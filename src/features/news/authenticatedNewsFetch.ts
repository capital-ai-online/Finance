import { supabase } from '../../supabaseClient';

const NEWS_API_PREFIX = '/api/news';

function assertNewsApiPath(path: string): void {
  if (path !== NEWS_API_PREFIX && !path.startsWith(`${NEWS_API_PREFIX}/`) && !path.startsWith(`${NEWS_API_PREFIX}?`)) {
    throw new Error('NEWS_AUTH_FETCH_PATH_OUTSIDE_ALLOWED_SCOPE');
  }
}

/**
 * Same-origin transport for the protected CAPITAL-AI news REST surface.
 *
 * The backend resolves identity exclusively from an RFC6750 Bearer token. Keep token
 * acquisition in one presentation-layer helper so the Newsfeed never falls back to an
 * unauthenticated request and the session token cannot be forwarded to arbitrary URLs.
 */
export async function fetchAuthenticatedNews(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  assertNewsApiPath(path);

  if (!supabase) {
    throw new Error('NEWS_AUTH_SUPABASE_NOT_CONFIGURED');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`NEWS_AUTH_SESSION_LOOKUP_FAILED:${error.message}`);
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('NEWS_AUTH_SESSION_REQUIRED');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  return fetch(path, {
    ...init,
    headers,
  });
}
