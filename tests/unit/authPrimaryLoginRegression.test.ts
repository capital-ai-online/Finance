import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildBaselineProductionCsp } from '../../server/securityResponse';
import {
  getSessionBootstrapKey,
  isSessionEstablishmentEvent,
} from '../../src/app/auth/sessionBootstrap';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const loginPage = read('src/features/public/ui/LoginPage.tsx');
const passkeyPanel = read('src/features/public/ui/PasskeyLoginPanel.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');
const loginStepUpGate = read('src/components/LoginStepUpGate.tsx');
const registrationCompletionGate = read('src/components/RegistrationCompletionGate.tsx');
const nativeMfa = read('src/platform/Security/nativeMfa.ts');
const hcaptcha = read('src/lib/hcaptcha.ts');
const authFeatureFlags = read('src/lib/authFeatureFlags.ts');
const supabaseClient = read('src/supabaseClient.ts');
const dockerfile = read('Dockerfile');
const renderBlueprint = read('render.yaml');

describe('website primary login regression boundary', () => {
  it('keeps registered email/password login ahead of direct Google OAuth', () => {
    expect(loginPage).toContain("provider: 'google'");
    expect(loginPage).toContain('supabase.auth.signInWithOAuth');
    expect(loginPage).toContain("redirectTo: `${window.location.origin}/login`");
    expect(loginPage).toContain("prompt: 'select_account'");
    expect(loginPage).toContain('Registriertes Konto');
    expect(loginPage).toContain('Alternative Anmeldung');
    expect(loginPage).toContain('aria-label="Mit Google anmelden"');
    expect(loginPage).not.toContain('Google-Konto ein Passkey eingerichtet');
    expect(loginPage).not.toContain('Passkey-Verifikation verbleibt vollständig bei Google');

    const passwordLoginIndex = loginPage.indexOf('<form onSubmit={handlePasswordLogin}');
    const googleLoginIndex = loginPage.indexOf('<span>Mit Google anmelden</span>');
    expect(passwordLoginIndex).toBeGreaterThanOrEqual(0);
    expect(googleLoginIndex).toBeGreaterThan(passwordLoginIndex);
  });

  it('restores the branded login frame and the explanatory web-content panel', () => {
    expect(loginPage).toContain('conic-gradient(from_0deg,#F5C453_0deg,#0DDDDD_120deg,#B026FF_240deg,#F5C453_360deg)');
    expect(loginPage).toContain('Finanzanalyse-Plattform');
    expect(loginPage).toContain('Multi-Asset-Analyse mit erklärbaren KI-Scorings');
    expect(loginPage).toContain('Fundamentale Bewertung (Graham, DCF)');
    expect(loginPage).toContain('Backtesting &amp; Stressszenarien');
    expect(loginPage).toContain('PDF-/CSV-Exporte für Compliance');
    expect(loginPage).toContain('aria-label="Webinhalte und Funktionsübersicht"');
  });

  it('authenticates existing registered users by password with a CAPTCHA token', () => {
    expect(sessionComposition).toContain('requestHcaptchaToken()');
    expect(sessionComposition).toContain('supabase.auth.signInWithPassword');
    expect(sessionComposition).toContain('options: { captchaToken }');
    expect(sessionComposition).not.toContain('Email/password arguments are deliberately ignored');
  });

  it('protects password reset requests with a short-lived CAPTCHA token', () => {
    expect(loginPage).toContain('const captchaToken = await requestHcaptchaToken()');
    expect(loginPage).toContain('supabase.auth.resetPasswordForEmail');
    expect(loginPage).toContain('captchaToken,');
    expect(loginPage).toContain("redirectTo: `${window.location.origin}/login`");
  });

  it('keeps native Supabase passkeys disabled until the controlled feature flag is enabled', () => {
    expect(authFeatureFlags).toContain('VITE_NATIVE_PASSKEY_LOGIN_ENABLED');
    expect(authFeatureFlags).toContain("return value === 'true'");
    expect(supabaseClient).toContain(
      'experimental: { passkey: isNativePasskeyLoginEnabled() }',
    );
    expect(loginPage).toContain('nativePasskeyEnabled && <PasskeyLoginPanel />');
    expect(passkeyPanel).toContain('signInWithPasskey');
    expect(dockerfile).toContain('ARG VITE_NATIVE_PASSKEY_LOGIN_ENABLED');
    expect(dockerfile).toContain(
      'VITE_NATIVE_PASSKEY_LOGIN_ENABLED=$VITE_NATIVE_PASSKEY_LOGIN_ENABLED',
    );
    expect(renderBlueprint).toMatch(
      /- key: VITE_NATIVE_PASSKEY_LOGIN_ENABLED\s+value: "false"/,
    );
  });

  it('binds native passkey authentication to a fresh hCaptcha token', () => {
    expect(passkeyPanel).toContain("import { requestHcaptchaToken } from '../../../lib/hcaptcha'");
    expect(passkeyPanel).toContain('const captchaToken = await requestHcaptchaToken()');
    expect(passkeyPanel).toContain('options: { captchaToken }');
    expect(passkeyPanel).not.toContain('localStorage');
    expect(passkeyPanel).not.toContain('sessionStorage');
  });

  it('separates primary passkeys from WebAuthn MFA and verifies both AAL2 paths', () => {
    expect(registrationCompletionGate).toContain('registerWebauthnMfaFactor');
    expect(registrationCompletionGate).not.toContain('supabase.auth.registerPasskey()');
    expect(nativeMfa).toContain('client.auth.mfa.webauthn.register({ friendlyName })');
    expect(nativeMfa).toContain('client.auth.mfa.webauthn.authenticate({ factorId })');
    expect(nativeMfa).toContain("factor.status === 'verified'");
    expect(loginStepUpGate).toContain('listVerifiedNativeMfaFactors');
    expect(loginStepUpGate).toContain('authenticateWebauthnMfaFactor');
    expect(loginStepUpGate).toContain("factor.factorType === 'webauthn'");
    expect(loginStepUpGate).toContain('Stattdessen Authenticator-App verwenden');
  });

  it('uses one synchronous Supabase auth-state bootstrap instead of racing getSession', () => {
    expect(sessionComposition).toContain('supabase.auth.onAuthStateChange((event, session) =>');
    expect(sessionComposition).not.toContain('onAuthStateChange(async');
    expect(sessionComposition).toContain('isSessionEstablishmentEvent(event)');
    expect(sessionComposition).toContain('scheduleSessionEstablishment(session)');
    expect(sessionComposition).toContain('window.setTimeout(() =>');
    expect(sessionComposition).toContain('getSessionBootstrapKey(session)');

    // The sole remaining Supabase getSession() call is the explicit human retry on the identity-mismatch screen.
    expect(sessionComposition.match(/supabase\.auth\.getSession\(\)/g)?.length ?? 0).toBe(1);
  });

  it('only establishes sessions for initial/sign-in events and uses a non-secret key', () => {
    expect(isSessionEstablishmentEvent('INITIAL_SESSION')).toBe(true);
    expect(isSessionEstablishmentEvent('SIGNED_IN')).toBe(true);
    expect(isSessionEstablishmentEvent('TOKEN_REFRESHED')).toBe(false);
    expect(isSessionEstablishmentEvent('MFA_CHALLENGE_VERIFIED')).toBe(false);
    expect(isSessionEstablishmentEvent('SIGNED_OUT')).toBe(false);

    const session = {
      access_token: 'must-not-be-read-by-helper',
      expires_at: 1_800_000_000,
      user: { id: 'user-123', is_anonymous: false },
    };
    const key = getSessionBootstrapKey(session);
    expect(key).toBe('user-123:1800000000');
    expect(key).not.toContain(session.access_token);
    expect(getSessionBootstrapKey({ user: { id: 'anon', is_anonymous: true } })).toBe('');
  });

  it('renders the login shell immediately while preserving authenticated onboarding/AAL gates', () => {
    expect(sessionComposition).toMatch(
      /const PUBLIC_SHELL_PATHS = new Set\(\[[\s\S]*'\/login',[\s\S]*\]\);/,
    );
    expect(sessionComposition).toContain('if (loading && !renderPublicShellImmediately)');
    expect(sessionComposition).toContain('if (pendingOnboardingSession)');
    expect(sessionComposition).toContain('if (pendingStepUpSession)');
  });

  it('keeps the native MFA/AAL gate mandatory and bounded instead of hanging forever', () => {
    expect(loginStepUpGate).toContain('email/password, Google OAuth or a native passkey');
    expect(loginStepUpGate).toContain("level.nextLevel === 'aal2'");
    expect(loginStepUpGate).toContain('verifyTotpChallenge');
    expect(loginStepUpGate).toContain('MFA_OPERATION_TIMEOUT_MS = 10_000');
    expect(loginStepUpGate).toContain('withMfaTimeout(');
    expect(loginStepUpGate).toContain("setRequirement('blocked')");
  });

  it('preloads the hCaptcha SDK without generating or persisting a token', () => {
    expect(loginPage).toContain('preloadHcaptchaSdk');
    expect(loginPage).toContain('onFocus={warmHcaptcha}');
    expect(hcaptcha).toContain('export async function preloadHcaptchaSdk()');
    expect(hcaptcha).toContain('await waitForSdk()');
    expect(hcaptcha).not.toContain('localStorage');
    expect(hcaptcha).not.toContain('sessionStorage');
  });

  it('obtains hCaptcha tokens without persisting or logging them', () => {
    expect(hcaptcha).toContain('VITE_HCAPTCHA_SITE_KEY');
    expect(hcaptcha).toContain("size: 'invisible'");
    expect(hcaptcha).toContain('hcaptcha.execute(widgetId, { async: true })');
    expect(hcaptcha).not.toContain('localStorage');
    expect(hcaptcha).not.toContain('sessionStorage');
    expect(hcaptcha).not.toContain('console.log');
  });

  it('allows the official hCaptcha origin set in enforced production CSP', () => {
    const csp = buildBaselineProductionCsp('test-nonce');
    expect(csp).toContain('https://hcaptcha.com');
    expect(csp).toContain('https://*.hcaptcha.com');
  });

  it('projects only public auth configuration into the Vite Docker build', () => {
    expect(dockerfile).toContain('ARG VITE_HCAPTCHA_SITE_KEY');
    expect(dockerfile).toContain('VITE_HCAPTCHA_SITE_KEY=$VITE_HCAPTCHA_SITE_KEY');
    expect(dockerfile).not.toContain('HCAPTCHA_SECRET');
  });

  it('declares public hCaptcha configuration without exposing the CAPTCHA secret', () => {
    expect(renderBlueprint).toMatch(/- key: VITE_HCAPTCHA_SITE_KEY\s+sync: false/);
    expect(renderBlueprint).not.toContain('HCAPTCHA_SECRET');
  });
});
