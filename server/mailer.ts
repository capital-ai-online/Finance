// SMTP-Mailer fuer transaktionale System-E-Mails (z.B. Abo-Aktivierung).
// Nutzt nodemailer (etablierte, battle-tested Standard-Bibliothek fuer Node.js SMTP -
// Auth-Mechanismus-Aushandlung, Multiline-Response-Handling, Provider-Eigenheiten sind
// dort bereits ueber Jahre gegen reale SMTP-Server gehaertet) statt einer eigenen
// Protokoll-Implementierung. Alle Zugangsdaten ausschliesslich ueber Umgebungsvariablen.

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getCleanEnv } from './env';
import { getServerSupabase, isSupabaseConfigured } from './db';

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
      // Port 465 = implizites TLS von Anfang an; 587 = STARTTLS nach Verbindungsaufbau.
      secure: port === 465,
      auth: {
        user: getCleanEnv('SMTP_USER'),
        pass: getCleanEnv('SMTP_PASSWORD'),
      },
    });
  }
  return transporter;
}

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Versendet eine System-E-Mail ueber das konfigurierte SMTP-Konto. Wirft NIE eine
 * Exception nach aussen - ein fehlgeschlagener E-Mail-Versand darf niemals die
 * Subscription-Projektion in Supabase beeinflussen.
 */
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
      text: params.text || params.html.replace(/<[^>]+>/g, ''),
    });
    console.log(`[Mailer] E-Mail an ${params.to} gesendet: "${params.subject}"`);
    return { success: true };
  } catch (err: any) {
    console.error(`[Mailer] Versand an ${params.to} fehlgeschlagen:`, err?.message || err);
    return { success: false, error: err?.message || 'unknown' };
  }
}

export function buildSubscriptionActivatedEmail(planId: string, email: string): { subject: string; html: string } {
  const planLabel = String(planId).charAt(0).toUpperCase() + String(planId).slice(1).toLowerCase();
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
  /** Stripe Plan-/Preis-Bezeichner aus session.metadata.plan_id. */
  planId: string;
  /**
   * Stripe Checkout Session ID (session.id). Dient als Idempotenz-Schluessel -
   * derselbe Checkout-Abschluss darf niemals zwei E-Mail-Paare ausloesen, auch
   * wenn Stripe denselben Webhook mehrfach zustellt oder manuell erneut sendet.
   */
  sessionId: string;
  userId?: string;
  amountTotal?: number | null;
  currency?: string | null;
}

function buildOwnerSubscriptionNotificationEmail(
  customerEmail: string,
  data: SubscriptionConfirmationData
): { subject: string; html: string } {
  const amount =
    typeof data.amountTotal === 'number' && data.currency
      ? `${(data.amountTotal / 100).toFixed(2)} ${data.currency.toUpperCase()}`
      : 'unbekannt';
  return {
    subject: `Neues Abo aktiviert: ${data.planId} (${customerEmail || data.userId || 'unbekannt'})`,
    html: `
      <div style="font-family: sans-serif;">
        <h3>Neue Abo-Aktivierung</h3>
        <ul>
          <li><strong>Plan:</strong> ${data.planId}</li>
          <li><strong>E-Mail:</strong> ${customerEmail || '(unbekannt)'}</li>
          <li><strong>User-ID:</strong> ${data.userId || '(unbekannt)'}</li>
          <li><strong>Betrag:</strong> ${amount}</li>
          <li><strong>Stripe Checkout Session:</strong> ${data.sessionId}</li>
        </ul>
      </div>
    `,
  };
}

// --- Atomic reservation fuer sendSubscriptionConfirmation() -------------------
//
// ADR-0045 / R-003: Die fruehere Supabase-Sequenz SELECT -> UPSERT war nicht atomar.
// Zwei parallele Webhook-Aufrufe konnten beide "noch nicht gesendet" lesen und danach
// beide senden. public.claim_subscription_confirmation(session_id) fuehrt jetzt ein
// einziges INSERT ... ON CONFLICT DO NOTHING in PostgreSQL aus und liefert zurueck,
// welcher Aufrufer die Reservation gewonnen hat.
//
// Die lokale Datei bleibt ausschliesslich fuer Entwicklung ohne Supabase erhalten.
// In Produktion darf ein fehlender/fehlerhafter Supabase-Claim NICHT auf Renders
// ephemeres Dateisystem zurueckfallen, weil dadurch horizontale/redeploy-sichere
// Idempotenz wieder verloren ginge.
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
  } catch (err: any) {
    console.error('[Mailer] Atomic confirmation reservation in Supabase failed; mail send blocked:', err?.message || err);
    return { status: 'unavailable', error: 'confirmation-reservation-failed' };
  }
}

export interface SubscriptionConfirmationResult {
  /** true, wenn dieser Aufruf wegen bereits erfolgter/in-flight Zustellung uebersprungen wurde. */
  skippedAsDuplicate: boolean;
  customer: { attempted: boolean; success: boolean; error?: string };
  owner: { attempted: boolean; success: boolean; error?: string };
}

/**
 * Versendet die Abo-Bestaetigung an den Kunden und die interne Benachrichtigung
 * an den Owner. Die Reservation erfolgt VOR SMTP und atomar je Checkout Session.
 * SMTP-Fehler werden als Ergebnis zurueckgegeben, aber nicht geworfen.
 */
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

  const reservation = await claimSubscriptionConfirmation(sessionId);
  if (reservation.status === 'duplicate') {
    console.log(`[Mailer] Abo-Bestaetigung fuer Session ${sessionId} bereits reserviert/versendet - Duplikat uebersprungen.`);
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
      : { success: false, error: customerOutcome.reason?.message || 'unknown' };
  const ownerResult =
    ownerOutcome.status === 'fulfilled'
      ? ownerOutcome.value
      : { success: false, error: ownerOutcome.reason?.message || 'unknown' };

  if (customerAttempted) {
    console.log(
      customerResult.success
        ? `[Mailer] Abo-Bestaetigung an Kunde ${customerEmail} gesendet (Session ${sessionId}).`
        : `[Mailer] Abo-Bestaetigung an Kunde ${customerEmail} fehlgeschlagen (Session ${sessionId}): ${customerResult.error}`
    );
  } else {
    console.warn(`[Mailer] Keine Kunden-E-Mail fuer Session ${sessionId} bekannt - Bestaetigung nicht versendet, Owner-Benachrichtigung erfolgt trotzdem.`);
  }
  console.log(
    ownerResult.success
      ? `[Mailer] Owner-Benachrichtigung an ${ownerEmail} gesendet (Session ${sessionId}).`
      : `[Mailer] Owner-Benachrichtigung an ${ownerEmail} fehlgeschlagen (Session ${sessionId}): ${ownerResult.error}`
  );

  return {
    skippedAsDuplicate: false,
    customer: { attempted: customerAttempted, ...customerResult },
    owner: { attempted: true, ...ownerResult },
  };
}
