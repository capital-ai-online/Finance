import { authFetch } from '../../lib/authFetch';

const NEWS_API_PREFIX = '/api/news';

function assertNewsApiPath(path: string): void {
  if (
    path !== NEWS_API_PREFIX &&
    !path.startsWith(`${NEWS_API_PREFIX}/`) &&
    !path.startsWith(`${NEWS_API_PREFIX}?`)
  ) {
    throw new Error('NEWS_AUTH_FETCH_PATH_OUTSIDE_ALLOWED_SCOPE');
  }
}

/**
 * Same-origin transport for the protected CAPITAL-AI news REST surface.
 * Authentication is provided exclusively by the backend HttpOnly session cookie.
 */
export async function fetchAuthenticatedNews(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  assertNewsApiPath(path);
  return authFetch(path, init);
}
