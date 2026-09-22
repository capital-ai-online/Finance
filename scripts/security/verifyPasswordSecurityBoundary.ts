import fs from 'node:fs';
import path from 'node:path';

interface Check {
  id: string;
  file: string;
  includes?: string;
  excludes?: string;
}

const root = process.cwd();
const checks: Check[] = [
  {
    id: 'PWD-SUPERSESSION-001',
    file: 'src/features/public/ui/LoginPage.tsx',
    includes: '/api/auth/login/google?next=%2F',
  },
  {
    id: 'PWD-SUPERSESSION-002',
    file: 'src/features/public/ui/LoginPage.tsx',
    excludes: 'signInWithPassword',
  },
  {
    id: 'PWD-SUPERSESSION-003',
    file: 'src/features/public/ui/LoginPage.tsx',
    excludes: 'signUp',
  },
  {
    id: 'PWD-SUPERSESSION-004',
    file: 'src/features/public/ui/LoginPage.tsx',
    excludes: 'resetPasswordForEmail',
  },
  {
    id: 'PWD-SUPERSESSION-005',
    file: 'src/features/public/ui/LoginPage.tsx',
    excludes: 'type="password"',
  },
  {
    id: 'PWD-SUPERSESSION-006',
    file: 'src/app/auth/SessionComposition.tsx',
    excludes: 'supabase',
  },
  {
    id: 'PWD-SUPERSESSION-007',
    file: 'server/routes/backendAuthRoutes.ts',
    includes: "backendAuthRouter.get('/login/google'",
  },
  {
    id: 'PWD-SUPERSESSION-008',
    file: 'server/routes/backendAuthRoutes.ts',
    includes: 'exchangeCodeForSession(code)',
  },
  {
    id: 'PWD-SUPERSESSION-009',
    file: 'server/auth/backendAuth.ts',
    includes: "'HttpOnly'",
  },
  {
    id: 'PWD-SUPERSESSION-010',
    file: 'server/auth/backendAuth.ts',
    includes: "flowType: 'pkce'",
  },
  {
    id: 'PWD-LEGACY-011',
    file: 'server/security/passwordSecurity.ts',
    includes: "const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range'",
  },
  {
    id: 'PWD-LEGACY-012',
    file: 'server/routes/passwordSecurityRoutes.ts',
    includes: "name: 'password-security'",
  },
];

const failures: Check[] = [];

for (const check of checks) {
  const absolute = path.join(root, check.file);
  if (!fs.existsSync(absolute)) {
    failures.push(check);
    continue;
  }
  const source = fs.readFileSync(absolute, 'utf8');
  const valid =
    check.includes !== undefined
      ? source.includes(check.includes)
      : check.excludes !== undefined
        ? !source.includes(check.excludes)
        : false;
  if (!valid) failures.push(check);
}

if (failures.length > 0) {
  console.error('[PASSWORD_SECURITY_BOUNDARY] DEPLOYMENT BLOCKED');
  for (const failure of failures) console.error(`- ${failure.id} ${failure.file}`);
  process.exit(1);
}

console.log(
  `[PASSWORD_SECURITY_BOUNDARY] ${checks.length} invariants verified; browser password auth is superseded by backend Google OAuth.`,
);
