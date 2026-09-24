import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyChangedFiles,
  isDatabaseMigrationPath,
  isDocsPath,
  isKnownNonProductionValidationPath,
  isOperationsReleaseControlPath,
  isOrdinaryOperationsToolingPath,
  isRuntimeDeployPath,
  isWorkflowPath,
} from './classifyPrScope.mjs';

describe('isDocsPath', () => {
  it('recognizes docs, .ai, markdown', () => {
    assert.equal(isDocsPath('docs/a.md'), true);
    assert.equal(isDocsPath('.ai/work-claims/x.json'), true);
    assert.equal(isDocsPath('README.md'), true);
    assert.equal(isDocsPath('src/app.ts'), false);
  });
});

describe('isDatabaseMigrationPath', () => {
  it('recognizes Supabase SQL migrations without treating arbitrary SQL as database scope', () => {
    assert.equal(isDatabaseMigrationPath('supabase/migrations/20260924171500_index.sql'), true);
    assert.equal(isDatabaseMigrationPath('docs/examples/schema.sql'), false);
  });
});

describe('isRuntimeDeployPath', () => {
  it('flags docker and package manifests', () => {
    assert.equal(isRuntimeDeployPath('Dockerfile'), true);
    assert.equal(isRuntimeDeployPath('package.json'), true);
    assert.equal(isRuntimeDeployPath('server/index.ts'), true);
    assert.equal(isRuntimeDeployPath('src/app.ts'), false);
  });
});

describe('isWorkflowPath', () => {
  it('flags workflow files', () => {
    assert.equal(isWorkflowPath('.github/workflows/ci.yml'), true);
    assert.equal(isWorkflowPath('src/x.ts'), false);
  });
});

describe('operations tooling classification', () => {
  it('keeps ordinary operations adapters out of release-control scope', () => {
    assert.equal(isOrdinaryOperationsToolingPath('scripts/operations/renderManagementAdapter.mjs'), true);
    assert.equal(isOperationsReleaseControlPath('scripts/operations/renderManagementAdapter.mjs'), false);
  });

  it('keeps cadence/deploy/release controls fail-closed as runtime/deploy scope', () => {
    assert.equal(isOperationsReleaseControlPath('scripts/operations/mergeCadence.mjs'), true);
    assert.equal(isRuntimeDeployPath('scripts/operations/mergeCadence.mjs'), true);
    assert.equal(isOrdinaryOperationsToolingPath('scripts/operations/mergeCadence.mjs'), false);
  });
});

describe('isKnownNonProductionValidationPath', () => {
  it('recognizes deterministic validation/tooling surfaces', () => {
    assert.equal(isKnownNonProductionValidationPath('tests/unit/x.test.ts'), true);
    assert.equal(isKnownNonProductionValidationPath('scripts/pr/classifyPrScope.mjs'), true);
    assert.equal(isKnownNonProductionValidationPath('scripts/governance/validate.mjs'), true);
    assert.equal(isKnownNonProductionValidationPath('.github/workflows/pr-governance.yml'), true);
    assert.equal(isKnownNonProductionValidationPath('.github/workflows/ci.yml'), false);
    assert.equal(isKnownNonProductionValidationPath('src/app.ts'), false);
  });
});

describe('classifyChangedFiles', () => {
  it('class D for docs-only without a runtime consumer', () => {
    const s = classifyChangedFiles(['docs/a.md', '.ai/x.json']);
    assert.equal(s.class, 'D');
    assert.equal(s.production_impact, false);
    assert.equal(s.node, false);
    assert.equal(s.unit, false);
    assert.equal(s.build, false);
    assert.equal(s.consumer_escalation, false);
  });

  it('escalates a docs deletion/change to class C when runtime code consumes it', () => {
    const path = 'docs/projects/operations/DEVELOPMENT_CHAIN.md';
    const s = classifyChangedFiles([path], { runtimeConsumedPaths: [path] });
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, true);
    assert.equal(s.node, true);
    assert.equal(s.unit, true);
    assert.equal(s.build, true);
    assert.equal(s.consumer_escalation, true);
  });

  it('keeps a documentary snapshot non-production when its only consumers are tests', () => {
    const path = 'docs/frontend/upstream-source/SvenKulessa-FRONTEND/manifest.json';
    const s = classifyChangedFiles([path], {
      runtimeConsumedPaths: [path],
      runtimeConsumerFiles: {
        [path]: ['tests/unit/frontendExtendedWebdesign.test.ts'],
      },
    });
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, false);
    assert.equal(s.unit, true);
    assert.equal(s.build, false);
    assert.equal(s.predeploy, false);
    assert.equal(s.consumer_escalation, true);
    assert.equal(s.consumer_test_only, true);
  });

  it('keeps ordinary operations tooling non-production while still testing it', () => {
    const s = classifyChangedFiles(['scripts/operations/renderManagementAdapter.mjs']);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, false);
    assert.equal(s.node, true);
    assert.equal(s.unit, true);
    assert.equal(s.build, false);
    assert.equal(s.predeploy, false);
  });

  it('class C for src changes with production impact but without docker', () => {
    const s = classifyChangedFiles(['src/app.ts']);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, true);
    assert.equal(s.node, true);
    assert.equal(s.lint, true);
    assert.equal(s.unit, true);
    assert.equal(s.build, true);
    assert.equal(s.docker, false);
    assert.equal(s.docker_image, false);
  });

  it('class R for Dockerfile keeps runtime checks and verifies the production build/predeploy path', () => {
    const s = classifyChangedFiles(['Dockerfile']);
    assert.equal(s.class, 'R');
    assert.equal(s.production_impact, true);
    assert.equal(s.node, true);
    assert.equal(s.lint, true);
    assert.equal(s.unit, true);
    assert.equal(s.audit, true);
    assert.equal(s.docker, true);
    assert.equal(s.build, true);
    assert.equal(s.predeploy, true);
    assert.equal(s.docker_image, false);
  });

  it('class R for package.json audits dependencies and verifies the production build/predeploy path', () => {
    const s = classifyChangedFiles(['package.json']);
    assert.equal(s.class, 'R');
    assert.equal(s.production_impact, true);
    assert.equal(s.audit, true);
    assert.equal(s.build, true);
    assert.equal(s.predeploy, true);
    assert.equal(s.docker_image, false);
  });

  it('class R for server runtime changes verifies build/predeploy without duplicating the PR Docker image build', () => {
    const s = classifyChangedFiles(['server/runtime/businessReadiness.ts']);
    assert.equal(s.class, 'R');
    assert.equal(s.production_impact, true);
    assert.equal(s.unit, true);
    assert.equal(s.build, true);
    assert.equal(s.predeploy, true);
    assert.equal(s.docker, true);
    assert.equal(s.docker_image, false);
  });

  it('Supabase migration + direct regression test avoids unrelated website build while retaining database validation', () => {
    const s = classifyChangedFiles([
      'supabase/migrations/20260924171500_index_stripe_managed_webhooks_account_fk.sql',
      'tests/unit/stripeManagedWebhooksFkIndex.test.ts',
    ]);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, true);
    assert.equal(s.database_migration, true);
    assert.equal(s.node, true);
    assert.equal(s.lint, true);
    assert.equal(s.unit, true);
    assert.equal(s.build, false);
    assert.equal(s.predeploy, false);
    assert.equal(s.audit, false);
  });

  it('SQL-only Supabase migration skips TypeScript/build but retains focused database validation', () => {
    const s = classifyChangedFiles(['supabase/migrations/20260924171500_index.sql']);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, true);
    assert.equal(s.database_migration, true);
    assert.equal(s.node, true);
    assert.equal(s.lint, false);
    assert.equal(s.unit, true);
    assert.equal(s.build, false);
    assert.equal(s.predeploy, false);
  });

  it('test-only keeps scoped tests but skips production build/predeploy', () => {
    const s = classifyChangedFiles(['tests/unit/foo.test.ts']);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, false);
    assert.equal(s.unit, true);
    assert.equal(s.build, false);
    assert.equal(s.predeploy, false);
  });

  it('governance tooling skips production build/predeploy', () => {
    const s = classifyChangedFiles(['scripts/governance/validateGovernanceControlPlane.mjs', 'docs/governance/PR_CHECK_CLASSIFICATION.md']);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, false);
    assert.equal(s.node, true);
    assert.equal(s.unit, true);
    assert.equal(s.build, false);
    assert.equal(s.predeploy, false);
  });

  it('non-deploy workflow change sets workflow security without production build', () => {
    const s = classifyChangedFiles(['.github/workflows/pr-governance.yml']);
    assert.equal(s.workflow_security, true);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, false);
    assert.equal(s.build, false);
    assert.equal(s.predeploy, false);
  });

  it('ci.yml is class R and production impacting with build/predeploy verification', () => {
    const s = classifyChangedFiles(['.github/workflows/ci.yml']);
    assert.equal(s.class, 'R');
    assert.equal(s.production_impact, true);
    assert.equal(s.workflow_security, true);
    assert.equal(s.build, true);
    assert.equal(s.predeploy, true);
    assert.equal(s.docker_image, false);
  });

  it('unknown non-doc config fails closed as production impacting', () => {
    const s = classifyChangedFiles(['vite.config.ts']);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, true);
    assert.equal(s.build, true);
    assert.equal(s.predeploy, true);
  });

  it('forceFull keeps the complete main production validation path', () => {
    const s = classifyChangedFiles([], { forceFull: true });
    assert.equal(s.class, 'R');
    assert.equal(s.production_impact, true);
    assert.equal(s.node, true);
    assert.equal(s.lint, true);
    assert.equal(s.unit, true);
    assert.equal(s.build, true);
    assert.equal(s.audit, true);
    assert.equal(s.predeploy, true);
    assert.equal(s.docker, true);
    assert.equal(s.docker_image, true);
  });

  it('mixed docs+src escalates to production-impacting C', () => {
    const s = classifyChangedFiles(['docs/a.md', 'src/x.ts']);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, true);
    assert.equal(s.node, true);
    assert.equal(s.build, true);
  });

  it('mixed governance tooling+src cannot downgrade production impact', () => {
    const s = classifyChangedFiles(['scripts/governance/validateGovernanceControlPlane.mjs', 'src/x.ts']);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, true);
    assert.equal(s.build, true);
    assert.equal(s.predeploy, true);
  });
});
