import fs from 'fs';

interface Check {
  id: string;
  file: string;
  description: string;
  includes?: string;
  excludes?: string;
}

const checks: Check[] = [
  {
    id: 'PCG-001',
    file: 'render.yaml',
    description: 'Production deploys must wait for repository checks',
    includes: 'autoDeployTrigger: checksPass',
  },
  {
    id: 'PCG-002',
    file: 'render.yaml',
    description: 'Render must use the application health endpoint',
    includes: 'healthCheckPath: /healthz',
  },
  {
    id: 'PCG-003',
    // Deploy-Härtung: SUPABASE_SECRET_KEY kommt seit der Secret-File-Migration nicht mehr
    // als einzelne render.yaml-envVar, sondern über die Render Secret File - deklariert in
    // scripts/security/secretFileManifest.ts (Single Source of Truth, siehe dort).
    file: 'scripts/security/secretFileManifest.ts',
    description: 'A dedicated Supabase secret key must be declared for privileged backend access',
    includes: "'SUPABASE_SECRET_KEY',",
  },
  {
    id: 'PCG-009',
    file: 'render.yaml',
    description: 'Secrets must be sourced from the Render Secret File, not individual envVars',
    includes: 'secretFiles:',
  },
  {
    id: 'PCG-010',
    file: 'render.yaml',
    description: 'Stripe secret key must not be redeclared as a plain envVar (belongs in the Secret File)',
    excludes: '- key: STRIPE_SECRET_KEY',
  },
  {
    id: 'PCG-011',
    file: 'render.yaml',
    description: 'TOTP encryption key must not be redeclared as a plain envVar (belongs in the Secret File)',
    excludes: '- key: TOTP_ENCRYPTION_KEY',
  },
  {
    id: 'PCG-004',
    file: 'server/db.ts',
    description: 'Privileged Supabase key resolution must not fall back to publishable/anon credentials',
    includes: "return getCleanEnv('SUPABASE_SECRET_KEY') || getCleanEnv('SUPABASE_SERVICE_ROLE_KEY');",
  },
  {
    id: 'PCG-005',
    file: 'server/db.ts',
    description: 'Production subscription persistence must fail closed when privileged credentials are absent',
    includes: "assertPrivilegedSupabaseConfigured('subscription persistence')",
  },
  {
    id: 'PCG-006',
    file: 'server/db.ts',
    description: 'Production subscription reads must not trust local subscription cache',
    includes: "const localSubs = isProduction() ? {} : getLocalSubscriptions();",
  },
  {
    id: 'PCG-007',
    file: '.github/workflows/ci.yml',
    description: 'CI checkout action must be pinned to a commit SHA',
    includes: 'actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683',
  },
  {
    id: 'PCG-008',
    file: '.github/workflows/ci.yml',
    description: 'CI Node setup action must be pinned to a commit SHA',
    includes: 'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
  },
];

const failures: Check[] = [];
for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    failures.push(check);
    continue;
  }
  const content = fs.readFileSync(check.file, 'utf8');
  const valid = check.includes !== undefined
    ? content.includes(check.includes)
    : check.excludes !== undefined
      ? !content.includes(check.excludes)
      : false;
  if (!valid) failures.push(check);
}

if (failures.length > 0) {
  console.error('\n[PRODUCTION_CONFIG_GUARD] DEPLOYMENT BLOCKED\n');
  for (const failure of failures) {
    console.error(`- ${failure.id} ${failure.file}: ${failure.description}`);
  }
  process.exit(1);
}

console.log(`[PRODUCTION_CONFIG_GUARD] ${checks.length} production configuration invariants verified.`);
