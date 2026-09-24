import { randomUUID } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { getPrivilegedServerSupabase } from '../db';
import { createLogger } from '../logger';
import {
  clearBackendAuthCookies,
  createAuthenticatedBackendAuthClient,
  createBackendEmailAuthClient,
  persistBackendAuthSession,
  resolveApplicationOrigin,
  resolveVerifiedBackendAuth,
} from '../auth/backendAuth';
import { rateLimitMiddleware } from '../../src/platform/Security/safeIo';

const accountLogger = createLogger('account-security');
const accountSecurityRouter = Router();

const ACCOUNT_RATE_LIMIT = rateLimitMiddleware({
  name: 'account-security',
  maxRequests: 30,
  windowMs: 60_000,
});
const MFA_RATE_LIMIT = rateLimitMiddleware({
  name: 'account-mfa',
  maxRequests: 12,
  windowMs: 10 * 60_000,
});
const PASSKEY_RATE_LIMIT = rateLimitMiddleware({
  name: 'account-passkey',
  maxRequests: 12,
  windowMs: 10 * 60_000,
});
const PASSWORD_RESET_RATE_LIMIT = rateLimitMiddleware({
  name: 'account-password-reset',
  maxRequests: 5,
  windowMs: 10 * 60_000,
});
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: 2 * 1024 * 1024 },
});

const ASSET_CLASSES = new Set(['Crypto', 'Stocks', 'Commodities', 'Forex']);
const RISK_PROFILES = new Set([
  'Sicherheitsorientiert',
  'Ausgewogen',
  'Spekulativ',
  'Hochfrequenz-Trading',
]);
const AVATAR_IDS = new Set(['1', '2', '3', '4', '5']);

type ProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
  avatar_id: string | null;
  avatar_color: string | null;
  preferred_asset_class: string | null;
  risk_profile: string | null;
  investment_capital: number | string | null;
};

function cleanName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  return cleaned.length >= 2 && cleaned.length <= 120 ? cleaned : null;
}

function cleanEnum(value: unknown, values: Set<string>): string | null {
  return typeof value === 'string' && values.has(value) ? value : null;
}

function cleanCapital(value: unknown): number | null {
  const capital = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(capital) && capital >= 0 && capital <= 1_000_000_000_000
    ? Math.round(capital * 100) / 100
    : null;
}

export async function readAccountProfile(userId: string): Promise<{
  name: string | null;
  avatarId: string;
  avatarColor: string;
  preferredAssetClass: string;
  riskProfile: string;
  capital: number;
  customAvatarUrl: string | null;
}> {
  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name,avatar_url,avatar_id,avatar_color,preferred_asset_class,risk_profile,investment_capital')
    .eq('id', userId)
    .single();
  if (error || !data) throw new Error('PROFILE_READ_FAILED');
  const row = data as ProfileRow;
  return {
    name: row.full_name,
    avatarId: row.avatar_id || '1',
    avatarColor: row.avatar_color || 'from-brand-primary to-brand-primary',
    preferredAssetClass: row.preferred_asset_class || 'Crypto',
    riskProfile: row.risk_profile || 'Ausgewogen',
    capital: Number(row.investment_capital || 0),
    customAvatarUrl: row.avatar_url ? '/api/auth/profile/avatar' : null,
  };
}

async function requireAccount(req: Request, res: Response) {
  const verified = await resolveVerifiedBackendAuth(req, res);
  if (!verified) {
    clearBackendAuthCookies(req, res);
    res.status(401).json({ error: 'Anmeldung erforderlich.' });
    return null;
  }
  return verified;
}

accountSecurityRouter.patch('/profile', ACCOUNT_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const verified = await requireAccount(req, res);
  if (!verified) return;

  const fullName = cleanName(req.body?.name);
  const avatarId = cleanEnum(req.body?.avatarId, AVATAR_IDS);
  const avatarColor = typeof req.body?.avatarColor === 'string'
    ? req.body.avatarColor.trim().slice(0, 120)
    : '';
  const preferredAssetClass = cleanEnum(req.body?.preferredAssetClass, ASSET_CLASSES);
  const riskProfile = cleanEnum(req.body?.riskProfile, RISK_PROFILES);
  const capital = cleanCapital(req.body?.capital);

  if (!fullName || !avatarId || !avatarColor || !preferredAssetClass || !riskProfile || capital === null) {
    res.status(400).json({ error: 'Die Profilangaben sind unvollständig oder ungültig.' });
    return;
  }

  try {
    const supabase = getPrivilegedServerSupabase();
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      avatar_id: avatarId,
      avatar_color: avatarColor,
      preferred_asset_class: preferredAssetClass,
      risk_profile: riskProfile,
      investment_capital: capital,
      updated_at: new Date().toISOString(),
    }).eq('id', verified.user.id);
    if (error) throw error;

    const { error: metadataError } = await supabase.auth.admin.updateUserById(verified.user.id, {
      user_metadata: { ...verified.user.user_metadata, full_name: fullName },
    });
    if (metadataError) throw metadataError;

    res.status(200).json({ updated: true });
  } catch (error) {
    accountLogger.error('Profile update failed', {
      requestId: req.requestId,
      userId: verified.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Profil konnte derzeit nicht gespeichert werden.' });
  }
});

function sniffImage(buffer: Buffer): { extension: 'png' | 'jpg' | 'webp'; contentType: string } | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { extension: 'png', contentType: 'image/png' };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: 'jpg', contentType: 'image/jpeg' };
  }
  if (
    buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { extension: 'webp', contentType: 'image/webp' };
  }
  return null;
}

accountSecurityRouter.get('/profile/avatar', ACCOUNT_RATE_LIMIT, async (req, res) => {
  const verified = await requireAccount(req, res);
  if (!verified) return;
  try {
    const supabase = getPrivilegedServerSupabase();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', verified.user.id)
      .single();
    if (profileError) throw profileError;
    if (typeof profile?.avatar_url !== 'string' || !profile.avatar_url) {
      res.status(404).end();
      return;
    }
    const { data, error } = await supabase.storage.from('profile-avatars').download(profile.avatar_url);
    if (error || !data) throw error || new Error('AVATAR_DOWNLOAD_FAILED');
    const buffer = Buffer.from(await data.arrayBuffer());
    const detected = sniffImage(buffer);
    if (!detected) throw new Error('AVATAR_CONTENT_INVALID');
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).type(detected.contentType).send(buffer);
  } catch (error) {
    accountLogger.error('Avatar read failed', {
      requestId: req.requestId,
      userId: verified.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Avatar konnte derzeit nicht geladen werden.' });
  }
});

accountSecurityRouter.post(
  '/profile/avatar',
  ACCOUNT_RATE_LIMIT,
  avatarUpload.single('avatar'),
  async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const verified = await requireAccount(req, res);
    if (!verified) return;
    const detected = req.file ? sniffImage(req.file.buffer) : null;
    if (!req.file || !detected) {
      res.status(415).json({ error: 'Bitte ein gültiges PNG-, JPG- oder WebP-Bild bis 2 MB wählen.' });
      return;
    }

    try {
      const supabase = getPrivilegedServerSupabase();
      const { data: existing } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', verified.user.id)
        .single();
      const objectPath = `${verified.user.id}/${randomUUID()}.${detected.extension}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(objectPath, req.file.buffer, {
          contentType: detected.contentType,
          cacheControl: '3600',
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: objectPath, updated_at: new Date().toISOString() })
        .eq('id', verified.user.id);
      if (updateError) {
        await supabase.storage.from('profile-avatars').remove([objectPath]);
        throw updateError;
      }

      const previousPath = typeof existing?.avatar_url === 'string' ? existing.avatar_url : null;
      if (previousPath && previousPath !== objectPath) {
        await supabase.storage.from('profile-avatars').remove([previousPath]);
      }
      res.status(201).json({ avatarUrl: '/api/auth/profile/avatar' });
    } catch (error) {
      accountLogger.error('Avatar upload failed', {
        requestId: req.requestId,
        userId: verified.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(503).json({ error: 'Avatar konnte derzeit nicht gespeichert werden.' });
    }
  },
);

accountSecurityRouter.delete('/profile/avatar', ACCOUNT_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const verified = await requireAccount(req, res);
  if (!verified) return;
  try {
    const supabase = getPrivilegedServerSupabase();
    const { data } = await supabase.from('profiles').select('avatar_url').eq('id', verified.user.id).single();
    const objectPath = typeof data?.avatar_url === 'string' ? data.avatar_url : null;
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', verified.user.id);
    if (error) throw error;
    if (objectPath) await supabase.storage.from('profile-avatars').remove([objectPath]);
    res.status(204).end();
  } catch (error) {
    accountLogger.error('Avatar removal failed', {
      requestId: req.requestId,
      userId: verified.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Avatar konnte derzeit nicht entfernt werden.' });
  }
});

accountSecurityRouter.get('/security/methods', MFA_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const verified = await requireAccount(req, res);
  if (!verified) return;
  try {
    const client = await createAuthenticatedBackendAuthClient(req, res, verified);
    const [{ data: factors, error: factorError }, { data: passkeys, error: passkeyError }] = await Promise.all([
      client.auth.mfa.listFactors(),
      client.auth.passkey.list(),
    ]);
    if (factorError) throw factorError;
    if (passkeyError) throw passkeyError;
    const registeredPasskeys = Array.isArray(passkeys) ? passkeys : [];
    res.status(200).json({
      methods: {
        password: { active: true },
        totp: {
          active: factors.totp.some((factor) => factor.status === 'verified'),
          factors: factors.totp
            .filter((factor) => factor.status === 'verified')
            .map((factor) => ({ id: factor.id, friendlyName: factor.friendly_name || 'Authenticator-App' })),
        },
        passkey: {
          active: registeredPasskeys.length > 0,
          available: true,
          factors: registeredPasskeys.map((passkey) => ({
            id: passkey.id,
            friendlyName: passkey.friendly_name || 'Passkey',
            createdAt: passkey.created_at,
            lastUsedAt: passkey.last_used_at || null,
          })),
        },
      },
    });
  } catch (error) {
    accountLogger.error('Security methods readback failed', {
      requestId: req.requestId,
      userId: verified.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Authentifizierungsmethoden konnten nicht geladen werden.' });
  }
});

accountSecurityRouter.post('/security/password/reset', PASSWORD_RESET_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const verified = await requireAccount(req, res);
  if (!verified) return;
  const email = verified.user.email?.trim();
  if (!email) {
    res.status(409).json({ error: 'Für dieses Konto ist keine bestätigte E-Mail-Adresse verfügbar.' });
    return;
  }

  try {
    const origin = resolveApplicationOrigin(req);
    const client = createBackendEmailAuthClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: new URL('/api/auth/email/confirm', origin).toString(),
    });
    if (error) throw error;
    res.status(202).json({
      accepted: true,
      message: 'Bestätigungsmail zum sicheren Zurücksetzen des Passworts wurde angefordert.',
    });
  } catch (error) {
    accountLogger.error('Authenticated password reset request failed', {
      requestId: req.requestId,
      userId: verified.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Passwort-Bestätigungsmail konnte derzeit nicht angefordert werden.' });
  }
});

accountSecurityRouter.post('/security/passkeys/registration/start', PASSKEY_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const verified = await requireAccount(req, res);
  if (!verified) return;
  try {
    const client = await createAuthenticatedBackendAuthClient(req, res, verified);
    const { data, error } = await client.auth.passkey.startRegistration();
    if (error || !data?.challenge_id || !data?.options) {
      throw error || new Error('PASSKEY_REGISTRATION_START_FAILED');
    }
    res.status(200).json({ challengeId: data.challenge_id, options: data.options });
  } catch (error) {
    accountLogger.error('Passkey registration start failed', {
      requestId: req.requestId,
      userId: verified.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Passkey-Registrierung konnte nicht gestartet werden.' });
  }
});

accountSecurityRouter.post('/security/passkeys/registration/verify', PASSKEY_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const verified = await requireAccount(req, res);
  if (!verified) return;
  const challengeId = typeof req.body?.challengeId === 'string' ? req.body.challengeId.trim() : '';
  const credential = req.body?.credential;
  if (!challengeId || challengeId.length > 200 || !credential || typeof credential !== 'object') {
    res.status(400).json({ error: 'Ungültige Passkey-Verifikationsdaten.' });
    return;
  }

  try {
    const client = await createAuthenticatedBackendAuthClient(req, res, verified);
    const { data, error } = await client.auth.passkey.verifyRegistration({
      challengeId,
      credential: credential as any,
    });
    if (error || !data) throw error || new Error('PASSKEY_REGISTRATION_VERIFY_FAILED');
    res.status(201).json({
      registered: true,
      passkey: {
        id: data.id,
        friendlyName: data.friendly_name || 'Passkey',
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    accountLogger.error('Passkey registration verification failed', {
      requestId: req.requestId,
      userId: verified.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(422).json({ error: 'Passkey konnte nicht verifiziert werden.' });
  }
});

accountSecurityRouter.delete('/security/passkeys/:passkeyId', PASSKEY_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const verified = await requireAccount(req, res);
  if (!verified) return;
  const passkeyId = typeof req.params.passkeyId === 'string' ? req.params.passkeyId.trim() : '';
  if (!passkeyId || passkeyId.length > 200) {
    res.status(400).json({ error: 'Ungültige Passkey-ID.' });
    return;
  }
  try {
    const client = await createAuthenticatedBackendAuthClient(req, res, verified);
    const { error } = await client.auth.passkey.delete({ passkeyId });
    if (error) throw error;
    res.status(204).end();
  } catch (error) {
    accountLogger.error('Passkey removal failed', {
      requestId: req.requestId,
      userId: verified.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Passkey konnte derzeit nicht entfernt werden.' });
  }
});

accountSecurityRouter.post('/security/totp/enroll', MFA_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const verified = await requireAccount(req, res);
  if (!verified) return;
  try {
    const client = await createAuthenticatedBackendAuthClient(req, res, verified);
    const { data: factors, error: listError } = await client.auth.mfa.listFactors();
    if (listError) throw listError;
    if (factors.totp.some((factor) => factor.status === 'verified')) {
      res.status(409).json({ error: 'Eine Authenticator-App ist bereits aktiviert.' });
      return;
    }
    for (const factor of factors.totp.filter((entry) => entry.status !== 'verified')) {
      await client.auth.mfa.unenroll({ factorId: factor.id });
    }
    const { data, error } = await client.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'CAPITAL-AI Authenticator',
    });
    if (error || !data || data.type !== 'totp' || !data.totp) throw error || new Error('TOTP_ENROLL_FAILED');
    res.status(201).json({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  } catch (error) {
    accountLogger.error('TOTP enrollment failed', {
      requestId: req.requestId,
      userId: verified.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Authenticator-App konnte nicht eingerichtet werden.' });
  }
});

accountSecurityRouter.post('/security/totp/verify', MFA_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const verified = await requireAccount(req, res);
  if (!verified) return;
  const factorId = typeof req.body?.factorId === 'string' ? req.body.factorId : '';
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!factorId || !/^\d{6}$/.test(code)) {
    res.status(400).json({ error: 'Bitte den sechsstelligen Code eingeben.' });
    return;
  }
  try {
    const client = await createAuthenticatedBackendAuthClient(req, res, verified);
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge?.id) throw challengeError || new Error('TOTP_CHALLENGE_FAILED');
    const { error: verifyError } = await client.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) {
      res.status(422).json({ error: 'Der Code ist ungültig oder abgelaufen.' });
      return;
    }
    const { data: sessionData } = await client.auth.getSession();
    if (sessionData.session) persistBackendAuthSession(req, res, sessionData.session);
    const supabase = getPrivilegedServerSupabase();
    await supabase.from('profiles').update({
      mfa_required_account: true,
      onboarding_required: false,
      mfa_enrollment_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', verified.user.id);
    res.status(200).json({ verified: true });
  } catch (error) {
    accountLogger.error('TOTP verification failed', {
      requestId: req.requestId,
      userId: verified.user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Authenticator-App konnte nicht verifiziert werden.' });
  }
});

export { accountSecurityRouter };
