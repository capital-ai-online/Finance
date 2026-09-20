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
    id: 'PWD-001',
    file: 'src/features/public/ui/LoginPage.tsx',
    includes: 'await assertStrongUncompromisedPassword(password)',
  },
  {
    id: 'PWD-002',
    file: 'src/features/public/ui/LoginPage.tsx',
    includes: 'await assertStrongUncompromisedPassword(recoveryPassword)',
  },
  {
    id: 'PWD-003',
    file: 'src/lib/passwordSecurity.ts',
    includes: "const PASSWORD_SCREENING_ENDPOINT = '/api/auth/password-security/check'",
  },
  {
    id: 'PWD-004',
    file: 'src/lib/passwordSecurity.ts',
    excludes: 'api.pwnedpasswords.com',
  },
  {
    id: 'PWD-005',
    file: 'server/security/passwordSecurity.ts',
    includes: "const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range'",
  },
  {
    id: 'PWD-006',
    file: 'server/security/passwordSecurity.ts',
    includes: "const prefix = fullHash.slice(0, 5)",
  },
  {
    id: 'PWD-007',
    file: 'server/security/passwordSecurity.ts',
    includes: "'Add-Padding': 'true'",
  },
  {
    id: 'PWD-008',
    file: 'server/security/passwordSecurity.ts',
    includes: "'User-Agent': HIBP_USER_AGENT",
  },
  {
    id: 'PWD-009',
    file: 'server/routes/passwordSecurityRoutes.ts',
    includes: "name: 'password-security'",
  },
  {
    id: 'PWD-010',
    file: 'server/routes/passwordSecurityRoutes.ts',
    includes: "res.setHeader('Cache-Control', 'no-store')",
  },
  {
    id: 'PWD-011',
    file: 'server/routes/registerApplicationRoutes.ts',
    includes: "app.use('/api/auth', passwordSecurityRouter)",
  },
  {
    id: 'PWD-012',
    file: 'tests/unit/serverPasswordSecurity.test.ts',
    includes: 'five-character SHA-1 prefix',
  },
];

const failures: Check[] = [];

for (const check of checks) {
  const absolute = path.join(root, check.file);
  if (!fs.existsSync(absolute)) {
    failures.push(check);
    continue;
  }
  const content = fs.readFileSync(absolute, 'utf8');
  const valid = check.includes !== undefined
    ? content.includes(check.includes)
    : check.excludes !== undefined
      ? !content.includes(check.excludes)
      : false;
  if (!valid) failures.push(check);
}

if (failures.length > 0) {
  console.error('[PASSWORD_SECURITY_BOUNDARY] DEPLOYMENT BLOCKED');
  for (const failure of failures) {
    console.error(`- ${failure.id} ${failure.file}`);
  }
  process.exit(1);
}

console.log(`[PASSWORD_SECURITY_BOUNDARY] ${checks.length} invariants verified.`);
