// Compliance-Review Punkt 5 — zentrale authFetch()-Implementierung für geschützte API-Aufrufe.
//
// OAuth, MFA und Supabase-Refresh-Token-Rotation können einen kurzen Übergang erzeugen, in dem
// ein Request noch mit einem gerade rotierten Access-Token beim Backend ankommt. Ein einzelner
// 401 darf deshalb nicht mehr sofort die gesamte Anwendungssession zerstören. authFetch() liest
// weiterhin ausschließlich die live vom Supabase SDK verwaltete Session, führt bei 401 genau
// einen deduplizierten Refresh durch und wiederholt den Request einmal mit dem neuen Token.
// Erst wenn auch der Retry 401 liefert, wird global 'auth:unauthorized' ausgelöst.

import { supabase } from '../supabaseClient';

const UNAUTHENTICATED_RESPONSE_BODY = JSON.stringify({ error: 'Anmeldung erforderlich.' });

let refreshInFlight: Promise<string | null> | null = null;

function notifyUnauthorized(url: string): void {
  // Guard für Kontexte ohne DOM (Prerender/Tests) — dort gibt es kein window.
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { url } }));
}

function unauthenticatedResponse(): Response {
  return new Response(UNAUTHENTICATED_RESPONSE_BODY, {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getCurrentAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (!supabase) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) return null;
        return data.session?.access_token || null;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

function withBearerToken(options: RequestInit, accessToken: string): RequestInit {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  return { ...options, headers };
}

async function sendAuthenticatedRequest(
  url: string,
  options: RequestInit,
  accessToken: string,
): Promise<Response> {
  return fetch(url, withBearerToken(options, accessToken));
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let accessToken = await getCurrentAccessToken();

  // getSession() kann während einer OAuth-/MFA-Token-Rotation kurzzeitig keine verwertbare
  // Session liefern. Vor einem globalen Logout versuchen wir einmal den SDK-eigenen Refresh.
  if (!accessToken) {
    accessToken = await refreshAccessToken();
  }

  if (!accessToken) {
    notifyUnauthorized(url);
    return unauthenticatedResponse();
  }

  const firstResponse = await sendAuthenticatedRequest(url, options, accessToken);
  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  // Ein 401 kann durch einen gerade rotierten Access-Token verursacht sein. Genau ein Retry mit
  // frisch erneuerter Supabase-Session verhindert den OAuth-Logout-Race, ohne Endlosschleifen oder
  // ein Aufweichen der serverseitigen Authentifizierung einzuführen.
  const refreshedToken = await refreshAccessToken();
  if (refreshedToken) {
    const retryResponse = await sendAuthenticatedRequest(url, options, refreshedToken);
    if (retryResponse.status !== 401) {
      return retryResponse;
    }
    notifyUnauthorized(url);
    return retryResponse;
  }

  notifyUnauthorized(url);
  return firstResponse;
}
