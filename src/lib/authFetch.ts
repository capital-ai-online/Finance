// OPS-AUTH-BACKEND-01 — authenticated browser transport.
//
// Browser code no longer reads, refreshes or forwards Supabase tokens. The backend owns the
// Supabase session in HttpOnly cookies. On a 401, one bounded /api/auth/session refresh/readback is
// attempted before retrying the original same-origin request exactly once.

const UNAUTHENTICATED_RESPONSE_BODY = JSON.stringify({ error: 'Anmeldung erforderlich.' });

let sessionRefreshInFlight: Promise<boolean> | null = null;

function notifyUnauthorized(url: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { url } }));
}

function unauthenticatedResponse(): Response {
  return new Response(UNAUTHENTICATED_RESPONSE_BODY, {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
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

async function refreshBackendSession(): Promise<boolean> {
  if (!sessionRefreshInFlight) {
    sessionRefreshInFlight = (async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) return false;
        const payload = await response.json().catch(() => null);
        return payload?.authenticated === true;
      } catch {
        return false;
      }
    })().finally(() => {
      sessionRefreshInFlight = null;
    });
  }
  return sessionRefreshInFlight;
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let firstResponse: Response;
  try {
    firstResponse = await sendSameOrigin(url, options);
  } catch (error) {
    if (error instanceof Error && error.message === 'AUTH_FETCH_CROSS_ORIGIN_BLOCKED') {
      throw error;
    }
    notifyUnauthorized(url);
    return unauthenticatedResponse();
  }

  if (firstResponse.status !== 401) return firstResponse;

  const refreshed = await refreshBackendSession();
  if (!refreshed) {
    notifyUnauthorized(url);
    return firstResponse;
  }

  const retryResponse = await sendSameOrigin(url, options);
  if (retryResponse.status === 401) notifyUnauthorized(url);
  return retryResponse;
}
