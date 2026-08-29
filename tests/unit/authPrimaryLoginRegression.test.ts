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
const passkeySettings = read('src/components/PasskeySettings.tsx');
const mfaLastFactorGuard = read('src/lib/mfaLastFactorGuard.ts');
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
  it('supports normal email/password and Google primary login without exposing native passkey login', () => {
    expect(loginPage).toContain('supabase.auth.signInWithPassword');
    expect(loginPage).toContain('supabase.auth.signUp');
    expect(loginPage).toContain('type="password"');
    expect(loginPage).toContain('Mit E-Mail anmelden');
    expect(loginPage).toContain('Normales Nutzerkonto registrieren');
    expect(loginPage).toContain("provider: 'google'");
    expect(loginPage).toContain('supabase.auth.signInWithOAuth');
    expect(loginPage).toContain("redirectTo: `${window.location.origin}/`");
    expect(loginPage).not.toContain("redirectTo: `${window.location.origin}/login`");
    expect(loginPage).toContain("prompt: 'select_account'");
    expect(loginPage).toContain('aria-label="Mit Google anmelden"');
    expect(loginPage).not.toContain('<PasskeyLoginPanel />');
    expect(loginPage).not.toContain('nativePasskeyEnabled');
    expect(loginPage).not.toContain('signInWithPasskey');

    const emailLoginIndex = loginPage.indexOf('Mit E-Mail anmelden');
    const googleLoginIndex = loginPage.indexOf('<span>Mit Google anmelden</span>');
    expect(emailLoginIndex).toBeGreaterThanOrEqual(0);
    expect(googleLoginIndex).toBeGreaterThan(emailLoginIndex);
  });

  it('keeps the branded login frame and the explanatory web-content panel', () => {
    expect(loginPage).toContain(
      'conic-gradient(from_0deg,var(--color-brand-primary)_0deg,var(--color-brand-accent)_180deg,var(--color-brand-primary)_360deg)',
    );
    expect(loginPage).toContain('motion-reduce:animate-none');
    expect(loginPage).toContain('Finanzanalyse-Plattform');
    expect(loginPage).toContain('Multi-Asset-Analyse mit erklärbaren KI-Scorings');
    expect(loginPage).toContain('Fundamentale Bewertung (Graham, DCF)');
    expect(loginPage).toContain('Backtesting &amp; Stressszenarien');
    expect(loginPage).toContain('PDF-/CSV-Exporte für Compliance');
    expect(loginPage).toContain('aria-label="Webinhalte und Funktionsübersicht"');
  });

  it('binds password login and self-registration to fresh hCaptcha tokens', () => {
    expect(loginPage).toContain("import { requestHcaptchaToken } from '../../../lib/hcaptcha'");
    expect(loginPage).toContain('const captchaToken = await requestHcaptchaToken()');
    expect(loginPage).toContain('supabase.auth.signInWithPassword');
    expect(loginPage).toContain('options: { captchaToken }');
    expect(loginPage).toContain('supabase.auth.signUp');
    expect(loginPage).toContain('data: { full_name: normalizedName }');
    expect(loginPage).toContain('captchaToken,');
    expect(loginPage).toContain("emailRedirectTo: `${window.location.origin}/login`");
    expect(loginPage).not.toContain('localStorage.setItem');
    expect(loginPage).not.toContain('sessionStorage.setItem');
  });

  it('keeps legacy password callbacks fail-closed so the canonical login page remains the single interactive entrypoint', () => {
    expect(sessionComposition).not.toContain('supabase.auth.signInWithPassword');
    expect(sessionComposition).toContain('const handleLogin = async (_email: string, _password: string) =>');
    expect(sessionComposition).toContain('Passwortbasierte Anmeldung ist deaktiviert');
    expect(sessionComposition).toContain('Selbstregistrierung ist derzeit kontrolliert deaktiviert');
  });

  it('keeps the dormant native primary-passkey capability out of the canonical login surface', () => {
    expect(authFeatureFlags).toContain('VITE_NATIVE_PASSKEY_LOGIN_ENABLED');
    expect(supabaseClient).toContain(
      'experimental: { passkey: isNativePasskeyLoginEnabled() }',
    );
    expect(passkeyPanel).toContain('signInWithPasskey');
    expect(dockerfile).toContain('ARG VITE_NATIVE_PASSKEY_LOGIN_ENABLED');
    expect(renderBlueprint).toMatch(
      /- key: VITE_NATIVE_PASSKEY_LOGIN_ENABLED\s+value: "true"/,
    );
    expect(loginPage).not.toContain('PasskeyLoginPanel');
    expect(loginPage).not.toContain('isNativePasskeyLoginEnabled');
  });

  it('keeps any dormant native primary-passkey authentication CAPTCHA-bound', () => {
    expect(passkeyPanel).toContain("import { requestHcaptchaToken } from '../../../lib/hcaptcha'");
    expect(passkeyPanel).toContain('const captchaToken = await requestHcaptchaToken()');
    expect(passkeyPanel).toContain('options: { captchaToken }');
    expect(passkeyPanel).not.toContain('localStorage');
    expect(passkeyPanel).not.toContain('sessionStorage');
  });

  it('binds user-settings passkeys to verified WebAuthn MFA instead of primary login', () => {
    expect(passkeySettings).toContain('listVerifiedNativeMfaFactors');
    expect(passkeySettings).toContain('registerWebauthnMfaFactor');
    expect(passkeySettings).toContain("factor.factorType === 'webauthn'");
    expect(passkeySettings).toContain("supabase.auth.mfa.unenroll({ factorId })");
    expect(passkeySettings).not.toContain('registerPasskey');
    expect(passkeySettings).not.toContain('auth.passkey.list');
    expect(passkeySettings).not.toContain('signInWithPasskey');

    expect(mfaLastFactorGuard).toContain('listVerifiedNativeMfaFactors');
    expect(mfaLastFactorGuard).not.toContain('supabase.auth.passkey.list');
  });

  it('separates primary authentication from WebAuthn MFA and verifies both AAL2 paths', () => {
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

  it('routes email/password and Google-created sessions through the existing onboarding and assurance gates', () => {
    expect(registrationCompletionGate).toContain('E-Mail/Passwort- UND');
    expect(registrationCompletionGate).toContain('Google-OAuth-Konten');
    expect(sessionComposition).toContain('const onboardingRequired = await needsOnboarding(session)');
    expect(sessionComposition).toContain('setPendingOnboardingSession(session)');
    expect(sessionComposition).toContain('setPendingStepUpSession(session)');
    expect(loginStepUpGate).toContain("level.nextLevel === 'aal2'");
  });

  it('uses one synchronous Supabase auth-state bootstrap instead of racing getSession', () => {
    expect(sessionComposition).toContain('supabase.auth.onAuthStateChange((event, session) =>');
    expect(sessionComposition).not.toContain('onAuthStateChange(async');
    expect(sessionComposition).toContain('isSessionEstablishmentEvent(event)');
    expect(sessionComposition).toContain('scheduleSessionEstablishment(session)');
    expect(sessionComposition).toContain('window.setTimeout(() =>');
    expect(sessionComposition).toContain('getSessionBootstrapKey(session)');

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
    expect(loginStepUpGate).toContain("level.nextLevel === 'aal2'");
    expect(loginStepUpGate).toContain('verifyTotpChallenge');
    expect(loginStepUpGate).toContain('MFA_OPERATION_TIMEOUT_MS = 10_000');
    expect(loginStepUpGate).toContain('withMfaTimeout(');
    expect(loginStepUpGate).toContain("setRequirement('blocked')");
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
