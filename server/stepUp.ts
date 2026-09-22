// ADR-0003.5 — TOTP-Step-Up-Authentifizierung.
//
// Owner-Aktionen (Rollenvergabe, kritische System-Eingriffe) verlangen zusätzlich zur normalen
// Session einen frischen, kurzlebigen Step-Up-Nachweis per TOTP. Sämtliche Endpunkte hier
// verlangen eine bereits gültige Supabase-Session (Bearer-Token); es gibt keinen Pfad, der ohne
// bestehende Authentifizierung Owner-Rechte gewährt.
//
// Owner-Policy 2026-08-14: kein Notfall-Bypass-Mechanismus in der Anwendung. Der vormals hier
// implementierte Break-Glass-Recovery-Pfad (redeembare Codes, die TOTP/Passkeys/native
// MFA-Faktoren zurücksetzen konnten) wurde ersatzlos entfernt. Verlust des zweiten Faktors wird
// jetzt ausschließlich außerhalb der Anwendung (Supabase-Dashboard-Administration durch den
// Owner) behoben, nicht durch einen in der App selbst vorgehaltenen Bypass-Code. Die
// `break_glass_codes`-Tabelle und bereits existierende, unbenutzte Codes bleiben Bestandteil
// einer separaten, noch zu entscheidenden Produktions-Cleanup-Mutation - dieser Commit entfernt
// nur den Anwendungscode, keine Produktionsdaten.

import express from 'express';
import { getServerSupabase, isSupabaseConfigured } from './db';
import { resolveVerifiedIdentity, logIamEvent, requireVerifiedAal2 } from '../src/platform/Security/authMiddleware';
import { checkRateLimit, getClientIp } from '../src/platform/Security/rateLimiter';
import { encryptSecret, decryptSecret, hashOpaqueToken, generateOpaqueToken } from '../src/platform/Security/secretCrypto';
import { generateBase32Secret, verifyTotp, buildOtpAuthUri } from '../src/platform/Security/totp';
import { rateLimitMiddleware } from '../src/platform/Security/safeIo';
import { createLogger } from './logger';
import {
  AAL2_DIAGNOSTIC_SUPERSESSION_ID,
  AAL2_REACTIVATION_STAGE,
  isAal2EnabledFor,
} from '../src/platform/Security/aal2DiagnosticSupersession';

export const stepUpRouter = express.Router();
stepUpRouter.use(rateLimitMiddleware({ name: 'step-up', maxRequests: 40, windowMs: 60_000 }));

// Owner-Anweisung 2026-08-14: DSGVO-Nachweispflicht (Art. 7 Abs. 1 DSGVO) fuer AGB-/
// Datenschutz-/Marketing-Zustimmungen bei der Registrierung. Versionsstempel wird server-seitig
// vergeben (nicht vom Client), damit spaeter nachvollziehbar bleibt, welcher Dokumentstand exakt
// akzeptiert wurde. Bei einer inhaltlichen Aenderung von AGB/Datenschutz muss dieser Wert manuell
// hochgezaehlt werden.
const CURRENT_TERMS_VERSION = '2026-08-14';
const CURRENT_PRIVACY_VERSION = '2026-08-14';

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
  } catch (err: any) {
    // security_events existiert produktiv (20260731000400_security_events_stepup_totp.sql);
    // Request bleibt trotzdem unblockiert, aber der Fehler wird jetzt sichtbar geloggt
    // (Audit ARCH-AUDIT-0002, AUD2-F-020).
    console.error('[STEP-UP][ERROR] security_events-Insert fehlgeschlagen: %s', err?.message || err);
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
      console.error('[STEP-UP][ERROR] %s %s:', req.method, req.originalUrl, err?.message || err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Interner Serverfehler.' });
      }
    }
  };
}

// Read-only diagnostic event for the temporary full AAL2 supersession. The browser
// sends no identity or policy decision; the server resolves both from the authenticated bearer
// and current profile, so Render logs can later correlate staged reactivation without trusting
// client-supplied account state.
stepUpRouter.post('/aal2/diagnostic-login', requireAuth(async (req, res, identity) => {
  createLogger('aal2-diagnostic', req.requestId).info('AAL2 login diagnostic request entered', {
    eventName: 'auth.aal2.diagnostic.login.start',
    userId: identity.userId,
    supersessionId: AAL2_DIAGNOSTIC_SUPERSESSION_ID,
    reactivationStage: AAL2_REACTIVATION_STAGE,
    privilegedAal2Required: true,
  });

  const supabase = getServerSupabase();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('onboarding_required, mfa_required_account')
    .eq('id', identity.userId)
    .maybeSingle();

  if (error || !profile) {
    return res.status(500).json({ error: 'AAL2-Diagnosestatus konnte nicht gelesen werden.' });
  }

  const diagnosticState = {
    supersessionId: AAL2_DIAGNOSTIC_SUPERSESSION_ID,
    reactivationStage: AAL2_REACTIVATION_STAGE,
    loginAal2Required:
      isAal2EnabledFor('login') && profile.mfa_required_account === true,
    registrationAal2Required: isAal2EnabledFor('registration'),
    accountMfaRequired: profile.mfa_required_account === true,
    onboardingRequired: profile.onboarding_required === true,
    privilegedAal2Required: true,
  };

  createLogger('aal2-diagnostic', req.requestId).info('AAL2 login diagnostic checkpoint', {
    eventName: 'auth.aal2.diagnostic.login',
    userId: identity.userId,
    ...diagnosticState,
  });
  await logIamEvent(
    identity.userId,
    identity.userId,
    'aal2.diagnostic_login_checkpoint',
    null,
    diagnosticState,
  );

  res.json({ success: true, ...diagnosticState });
}));

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

// 2. TOTP-Setup bestätigen: verifiziert den ersten Code und aktiviert TOTP.
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

  await logIamEvent(identity.userId, identity.userId, 'totp.enabled', null, { enabled: true });

  res.json({ success: true });
}));

// Registrierungsabschluss: DSGVO-Consent-Log + zusaetzliche Profilangaben (Land, Telefon).
// Wird vom Client unmittelbar nach erfolgreichem supabase.auth.signUp() aufgerufen - profiles
// selbst hat fuer normale Nutzer keine UPDATE-RLS-Policy (nur SELECT der eigenen Zeile), daher
// muss diese Schreiboperation ueber die service-role laufen statt direkt vom Client.
stepUpRouter.post('/register/complete', requireAuth(async (req, res, identity) => {
  if (!checkRateLimit(`register-complete:${identity.userId}`, 5, 60_000)) {
    return res.status(429).json({ error: 'Zu viele Versuche. Bitte kurz warten.' });
  }
  const { country, phoneNumber, termsAccepted, privacyAccepted, marketingOptIn } = req.body;

  if (termsAccepted !== true || privacyAccepted !== true) {
    return res.status(400).json({ error: 'Zustimmung zu AGB und Datenschutzbestimmungen ist erforderlich.' });
  }
  if (typeof country !== 'string' || country.trim().length === 0) {
    return res.status(400).json({ error: 'Land/Wohnsitz ist erforderlich.' });
  }

  const ip = getClientIp(req as any);
  const ipHash = hashOpaqueToken(ip);
  const supabase = getServerSupabase();

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({
      country: country.trim().slice(0, 2).toUpperCase(),
      phone_number: typeof phoneNumber === 'string' && phoneNumber.trim() ? phoneNumber.trim().slice(0, 32) : null,
    })
    .eq('id', identity.userId);
  if (profileErr) {
    return res.status(500).json({ error: 'Profilangaben konnten nicht gespeichert werden.' });
  }

  const consentRows = [
    { user_id: identity.userId, consent_type: 'terms', document_version: CURRENT_TERMS_VERSION, granted: true, ip_hash: ipHash },
    { user_id: identity.userId, consent_type: 'privacy', document_version: CURRENT_PRIVACY_VERSION, granted: true, ip_hash: ipHash },
    { user_id: identity.userId, consent_type: 'marketing', document_version: CURRENT_TERMS_VERSION, granted: marketingOptIn === true, ip_hash: ipHash },
  ];
  const { error: consentErr } = await supabase.from('user_consents').insert(consentRows);
  if (consentErr) {
    console.error('[STEP-UP][ERROR] user_consents-Insert fehlgeschlagen: %s', consentErr.message);
    return res.status(500).json({ error: 'Zustimmungen konnten nicht protokolliert werden.' });
  }

  res.json({ success: true });
}));

// Verpflichtende MFA-Einrichtung fuer neue Registrierungen (Owner-Policy 2026-08-14:
// "mindestens 1 von TOTP/Passkey muss aktiviert sein, um sich anmelden zu koennen" -
// Uebergangsfrist-Modell: gilt nur fuer profiles.onboarding_required = true, siehe Migration
// 20260814153000/20260814154500). Verlangt eine bereits verifizierte AAL2-Sitzung als Nachweis -
// dieselbe unabhaengige, server-seitig gegen Supabase Auth re-validierte Pruefung wie
// /step-up/verify (requireVerifiedAal2), damit ein Client nicht einfach "ich habe eingerichtet"
// behaupten kann, ohne dass ein echter verifizierter Faktor (nativer TOTP-Faktor ODER Passkey)
// existiert.
//
// Setzt zusaetzlich mfa_required_account = true (Migration 20260814160000): anders als
// onboarding_required (einmaliger Gate-Zustand) bleibt dieses Flag dauerhaft bestehen und macht
// die Pflicht nicht durch sofortiges Entfernen des gerade eingerichteten Faktors wirkungslos -
// src/lib/mfaLastFactorGuard.ts verweigert danach das Entfernen des letzten verbleibenden Faktors.
stepUpRouter.post('/mfa/enrollment-complete', requireAuth(async (req, res, identity) => {
  const registrationAal2Required = isAal2EnabledFor('registration');

  if (registrationAal2Required) {
    const aal2 = await requireVerifiedAal2(req);
    if (!aal2.verified) {
      return res.status(428).json({
        error: 'Verpflichtende MFA-Einrichtung erfordert eine gueltige native TOTP- oder Passkey-Bestaetigung (AAL2) dieser Sitzung.',
        code: 'aal2_required',
      });
    }
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_required: false,
      mfa_required_account: registrationAal2Required,
    })
    .eq('id', identity.userId);
  if (error) {
    return res.status(500).json({ error: 'Status konnte nicht aktualisiert werden.' });
  }

  const diagnosticState = {
    supersessionId: AAL2_DIAGNOSTIC_SUPERSESSION_ID,
    reactivationStage: AAL2_REACTIVATION_STAGE,
    registrationAal2Required,
    resultingMfaRequiredAccount: registrationAal2Required,
    privilegedAal2Required: true,
  };

  createLogger('aal2-diagnostic', req.requestId).info(
    registrationAal2Required
      ? 'AAL2 registration requirement active'
      : 'AAL2 registration requirement superseded',
    {
      eventName: 'auth.aal2.diagnostic.registration',
      userId: identity.userId,
      ...diagnosticState,
    },
  );
  await logIamEvent(
    identity.userId,
    identity.userId,
    registrationAal2Required
      ? 'mfa.enrollment_completed'
      : 'mfa.enrollment_superseded',
    null,
    diagnosticState,
  );

  res.json({ success: true, ...diagnosticState });
}));

// 3. Step-Up-Verifikation: gültiger TOTP-Code -> kurzlebiges, einmaliges Step-Up-Token
//    (5 Minuten), das kritische Owner-Endpunkte zusätzlich zum normalen Bearer-Token verlangen.
//
// ADR-0064 (M5A): ein Step-Up-Token darf seit der Native-MFA-Härtung nur noch aus einer bereits
// gültigen AAL2-Sitzung heraus ausgestellt werden ("it may only be issued/accepted together
// with a valid AAL2 session" - Runbook Stage B4). Das bestehende Legacy-TOTP bleibt zusätzlich
// als Defense-in-Depth-Prüfung erhalten; keine der beiden Prüfungen ersetzt die andere.
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

  const aal2 = await requireVerifiedAal2(req);
  if (!aal2.verified) {
    await logSecurityEvent({
      event_type: 'invalid_token',
      actor_user_id: identity.userId,
      ip_address: ip,
      outcome: 'blocked',
      reason: `Step-Up-Ausstellung ohne AAL2-Sitzung verweigert (${aal2.reason})`,
      endpoint: '/api/auth/step-up/verify',
    });
    return res.status(428).json({
      error: 'Diese Aktion erfordert eine gültige native TOTP-Bestätigung (AAL2) dieser Sitzung.',
      code: 'aal2_required',
    });
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
