// SMTP-Mailer fuer transaktionale System-E-Mails (z.B. Abo-Aktivierung).
// Nutzt nodemailer (etablierte, battle-tested Standard-Bibliothek fuer Node.js SMTP -
// Auth-Mechanismus-Aushandlung, Multiline-Response-Handling, Provider-Eigenheiten sind
// dort bereits ueber Jahre gegen reale SMTP-Server gehaertet) statt einer eigenen
// Protokoll-Implementierung. Alle Zugangsdaten ausschliesslich ueber Umgebungsvariablen.

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
