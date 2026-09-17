// ADR-0020 — Echter OAuth-2.0-Authorization-Code-Handshake pro Plattform.
//
// Ersetzt den Handover-Prototyp, dessen /auth/callback den `code`-Parameter nie gegen ein
// Access-Token eintauschte und den `state`-Parameter nie verifizierte (siehe Migration
// 20260801150000 fuer die CSRF-Begruendung). Dieses Modul deckt beide fehlenden Schritte ab:
// State-Erzeugung/-Verifikation (createAuthorizationRequest/consumeOAuthState) und den
// tatsaechlichen Token-Exchange inkl. plattformspezifischer Nachbearbeitung
// (Meta: User-Token -> Page-Token; TikTok/YouTube/X: Profil-Nachladen fuer Handle/Avatar/Follower).

import crypto from 'crypto';
import { getServerSupabase, isSupabaseConfigured } from '../db';
import { getCleanEnv } from '../env';
import { createLogger } from '../logger';
import { getProviderConfig } from './oauthProviders';
import { generateCodeVerifier, deriveCodeChallenge } from './pkce';
import { upsertConnectedAccount } from './tokenStore';
import { checkSocialMediaAccessForUserId, accessDeniedMessage } from './accessControl';
import type { SupportedAccountPlatform, SocialAccount } from '../../src/platform/SocialMediaEngine/types';

const logger = createLogger('social-media:oauth');
const STATE_TTL_MS = 10 * 60 * 1000; // 10 Minuten - genug Zeit fuer einen Popup-Handshake

export function isProviderConfigured(platform: SupportedAccountPlatform): boolean {
  const cfg = getProviderConfig(platform);
  return !!(getCleanEnv(cfg.clientIdEnvVar) && getCleanEnv(cfg.clientSecretEnvVar));
}

/**
 * Erzeugt einen an user_id+platform gebundenen State-Token, persistiert ihn und liefert die
 * fertige Autorisierungs-URL. Der Client bekommt ausschliesslich die URL - der State selbst
 * verlaesst den Server nur eingebettet im redirect, nie separat auslesbar fuer den Client-Code.
 */
export async function createAuthorizationRequest(
  userId: string,
  platform: SupportedAccountPlatform,
  redirectUri: string
): Promise<{ url: string } | { error: string }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Supabase ist nicht konfiguriert - OAuth-State kann nicht persistiert werden.' };
  }
  if (!isProviderConfigured(platform)) {
    return { error: `${platform}: OAuth-Client-Credentials fehlen (siehe Runbook docs/runbooks/SOCIAL_MEDIA_OAUTH_SETUP.md).` };
  }

  const cfg = getProviderConfig(platform);
  const stateToken = crypto.randomBytes(24).toString('base64url');
  const codeVerifier = cfg.requiresPkce ? generateCodeVerifier() : null;

  const supabase = getServerSupabase();
  const { error } = await supabase.from('social_media_oauth_states').insert({
    state_token: stateToken,
    user_id: userId,
    platform,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString(),
  });
  if (error) {
    logger.error('OAuth-State konnte nicht persistiert werden', { platform, error: error.message });
    return { error: 'OAuth-State konnte nicht gespeichert werden.' };
  }

  const params = new URLSearchParams({
    [cfg.clientIdParam]: getCleanEnv(cfg.clientIdEnvVar),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: cfg.scopes.join(platform === 'tiktok' ? ',' : ' '),
    state: stateToken,
    ...(cfg.extraAuthParams || {}),
  });
  if (codeVerifier) {
    params.set('code_challenge', deriveCodeChallenge(codeVerifier));
    params.set('code_challenge_method', 'S256');
  }

  return { url: `${cfg.authUrl}?${params.toString()}` };
}

interface StateRow {
  id: string;
  user_id: string;
  platform: SupportedAccountPlatform;
  redirect_uri: string;
  code_verifier: string | null;
}

/** Verifiziert den State atomar (verhindert Wiederverwendung bei parallelen Callback-Requests). */
async function consumeOAuthState(stateToken: string): Promise<StateRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('social_media_oauth_states')
    .update({ used_at: new Date().toISOString() })
    .eq('state_token', stateToken)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('id, user_id, platform, redirect_uri, code_verifier')
    .maybeSingle();
  if (error || !data) return null;
  return data as StateRow;
}

interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
}

async function exchangeCodeForToken(
  platform: SupportedAccountPlatform,
  code: string,
  redirectUri: string,
  codeVerifier: string | null
): Promise<TokenExchangeResult> {
  const cfg = getProviderConfig(platform);
  const clientId = getCleanEnv(cfg.clientIdEnvVar);
  const clientSecret = getCleanEnv(cfg.clientSecretEnvVar);

  if (platform === 'x') {
    // X verlangt Basic-Auth mit client_id:client_secret PLUS PKCE code_verifier im Body.
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const body = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier || '',
    });
    const res = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${basicAuth}` },
      body: body.toString(),
    });
    const json: any = await res.json();
    if (!res.ok) throw new Error(`X-Token-Exchange fehlgeschlagen: ${JSON.stringify(json)}`);
    return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresInSeconds: json.expires_in };
  }

  if (platform === 'tiktok') {
    const body = new URLSearchParams({
      client_key: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    const res = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const json: any = await res.json();
    const payload = json.data && json.data.access_token ? json.data : json;
    if (!res.ok || !payload.access_token) throw new Error(`TikTok-Token-Exchange fehlgeschlagen: ${JSON.stringify(json)}`);
    return { accessToken: payload.access_token, refreshToken: payload.refresh_token, expiresInSeconds: payload.expires_in };
  }

  if (platform === 'instagram' || platform === 'facebook') {
    // Schritt 1: kurzlebiges User-Token (Meta gibt hier per GET-Query zurueck).
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });
    const shortRes = await fetch(`${cfg.tokenUrl}?${params.toString()}`);
    const shortJson: any = await shortRes.json();
    if (!shortRes.ok || !shortJson.access_token) {
      throw new Error(`Meta-Token-Exchange fehlgeschlagen: ${JSON.stringify(shortJson)}`);
    }
    // Schritt 2: gegen langlebiges Token tauschen (~60 Tage statt ~1-2h).
    const longParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: shortJson.access_token,
    });
    const longRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${longParams.toString()}`);
    const longJson: any = await longRes.json();
    if (!longRes.ok || !longJson.access_token) {
      // Langlebiger Exchange ist ein Nice-to-have; bei Fehlschlag reicht das kurzlebige Token,
      // fuehrt aber zu schnellerem Ablauf (status wechselt dann auf 'token_expired').
      logger.error('Meta Long-Lived-Token-Exchange fehlgeschlagen, verwende Short-Lived-Token', { platform });
      return { accessToken: shortJson.access_token, expiresInSeconds: shortJson.expires_in };
    }
    return { accessToken: longJson.access_token, expiresInSeconds: longJson.expires_in };
  }

  // youtube (Google Standard-Flow)
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const json: any = await res.json();
  if (!res.ok || !json.access_token) throw new Error(`YouTube-Token-Exchange fehlgeschlagen: ${JSON.stringify(json)}`);
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresInSeconds: json.expires_in };
}

interface ProfileInfo {
  accountName?: string;
  handle?: string;
  avatarUrl?: string;
  followersCount?: number;
  externalAccountId?: string;
  /** Fuer Meta: das tatsaechlich zu persistierende Token ist das Page-Token, nicht das User-Token. */
  effectiveAccessToken?: string;
}

async function fetchProviderProfile(platform: SupportedAccountPlatform, accessToken: string): Promise<ProfileInfo> {
  try {
    if (platform === 'youtube') {
      const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json: any = await res.json();
      const channel = json.items?.[0];
      if (!channel) return {};
      return {
        accountName: channel.snippet?.title,
        handle: channel.snippet?.customUrl ? `@${channel.snippet.customUrl}` : channel.snippet?.title,
        avatarUrl: channel.snippet?.thumbnails?.default?.url,
        followersCount: channel.statistics?.subscriberCount ? Number(channel.statistics.subscriberCount) : undefined,
        externalAccountId: channel.id,
      };
    }

    if (platform === 'tiktok') {
      const res = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const json: any = await res.json();
      const user = json.data?.user;
      if (!user) return {};
      return {
        accountName: user.display_name,
        handle: `@${user.display_name}`,
        avatarUrl: user.avatar_url,
        followersCount: user.follower_count,
        externalAccountId: user.open_id,
      };
    }

    if (platform === 'facebook' || platform === 'instagram') {
      // Meta-Publishing laeuft ueber die Page (nicht das User-Konto): erst die verwalteten
      // Pages laden, die erste nehmen (Mehrfach-Page-Auswahl ist Folgearbeit, siehe ADR-0020).
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${encodeURIComponent(accessToken)}`);
      const pagesJson: any = await pagesRes.json();
      const page = pagesJson.data?.[0];
      if (!page) return {};

      if (platform === 'facebook') {
        return {
          accountName: page.name,
          handle: page.name,
          externalAccountId: page.id,
          effectiveAccessToken: page.access_token,
        };
      }

      // instagram: ueber die Page das verknuepfte IG-Business-Konto ermitteln.
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${encodeURIComponent(page.access_token)}`
      );
      const igJson: any = await igRes.json();
      const igAccountId = igJson.instagram_business_account?.id;
      if (!igAccountId) {
        return { effectiveAccessToken: page.access_token }; // Page verbunden, aber keine IG-Verknuepfung
      }
      const igProfileRes = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}?fields=username,profile_picture_url,followers_count&access_token=${encodeURIComponent(page.access_token)}`
      );
      const igProfile: any = await igProfileRes.json();
      return {
        accountName: igProfile.username,
        handle: `@${igProfile.username}`,
        avatarUrl: igProfile.profile_picture_url,
        followersCount: igProfile.followers_count,
        externalAccountId: igAccountId,
        effectiveAccessToken: page.access_token,
      };
    }

    if (platform === 'x') {
      const res = await fetch('https://api.twitter.com/2/users/me?user.fields=username,public_metrics,profile_image_url', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json: any = await res.json();
      const user = json.data;
      if (!user) return {};
      return {
        accountName: user.name || user.username,
        handle: `@${user.username}`,
        avatarUrl: user.profile_image_url,
        followersCount: user.public_metrics?.followers_count,
        externalAccountId: user.id,
      };
    }
  } catch (err: any) {
    logger.error('Profil-Nachladen fehlgeschlagen (Konto bleibt trotzdem verbunden)', { platform, error: err?.message || String(err) });
  }
  return {};
}

export type OAuthCallbackResult =
  | { success: true; platform: SupportedAccountPlatform; account: SocialAccount }
  | { success: false; platform: SupportedAccountPlatform | 'unknown'; error: string };

export async function completeOAuthCallback(code: string, stateToken: string): Promise<OAuthCallbackResult> {
  const state = await consumeOAuthState(stateToken);
  if (!state) {
    return { success: false, platform: 'unknown', error: 'Ungueltiger, bereits verwendeter oder abgelaufener OAuth-State.' };
  }

  // ADR-0021: Zugriff erneut pruefen (nicht nur beim Erzeugen der Auth-URL) - zwischen
  // /auth/url und diesem Callback koennen mehrere Minuten liegen, in denen z.B. ein
  // Founder-Abo ablaufen oder ein Owner-Status entzogen werden koennte. Ohne diesen
  // Re-Check koennte ein zwischenzeitlich ungueltig gewordener Zugriff trotzdem noch ein
  // Konto verbinden.
  const access = await checkSocialMediaAccessForUserId(state.user_id);
  if (!access.allowed) {
    logger.error('OAuth-Callback abgelehnt: Zugriff nicht (mehr) berechtigt', { platform: state.platform, userId: state.user_id, reason: access.reason });
    return { success: false, platform: state.platform, error: accessDeniedMessage(access.reason) };
  }

  try {
    const cfg = getProviderConfig(state.platform);
    const tokenResult = await exchangeCodeForToken(state.platform, code, state.redirect_uri, state.code_verifier);
    const profile = await fetchProviderProfile(state.platform, tokenResult.accessToken);

    const account = await upsertConnectedAccount({
      userId: state.user_id,
      platform: state.platform,
      accountName: profile.accountName,
      handle: profile.handle,
      avatarUrl: profile.avatarUrl,
      scopes: cfg.scopes,
      followersCount: profile.followersCount,
      externalAccountId: profile.externalAccountId,
      accessToken: profile.effectiveAccessToken || tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      expiresInSeconds: tokenResult.expiresInSeconds,
    });

    if (!account) {
      return { success: false, platform: state.platform, error: 'Konto konnte nicht gespeichert werden.' };
    }
    return { success: true, platform: state.platform, account };
  } catch (err: any) {
    logger.error('OAuth-Callback fehlgeschlagen', { platform: state.platform, error: err?.message || String(err) });
    return { success: false, platform: state.platform, error: err?.message || 'Unbekannter Fehler beim Token-Exchange.' };
  }
}
