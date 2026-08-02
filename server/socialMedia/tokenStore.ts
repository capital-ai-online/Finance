// ADR-0020 — Persistenz fuer verbundene Social-Media-Konten (Supabase statt In-Memory-Array).
//
// Jede Funktion hier arbeitet ausschliesslich mit dem Service-Role-Client (getServerSupabase()),
// nie mit nutzerseitigen Tokens - RLS auf social_media_accounts erlaubt ohnehin nur
// service_role (siehe Migration 20260801150000). Tokens werden ausschliesslich verschluesselt
// abgelegt (encryptSecret/decryptSecret, AES-256-GCM, gleicher Mechanismus wie TOTP-Secrets)
// und NIE an den Client zurueckgegeben - toPublicAccount() ist die einzige Funktion, die eine
// DB-Zeile nach aussen sichtbar macht, und sie laesst beide *_encrypted-Spalten konsequent weg.

import { getServerSupabase, isSupabaseConfigured } from '../db';
import { encryptSecret, decryptSecret } from '../../src/platform/Security/secretCrypto';
import { createLogger } from '../logger';
import type { SocialAccount, SupportedAccountPlatform } from '../../src/platform/SocialMediaEngine/types';

const logger = createLogger('social-media:tokenStore');

export interface StoredAccountRow {
  id: string;
  user_id: string;
  platform: SupportedAccountPlatform;
  account_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  status: SocialAccount['status'];
  scopes: string[];
  followers_count: number | null;
  external_account_id: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  connected_at: string | null;
}

/** Wandelt eine DB-Zeile in das Client-sichere SocialAccount-DTO um - NIE die *_encrypted-Spalten. */
export function toPublicAccount(row: StoredAccountRow): SocialAccount {
  return {
    id: row.id,
    platform: row.platform,
    accountName: row.account_name || `CAPITAL-AI ${row.platform.toUpperCase()}`,
    handle: row.handle || `@${row.platform}`,
    avatarUrl: row.avatar_url || undefined,
    status: row.status,
    connectedAt: row.connected_at || undefined,
    scopes: row.scopes || [],
    followersCount: row.followers_count ?? undefined,
    channelId: row.external_account_id || undefined,
    // Nicht-reversible Anzeige-Referenz statt eines echten Tokens (auch nicht maskiert-real) -
    // der Client braucht das Feld nur, um "verbunden, Token vorhanden" von "verbunden, aber
    // Token abgelaufen" zu unterscheiden.
    accessTokenMasked: row.access_token_encrypted ? `${row.platform}_${row.id.slice(0, 8)}` : undefined,
  };
}

export async function listAccountsForUser(userId: string): Promise<SocialAccount[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('social_media_accounts')
    .select('id, user_id, platform, account_name, handle, avatar_url, status, scopes, followers_count, external_account_id, access_token_encrypted, refresh_token_encrypted, token_expires_at, connected_at')
    .eq('user_id', userId);
  if (error) {
    logger.error('listAccountsForUser fehlgeschlagen', { error: error.message });
    return [];
  }
  return (data || []).map(toPublicAccount);
}

/** Fuer den Publish-Pfad: liefert das entschluesselte Access-Token, NIE an den Client weitergeben. */
export async function getDecryptedAccount(userId: string, platform: SupportedAccountPlatform): Promise<{ row: StoredAccountRow; accessToken: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('social_media_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('status', 'connected')
    .maybeSingle();
  if (error || !data || !data.access_token_encrypted) return null;
  try {
    const accessToken = decryptSecret(data.access_token_encrypted);
    return { row: data as StoredAccountRow, accessToken };
  } catch (err: any) {
    logger.error('Token-Entschluesselung fehlgeschlagen', { platform, error: err?.message || String(err) });
    return null;
  }
}

export interface UpsertAccountInput {
  userId: string;
  platform: SupportedAccountPlatform;
  accountName?: string;
  handle?: string;
  avatarUrl?: string;
  scopes: string[];
  followersCount?: number;
  externalAccountId?: string;
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
}

export async function upsertConnectedAccount(input: UpsertAccountInput): Promise<SocialAccount | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getServerSupabase();
  const nowIso = new Date().toISOString();
  const expiresAt = input.expiresInSeconds
    ? new Date(Date.now() + input.expiresInSeconds * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('social_media_accounts')
    .upsert(
      {
        user_id: input.userId,
        platform: input.platform,
        account_name: input.accountName || null,
        handle: input.handle || null,
        avatar_url: input.avatarUrl || null,
        status: 'connected',
        scopes: input.scopes,
        followers_count: input.followersCount ?? null,
        external_account_id: input.externalAccountId || null,
        access_token_encrypted: encryptSecret(input.accessToken),
        refresh_token_encrypted: input.refreshToken ? encryptSecret(input.refreshToken) : null,
        token_expires_at: expiresAt,
        connected_at: nowIso,
      },
      { onConflict: 'user_id,platform' }
    )
    .select('id, user_id, platform, account_name, handle, avatar_url, status, scopes, followers_count, external_account_id, access_token_encrypted, refresh_token_encrypted, token_expires_at, connected_at')
    .single();

  if (error || !data) {
    logger.error('upsertConnectedAccount fehlgeschlagen', { platform: input.platform, error: error?.message });
    return null;
  }
  return toPublicAccount(data as StoredAccountRow);
}

export async function disconnectAccount(userId: string, platform: SupportedAccountPlatform): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('social_media_accounts')
    .update({
      status: 'disconnected',
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
    })
    .eq('user_id', userId)
    .eq('platform', platform);
  if (error) {
    logger.error('disconnectAccount fehlgeschlagen', { platform, error: error.message });
    return false;
  }
  return true;
}
