import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const SUPABASE_PROJECT_REF = 'ryzywoktpmyhwzxmstyu';
export const CANONICAL_SITE_URL = 'https://capital-ai.online';
const MANAGEMENT_API_BASE = 'https://api.supabase.com';
const MANAGEMENT_ACCESS_TOKEN_ENV_KEYS = Object.freeze([
  'SUPABASE_MANAGEMENT_ACCESS_TOKEN',
  'CAPITAL_AI_SUPABASE_MGMT_ACCESS_TOKEN',
  'SUPABASE_ACCESS_TOKEN',
]);

export function resolveManagementAccessToken(env = process.env) {
  for (const key of MANAGEMENT_ACCESS_TOKEN_ENV_KEYS) {
    const candidate = env?.[key];
    if (typeof candidate !== 'string') continue;
    const accessToken = candidate.trim();
    if (accessToken.length >= 20) return { accessToken, source: key };
  }
  throw new Error('SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING');
}

const confirmationTemplatePath = fileURLToPath(
  new URL('../../supabase/templates/confirmation.html', import.meta.url),
);
const recoveryTemplatePath = fileURLToPath(
  new URL('../../supabase/templates/recovery.html', import.meta.url),
);

async function managementFetch(path, accessToken, init = {}) {
  const response = await fetch(`${MANAGEMENT_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!response.ok) throw new Error(`SUPABASE_MANAGEMENT_HTTP_${response.status}`);
  return response.json();
}

export async function desiredAuthConfig() {
  const [confirmation, recovery] = await Promise.all([
    fs.readFile(confirmationTemplatePath, 'utf8'),
    fs.readFile(recoveryTemplatePath, 'utf8'),
  ]);
  return {
    site_url: CANONICAL_SITE_URL,
    uri_allow_list: [
      CANONICAL_SITE_URL,
      `${CANONICAL_SITE_URL}/`,
      `${CANONICAL_SITE_URL}/api/auth/email/confirm`,
      `${CANONICAL_SITE_URL}/account/update-password`,
    ].join(','),
    disable_signup: false,
    external_email_enabled: true,
    external_phone_enabled: false,
    mailer_autoconfirm: false,
    mailer_allow_unverified_email_sign_ins: false,
    mailer_subjects_confirmation: 'CAPITAL-AI · Registrierung bestätigen',
    mailer_templates_confirmation_content: confirmation,
    mailer_subjects_recovery: 'CAPITAL-AI · Passwort sicher zurücksetzen',
    mailer_templates_recovery_content: recovery,
    mailer_otp_exp: 3600,
    password_min_length: 12,
    password_hibp_enabled: true,
    refresh_token_rotation_enabled: true,
    security_update_password_require_reauthentication: true,
    security_captcha_enabled: false,
    mfa_totp_enroll_enabled: true,
    mfa_totp_verify_enabled: true,
    mfa_web_authn_enroll_enabled: false,
    mfa_web_authn_verify_enabled: false,
    passkey_enabled: false,
  };
}

function sameValue(left, right) {
  return typeof left === 'string' && typeof right === 'string'
    ? left.trim() === right.trim()
    : left === right;
}

export async function reconcileAuthRegistrationConfig(accessToken) {
  if (typeof accessToken !== 'string' || accessToken.length < 20) {
    throw new Error('SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING');
  }
  const path = `/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`;
  const desired = await desiredAuthConfig();
  const before = await managementFetch(path, accessToken);
  const changedKeys = Object.keys(desired).filter((key) => !sameValue(before[key], desired[key]));
  if (changedKeys.length > 0) {
    await managementFetch(path, accessToken, { method: 'PATCH', body: JSON.stringify(desired) });
  }
  const after = await managementFetch(path, accessToken);
  const mismatches = Object.keys(desired).filter((key) => !sameValue(after[key], desired[key]));
  if (mismatches.length > 0) {
    throw new Error(`SUPABASE_AUTH_CONFIG_READBACK_MISMATCH:${mismatches.join(',')}`);
  }
  return { changedKeys, verifiedKeys: Object.keys(desired) };
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);
const invokedAsRuntimePreload = process.env.CAPITAL_AI_SUPABASE_AUTH_CONFIG_CONTROL === 'true';

if (invokedDirectly || invokedAsRuntimePreload) {
  const credential = resolveManagementAccessToken(process.env);
  const result = await reconcileAuthRegistrationConfig(credential.accessToken);
  console.log(JSON.stringify({
    status: 'verified',
    projectRef: SUPABASE_PROJECT_REF,
    credentialSource: credential.source,
    changedKeys: result.changedKeys,
    verifiedKeyCount: result.verifiedKeys.length,
  }));
}
