// Compliance-Review Punkt 5 — zentrale, einmalige authFetch()-Implementierung statt
// fünf identischer lokaler Kopien in VersionManagerPanel.tsx, DocumentHygienePanel.tsx,
// SupervisorDashboard.tsx, AuditLogs.tsx und OrchestratorPanel.tsx.
//
// Bei einer 401-Antwort wird global ein 'auth:unauthorized'-Event ausgelöst, auf das
// App.tsx lauscht und den Nutzer sauber ausloggt/zur Anmeldung zurückführt - statt dass
// jede einzelne Komponente ihre eigene Fehlerbehandlung (oder gar keine) implementiert.

import { supabase } from '../supabaseClient';

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { url } }));
  }

  return response;
}
