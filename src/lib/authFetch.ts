// Compliance-Review Punkt 5 — zentrale, einmalige authFetch()-Implementierung statt
// fünf identischer lokaler Kopien in VersionManagerPanel.tsx, DocumentHygienePanel.tsx,
// SupervisorDashboard.tsx, AuditLogs.tsx und OrchestratorPanel.tsx.
//
// Bei einer 401-Antwort wird global ein 'auth:unauthorized'-Event ausgelöst, auf das
// SessionComposition.tsx lauscht und den Nutzer sauber ausloggt/zur Anmeldung zurückführt —
// statt dass jede einzelne Komponente ihre eigene Fehlerbehandlung (oder gar keine) implementiert.
//
// F-01: Ohne verifiziertes Token wird der Request gar nicht erst gesendet. Jeder über authFetch()
// angesprochene Endpunkt verlangt eine verifizierte Identität und würde mit 401 antworten; der
// Roundtrip erzeugt also nur einen weiteren DENIED-Datensatz im IAM-Auditlog, ohne dass sich an
// der Ursache etwas ändert. Der Aufrufer-Vertrag bleibt unverändert: er sieht eine 401-Response.

import { supabase } from '../supabaseClient';

const UNAUTHENTICATED_RESPONSE_BODY = JSON.stringify({ error: 'Anmeldung erforderlich.' });

function notifyUnauthorized(url: string): void {
  // Guard für Kontexte ohne DOM (Prerender/Tests) — dort gibt es kein window.
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { url } }));
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;

  if (!session?.access_token) {
    notifyUnauthorized(url);
    return new Response(UNAUTHENTICATED_RESPONSE_BODY, {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
    Authorization: `Bearer ${session.access_token}`,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    notifyUnauthorized(url);
  }

  return response;
}
