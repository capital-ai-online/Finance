// SMTP-Mailer fuer transaktionale System-E-Mails (z.B. Abo-Aktivierung).
// Nutzt nodemailer (etablierte, battle-tested Standard-Bibliothek fuer Node.js SMTP -
// Auth-Mechanismus-Aushandlung, Multiline-Response-Handling, Provider-Eigenheiten sind
// dort bereits ueber Jahre gegen reale SMTP-Server gehaertet) statt einer eigenen
// Protokoll-Implementierung. Alle Zugangsdaten ausschliesslich ueber Umgebungsvariablen.

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getCleanEnv } from './env';

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
 * Exception nach aussen (Fire-and-forget-Charakter fuer Aufrufer wie den Stripe-
 * Webhook-Handler) - ein fehlgeschlagener E-Mail-Versand darf niemals die eigentliche
 * Webhook-Verarbeitung (Freischaltung des Abos) blockieren oder zum Scheitern bringen.
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
   * wenn Stripe denselben Webhook mehrfach zustellt (at-least-once delivery).
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

// --- Idempotenz-Speicher fuer sendSubscriptionConfirmation() ------------------
//
// Stripe stellt Webhooks mit "at-least-once"-Semantik zu - ein und dasselbe Event
// kann mehrfach eintreffen (Retry nach Timeout, manueller Resend im Dashboard,
// etc.). Ohne Sperre wuerde jede Zustellung ein neues E-Mail-Paar auslösen. Die
// Sperre wird auf der Stripe Checkout Session ID gefuehrt (stabil je Kauf,
// anders als die Event-ID, die sich bei einem manuellen Resend aendern kann).
//
// Dateibasiert statt In-Memory, damit ein Prozess-Neustart (Deploy) keine
// bereits gesendete Bestaetigung erneut versendet - konsistent mit dem
// bestehenden Muster in systemEvents.ts (SYSTEM_EVENTS_FILE).
const SUBSCRIPTION_CONFIRMATIONS_FILE = path.join(process.cwd(), 'uploads', 'subscription_confirmations_sent.json');
const MAX_TRACKED_CONFIRMATIONS = 1000;

interface TrackedConfirmation {
  sessionId: string;
  sentAt: string;
}

function readTrackedConfirmations(): TrackedConfirmation[] {
  try {
    if (!fs.existsSync(SUBSCRIPTION_CONFIRMATIONS_FILE)) return [];
    const raw = fs.readFileSync(SUBSCRIPTION_CONFIRMATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // Ein beschaedigter/nicht lesbarer Idempotenz-Speicher darf den Versand
    // niemals blockieren - im Zweifel wird als "noch nicht gesendet" behandelt.
    console.error('[Mailer] Idempotenz-Speicher nicht lesbar, fahre ohne Sperre fort:', err);
    return [];
  }
}

function hasConfirmationBeenSent(sessionId: string): boolean {
  return readTrackedConfirmations().some((entry) => entry.sessionId === sessionId);
}

function markConfirmationSent(sessionId: string): void {
  try {
    const existing = readTrackedConfirmations();
    if (existing.some((entry) => entry.sessionId === sessionId)) return;
    const updated = [...existing, { sessionId, sentAt: new Date().toISOString() }].slice(-MAX_TRACKED_CONFIRMATIONS);
    fs.mkdirSync(path.dirname(SUBSCRIPTION_CONFIRMATIONS_FILE), { recursive: true });
    fs.writeFileSync(SUBSCRIPTION_CONFIRMATIONS_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    // Fehler beim Persistieren der Sperre darf den bereits erfolgten Versand
    // nicht rueckgaengig machen oder den Aufrufer scheitern lassen - lediglich
    // loggen. Im schlimmsten Fall wird bei einem spaeteren Retry doppelt
    // versendet, was fuer eine Bestaetigungs-E-Mail unkritisch ist.
    console.error('[Mailer] Idempotenz-Speicher konnte nicht geschrieben werden:', err);
  }
}

export interface SubscriptionConfirmationResult {
  /** true, wenn dieser Aufruf wegen bereits erfolgter Zustellung uebersprungen wurde. */
  skippedAsDuplicate: boolean;
  customer: { attempted: boolean; success: boolean; error?: string };
  owner: { attempted: boolean; success: boolean; error?: string };
}

/**
 * Versendet die Abo-Bestaetigung an den Kunden und die interne Benachrichtigung
 * an den Owner. Deterministisch, idempotent (pro Stripe Checkout Session genau
 * einmal) und side-effect-safe: wirft NIEMALS eine Exception, unabhaengig davon
 * ob SMTP nicht konfiguriert ist, der Versand fehlschlaegt oder der
 * Idempotenz-Speicher nicht verfuegbar ist. Aufrufer (z.B. der Stripe-Webhook-
 * Handler) koennen das Ergebnis fuer Logging/Diagnose auswerten, muessen es aber
 * nicht - der Webhook darf in jedem Fall mit 200 OK antworten.
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

  if (hasConfirmationBeenSent(sessionId)) {
    console.log(`[Mailer] Abo-Bestaetigung fuer Session ${sessionId} bereits versendet - Duplikat uebersprungen (Idempotenz).`);
    return {
      skippedAsDuplicate: true,
      customer: { attempted: false, success: false },
      owner: { attempted: false, success: false },
    };
  }

  // Sperre VOR dem eigentlichen Versand setzen, nicht danach: ein paralleler
  // zweiter Webhook-Aufruf fuer dieselbe Session (Stripe kann Retries auch
  // ueberlappend zustellen) soll den in-flight-Versand ebenfalls als bereits
  // laufend erkennen, statt in der Race Condition zwischen "Versand gestartet"
  // und "Versand geloggt" ein zweites Mal zuzuschlagen.
  markConfirmationSent(sessionId);

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
