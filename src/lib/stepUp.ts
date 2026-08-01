// ADR-0003.5 / Audit ARCH-AUDIT-0002 (D9): zentraler, einmaliger API-Wrapper fuer den
// Step-Up-Verifikationsschritt, damit jede kuenftige kritische Owner-Aktion (nicht nur der
// Versions-Bump) denselben Ablauf wiederverwendet statt ihn erneut zu implementieren -
// analog zu authFetch() als zentraler Auth-Fetch-Wrapper (src/lib/authFetch.ts).

import { authFetch } from './authFetch';

export class StepUpError extends Error {}

/**
 * Verifiziert einen 6-stelligen TOTP-Code gegen /api/auth/step-up/verify und liefert bei Erfolg
 * ein kurzlebiges (5 Minuten), einmalig verwendbares Step-Up-Token zurueck. Dieses Token wird
 * anschliessend als `x-step-up-token`-Header an die eigentliche kritische Aktion angehaengt.
 */
export async function verifyStepUp(code: string, purpose: string): Promise<string> {
  const res = await authFetch('/api/auth/step-up/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, purpose }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new StepUpError(body.error || `Step-Up-Verifikation fehlgeschlagen (HTTP ${res.status}).`);
  }
  if (!body.stepUpToken) {
    throw new StepUpError('Server hat kein Step-Up-Token zurückgegeben.');
  }
  return body.stepUpToken as string;
}

/** True, wenn eine Server-Antwort signalisiert, dass ein frischer Step-Up-Nachweis fehlt. */
export function isStepUpRequired(status: number, body: any): boolean {
  return status === 428 || body?.code === 'step_up_required';
}
