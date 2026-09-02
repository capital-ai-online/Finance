import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LifecycleResult } from './userLifecycleHarness';

export type AuthLifecycleOwner = 'CAPITAL-AI-OPS' | 'CAPITAL-AI-FE' | 'CAPITAL-AI-GOV' | 'CAPITAL-AI-SEO';

export interface AuthLifecycleFinding {
  id: string;
  result: LifecycleResult;
  owner: AuthLifecycleOwner;
  surface: string[];
  expected: string;
  observed: string;
}

function read(repoRoot: string, relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function finding(
  id: string,
  result: LifecycleResult,
  owner: AuthLifecycleOwner,
  surface: string[],
  expected: string,
  observed: string,
): AuthLifecycleFinding {
  return { id, result, owner, surface, expected, observed };
}

function sliceCurrentPathBlock(source: string, pathname: string, nextPathname: string): string {
  const start = source.indexOf(`if (currentPath === '${pathname}')`);
  if (start < 0) return '';
  const end = source.indexOf(`if (currentPath === '${nextPathname}')`, start + 1);
  return end > start ? source.slice(start, end) : source.slice(start);
}

export function evaluateAuthLifecycleRepositoryContracts(repoRoot = process.cwd()): AuthLifecycleFinding[] {
  const loginPage = read(repoRoot, 'src/features/public/ui/LoginPage.tsx');
  const appRoutes = read(repoRoot, 'src/app/routing/AppRoutes.tsx');
  const sessionComposition = read(repoRoot, 'src/app/auth/SessionComposition.tsx');
  const registrationGate = read(repoRoot, 'src/components/RegistrationCompletionGate.tsx');
  const dashboard = read(repoRoot, 'src/components/Dashboard.tsx');
  const stepUp = read(repoRoot, 'server/stepUp.ts');
  const registrationRoadmap = read(repoRoot, 'docs/roadmaps/work-packages/AUTH_NORMAL_USER_LOGIN_REGISTRATION_2026-08-29.md');
  const indexHtml = read(repoRoot, 'index.html');
  const packageJson = JSON.parse(read(repoRoot, 'package.json')) as { version?: string };
  const version = packageJson.version || 'UNKNOWN';
  const findings: AuthLifecycleFinding[] = [];

  const googleOauthRoot =
    loginPage.includes("provider: 'google'") &&
    loginPage.includes('supabase.auth.signInWithOAuth') &&
    loginPage.includes("redirectTo: `${window.location.origin}/`");
  findings.push(finding(
    'google_oauth_provider_handoff',
    googleOauthRoot ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['src/features/public/ui/LoginPage.tsx'],
    'Google OAuth returns to the canonical application root through the existing Supabase Auth flow.',
    googleOauthRoot
      ? 'Google OAuth is configured for the canonical root callback.'
      : 'The canonical Google OAuth root handoff is missing or divergent.',
  ));

  const rootBlock = sliceCurrentPathBlock(appRoutes, '/', '/login');
  const authenticatedRootToDashboard =
    rootBlock.includes('userSession') &&
    (rootBlock.includes('to="/dashboard"') || rootBlock.includes("window.location.replace('/dashboard')"));
  findings.push(finding(
    'authenticated_root_dashboard_handoff',
    authenticatedRootToDashboard ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['src/app/routing/AppRoutes.tsx'],
    'After successful OAuth/session composition, an authenticated visit to / deterministically continues to /dashboard.',
    authenticatedRootToDashboard
      ? 'The root route contains an authenticated dashboard handoff.'
      : 'The root route renders the public landing composition without an authenticated /dashboard handoff.',
  ));

  const menuContract =
    dashboard.includes('onClick={() => setMenuOpen(true)}') &&
    dashboard.includes('onClick={() => setMenuOpen(false)}') &&
    dashboard.includes('aria-label="Hauptmenü öffnen"');
  findings.push(finding(
    'dashboard_menu_interaction_contract',
    menuContract ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['src/components/Dashboard.tsx'],
    'The hamburger button opens the existing slide-out navigation and the overlay/navigation paths can close it.',
    menuContract
      ? 'Static menu open/close wiring is present; a post-login freeze therefore requires application/session composition correlation rather than a new menu implementation.'
      : 'The static hamburger open/close interaction contract is incomplete.',
  ));

  const localLogoutDefault = sessionComposition.includes("supabase.auth.signOut({ scope: 'local' })");
  findings.push(finding(
    'logout_local_default',
    localLogoutDefault ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['src/app/auth/SessionComposition.tsx'],
    'Normal logout terminates only the current device/session with Supabase scope=local.',
    localLogoutDefault
      ? 'Normal logout explicitly uses Supabase local scope.'
      : 'Normal logout still calls signOut without local scope, so provider default global semantics remain reachable.',
  ));

  const explicitGlobalLogout =
    (sessionComposition.includes("scope: 'global'") || dashboard.includes("scope: 'global'")) &&
    /alle ger[aä]te|all devices|global logout/i.test(`${sessionComposition}\n${dashboard}`);
  findings.push(finding(
    'logout_explicit_global_action',
    explicitGlobalLogout ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['src/app/auth/SessionComposition.tsx', 'src/components/Dashboard.tsx'],
    'Global logout is a separate explicit user action and is not the default logout path.',
    explicitGlobalLogout
      ? 'A distinct global-logout action is represented in the application contract.'
      : 'No distinct user-facing global logout action is represented in the current application contract.',
  ));

  const registrationPrimary =
    loginPage.includes('supabase.auth.signUp') &&
    loginPage.includes('requestHcaptchaToken') &&
    loginPage.includes('Normales Nutzerkonto registrieren') &&
    loginPage.includes('data: { full_name: normalizedName }');
  findings.push(finding(
    'registration_primary_contract',
    registrationPrimary ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['src/features/public/ui/LoginPage.tsx'],
    'Self-registration uses Supabase Auth, fresh hCaptcha evidence and explicit profile identity metadata.',
    registrationPrimary
      ? 'The canonical login page contains the expected self-registration and hCaptcha binding.'
      : 'One or more canonical self-registration controls are missing.',
  ));

  const registrationOnboarding =
    sessionComposition.includes('RegistrationCompletionGate') &&
    sessionComposition.includes('needsOnboarding(session)') &&
    registrationGate.includes("authFetch('/api/auth/register/complete'") &&
    registrationGate.includes("authFetch('/api/auth/mfa/enrollment-complete'") &&
    stepUp.includes("stepUpRouter.post('/register/complete'") &&
    stepUp.includes("stepUpRouter.post('/mfa/enrollment-complete'");
  findings.push(finding(
    'registration_onboarding_contract',
    registrationOnboarding ? 'PASS' : 'FAIL',
    'CAPITAL-AI-GOV',
    [
      'src/app/auth/SessionComposition.tsx',
      'src/components/RegistrationCompletionGate.tsx',
      'server/stepUp.ts',
    ],
    'New registrations converge on profile/consent completion and verified MFA before protected application access.',
    registrationOnboarding
      ? 'Profile/consent and MFA onboarding gates are connected end-to-end in repository code.'
      : 'The registration onboarding chain is incomplete or bypassable in repository code.',
  ));

  const roadmapClosed =
    !registrationRoadmap.includes('PR VALIDATION PENDING') &&
    /MERGED|COMPLETE|CLOSED/.test(registrationRoadmap);
  findings.push(finding(
    'registration_roadmap_closure',
    roadmapClosed ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['docs/roadmaps/work-packages/AUTH_NORMAL_USER_LOGIN_REGISTRATION_2026-08-29.md'],
    'The registration work-package status reflects its already Human-merged implementation and separates remaining validation gaps from implementation state.',
    roadmapClosed
      ? 'The roadmap work package is terminalized consistently with merged implementation state.'
      : 'The work package still reports PR validation pending even though the implementation PR has already been Human-merged.',
  ));

  const canonicalVersionProjected =
    version !== 'UNKNOWN' &&
    indexHtml.includes(`Version ${version}`) &&
    indexHtml.includes(`content="Offizielles CAPITAL-AI Portal (Version ${version})`);
  findings.push(finding(
    'platform_version_projection',
    canonicalVersionProjected ? 'PASS' : 'FAIL',
    'CAPITAL-AI-OPS',
    ['package.json', 'index.html'],
    'package.json#version remains authoritative and the public page metadata projects the same platform version.',
    canonicalVersionProjected
      ? `package.json and public metadata both project version ${version}.`
      : `Public metadata does not consistently project package.json version ${version}.`,
  ));

  const structuredVersion =
    version !== 'UNKNOWN' &&
    indexHtml.includes(`"softwareVersion": "${version}"`);
  findings.push(finding(
    'search_structured_version_metadata',
    structuredVersion ? 'PASS' : 'FAIL',
    'CAPITAL-AI-SEO',
    ['index.html'],
    'SoftwareApplication structured data explicitly projects the canonical package.json version for search-engine consumption.',
    structuredVersion
      ? `JSON-LD explicitly declares softwareVersion ${version}.`
      : `JSON-LD has no explicit softwareVersion field for canonical version ${version}; search-engine cache/reindex remains an external follow-up.`,
  ));

  return findings;
}

export function summarizeAuthLifecycleFindings(findings: AuthLifecycleFinding[]) {
  const counts = findings.reduce(
    (acc, item) => {
      acc[item.result] += 1;
      return acc;
    },
    { PASS: 0, FAIL: 0, NOT_AVAILABLE: 0 } as Record<LifecycleResult, number>,
  );
  return {
    result: counts.FAIL > 0 ? 'FAIL' : counts.NOT_AVAILABLE > 0 ? 'NOT_AVAILABLE' : 'PASS',
    counts,
    findings,
  } as const;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  const findings = evaluateAuthLifecycleRepositoryContracts();
  const summary = summarizeAuthLifecycleFindings(findings);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (process.argv.includes('--strict') && summary.result === 'FAIL') process.exitCode = 1;
}
