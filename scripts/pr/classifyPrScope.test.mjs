import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyChangedFiles,
  isDocsPath,
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

describe('classifyChangedFiles', () => {
  it('class D for docs-only', () => {
    const s = classifyChangedFiles(['docs/a.md', '.ai/x.json']);
    assert.equal(s.class, 'D');
    assert.equal(s.node, false);
    assert.equal(s.unit, false);
    assert.equal(s.docker, false);
    assert.equal(s.workflow_security, false);
  });

  it('class C for src changes without docker', () => {
    const s = classifyChangedFiles(['src/app.ts']);
    assert.equal(s.class, 'C');
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
    assert.equal(s.docker, true);
    assert.equal(s.docker_image, true);
    assert.equal(s.audit, true);
  });

  it('class R for package.json', () => {
    const s = classifyChangedFiles(['package.json']);
    assert.equal(s.class, 'R');
    assert.equal(s.audit, true);
  });

  it('test-only narrows build/predeploy', () => {
    const s = classifyChangedFiles(['tests/unit/foo.test.ts']);
    assert.equal(s.class, 'C');
    assert.equal(s.unit, true);
    assert.equal(s.build, false);
    assert.equal(s.predeploy, false);
  });

  it('workflow change sets workflow_security', () => {
    const s = classifyChangedFiles(['.github/workflows/pr-governance.yml']);
    assert.equal(s.workflow_security, true);
    // pr-governance alone is not runtime deploy path → C
    assert.equal(s.class, 'C');
  });

  it('ci.yml is class R', () => {
    const s = classifyChangedFiles(['.github/workflows/ci.yml']);
    assert.equal(s.class, 'R');
  });

  it('forceFull yields full R', () => {
    const s = classifyChangedFiles([], { forceFull: true });
    assert.equal(s.class, 'R');
    assert.equal(s.docker_image, true);
    assert.equal(s.node, true);
  });

  it('mixed docs+src escalates to C', () => {
    const s = classifyChangedFiles(['docs/a.md', 'src/x.ts']);
    assert.equal(s.class, 'C');
    assert.equal(s.node, true);
  });
});
