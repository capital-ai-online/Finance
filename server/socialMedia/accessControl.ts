// ADR-0021 — Zugriffsbeschraenkung Social Media Direct Publishing Hub.
//
// Auf ausdruecklichen Wunsch: das Tool ist NICHT allen registrierten Nutzern zugaenglich,
// sondern ausschliesslich Owner-Accounts (profiles.iam_role = 'owner') oder Abonnenten des
// 'Founder'-Tarifs. Andere Tarife (Free/Starter/Pro/Enterprise) haben KEINEN Zugriff, auch
// wenn sie fuer andere Features als "unlimited" gelten (siehe server/quota.ts
// UNLIMITED_TIERS - das ist eine andere, bewusst nicht wiederverwendete Liste).
//
// Fail-closed: ohne Supabase-Konfiguration, ohne gueltiges Bearer-Token oder bei jedem
// unerwarteten Fehler ist der Zugriff verweigert, nie stillschweigend erlaubt.

import type { Request } from 'express';
import { getServerSupabase, isSupabaseConfigured, getSubscription } from '../db';
import { resolveVerifiedIdentity } from '../../src/platform/Security/authMiddleware';
import { createLogger } from '../logger';

const logger = createLogger('social-media:access');

export type SocialMediaAccessReason =
  | 'owner'
  | 'founder-tier'
  | 'unauthenticated'
  | 'insufficient-tier'
  | 'supabase-not-configured'
  | 'internal-error';

export interface SocialMediaAccessResult {
  allowed: boolean;
  userId?: string;
  email?: string | null;
  reason: SocialMediaAccessReason;
}

async function isOwner(userId: string): Promise<boolean> {
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.from('profiles').select('iam_role').eq('id', userId).maybeSingle();
    if (error || !data) return false;
    return data.iam_role === 'owner';
  } catch (err: any) {
    logger.error('Owner-Pruefung fehlgeschlagen', { userId, error: err?.message || String(err) });
    return false;
  }
}

async function isFounderTier(userId: string): Promise<boolean> {
  try {
    const tier = await getSubscription(userId);
    // getSubscription() liefert bei erkanntem Owner bereits 'Enterprise' zurueck (siehe
    // server/db.ts isOwnerIdentifier-Bypass) - das ist hier irrelevant, da Owner bereits ueber
    // isOwner() separat und praeziser (iam_role direkt) geprueft wird, nicht ueber diesen Pfad.
    return typeof tier === 'string' && tier.trim().toUpperCase() === 'FOUNDER';
  } catch (err: any) {
    logger.error('Tarif-Pruefung fehlgeschlagen', { userId, error: err?.message || String(err) });
    return false;
  }
}

/** Kernpruefung anhand einer bereits bekannten User-ID (z.B. aus einem OAuth-State-Datensatz,
 *  wo kein Bearer-Token im Request vorliegt - siehe oauthExchange.ts completeOAuthCallback). */
export async function checkSocialMediaAccessForUserId(
  userId: string,
  email: string | null = null
): Promise<SocialMediaAccessResult> {
  if (!isSupabaseConfigured()) {
    return { allowed: false, reason: 'supabase-not-configured' };
  }
  try {
    if (await isOwner(userId)) {
      return { allowed: true, userId, email, reason: 'owner' };
    }
    if (await isFounderTier(userId)) {
      return { allowed: true, userId, email, reason: 'founder-tier' };
    }
    return { allowed: false, userId, email, reason: 'insufficient-tier' };
  } catch (err: any) {
    logger.error('checkSocialMediaAccessForUserId fehlgeschlagen', { userId, error: err?.message || String(err) });
    return { allowed: false, userId, email, reason: 'internal-error' };
  }
}

/** Fuer normale, bearer-token-authentifizierte Requests. */
export async function checkSocialMediaAccess(req: Request): Promise<SocialMediaAccessResult> {
  if (!isSupabaseConfigured()) {
    return { allowed: false, reason: 'supabase-not-configured' };
  }
  const identity = await resolveVerifiedIdentity(req);
  if (!identity) {
    return { allowed: false, reason: 'unauthenticated' };
  }
  return checkSocialMediaAccessForUserId(identity.userId, identity.email);
}

export function accessDeniedMessage(reason: SocialMediaAccessReason): string {
  switch (reason) {
    case 'unauthenticated':
      return 'Anmeldung erforderlich.';
    case 'insufficient-tier':
      return 'Dieses Tool ist ausschliesslich fuer Owner-Accounts oder Founder-Abonnenten verfuegbar.';
    case 'supabase-not-configured':
      return 'Zugriffspruefung derzeit nicht verfuegbar (Supabase nicht konfiguriert).';
    default:
      return 'Zugriff verweigert.';
  }
}
