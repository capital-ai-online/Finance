import fs from 'node:fs';
import {
  SUPABASE_PROJECT_REF,
  desiredAuthConfig,
  managementFetch,
  resolveManagementAccessToken,
} from './supabaseAuthRegistrationControl.mjs';

const SAFE_AUTH_KEYS = Object.freeze([
  'site_url',
  'disable_signup',
  'external_email_enabled',
  'external_phone_enabled',
  'mailer_autoconfirm',
  'mailer_allow_unverified_email_sign_ins',
  'mailer_otp_exp',
  'password_min_length',
  'password_hibp_enabled',
  'refresh_token_rotation_enabled',
  'security_update_password_require_reauthentication',
  'security_captcha_enabled',
  'mfa_totp_enroll_enabled',
  'mfa_totp_verify_enabled',
  'mfa_web_authn_enroll_enabled',
  'mfa_web_authn_verify_enabled',
  'passkey_enabled',
  'webauthn_rp_id',
]);

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`[SUPABASE-SECURITY-POSTURE] missing ${name}`);
  return value;
}

function sameValue(left, right) {
  return typeof left === 'string' && typeof right === 'string'
    ? left.trim() === right.trim()
    : left === right;
}

const credential = resolveManagementAccessToken(process.env);
const desired = await desiredAuthConfig();
const observed = await managementFetch(
  `/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
  credential.accessToken,
);

const settings = Object.freeze(Object.fromEntries(
  SAFE_AUTH_KEYS.map((key) => {
    const current = observed?.[key];
    const target = desired?.[key];
    return [key, Object.freeze({
      observed: current ?? null,
      desired: target ?? null,
      state: sameValue(current, target) ? 'MATCH' : 'DRIFT_OR_PLAN_CONSTRAINT',
    })];
  }),
));

const output = Object.freeze({
  schemaVersion: '1.0.0',
  status: Object.values(settings).every((entry) => entry.state === 'MATCH') ? 'PASS' : 'FINDINGS',
  projectRef: SUPABASE_PROJECT_REF,
  credentialSource: credential.source,
  settings,
  readOnly: true,
  mutationPerformed: false,
  secretsProjected: false,
  omittedSensitiveConfigKeys: true,
});

const outputPath = requiredEnv('CAPITAL_AI_SUPABASE_AUTH_POSTURE_PATH');
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, {
  encoding: 'utf8',
  mode: 0o600,
});
process.stdout.write(`${JSON.stringify({ status: output.status, readOnly: true }, null, 2)}\n`);
