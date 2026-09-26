import fs from 'fs';

interface Check {
  id: string;
  file: string;
  description: string;
  includes?: string;
  excludes?: string;
  pattern?: RegExp;
}

const checks: Check[] = [
  {
    id: 'PCG-001',
    file: 'render.yaml',
    description: 'Render auto-deploy must remain off when GitHub CI is the production deployment authority',
    includes: 'autoDeployTrigger: off',
  },
  {
    id: 'PCG-012',
    file: '.github/workflows/ci.yml',
    description: 'Production deployment must require a successful main push',
    includes: "github.event_name == 'push' && github.ref == 'refs/heads/main'",
  },
  {
    id: 'PCG-013',
    file: '.github/workflows/ci.yml',
    description: 'Production deployment must depend on the successful build-and-test trust boundary',
    includes: 'needs: [build-and-test]',
  },
  {
    id: 'PCG-015',
    file: '.github/workflows/ci.yml',
    description: 'The consolidated main build must still require hosted supply-chain provenance',
    includes: 'verifySupplyChainProvenance.ts --require-ci',
  },
  {
    id: 'PCG-016',
    file: '.github/workflows/ci.yml',
    description: 'The consolidated main build must still verify Sigstore provenance before deployment',
    includes: 'cosign verify-blob',
  },
  {
    id: 'PCG-017',
    file: '.github/workflows/ci.yml',
    description: 'Production mutation must reject an artifact whose release-manifest commit differs from github.sha',
    includes: 'manifest.sourceCommit !== process.env.VERIFIED_COMMIT_SHA',
  },
  {
    id: 'PCG-014',
    file: '.github/workflows/ci.yml',
    description: 'Render deployment must use the exact verified commit through the canonical Render API trigger',
    includes: 'node p2b-runtime/artifacts/deployment/triggerRenderExactCommit.mjs',
  },
  {
    id: 'PCG-018',
    file: '.github/workflows/ci.yml',
    description: 'Render deployment must fail closed unless live main still equals the exact verified commit SHA',
    includes: 'test "$live_main_sha" = "$VERIFIED_COMMIT_SHA"',
  },
  {
    id: 'PCG-002',
    file: 'render.yaml',
    description: 'Render must use the application health endpoint',
    includes: 'healthCheckPath: /healthz',
  },
  {
    id: 'PCG-003',
    file: 'render.yaml',
    description: 'A dedicated Supabase secret key must be declared as a Dashboard-managed Render env var',
    includes: '- key: SUPABASE_SECRET_KEY',
  },
  {
    id: 'PCG-009',
    file: 'render.yaml',
    description: 'Render Secret Files must not be part of the production configuration authority',
    excludes: 'secretFiles:',
  },
  {
    id: 'PCG-010',
    file: 'render.yaml',
    description: 'Stripe secret key must be declared as a Dashboard-managed Render env var',
    includes: '- key: STRIPE_SECRET_KEY',
  },
  {
    id: 'PCG-011',
    file: 'render.yaml',
    description: 'TOTP encryption key must be declared as a Dashboard-managed Render env var',
    includes: '- key: TOTP_ENCRYPTION_KEY',
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
    description: 'CI checkout action must be pinned to a full 40-character commit SHA',
    pattern: /actions\/checkout@[0-9a-f]{40}(?:\s|$)/,
  },
  {
    id: 'PCG-008',
    file: '.github/workflows/ci.yml',
    description: 'CI Node setup action must be pinned to a full 40-character commit SHA',
    pattern: /actions\/setup-node@[0-9a-f]{40}(?:\s|$)/,
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
      : check.pattern !== undefined
        ? check.pattern.test(content)
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
