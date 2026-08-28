import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildBaselineProductionCsp } from '../../server/securityResponse';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const loginPage = read('src/features/public/ui/LoginPage.tsx');
const passkeyPanel = read('src/features/public/ui/PasskeyLoginPanel.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');
const loginStepUpGate = read('src/components/LoginStepUpGate.tsx');
const hcaptcha = read('src/lib/hcaptcha.ts');
const authFeatureFlags = read('src/lib/authFeatureFlags.ts');
const supabaseClient = read('src/supabaseClient.ts');
const dockerfile = read('Dockerfile');
const renderBlueprint = read('render.yaml');

describe('website primary login regression boundary', () => {
  it('keeps Google OAuth as the leading website provider until native passkey activation', () => {
    expect(loginPage).toContain("provider: 'google'");
    expect(loginPage).toContain('supabase.auth.signInWithOAuth');
    expect(loginPage).toContain("redirectTo: `${window.location.origin}/login`");
    expect(loginPage).toContain("prompt: 'select_account'");
    expect(loginPage).toContain('Primärer Login · Google');
    expect(loginPage).toContain('Google-Konto ein Passkey eingerichtet');
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

  it('does not perform asynchronous Supabase work inside onAuthStateChange itself', () => {
    expect(sessionComposition).toContain('supabase.auth.onAuthStateChange((_event, session) =>');
    expect(sessionComposition).not.toContain('onAuthStateChange(async');
    expect(sessionComposition).toContain('window.setTimeout(() =>');
    expect(sessionComposition).toContain('establishSession(session).catch');
  });

  it('lets authenticated OAuth callbacks reach onboarding/AAL gates', () => {
    expect(sessionComposition).toContain('if (pendingOnboardingSession)');
    expect(sessionComposition).toContain('if (pendingStepUpSession)');
    expect(sessionComposition).not.toContain(
      'pendingStepUpSession && !renderPublicShellImmediately',
    );
    expect(sessionComposition).not.toContain(
      'pendingOnboardingSession && !renderPublicShellImmediately',
    );
  });

  it('keeps the native MFA/AAL gate mandatory regardless of primary login method', () => {
    expect(loginStepUpGate).toContain('email/password, Google OAuth or a native passkey');
    expect(loginStepUpGate).toContain('There is no bypass around the native AAL gate.');
    expect(loginStepUpGate).toContain("level.nextLevel === 'aal2'");
    expect(loginStepUpGate).toContain('verifyTotpChallenge');
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
