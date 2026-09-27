// OPS-AUTH-BACKEND-01 — authenticated browser transport.
//
// Browser code no longer reads, refreshes or forwards Supabase tokens. The backend owns the
// Supabase session in HttpOnly cookies. On a 401, one bounded /api/auth/session readback is
// attempted before retrying the original same-origin request exactly once.

type SessionReadback = 'authenticated' | 'unauthenticated' | 'unavailable';

let sessionRefreshInFlight: Promise<SessionReadback> | null = null;

function notifyUnauthorized(url: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { url } }));
}

function isSameOriginPath(url: string): boolean {
  if (url.startsWith('/')) return !url.startsWith('//');
  if (typeof window === 'undefined') return false;
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

async function sendSameOrigin(url: string, options: RequestInit): Promise<Response> {
  if (!isSameOriginPath(url)) {
    throw new Error('AUTH_FETCH_CROSS_ORIGIN_BLOCKED');
  }
  return fetch(url, {
    ...options,
    credentials: 'same-origin',
  });
}

async function refreshBackendSession(): Promise<SessionReadback> {
  if (!sessionRefreshInFlight) {
    sessionRefreshInFlight = (async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (response.status === 401 || response.status === 403) return 'unauthenticated';
        if (!response.ok) return 'unavailable';

        const payload = await response.json().catch(() => null);
        if (payload?.authenticated === true) return 'authenticated';
        if (payload?.authenticated === false) return 'unauthenticated';
        return 'unavailable';
      } catch {
        return 'unavailable';
      }
    })().finally(() => {
      sessionRefreshInFlight = null;
    });
  }
  return sessionRefreshInFlight;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const firstResponse = await sendSameOrigin(url, options);
  if (firstResponse.status !== 401) return firstResponse;

  const sessionState = await refreshBackendSession();
  if (sessionState === 'unauthenticated') {
    notifyUnauthorized(url);
    return firstResponse;
  }

  if (sessionState === 'unavailable') return firstResponse;

  // A second 401 after a verified session is endpoint-specific authorization evidence. It must
  // not clear the global session or redirect an authenticated user away from the current route.
  return sendSameOrigin(url, options);
}
// end of authenticated transport
