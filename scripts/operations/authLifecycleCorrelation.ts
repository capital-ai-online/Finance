import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LifecycleResult } from './userLifecycleHarness';

export type AuthLifecycleOwner =
  | 'CAPITAL-AI-OPS'
  | 'CAPITAL-AI-FE'
  | 'CAPITAL-AI-GOV'
  | 'CAPITAL-AI-SEC'
  | 'CAPITAL-AI-SEO';

export interface AuthLifecycleFinding {
  id: string;
  result: LifecycleResult;
  owner: AuthLifecycleOwner;
  surface: string[];
  expected: string;
  observed: string;
}

const read = (root: string, file: string) => fs.readFileSync(path.join(root, file), 'utf8');

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

export function evaluateAuthLifecycleRepositoryContracts(repoRoot = process.cwd()): AuthLifecycleFinding[] {
  const login = read(repoRoot, 'src/features/public/ui/LoginPage.tsx');
  const session = read(repoRoot, 'src/app/auth/SessionComposition.tsx');
  const routes = read(repoRoot, 'src/app/routing/AppRoutes.tsx');
  const backendRoutes = read(repoRoot, 'server/routes/backendAuthRoutes.ts');
  const backendAuth = read(repoRoot, 'server/auth/backendAuth.ts');
  const authMiddleware = read(repoRoot, 'src/platform/Security/authMiddleware.ts');
  const application = read(repoRoot, 'server.application.ts');
  const header = read(repoRoot, 'src/features/public/ui/frontend-port/components/Header.tsx');
  const indexHtml = read(repoRoot, 'index.html');
  const packageJson = JSON.parse(read(repoRoot, 'package.json')) as { version?: string };
  const version = packageJson.version || 'UNKNOWN';

  const findings: AuthLifecycleFinding[] = [];

  const backendOauth =
    login.includes('/api/auth/login/google?next=%2F') &&
    !login.includes('supabase.auth.') &&
    backendRoutes.includes("backendAuthRouter.get('/login/google'") &&
    backendRoutes.includes("provider: 'google'") &&
    backendRoutes.includes('signInWithOAuth') &&
    backendRoutes.includes('exchangeCodeForSession');
  findings.push(finding(
    'backend_google_oauth_contract',
    backendOauth ? 'PASS' : 'FAIL',
    'CAPITAL-AI-OPS',
    ['src/features/public/ui/LoginPage.tsx', 'server/routes/backendAuthRoutes.ts'],
    'Google OAuth is initiated and completed by backend endpoints; the public login page contains no Supabase client auth.',
    backendOauth ? 'Backend Google OAuth + code exchange is the only productive login path.' : 'Browser/backend OAuth ownership is incomplete or divergent.',
  ));

  const httpOnlySession =
    backendAuth.includes("'HttpOnly'") &&
    backendAuth.includes("'SameSite='") &&
    backendAuth.includes("if (isProduction()) parts.push('Secure')") &&
    backendAuth.includes('resolveVerifiedBackendAuth') &&
    backendRoutes.includes("backendAuthRouter.get('/session'") &&
    backendRoutes.includes('getSubscription(user.id)');
  findings.push(finding(
    'backend_http_only_session_contract',
    httpOnlySession ? 'PASS' : 'FAIL',
    'CAPITAL-AI-OPS',
    ['server/auth/backendAuth.ts', 'server/routes/backendAuthRoutes.ts'],
    'Supabase session material is backend-owned in HttpOnly/SameSite cookies and session projection binds entitlement to verified user UUID.',
    httpOnlySession ? 'Backend cookie session and UUID-bound subscription projection are present.' : 'Backend session or entitlement projection is incomplete.',
  ));

  const clientAuthRemoved =
    !session.includes('supabase') &&
    !session.includes('localStorage') &&
    !session.includes('LoginStepUpGate') &&
    !session.includes('RegistrationCompletionGate') &&
    !login.includes('signInWithPassword') &&
    !login.includes('signUp') &&
    !login.includes('resetPasswordForEmail') &&
    !login.includes('supabase');
  findings.push(finding(
    'client_auth_orchestration_removed',
    clientAuthRemoved ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['src/app/auth/SessionComposition.tsx', 'src/features/public/ui/LoginPage.tsx'],
    'Productive browser login/session composition contains no Supabase OAuth/password/MFA/onboarding/token-persistence authority.',
    clientAuthRemoved ? 'Client auth is a thin backend-session projection only.' : 'Legacy browser auth authority is still reachable.',
  ));

  const rootLanding =
    routes.includes("if (currentPath === '/')") &&
    routes.includes('<LandingPage') &&
    routes.includes('authenticatedProfile={{') &&
    routes.includes('subscriptionTier: userSession.subscriptionTier');
  findings.push(finding(
    'authenticated_root_landing_handoff',
    rootLanding ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['src/app/routing/AppRoutes.tsx'],
    'Authenticated users remain on the canonical landing with the backend-projected profile.',
    rootLanding ? 'Root landing receives the authenticated backend profile projection.' : 'Authenticated root projection is missing.',
  ));

  const logout =
    session.includes("fetch('/api/auth/logout'") &&
    session.includes("JSON.stringify({ scope })") &&
    header.includes('id="header-logout-btn"') &&
    header.includes('id="drawer-logout-btn"');
  findings.push(finding(
    'backend_logout_visible_contract',
    logout ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['src/app/auth/SessionComposition.tsx', 'src/features/public/ui/frontend-port/components/Header.tsx'],
    'Authenticated landing UI exposes an explicit logout action backed by POST /api/auth/logout.',
    logout ? 'Desktop/header and drawer logout controls are wired to backend logout.' : 'Logout is not fully visible/wired.',
  ));

  const protectedDashboard =
    routes.includes("if (currentPath === '/dashboard')") &&
    routes.includes('if (!userSession)') &&
    routes.includes('<RouteRedirect to="/login"');
  findings.push(finding(
    'dashboard_protected_deep_link',
    protectedDashboard ? 'PASS' : 'FAIL',
    'CAPITAL-AI-FE',
    ['src/app/routing/AppRoutes.tsx'],
    '/dashboard remains protected by the backend session projection.',
    protectedDashboard ? 'Unauthenticated dashboard access converges to /login.' : 'Dashboard auth gate is missing.',
  ));

  const backendIdentity =
    authMiddleware.includes('resolveVerifiedBackendAuth') &&
    authMiddleware.includes("source: 'backend-cookie'") &&
    authMiddleware.includes('resolveRequestCredential(req)');
  findings.push(finding(
    'backend_cookie_identity_contract',
    backendIdentity ? 'PASS' : 'FAIL',
    'CAPITAL-AI-SEC',
    ['src/platform/Security/authMiddleware.ts', 'server/auth/backendAuth.ts'],
    'Protected server routes accept only a Supabase-verified backend cookie session or an explicitly supported Bearer credential.',
    backendIdentity ? 'IAM resolves the backend cookie through verified Supabase identity.' : 'Server IAM is not yet bound to the backend session.',
  ));

  const csrfBoundary =
    application.includes("return res.status(403).json({ error: 'Origin nicht erlaubt.' });") &&
    application.includes('SameSite=Lax backend cookies') &&
    backendAuth.includes("sameSite?: 'Lax' | 'Strict'") &&
    backendAuth.includes('verifyOAuthState');
  findings.push(finding(
    'backend_cookie_origin_csrf_boundary',
    csrfBoundary ? 'PASS' : 'FAIL',
    'CAPITAL-AI-SEC',
    ['server.application.ts', 'server/auth/backendAuth.ts'],
    'Cookie-authenticated requests reject non-canonical browser origins and OAuth callback state is independently bound.',
    csrfBoundary ? 'Origin rejection + SameSite + OAuth state/PKCE boundaries are materialized.' : 'Cookie CSRF/origin boundary is incomplete.',
  ));

  const canonicalVersion =
    version !== 'UNKNOWN' &&
    indexHtml.includes(`Version ${version}`) &&
    indexHtml.includes(`content="Offizielles CAPITAL-AI Portal (Version ${version})`);
  findings.push(finding(
    'platform_version_projection',
    canonicalVersion ? 'PASS' : 'FAIL',
    'CAPITAL-AI-OPS',
    ['package.json', 'index.html'],
    'Public metadata projects package.json#version.',
    canonicalVersion ? `Public metadata projects version ${version}.` : `Version ${version} is not consistently projected.`,
  ));

  const structuredVersion = version !== 'UNKNOWN' && indexHtml.includes(`"softwareVersion": "${version}"`);
  findings.push(finding(
    'search_structured_version_metadata',
    structuredVersion ? 'PASS' : 'FAIL',
    'CAPITAL-AI-SEO',
    ['index.html'],
    'Structured SoftwareApplication metadata projects the canonical platform version.',
    structuredVersion ? `JSON-LD declares softwareVersion ${version}.` : 'softwareVersion is missing or divergent.',
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
  const summary = summarizeAuthLifecycleFindings(evaluateAuthLifecycleRepositoryContracts());
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (process.argv.includes('--strict') && summary.result === 'FAIL') process.exitCode = 1;
}
