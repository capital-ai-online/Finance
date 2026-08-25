// ADR-0026 — Provider-Metadaten fuer den Social-Media-OAuth-2.0-Handshake.
//
// Bewusst getrennt von den eigentlichen Secret-Werten (die liegen ausschliesslich in
// getCleanEnv()-Aufrufen in oauthExchange.ts) und bewusst unter server/ statt src/platform/
// abgelegt: dieses Modul wird nie vom Vite-Frontend-Bundle importiert, auch wenn es selbst
// keine Secrets enthaelt - klare Trennung server-only/isomorph vermeidet, dass ein spaeterer,
// unbedachter Import aus einer React-Komponente heraus versehentlich Server-Interna mitbuendelt.
//
// Wichtige plattformspezifische Eigenheiten, die bei einer naiven "gleiche Logik fuer alle
// Provider"-Implementierung uebersehen werden und den Handshake schlicht scheitern lassen wuerden:
//  - TikTok verwendet `client_key` statt `client_id` als Query-Parameter (eigener OAuth-Dialekt).
//  - X (Twitter) verlangt PKCE (code_challenge/code_verifier) fuer JEDEN OAuth-2.0-Client,
//    auch confidential Clients mit Secret - ohne PKCE lehnt X den Request ab.
//  - Meta (Instagram/Facebook) liefert beim Token-Exchange zunaechst ein kurzlebiges
//    User-Token; Veroeffentlichung braucht ein Page-Access-Token, das erst ueber einen
//    Folge-Request (/me/accounts) ermittelt wird - siehe platformPublishers.ts.

import type { SupportedAccountPlatform } from '../../src/platform/SocialMediaEngine/types';

export interface OAuthProviderConfig {
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  /** Query-Parameter-Name fuer die Client-ID im Autorisierungs-Request (Standard: client_id). */
  clientIdParam: string;
  /** Name der Env-Variable fuer die Client-ID dieser Plattform. */
  clientIdEnvVar: string;
  /** Name der Env-Variable fuer das Client-Secret dieser Plattform. */
  clientSecretEnvVar: string;
  requiresPkce: boolean;
  /** Zusaetzliche, providerspezifische Query-Parameter fuer den Autorisierungs-Request. */
  extraAuthParams?: Record<string, string>;
}

export const OAUTH_PROVIDERS: Record<SupportedAccountPlatform, OAuthProviderConfig> = {
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
    ],
    clientIdParam: 'client_id',
    clientIdEnvVar: 'YOUTUBE_CLIENT_ID',
    clientSecretEnvVar: 'YOUTUBE_CLIENT_SECRET',
    requiresPkce: false,
    // access_type=offline + prompt=consent: ohne beides liefert Google beim wiederholten
    // Verbinden desselben Kontos KEIN refresh_token mehr zurueck (nur beim allerersten Consent).
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    scopes: ['user.info.basic', 'video.upload', 'video.publish'],
    clientIdParam: 'client_key',
    clientIdEnvVar: 'TIKTOK_CLIENT_ID',
    clientSecretEnvVar: 'TIKTOK_CLIENT_SECRET',
    requiresPkce: false,
  },
  instagram: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
    clientIdParam: 'client_id',
    clientIdEnvVar: 'INSTAGRAM_CLIENT_ID',
    clientSecretEnvVar: 'INSTAGRAM_CLIENT_SECRET',
    requiresPkce: false,
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    clientIdParam: 'client_id',
    clientIdEnvVar: 'FACEBOOK_CLIENT_ID',
    clientSecretEnvVar: 'FACEBOOK_CLIENT_SECRET',
    requiresPkce: false,
  },
  x: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    clientIdParam: 'client_id',
    clientIdEnvVar: 'X_CLIENT_ID',
    clientSecretEnvVar: 'X_CLIENT_SECRET',
    requiresPkce: true,
  },
};

export function getProviderConfig(platform: SupportedAccountPlatform): OAuthProviderConfig {
  const config = OAUTH_PROVIDERS[platform];
  if (!config) {
    throw new Error(`Unbekannte Social-Media-Plattform: ${platform}`);
  }
  return config;
}
