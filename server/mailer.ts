// SMTP-Mailer fuer transaktionale System-E-Mails (z.B. Abo-Aktivierung).
// Nutzt nodemailer (etablierte, battle-tested Standard-Bibliothek fuer Node.js SMTP -
// Auth-Mechanismus-Aushandlung, Multiline-Response-Handling, Provider-Eigenheiten sind
// dort bereits ueber Jahre gegen reale SMTP-Server gehaertet) statt einer eigenen
// Protokoll-Implementierung. Alle Zugangsdaten ausschliesslich ueber Umgebungsvariablen.

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getCleanEnv } from './env';
import { getServerSupabase, isSupabaseConfigured } from './db';
import { enqueueOutboxJob } from './outbox';
import { htmlToPlainText } from '../src/platform/Security/safeIo';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

export function isMailerConfigured(): boolean {
  return !!(getCleanEnv('SMTP_HOST') && getCleanEnv('SMTP_USER') && getCleanEnv('SMTP_PASSWORD'));
}

function getTransporter() {
  if (!transporter) {
    const port = parseInt(getCleanEnv('SMTP_PORT') || '587', 10);
    transporter = nodemailer.createTransport({
      host: getCleanEnv('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: {
        user: getCleanEnv('SMTP_USER'),
        pass: getCleanEnv('SMTP_PASSWORD'),
      },
    });
  }
  return transporter;
}

function logCorrelationRef(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 12);
}

function mailerErrorCode(err: unknown): string {
  if (err && typeof err === 'object') {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string' && /^[A-Z0-9_-]{1,64}$/i.test(code)) {
      return code;
    }
  }
  return 'mail-operation-failed';
}

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(params: SendMailParams): Promise<{ success: boolean; error?: string }> {
  if (!isMailerConfigured()) {
    console.warn('[Mailer] SMTP_HOST/SMTP_USER/SMTP_PASSWORD nicht vollstaendig gesetzt - E-Mail-Versand übersprungen.');
    return { success: false, error: 'smtp-not-configured' };
  }
  try {
    const fromAddress = getCleanEnv('SMTP_FROM') || `CAPITAL-AI <${getCleanEnv('SMTP_USER')}>`;
    await getTransporter().sendMail({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || htmlToPlainText(params.html),
    });
    console.log('[Mailer] E-Mail erfolgreich versendet.');
    return { success: true };
  } catch (err: unknown) {
    const error = mailerErrorCode(err);
    console.error(`[Mailer] Versand fehlgeschlagen (${error}).`);
    return { success: false, error };
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&';
      case '<': return '<';
      case '>': return '>';
      case '"': return '"';
      default: return '&#39;';
    }
  });
}

export function buildSubscriptionActivatedEmail(planId: string, email: string): { subject: string; html: string } {
  const planLabel = escapeHtml(String(planId).charAt(0).toUpperCase() + String(planId).slice(1).toLowerCase());
  return {
    subject: `Ihr CAPITAL-AI ${planLabel}-Abonnement ist aktiv`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Willkommen im ${planLabel}-Plan!</h2>
        <p>Hallo,</p>
        <p>Ihr <strong>${planLabel}</strong>-Abonnement bei CAPITAL-AI wurde soeben aktiviert und steht Ihnen ab sofort zur Verfügung.</p>
        <p>Bei Fragen erreichen Sie uns jederzeit unter <a href="mailto:support@capital-ai.online">support@capital-ai.online</a>.</p>
        <p>Viele Grüße<br/>Ihr CAPITAL-AI Team</p>
      </div>
    `,
  };
}

export interface SubscriptionConfirmationData {
  planId: string;
  sessionId: string;
  userId?: string;
  amountTotal?: number | null;
  currency?: string | null;
}

export function buildOwnerSubscriptionNotificationEmail(
  customerEmail: string,
  data: SubscriptionConfirmationData
): { subject: string; html: string } {
  const amount =
    typeof data.amountTotal === 'number' && data.currency
      ? `${(data.amountTotal / 100).toFixed(2)} ${escapeHtml(data.currency.toUpperCase())}`
      : 'unbekannt';
  return {
    subject: `Neues Abo aktiviert: ${data.planId}`,
    html: `
      <div style="font-family: sans-serif;">
        <h3>Neue Abo-Aktivierung</h3>
        <ul>
          <li><strong>Plan:</strong> ${escapeHtml(data.planId)}</li>
          <li><strong>E-Mail:</strong> ${customerEmail ? escapeHtml(customerEmail) : '(unbekannt)'}</li>
          <li><strong>User-ID:</strong> ${data.userId ? escapeHtml(data.userId) : '(unbekannt)'}</li>
          <li><strong>Betrag:</strong> ${amount}</li>
          <li><strong>Stripe Checkout Session:</strong> ${escapeHtml(data.sessionId)}</li>
        </ul>
      </div>
    `,
  };
}

const SUBSCRIPTION_CONFIRMATIONS_FILE = path.join(process.cwd(), 'uploads', 'subscription_confirmations_sent.json');
const MAX_TRACKED_CONFIRMATIONS = 1000;

interface TrackedConfirmation {
  sessionId: string;
  sentAt: string;
}

function readTrackedConfirmationsLocal(): TrackedConfirmation[] {
  try {
    if (!fs.existsSync(SUBSCRIPTION_CONFIRMATIONS_FILE)) return [];
    const raw = fs.readFileSync(SUBSCRIPTION_CONFIRMATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[Mailer] Lokaler Idempotenz-Speicher nicht lesbar:', err);
    return [];
  }
}

function claimConfirmationLocal(sessionId: string): boolean {
  try {
    const existing = readTrackedConfirmationsLocal();
    if (existing.some((entry) => entry.sessionId === sessionId)) return false;
    const updated = [...existing, { sessionId, sentAt: new Date().toISOString() }].slice(-MAX_TRACKED_CONFIRMATIONS);
    fs.mkdirSync(path.dirname(SUBSCRIPTION_CONFIRMATIONS_FILE), { recursive: true });
    fs.writeFileSync(SUBSCRIPTION_CONFIRMATIONS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[Mailer] Lokale Confirmation-Reservation fehlgeschlagen:', err);
    return false;
  }
}

type ConfirmationClaim =
  | { status: 'claimed' }
  | { status: 'duplicate' }
  | { status: 'unavailable'; error: string };

async function claimSubscriptionConfirmation(sessionId: string): Promise<ConfirmationClaim> {
  if (!isSupabaseConfigured()) {
    if (getCleanEnv('NODE_ENV') === 'production') {
      console.error('[Mailer] Production confirmation claim blocked: privileged Supabase is unavailable.');
      return { status: 'unavailable', error: 'confirmation-reservation-unavailable' };
    }
    return claimConfirmationLocal(sessionId) ? { status: 'claimed' } : { status: 'duplicate' };
  }

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.rpc('claim_subscription_confirmation', {
      p_session_id: sessionId,
    });
    if (error) throw error;
    return data === true ? { status: 'claimed' } : { status: 'duplicate' };
  } catch (err: unknown) {
    const error = mailerErrorCode(err);
    console.error(`[Mailer] Atomic confirmation reservation in Supabase failed; mail send blocked (${error}).`);
    return { status: 'unavailable', error: 'confirmation-reservation-failed' };
  }
}

export type ConfirmationMailRecipientKind = 'customer' | 'owner';

export interface SubscriptionConfirmationMailJobPayload {
  kind: ConfirmationMailRecipientKind;
  to: string;
  subject: string;
  html: string;
  sessionId: string;
}

async function scheduleConfirmationMailRetry(
  kind: ConfirmationMailRecipientKind,
  sessionId: string,
  to: string,
  message: { subject: string; html: string }
): Promise<void> {
  const ref = logCorrelationRef(sessionId);
  try {
    const result = await enqueueOutboxJob({
      jobType: 'subscription_confirmation_mail',
      idempotencyKey: `subscription_confirmation_mail:${sessionId}:${kind}`,
      payload: { kind, to, subject: message.subject, html: message.html, sessionId },
    });
    if (result.enqueued) {
      console.log(`[Mailer] Outbox-Retry fuer ${kind}-Bestaetigungsmail eingeplant (Ref ${ref}, Job ${result.jobId}).`);
    }
  } catch (err: unknown) {
    const error = mailerErrorCode(err);
    console.error(`[Mailer] Outbox-Retry fuer ${kind}-Bestaetigungsmail konnte nicht eingeplant werden (Ref ${ref}, ${error}).`);
  }
}

export async function processSubscriptionConfirmationMailJob(
  payload: Record<string, unknown>
): Promise<void> {
  const { to, subject, html, sessionId, kind } = payload as unknown as SubscriptionConfirmationMailJobPayload;
  if (!to || !subject || !html) {
    throw new Error('[Mailer] subscription_confirmation_mail job payload missing to/subject/html.');
  }
  const result = await sendMail({ to, subject, html });
  if (!result.success) {
    throw new Error(result.error || `send failed for ${kind} confirmation mail (Ref ${logCorrelationRef(sessionId || 'missing')})`);
  }
}

export interface SubscriptionConfirmationResult {
  skippedAsDuplicate: boolean;
  customer: { attempted: boolean; success: boolean; error?: string };
  owner: { attempted: boolean; success: boolean; error?: string };
}

export async function sendSubscriptionConfirmation(
  customerEmail: string,
  ownerEmail: string,
  subscriptionData: SubscriptionConfirmationData
): Promise<SubscriptionConfirmationResult> {
  const { sessionId, planId } = subscriptionData;

  if (!sessionId) {
    console.error('[Mailer] sendSubscriptionConfirmation ohne sessionId aufgerufen - Idempotenz nicht sicherstellbar, Versand uebersprungen.');
    return {
      skippedAsDuplicate: false,
      customer: { attempted: false, success: false, error: 'missing-session-id' },
      owner: { attempted: false, success: false, error: 'missing-session-id' },
    };
  }

  const ref = logCorrelationRef(sessionId);
  const reservation = await claimSubscriptionConfirmation(sessionId);
  if (reservation.status === 'duplicate') {
    console.log(`[Mailer] Abo-Bestaetigung bereits reserviert/versendet - Duplikat uebersprungen (Ref ${ref}).`);
    return {
      skippedAsDuplicate: true,
      customer: { attempted: false, success: false },
      owner: { attempted: false, success: false },
    };
  }
  if (reservation.status === 'unavailable') {
    return {
      skippedAsDuplicate: false,
      customer: { attempted: false, success: false, error: reservation.error },
      owner: { attempted: false, success: false, error: reservation.error },
    };
  }

  const customerAttempted = Boolean(customerEmail);
  const [customerOutcome, ownerOutcome] = await Promise.allSettled([
    customerAttempted
      ? sendMail({ to: customerEmail, ...buildSubscriptionActivatedEmail(planId, customerEmail) })
      : Promise.resolve({ success: false, error: 'no-customer-email' }),
    sendMail({ to: ownerEmail, ...buildOwnerSubscriptionNotificationEmail(customerEmail, subscriptionData) }),
  ]);

  const customerResult =
    customerOutcome.status === 'fulfilled'
      ? customerOutcome.value
      : { success: false, error: mailerErrorCode(customerOutcome.reason) };
  const ownerResult =
    ownerOutcome.status === 'fulfilled'
      ? ownerOutcome.value
      : { success: false, error: mailerErrorCode(ownerOutcome.reason) };

  if (customerAttempted) {
    console.log(
      customerResult.success
        ? `[Mailer] Abo-Bestaetigung an Kunden gesendet (Ref ${ref}).`
        : `[Mailer] Abo-Bestaetigung an Kunden fehlgeschlagen (Ref ${ref}, ${customerResult.error}).`
    );
    if (!customerResult.success) {
      await scheduleConfirmationMailRetry(
        'customer',
        sessionId,
        customerEmail,
        buildSubscriptionActivatedEmail(planId, customerEmail)
      );
    }
  } else {
    console.warn(`[Mailer] Keine Kunden-E-Mail fuer Abo-Bestaetigung vorhanden; Owner-Benachrichtigung erfolgt trotzdem (Ref ${ref}).`);
  }
  console.log(
    ownerResult.success
      ? `[Mailer] Owner-Benachrichtigung gesendet (Ref ${ref}).`
      : `[Mailer] Owner-Benachrichtigung fehlgeschlagen (Ref ${ref}, ${ownerResult.error}).`
  );
  if (!ownerResult.success) {
    await scheduleConfirmationMailRetry(
      'owner',
      sessionId,
      ownerEmail,
      buildOwnerSubscriptionNotificationEmail(customerEmail, subscriptionData)
    );
  }

  return {
    skippedAsDuplicate: false,
    customer: { attempted: customerAttempted, ...customerResult },
    owner: { attempted: true, ...ownerResult },
  };
}
