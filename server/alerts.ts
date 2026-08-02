// ARCH-AUDIT-0002 (H2, Kapitel 14.5) - Serverseitiges Alerting. Vorher konnte ein Score-
// Ausschlag (Watchlist.tsx: "News <3.0 o. >7.0 triggert Push") nur etwas in einer bereits
// offenen Browser-Session bewirken - kein Signal erreichte einen Nutzer, der die Seite gerade
// nicht offen hatte. Dieses Modul schliesst genau diese Luecke: E-Mail-Alerts, ausgeloest vom
// bereits vorhandenen 60-Sekunden-Hintergrund-Refresh in server.ts (kein neuer Scheduler-
// Mechanismus - Wiederverwendung des bestehenden Wertschoepfungsschritts, analog zu
// recordDailySnapshots() aus server/scoreValidation.ts, N1).
//
// Identitaetsmodell (siehe AskUserQuestion-Entscheidung in dieser Session): es gibt keine
// echte Endnutzer-Session in dieser Anwendung, nur die bereits bestehende schwache
// E-Mail-Bindung (public.subscriptions/public.user_quota, server/db.ts). Alert-Abos folgen
// demselben Muster, ABER zusaetzlich mit Double-Opt-In (confirm_token) - ohne diese Sperre
// koennte jeder Aufrufer eine fremde E-Mail-Adresse mit Alert-Mails belasten. Jede
// Alert-Mail traegt ausserdem einen individuellen Unsubscribe-Link (unsubscribe_token).
//
// Anti-Spam bei anhaltender Schwellenwert-Ueberschreitung: kein Crossing-Detection-Zustands-
// automat (dafuer muesste der vorherige Score jedes Assets je Abo vorgehalten werden),
// sondern ein einfacher Cooldown (ALERT_COOLDOWN_MS) ueber last_notified_at - deutlich
// einfacher und ausreichend fuer den Zweck (kein staendiges Nachfeuern, waehrend die
// Bedingung erfuellt bleibt).

import express from 'express';
import crypto from 'crypto';
import { getServerSupabase, isSupabaseConfigured } from './db';
import { getCleanEnv } from './env';
import { sendMail } from './mailer';
import { checkRateLimit, getClientIp } from '../src/platform/Security/rateLimiter';
import { createLogger } from './logger';

const alertsLogger = createLogger('alerts');

const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 Stunden
const ALLOWED_CONDITIONS = ['score_above', 'score_below'] as const;
type AlertCondition = (typeof ALLOWED_CONDITIONS)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getBaseUrl(): string {
  // RENDER_EXTERNAL_URL wird von Render automatisch gesetzt (kein render.yaml-Eintrag
  // noetig, kein Secret) - siehe scripts/automation/verifyDeploymentReadiness.ts.
  const renderUrl = getCleanEnv('RENDER_EXTERNAL_URL');
  if (renderUrl) return renderUrl.replace(/\/$/, '');
  return `http://localhost:${getCleanEnv('PORT') || '3000'}`;
}

function isValidCondition(value: unknown): value is AlertCondition {
  return typeof value === 'string' && (ALLOWED_CONDITIONS as readonly string[]).includes(value);
}

// --- Erstellung + Double-Opt-In -----------------------------------------------------------

export const alertsRouter = express.Router();

alertsRouter.post('/', async (req, res) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Alerting ist derzeit nicht verfuegbar.' });
  }

  // Eigene, engere Grenze zusaetzlich zum globalen Rate-Limit (server.ts) - dieser
  // Endpunkt versendet E-Mails an vom Aufrufer angegebene Adressen, daher eine eigene,
  // deutlich engere Schranke gegen Missbrauch (E-Mail-Bombing fremder Adressen).
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`alerts-create:${ip}`, 10, 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Zu viele Alert-Anmeldungen. Bitte spaeter erneut versuchen.' });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const symbol = typeof req.body?.symbol === 'string' ? req.body.symbol.trim().toUpperCase() : '';
  const assetType = typeof req.body?.assetType === 'string' ? req.body.assetType.trim() : '';
  const condition = req.body?.condition;
  const thresholdRaw = Number(req.body?.threshold);

  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Ungueltige E-Mail-Adresse.' });
  }
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol fehlt.' });
  }
  if (!isValidCondition(condition)) {
    return res.status(400).json({ error: `condition muss eines von ${ALLOWED_CONDITIONS.join(', ')} sein.` });
  }
  if (!Number.isFinite(thresholdRaw) || thresholdRaw < 0 || thresholdRaw > 10) {
    return res.status(400).json({ error: 'threshold muss eine Zahl zwischen 0 und 10 sein (Score-Skala).' });
  }

  const confirmToken = crypto.randomBytes(24).toString('hex');
  const unsubscribeToken = crypto.randomBytes(24).toString('hex');

  try {
    const supabase = getServerSupabase();
    const { error } = await supabase.from('alert_subscriptions').insert({
      email,
      symbol,
      asset_type: assetType || 'unbekannt',
      condition,
      threshold: thresholdRaw,
      confirmed: false,
      confirm_token: confirmToken,
      unsubscribe_token: unsubscribeToken,
      active: true,
    });
    if (error) {
      alertsLogger.error('Anlage des Alert-Abos fehlgeschlagen', { requestId: req.requestId, error: error.message });
      return res.status(500).json({ error: 'Alert-Abo konnte nicht angelegt werden.' });
    }
  } catch (err: any) {
    alertsLogger.error('Anlage des Alert-Abos fehlgeschlagen', { requestId: req.requestId, error: err?.message || String(err) });
    return res.status(500).json({ error: 'Alert-Abo konnte nicht angelegt werden.' });
  }

  const confirmUrl = `${getBaseUrl()}/api/alerts/confirm?token=${confirmToken}`;
  const conditionLabel = condition === 'score_above' ? `über ${thresholdRaw}` : `unter ${thresholdRaw}`;
  const mailResult = await sendMail({
    to: email,
    subject: `Bitte bestätigen: Alert für ${symbol}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Alert-Anmeldung bestätigen</h2>
        <p>Sie (oder jemand mit dieser E-Mail-Adresse) haben einen Alert für <strong>${symbol}</strong> eingerichtet: Benachrichtigung, wenn der Score ${conditionLabel} liegt.</p>
        <p><a href="${confirmUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Alert bestätigen</a></p>
        <p style="color:#666;font-size:12px;">Falls Sie diesen Alert nicht angefordert haben, ignorieren Sie diese E-Mail einfach - ohne Bestätigung wird kein Alert aktiv.</p>
      </div>
    `,
  });

  alertsLogger.info('Alert-Abo angelegt, Bestaetigungsmail ausgeloest', {
    requestId: req.requestId,
    symbol,
    condition,
    mailSent: mailResult.success,
  });

  res.status(201).json({ status: 'pending_confirmation' });
});

alertsRouter.get('/confirm', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token || !isSupabaseConfigured()) {
    return res.status(400).send(renderStatusPage('Ungültiger Bestätigungslink.'));
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('alert_subscriptions')
      .update({ confirmed: true, confirm_token: null })
      .eq('confirm_token', token)
      .select('symbol')
      .maybeSingle();
    if (error || !data) {
      return res.status(404).send(renderStatusPage('Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet.'));
    }
    return res.send(renderStatusPage(`Alert für ${data.symbol} ist jetzt aktiv.`));
  } catch (err: any) {
    alertsLogger.error('Bestaetigung fehlgeschlagen', { requestId: req.requestId, error: err?.message || String(err) });
    return res.status(500).send(renderStatusPage('Bestätigung fehlgeschlagen. Bitte später erneut versuchen.'));
  }
});

alertsRouter.get('/unsubscribe', async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token || !isSupabaseConfigured()) {
    return res.status(400).send(renderStatusPage('Ungültiger Abmeldelink.'));
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('alert_subscriptions')
      .update({ active: false })
      .eq('unsubscribe_token', token)
      .select('symbol')
      .maybeSingle();
    if (error || !data) {
      return res.status(404).send(renderStatusPage('Dieser Abmeldelink ist ungültig oder der Alert wurde bereits abgemeldet.'));
    }
    return res.send(renderStatusPage(`Alert für ${data.symbol} wurde abgemeldet.`));
  } catch (err: any) {
    alertsLogger.error('Abmeldung fehlgeschlagen', { requestId: req.requestId, error: err?.message || String(err) });
    return res.status(500).send(renderStatusPage('Abmeldung fehlgeschlagen. Bitte später erneut versuchen.'));
  }
});

function renderStatusPage(message: string): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>CAPITAL-AI Alerts</title></head>` +
    `<body style="font-family: sans-serif; max-width: 480px; margin: 80px auto; text-align: center;">` +
    `<h2>${message}</h2></body></html>`;
}

// --- Auswertung (aus server.ts, fetchLiveMarketData) ---------------------------------------

export interface AlertEvaluationInput {
  symbol: string;
  score: number;
}

/**
 * Prueft alle bestaetigten, aktiven Abos gegen die aktuellen Scores und versendet faellige
 * Alert-Mails. Best-effort: ein Fehler hier darf den aufrufenden Request (/api/market-data)
 * nicht scheitern lassen - gleiches Muster wie recordDailySnapshots() in scoreValidation.ts.
 */
export async function evaluateAlerts(assets: AlertEvaluationInput[]): Promise<void> {
  if (!isSupabaseConfigured() || assets.length === 0) return;

  const scoreBySymbol = new Map<string, number>();
  for (const a of assets) {
    if (a.symbol && Number.isFinite(a.score)) scoreBySymbol.set(a.symbol.toUpperCase(), a.score);
  }
  if (scoreBySymbol.size === 0) return;

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('alert_subscriptions')
      .select('id, email, symbol, condition, threshold, last_notified_at, unsubscribe_token')
      .eq('confirmed', true)
      .eq('active', true)
      .in('symbol', Array.from(scoreBySymbol.keys()));

    if (error || !data) {
      if (error) alertsLogger.warn('Alert-Auswertung: Abfrage fehlgeschlagen', { error: error.message });
      return;
    }

    const now = Date.now();
    for (const sub of data as Array<{
      id: string; email: string; symbol: string; condition: AlertCondition; threshold: number;
      last_notified_at: string | null; unsubscribe_token: string;
    }>) {
      const score = scoreBySymbol.get(sub.symbol.toUpperCase());
      if (score === undefined) continue;

      const conditionMet = sub.condition === 'score_above' ? score > sub.threshold : score < sub.threshold;
      if (!conditionMet) continue;

      if (sub.last_notified_at) {
        const elapsed = now - new Date(sub.last_notified_at).getTime();
        if (elapsed < ALERT_COOLDOWN_MS) continue;
      }

      await sendAlertNotification(sub, score);
    }
  } catch (err: any) {
    alertsLogger.warn('Alert-Auswertung fehlgeschlagen', { error: err?.message || String(err) });
  }
}

async function sendAlertNotification(
  sub: { id: string; email: string; symbol: string; condition: AlertCondition; threshold: number; unsubscribe_token: string },
  currentScore: number
): Promise<void> {
  const unsubscribeUrl = `${getBaseUrl()}/api/alerts/unsubscribe?token=${sub.unsubscribe_token}`;
  const conditionLabel = sub.condition === 'score_above' ? `über ${sub.threshold}` : `unter ${sub.threshold}`;

  const result = await sendMail({
    to: sub.email,
    subject: `CAPITAL-AI Alert: ${sub.symbol} — Score ${currentScore.toFixed(1)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${sub.symbol}: Score ${conditionLabel}</h2>
        <p>Der aktuelle Score für <strong>${sub.symbol}</strong> beträgt <strong>${currentScore.toFixed(1)}</strong> und erfüllt damit Ihre Alert-Bedingung (${conditionLabel}).</p>
        <p style="color:#666;font-size:12px;">
          <a href="${unsubscribeUrl}">Diesen Alert abmelden</a>
        </p>
      </div>
    `,
  });

  // Cooldown erst NACH tatsaechlich erfolgreichem Versand setzen - schlaegt der Versand fehl
  // (z.B. SMTP voruebergehend nicht erreichbar), soll der naechste Auswertungszyklus (60s)
  // es erneut versuchen, statt den Nutzer bis zu 6 Stunden ohne Benachrichtigung zu lassen.
  if (result.success) {
    try {
      const supabase = getServerSupabase();
      await supabase
        .from('alert_subscriptions')
        .update({ last_notified_at: new Date().toISOString() })
        .eq('id', sub.id);
    } catch (err: any) {
      alertsLogger.warn('last_notified_at konnte nicht aktualisiert werden', { symbol: sub.symbol, error: err?.message || String(err) });
    }
  }

  alertsLogger.info('Alert-Mail ausgeloest', { symbol: sub.symbol, mailSent: result.success });
}
