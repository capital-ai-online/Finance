// ADR-0026 / ADR-0096 — OAuth redirect binding and transport hardening.
//
// The request Host header is untrusted input. OAuth authorization requests therefore bind to
// an explicit allowlist of canonical origins and one exact callback path before state is stored.
// This keeps redirect_uri deterministic and fail-closed even when a reverse proxy forwards an
// unexpected Host/X-Forwarded-* value.

export const SOCIAL_MEDIA_OAUTH_CALLBACK_PATH = '/api/social-media/auth/callback' as const;

const PRODUCTION_OAUTH_ORIGINS = new Set([
  'https://capital-ai.online',
  'https://www.capital-ai.online',
]);

function isLocalDevelopmentOrigin(url: URL): boolean {
  return (
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
    (url.protocol === 'http:' || url.protocol === 'https:')
  );
}

function allowsLoopback(nodeEnv: string): boolean {
  return nodeEnv === 'development' || nodeEnv === 'test';
}

/**
 * Validates and canonicalizes the OAuth callback URI before it becomes part of persisted state.
 * Production accepts only the CAPITAL-AI HTTPS origins. Loopback is allowed exclusively when
 * NODE_ENV is explicitly `development` or `test`; unknown/missing environment values therefore
 * inherit the strict production-origin boundary instead of silently widening trust.
 */
export function assertSafeOAuthRedirectUri(
  redirectUri: string,
  nodeEnv = process.env.NODE_ENV || ''
): string {
  let url: URL;
  try {
    url = new URL(redirectUri);
  } catch {
    throw new Error('OAuth redirect URI is not a valid absolute URL.');
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error('OAuth redirect URI must not contain userinfo, query parameters, or fragments.');
  }

  const normalizedPath = url.pathname.endsWith('/') && url.pathname !== '/'
    ? url.pathname.slice(0, -1)
    : url.pathname;
  if (normalizedPath !== SOCIAL_MEDIA_OAUTH_CALLBACK_PATH) {
    throw new Error('OAuth redirect URI does not use the canonical callback path.');
  }

  const productionOrigin = PRODUCTION_OAUTH_ORIGINS.has(url.origin);
  const explicitLoopback = allowsLoopback(nodeEnv) && isLocalDevelopmentOrigin(url);

  if (!productionOrigin && !explicitLoopback) {
    throw new Error('OAuth redirect URI origin is not allowed.');
  }
  if (productionOrigin && url.protocol !== 'https:') {
    throw new Error('OAuth redirect URI origin is not allowed in production.');
  }

  return `${url.origin}${SOCIAL_MEDIA_OAUTH_CALLBACK_PATH}`;
}
