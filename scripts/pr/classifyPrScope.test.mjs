import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyChangedFiles,
  isDocsPath,
  isKnownNonProductionValidationPath,
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
  it('class D for docs-only without production impact', () => {
    const s = classifyChangedFiles(['docs/a.md', '.ai/x.json']);
    assert.equal(s.class, 'D');
    assert.equal(s.production_impact, false);
    assert.equal(s.node, false);
    assert.equal(s.unit, false);
    assert.equal(s.build, false);
    assert.equal(s.docker, false);
    assert.equal(s.workflow_security, false);
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

  it('class R for Dockerfile', () => {
    const s = classifyChangedFiles(['Dockerfile']);
    assert.equal(s.class, 'R');
    assert.equal(s.production_impact, true);
    assert.equal(s.docker, true);
    assert.equal(s.docker_image, true);
    assert.equal(s.audit, true);
  });

  it('class R for package.json', () => {
    const s = classifyChangedFiles(['package.json']);
    assert.equal(s.class, 'R');
    assert.equal(s.production_impact, true);
    assert.equal(s.audit, true);
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
    const s = classifyChangedFiles([
      'scripts/governance/validateGovernanceControlPlane.mjs',
      'docs/governance/PR_CHECK_CLASSIFICATION.md',
    ]);
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

  it('ci.yml is class R and production impacting', () => {
    const s = classifyChangedFiles(['.github/workflows/ci.yml']);
    assert.equal(s.class, 'R');
    assert.equal(s.production_impact, true);
  });

  it('unknown non-doc config fails closed as production impacting', () => {
    const s = classifyChangedFiles(['vite.config.ts']);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, true);
    assert.equal(s.build, true);
    assert.equal(s.predeploy, true);
  });

  it('forceFull yields full R production validation', () => {
    const s = classifyChangedFiles([], { forceFull: true });
    assert.equal(s.class, 'R');
    assert.equal(s.production_impact, true);
    assert.equal(s.docker_image, true);
    assert.equal(s.node, true);
  });

  it('mixed docs+src escalates to production-impacting C', () => {
    const s = classifyChangedFiles(['docs/a.md', 'src/x.ts']);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, true);
    assert.equal(s.node, true);
    assert.equal(s.build, true);
  });

  it('mixed governance tooling+src cannot downgrade production impact', () => {
    const s = classifyChangedFiles([
      'scripts/governance/validateGovernanceControlPlane.mjs',
      'src/x.ts',
    ]);
    assert.equal(s.class, 'C');
    assert.equal(s.production_impact, true);
    assert.equal(s.build, true);
    assert.equal(s.predeploy, true);
  });
});