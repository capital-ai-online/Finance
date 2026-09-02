import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');
const dashboard = read('src/app/dashboard/Dashboard.tsx');
const loginPage = read('src/features/public/ui/LoginPage.tsx');
const registrationGate = read('src/components/RegistrationCompletionGate.tsx');
const loginStepUpGate = read('src/components/LoginStepUpGate.tsx');
const packageJson = JSON.parse(read('package.json')) as { version: string };
const indexHtml = read('index.html');
const workPackage = read('docs/roadmaps/work-packages/AUTH_NORMAL_USER_LOGIN_REGISTRATION_2026-08-29.md');

describe('frontend auth lifecycle remediation', () => {
  it('hands an authenticated canonical root to the dashboard without bypassing session gates', () => {
    expect(routes).toMatch(
      /if \(currentPath === '\/'\) \{\s+if \(userSession\) \{\s+return <RouteRedirect to="\/dashboard"/,
    );
    expect(routes).toContain('<LandingPage');
    expect(sessionComposition).toContain('const onboardingRequired = await needsOnboarding(session)');
    expect(sessionComposition).toContain('setPendingOnboardingSession(session)');
    expect(sessionComposition).toContain('setPendingStepUpSession(session)');
  });

  it('keeps unauthenticated root public', () => {
    expect(routes).toContain("if (currentPath === '/')");
    expect(routes).toContain('<LandingPage');
  });

  it('uses explicit bounded local and global Supabase logout scopes', () => {
    expect(sessionComposition).toContain("const handleLogout = async () => performLogout('local')");
    expect(sessionComposition).toContain("const handleGlobalLogout = async () => performLogout('global')");
    expect(sessionComposition).toContain('supabase.auth.signOut({ scope })');
    expect(sessionComposition).toContain('SIGN_OUT_TIMEOUT_MS = 5_000');
    expect(sessionComposition).toContain('Promise.race([');
    expect(sessionComposition).toContain('resetAuthProjection()');
  });

  it('exposes global logout as a separate confirmed action without claiming instant JWT revocation', () => {
    expect(dashboard).toContain('Von allen Geräten abmelden');
    expect(dashboard).toContain('window.confirm(');
    expect(dashboard).toContain('Access-Tokens können bis zu ihrem Ablauf gültig bleiben');
    expect(dashboard).toContain('data-testid="global-logout-action"');
  });

  it('keeps registration CAPTCHA, consent/onboarding and MFA gates intact', () => {
    expect(loginPage).toContain('const captchaToken = await requestHcaptchaToken()');
    expect(loginPage).toContain('supabase.auth.signUp');
    expect(loginPage).toContain('captchaToken,');
    expect(registrationGate).toContain('consent');
    expect(sessionComposition).toContain('RegistrationCompletionGate');
    expect(sessionComposition).toContain('LoginStepUpGate');
    expect(loginStepUpGate).toContain("level.nextLevel === 'aal2'");
  });

  it('projects the canonical package version into SoftwareApplication structured data', () => {
    expect(indexHtml).toContain('"@type": "SoftwareApplication"');
    expect(indexHtml).toContain(`"softwareVersion": "${packageJson.version}"`);
  });

  it('terminalizes merged registration implementation without inventing runtime evidence', () => {
    expect(workPackage).toContain('`IMPLEMENTED / MERGED`');
    expect(workPackage).toContain('PR #601');
    expect(workPackage).toContain('Runtime/E2E lifecycle validation: **PENDING SEPARATE EVIDENCE**');
  });
});
