import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');
const dashboard = read('src/app/dashboard/Dashboard.tsx');
const dashboardNavigation = read('src/app/dashboard/DashboardNavigation.tsx');
const loginPage = read('src/features/public/ui/LoginPage.tsx');
const registrationGate = read('src/components/RegistrationCompletionGate.tsx');
const loginStepUpGate = read('src/components/LoginStepUpGate.tsx');
const packageJson = JSON.parse(read('package.json')) as { version: string };
const indexHtml = read('index.html');
const workPackage = read('docs/roadmaps/work-packages/AUTH_NORMAL_USER_LOGIN_REGISTRATION_2026-08-29.md');

describe('frontend auth lifecycle remediation', () => {
  it('keeps authenticated users on the canonical root without bypassing session gates', () => {
    const rootStart = routes.indexOf("if (currentPath === '/')");
    const loginStart = routes.indexOf("if (currentPath === '/login')");
    const rootBlock = routes.slice(rootStart, loginStart);

    expect(rootStart).toBeGreaterThanOrEqual(0);
    expect(loginStart).toBeGreaterThan(rootStart);
    expect(rootBlock).toContain('<LandingPage onLoginNavigate={clearJustLoggedOut} />');
    expect(rootBlock).not.toContain('/dashboard');
    expect(routes).toContain('<RouteRedirect to="/" label="Zur Landingpage" />');
    expect(sessionComposition).toContain('const gatePolicy = await readAuthGatePolicy(session)');
    expect(sessionComposition).toContain('if (gatePolicy.onboardingRequired)');
    expect(sessionComposition).toContain('if (!gatePolicy.mfaRequiredAccount)');
    expect(sessionComposition).toContain('setPendingOnboardingSession(session)');
    expect(sessionComposition).toContain('setPendingStepUpSession(session)');
  });

  it('keeps unauthenticated root public', () => {
    expect(routes).toContain("if (currentPath === '/')");
    expect(routes).toContain('<LandingPage');
  });

  it('uses explicit local and global Supabase logout scopes without a generic watchdog', () => {
    expect(sessionComposition).toContain("const handleLogout = async () => performLogout('local')");
    expect(sessionComposition).toContain("const handleGlobalLogout = async () => performLogout('global')");
    expect(sessionComposition).toContain('await supabase.auth.signOut({ scope });');
    expect(sessionComposition).not.toContain('SIGN_OUT_TIMEOUT_MS');
    expect(sessionComposition).not.toContain('signOutWithTimeout');
    expect(sessionComposition).not.toContain('Promise.race([');
    expect(sessionComposition).toContain('resetAuthProjection()');
  });

  it('exposes global logout as a separate confirmed action without claiming instant JWT revocation', () => {
    expect(dashboard).toContain('Von allen Geräten abmelden');
    expect(dashboard).toContain('window.confirm(');
    expect(dashboard).toContain('Access-Tokens können bis zu ihrem Ablauf gültig bleiben');
    expect(dashboard).toContain('onGlobalLogout={onGlobalLogout ? handleGlobalLogoutClick : undefined}');
    expect(dashboardNavigation).toContain('Von allen Geräten abmelden');
    expect(dashboardNavigation).toContain('onClick={() => void onGlobalLogout()}');
  });

  it('keeps registration CAPTCHA, consent/onboarding and account-required MFA gates intact', () => {
    expect(loginPage).toContain('const captchaToken = await requestHcaptchaToken()');
    expect(loginPage).toContain('supabase.auth.signUp');
    expect(loginPage).toContain('captchaToken,');
    expect(registrationGate).toContain('termsAccepted: true');
    expect(registrationGate).toContain('privacyAccepted: true');
    expect(registrationGate).toContain('marketingOptIn');
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