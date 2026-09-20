import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  selectRegisteredRepairer,
  validateRegisteredRepairDiff,
} from './applyRegisteredPrAutofix.mjs';

const REGISTRY = Object.freeze([
  Object.freeze({
    id: 'EXPECTATION_SAMPLE_V1',
    owner: 'CAPITAL-AI-OPS',
    sourceWorkflow: '.github/workflows/ci.yml',
    exactSignatures: Object.freeze(['EXPECTATION_SAMPLE_V1']),
    repairerPath: 'scripts/pr/repairers/expectationSampleV1.mjs',
    allowedPaths: Object.freeze(['tests/unit/sample.test.ts']),
    evidenceBinding: Object.freeze({
      kind: 'EXACT_LOG_TOKENS_V1',
      requiredTokens: Object.freeze([
        'tests/unit/sample.test.ts',
        'expected 2 to equal 3',
      ]),
    }),
  }),
]);

test('selects only the exact registered id, workflow and signature tuple', () => {
  const entry = selectRegisteredRepairer({
    repairerId: 'EXPECTATION_SAMPLE_V1',
    sourceWorkflow: '.github/workflows/ci.yml',
    signature: 'EXPECTATION_SAMPLE_V1',
  }, REGISTRY);
  assert.equal(entry.id, 'EXPECTATION_SAMPLE_V1');

  assert.throws(() => selectRegisteredRepairer({
    repairerId: 'EXPECTATION_SAMPLE_V1',
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    signature: 'EXPECTATION_SAMPLE_V1',
  }, REGISTRY), /not registered/);
});

test('repair diff validation rejects path expansion and symlink targets', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-autofix-diff-'));
  try {
    fs.mkdirSync(path.join(root, 'tests/unit'), { recursive: true });
    fs.writeFileSync(path.join(root, 'tests/unit/sample.test.ts'), 'ok\n');

    assert.deepEqual(validateRegisteredRepairDiff({
      worktree: root,
      allowedPaths: ['tests/unit/sample.test.ts'],
      changedPaths: ['tests/unit/sample.test.ts'],
    }), ['tests/unit/sample.test.ts']);

    assert.throws(() => validateRegisteredRepairDiff({
      worktree: root,
      allowedPaths: ['tests/unit/sample.test.ts'],
      changedPaths: ['src/product.ts'],
    }), /exceeded its path allowlist/);

    fs.symlinkSync(path.join(root, 'tests/unit/sample.test.ts'), path.join(root, 'tests/unit/link.test.ts'));
    assert.throws(() => validateRegisteredRepairDiff({
      worktree: root,
      allowedPaths: ['tests/unit/link.test.ts'],
      changedPaths: ['tests/unit/link.test.ts'],
    }), /regular file/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
