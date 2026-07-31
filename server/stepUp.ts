// ADR-0003.5 — TOTP-Step-Up-Authentifizierung & Break-Glass-Recovery.
//
// Owner-Aktionen (Rollenvergabe, Break-Glass, kritische System-Eingriffe) verlangen
// zusätzlich zur normalen Session einen frischen, kurzlebigen Step-Up-Nachweis per TOTP.
// Sämtliche Endpunkte hier verlangen eine bereits gültige Supabase-Session (Bearer-Token);
// es gibt keinen Pfad, der ohne bestehende Authentifizierung Owner-Rechte gewährt.

import express from 'express';
import { getServerSupabase, isSupabaseConfigured } from './db';
import { resolveVerifiedIdentity, logIamEvent } from './iam/authMiddleware';
import { checkRateLimit, getClientIp } from './iam/rateLimiter';
import { encryptSecret, decryptSecret, hashOpaqueToken, generateOpaqueToken } from './iam/secretCrypto';
import { generateBase32Secret, verifyTotp, buildOtpAuthUri } from './iam/totp';

export const stepUpRouter = express.Router();

async function logSecurityEvent(fields: {
  event_type: string;
  ip_address?: string;
  user_agent?: string;
  actor_user_id?: string;
  outcome: string;
  reason?: string;
  endpoint?: string;
}) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getServerSupabase();
    await supabase.from('security_events').insert({
      event_type: fields.event_type,
      ip_address: fields.ip_address || null,
      user_agent: fields.user_agent || null,
      attempted_email: null,
      endpoint: fields.endpoint || null,
      outcome: fields.outcome,
      reason: fields.reason || null,
    });
  } catch {
    // security_events optional bis Migration bestätigt - Request nicht blockieren.
  }
}

function requireAuth(handler: (req: express.Request, res: express.Response, identity: { userId: string; email: string | null }) => Promise<void | express.Response>) {
  return async (req: express.Request, res: express.Response) => {
    const identity = await resolveVerifiedIdentity(req);
    if (!identity) {
      return res.status(401).json({ error: 'Authentifizierung erforderlich.' });
    }
    // Compliance-Review Punkt 1: Express 4 fängt Rejections aus async Handlern nicht
    // automatisch ab. Ohne dieses try/catch würde z.B. ein fehlendes
    // TOTP_ENCRYPTION_KEY (encryptSecret()/decryptSecret() werfen dann) den Request
    // unbeantwortet hängen lassen statt eine klare 500-Antwort zu liefern.
    try {
      await handler(req, res, identity);
    } catch (err: any) {
      console.error(`[STEP-UP][ERROR] ${req.method} ${req.originalUrl}:`, err?.message || err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Interner Serverfehler.' });
      }
    }
  };
}

// 1. TOTP-Setup starten: erzeugt ein neues Secret, speichert es nur als "pending"
//    (noch nicht aktiv), bis der Nutzer einen Code erfolgreich verifiziert.
stepUpRouter.post('/totp/setup', requireAuth(async (req, res, identity) => {
  if (!checkRateLimit(`totp-setup:${identity.userId}`, 5, 60_000)) {
    return res.status(429).json({ error: 'Zu viele Versuche. Bitte kurz warten.' });
  }
  const secret = generateBase32Secret();
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('profiles')
    .update({ totp_pending_secret_encrypted: encryptSecret(secret) })
    .eq('id', identity.userId);
  if (error) {
    return res.status(500).json({ error: 'Setup konnte nicht gespeichert werden.' });
  }
  res.json({
    secret,
    otpauthUri: buildOtpAuthUri(secret, identity.email || identity.userId),
  });
}));

// 2. TOTP-Setup bestätigen: verifiziert den ersten Code, aktiviert TOTP, generiert
//    einmalig 10 Break-Glass-Recovery-Codes (nur JETZT im Klartext sichtbar).
stepUpRouter.post('/totp/verify-setup', requireAuth(async (req, res, identity) => {
  if (!checkRateLimit(`totp-verify-setup:${identity.userId}`, 8, 5 * 60_000)) {
    return res.status(429).json({ error: 'Zu viele Versuche. Bitte 5 Minuten warten.' });
  }
  const { code } = req.body;
  const supabase = getServerSupabase();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('totp_pending_secret_encrypted')
    .eq('id', identity.userId)
    .maybeSingle();

  if (error || !profile?.totp_pending_secret_encrypted) {
    return res.status(400).json({ error: 'Kein ausstehendes TOTP-Setup gefunden. Bitte zuerst /totp/setup aufrufen.' });
  }

  const secret = decryptSecret(profile.totp_pending_secret_encrypted);
  if (!verifyTotp(secret, String(code || ''))) {
    await logSecurityEvent({
      event_type: 'invalid_token',
      actor_user_id: identity.userId,
      ip_address: getClientIp(req as any),
      outcome: 'blocked',
      reason: 'TOTP-Setup-Verifikation fehlgeschlagen',
      endpoint: '/api/auth/totp/verify-setup',
    });
    return res.status(400).json({ error: 'Code ungültig oder abgelaufen.' });
  }

  const recoveryCodes = Array.from({ length: 10 }, () =>
    generateOpaqueToken(6).replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase()
  );

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      totp_secret_encrypted: encryptSecret(secret),
      totp_pending_secret_encrypted: null,
      totp_enabled: true,
    })
    .eq('id', identity.userId);
  if (updateErr) {
    return res.status(500).json({ error: 'Aktivierung fehlgeschlagen.' });
  }

  await supabase.from('break_glass_codes').delete().eq('user_id', identity.userId);
  await supabase.from('break_glass_codes').insert(
    recoveryCodes.map((c) => ({ user_id: identity.userId, code_hash: hashOpaqueToken(c) }))
  );

  await logIamEvent(identity.userId, identity.userId, 'totp.enabled', null, { enabled: true });

  res.json({
    success: true,
    recoveryCodes,
  });
}));

// 3. Step-Up-Verifikation: gültiger TOTP-Code -> kurzlebiges, einmaliges Step-Up-Token
//    (5 Minuten), das kritische Owner-Endpunkte zusätzlich zum normalen Bearer-Token verlangen.
stepUpRouter.post('/step-up/verify', requireAuth(async (req, res, identity) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`stepup-verify:${identity.userId}`, 5, 5 * 60_000) || !checkRateLimit(`stepup-verify-ip:${ip}`, 15, 5 * 60_000)) {
    await logSecurityEvent({
      event_type: 'rate_limit_exceeded',
      actor_user_id: identity.userId,
      ip_address: ip,
      outcome: 'blocked',
      endpoint: '/api/auth/step-up/verify',
    });
    return res.status(429).json({ error: 'Zu viele Versuche. Bitte 5 Minuten warten.' });
  }

  const { code, purpose } = req.body;
  const supabase = getServerSupabase();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('totp_secret_encrypted, totp_enabled')
    .eq('id', identity.userId)
    .maybeSingle();

  if (error || !profile?.totp_enabled || !profile.totp_secret_encrypted) {
    return res.status(400).json({ error: 'TOTP ist für dieses Konto nicht aktiviert.' });
  }

  const secret = decryptSecret(profile.totp_secret_encrypted);
  if (!verifyTotp(secret, String(code || ''))) {
    await logSecurityEvent({
      event_type: 'invalid_token',
      actor_user_id: identity.userId,
      ip_address: ip,
      outcome: 'blocked',
      reason: 'Step-Up-TOTP-Code ungültig',
      endpoint: '/api/auth/step-up/verify',
    });
    return res.status(400).json({ error: 'Code ungültig oder abgelaufen.' });
  }

  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
  const { error: insertErr } = await supabase.from('step_up_tokens').insert({
    user_id: identity.userId,
    token_hash: hashOpaqueToken(token),
    purpose: purpose || 'owner-action',
    expires_at: expiresAt,
  });
  if (insertErr) {
    return res.status(500).json({ error: 'Step-Up-Token konnte nicht ausgestellt werden.' });
  }

  res.json({ stepUpToken: token, expiresAt });
}));

// 4. Break-Glass-Redemption.
//
// WICHTIG (siehe COMPLIANCE_REVIEW.md): Dies ersetzt NICHT die normale Authentifizierung.
// Voraussetzung ist eine bereits gültige Supabase-Session - die der Nutzer nur über
// Supabases eigenen, bewährten E-Mail-Passwort-Reset-Flow (supabase.auth.resetPasswordForEmail)
// erhalten kann, falls er ausgesperrt ist. Der Recovery-Code ist ein ZUSÄTZLICHER Faktor
// oben drauf, kein Ersatz für Authentifizierung. Diese Route gewährt keine neuen
// Berechtigungen - sie setzt lediglich TOTP zurück, damit der Owner sich neu einrichten kann,
// und protokolliert den Vorgang als CRITICAL Security Event.
stepUpRouter.post('/break-glass/redeem', requireAuth(async (req, res, identity) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`break-glass:${identity.userId}`, 3, 60 * 60_000)) {
    await logSecurityEvent({
      event_type: 'rate_limit_exceeded',
      actor_user_id: identity.userId,
      ip_address: ip,
      outcome: 'blocked',
      reason: 'Break-Glass Rate-Limit erreicht',
      endpoint: '/api/auth/break-glass/redeem',
    });
    return res.status(429).json({ error: 'Zu viele Versuche. Bitte später erneut versuchen und ggf. den Owner direkt kontaktieren.' });
  }

  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Recovery-Code erforderlich.' });
  }

  const supabase = getServerSupabase();
  const codeHash = hashOpaqueToken(code.toUpperCase().trim());

  const { data: redeemed, error: redeemErr } = await supabase
    .from('break_glass_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', identity.userId)
    .eq('code_hash', codeHash)
    .is('used_at', null)
    .select('id')
    .maybeSingle();

  if (redeemErr || !redeemed) {
    await logSecurityEvent({
      event_type: 'unauthorized_access',
      actor_user_id: identity.userId,
      ip_address: ip,
      outcome: 'blocked',
      reason: 'Ungültiger oder bereits verwendeter Break-Glass-Code',
      endpoint: '/api/auth/break-glass/redeem',
    });
    return res.status(400).json({ error: 'Recovery-Code ungültig oder bereits verwendet.' });
  }

  await supabase.from('break_glass_codes').delete().eq('user_id', identity.userId);
  await supabase.from('step_up_tokens').delete().eq('user_id', identity.userId);
  await supabase
    .from('profiles')
    .update({ totp_enabled: false, totp_secret_encrypted: null, totp_pending_secret_encrypted: null })
    .eq('id', identity.userId);

  await logSecurityEvent({
    event_type: 'unauthorized_access',
    actor_user_id: identity.userId,
    ip_address: ip,
    outcome: 'CRITICAL_BREAK_GLASS_USED',
    reason: 'Break-Glass-Recovery erfolgreich eingelöst - TOTP zurückgesetzt, Neueinrichtung erforderlich',
    endpoint: '/api/auth/break-glass/redeem',
  });
  await logIamEvent(identity.userId, identity.userId, 'break-glass.redeemed', null, { reset: 'totp+step-up-tokens' });

  res.json({
    success: true,
    message: 'Break-Glass erfolgreich. TOTP wurde zurückgesetzt - bitte richten Sie 2FA über /totp/setup neu ein.',
  });
}));
