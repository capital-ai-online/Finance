// ESS-0018 Phase 2 / ADR-0051: Admin/Support diagnostics agent tools. Backend-only - never
// import from Vite-/browser-bundled code. Two capability classes:
//   - read: getAdminDiagnostics(), getAlertSubscriptionPreview() - gated only by
//     checkCapability(), no approval needed (ESS-0018 §4.2 read allowlist).
//   - write: disableAlertSubscription() - gated by checkCapability() AND an already-consumed
//     approval artifact (enforced by the caller via executeApprovedSupervisedAction(), not by
//     this module itself). Single allowlisted write in this slice: disabling an alert
//     subscription is reversible, touches no money/score/identity data, and is a single-row
//     update - see ESS-0018 §4.2 scope decision for why this was chosen as the first real write
//     capability instead of e.g. subscription-tier mutation.

import crypto from 'crypto';
import { getPrivilegedServerSupabase, isPrivilegedSupabaseConfigured } from '../../../server/db';
import { sendAlertConfirmationEmail, type AlertCondition } from '../../../server/alerts';

function assertValidUuid(value: string, label: string): string {
  const cleaned = (value || '').trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleaned)) {
    throw new Error(`[AdminDiagnosticsTool] Ungueltige UUID fuer ${label}: "${value}"`);
  }
  return cleaned;
}

// ---- Read: subscription tier + quota diagnostics ---------------------------------------------

export interface AdminDiagnosticsRequest {
  userId?: string;
  email?: string;
}

export interface AdminDiagnosticsResult {
  subscription: { tier: string; updatedAt: string } | null;
  quota: Array<{ quotaKind: string; count: number; windowStart: string }>;
}

export async function getAdminDiagnostics(request: AdminDiagnosticsRequest): Promise<AdminDiagnosticsResult> {
  const userId = request.userId ? assertValidUuid(request.userId, 'userId') : undefined;
  const email = request.email ? request.email.toLowerCase().trim() : undefined;
  if (!userId && !email) {
    throw new Error('[AdminDiagnosticsTool] userId oder email erforderlich.');
  }
  if (!isPrivilegedSupabaseConfigured()) {
    return { subscription: null, quota: [] };
  }

  const supabase = getPrivilegedServerSupabase();
  let subscription: AdminDiagnosticsResult['subscription'] = null;
  if (userId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('tier, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) subscription = { tier: data.tier, updatedAt: data.updated_at };
  }

  let quota: AdminDiagnosticsResult['quota'] = [];
  if (email) {
    const { data } = await supabase
      .from('user_quota')
      .select('quota_kind, count, window_start')
      .eq('email', email);
    quota = (data ?? []).map((row: { quota_kind: string; count: number; window_start: string }) => ({
      quotaKind: row.quota_kind,
      count: row.count,
      windowStart: row.window_start,
    }));
  }

  return { subscription, quota };
}

// ---- Read/preview + write: alert-subscription disable ----------------------------------------

export interface AlertSubscriptionPreview {
  id: string;
  symbol: string;
  active: boolean;
  fingerprint: string;
}

function computeAlertSubscriptionFingerprint(id: string, active: boolean): string {
  return crypto.createHash('sha256').update(`${id}:${active}`).digest('hex');
}

/** Read-only preview - no approval required. Used both for diagnostics and to obtain the
 * expectedFingerprint an approval request must cite. */
export async function getAlertSubscriptionPreview(id: string): Promise<AlertSubscriptionPreview | null> {
  const cleanId = assertValidUuid(id, 'id');
  if (!isPrivilegedSupabaseConfigured()) return null;

  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase
    .from('alert_subscriptions')
    .select('id, symbol, active')
    .eq('id', cleanId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    symbol: data.symbol,
    active: data.active,
    fingerprint: computeAlertSubscriptionFingerprint(data.id, data.active),
  };
}

export interface DisableAlertSubscriptionRequest {
  id: string;
  expectedFingerprint: string;
}

/**
 * The actual write. MUST only ever be invoked from inside
 * executeApprovedSupervisedAction()'s `fn` - this function itself does not check capability or
 * approval, it only re-verifies the fingerprint against current DB state immediately before
 * writing (defends against a row changing between preview and Apply) and fails closed on
 * mismatch rather than silently overwriting.
 */
export async function disableAlertSubscription(request: DisableAlertSubscriptionRequest): Promise<{ id: string; active: boolean }> {
  const id = assertValidUuid(request.id, 'id');
  if (!isPrivilegedSupabaseConfigured()) {
    throw new Error('[AdminDiagnosticsTool] Supabase nicht konfiguriert.');
  }

  const current = await getAlertSubscriptionPreview(id);
  if (!current) {
    throw new Error(`[AdminDiagnosticsTool] alert_subscriptions-Zeile "${id}" nicht gefunden.`);
  }
  if (current.fingerprint !== request.expectedFingerprint) {
    throw new Error(
      `[AdminDiagnosticsTool] Fingerprint-Mismatch fuer "${id}" - Zeile hat sich seit der Genehmigung geaendert, Apply abgelehnt.`
    );
  }
  if (!current.active) {
    return { id, active: false };
  }

  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase
    .from('alert_subscriptions')
    .update({ active: false })
    .eq('id', id)
    .eq('active', true)
    .select('id, active')
    .maybeSingle();

  if (error || !data) {
    throw new Error(`[AdminDiagnosticsTool] Update fehlgeschlagen fuer "${id}": ${error?.message || 'keine Zeile aktualisiert'}`);
  }
  return { id: data.id, active: data.active };
}

// ---- Read/preview + write: alert-subscription resend confirmation ----------------------------
//
// Support-Anwendungsfall: ein Nutzer meldet, die Bestaetigungsmail fuer sein Alert-Abo nie
// erhalten (oder verloren) zu haben. Double-Opt-In (server/alerts.ts) belaesst confirm_token
// gesetzt, bis bestaetigt wird - daher genuegt ein erneuter Versand derselben Mail mit dem
// bestehenden Token, ohne die Zeile zu mutieren. Trotzdem volle Governance-Kette wie bei
// disableAlertSubscription: ein Admin-Agent, der beliebige E-Mail-Adressen erneut anschreiben
// kann, ist derselbe Missbrauchsvektor, den die Rate-Begrenzung beim urspruenglichen Anlegen
// bereits adressiert (server/alerts.ts, POST /).

export interface AlertSubscriptionConfirmationPreview {
  id: string;
  email: string;
  symbol: string;
  confirmed: boolean;
  fingerprint: string;
}

function computeConfirmationFingerprint(id: string, confirmed: boolean): string {
  return crypto.createHash('sha256').update(`confirmation:${id}:${confirmed}`).digest('hex');
}

/** Read-only preview - no approval required. Also used to obtain the expectedFingerprint an
 * approval request must cite. */
export async function getAlertSubscriptionConfirmationPreview(id: string): Promise<AlertSubscriptionConfirmationPreview | null> {
  const cleanId = assertValidUuid(id, 'id');
  if (!isPrivilegedSupabaseConfigured()) return null;

  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase
    .from('alert_subscriptions')
    .select('id, email, symbol, confirmed')
    .eq('id', cleanId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    symbol: data.symbol,
    confirmed: data.confirmed,
    fingerprint: computeConfirmationFingerprint(data.id, data.confirmed),
  };
}

export interface ResendAlertSubscriptionConfirmationRequest {
  id: string;
  expectedFingerprint: string;
}

export interface ResendAlertSubscriptionConfirmationResult {
  id: string;
  resent: boolean;
  alreadyConfirmed: boolean;
}

/**
 * The actual write (re-send is a real side effect - an email to an external address - even
 * though no DB row is mutated on the happy path). MUST only ever be invoked from inside
 * executeApprovedSupervisedAction()'s `fn`, same contract as disableAlertSubscription(): this
 * function does not check capability or approval itself, it only re-verifies the fingerprint
 * against current DB state immediately before sending and fails closed on mismatch.
 */
export async function resendAlertSubscriptionConfirmation(
  request: ResendAlertSubscriptionConfirmationRequest
): Promise<ResendAlertSubscriptionConfirmationResult> {
  const id = assertValidUuid(request.id, 'id');
  if (!isPrivilegedSupabaseConfigured()) {
    throw new Error('[AdminDiagnosticsTool] Supabase nicht konfiguriert.');
  }

  const current = await getAlertSubscriptionConfirmationPreview(id);
  if (!current) {
    throw new Error(`[AdminDiagnosticsTool] alert_subscriptions-Zeile "${id}" nicht gefunden.`);
  }
  if (current.fingerprint !== request.expectedFingerprint) {
    throw new Error(
      `[AdminDiagnosticsTool] Fingerprint-Mismatch fuer "${id}" - Zeile hat sich seit der Genehmigung geaendert, Apply abgelehnt.`
    );
  }
  if (current.confirmed) {
    return { id, resent: false, alreadyConfirmed: true };
  }

  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase
    .from('alert_subscriptions')
    .select('confirm_token, condition, threshold')
    .eq('id', id)
    .maybeSingle();
  if (error || !data?.confirm_token) {
    throw new Error(`[AdminDiagnosticsTool] Kein aktiver Bestaetigungs-Token fuer "${id}" gefunden.`);
  }

  const mailResult = await sendAlertConfirmationEmail({
    email: current.email,
    symbol: current.symbol,
    condition: data.condition as AlertCondition,
    threshold: data.threshold,
    confirmToken: data.confirm_token,
  });
  if (!mailResult.success) {
    throw new Error(`[AdminDiagnosticsTool] Bestaetigungsmail fuer "${id}" konnte nicht versendet werden: ${mailResult.error || 'unbekannter Fehler'}`);
  }

  return { id, resent: true, alreadyConfirmed: false };
}
