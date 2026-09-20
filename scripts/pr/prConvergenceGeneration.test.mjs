import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PR_CONVERGENCE_GENERATION_SCHEMA,
  buildPrConvergenceGeneration,
  readControlPlaneVersion,
} from './prConvergenceGeneration.mjs';

const MAIN = 'a'.repeat(40);
const HEAD = 'b'.repeat(40);

function fixture(overrides = {}) {
  return {
    repository: 'capital-ai-online/Finance',
    prNumber: 1134,
    headSha: HEAD,
    baseSha: MAIN,
    currentMainSha: MAIN,
    controlPlaneVersion: '4.6.0',
    ...overrides,
  };
}

test('generation identity is deterministic and repository-normalized', () => {
  const first = buildPrConvergenceGeneration(fixture());
  const second = buildPrConvergenceGeneration(fixture({ repository: 'CAPITAL-AI-ONLINE/FINANCE' }));

  assert.equal(first.schemaVersion, PR_CONVERGENCE_GENERATION_SCHEMA);
  assert.equal(first.generationId, second.generationId);
  assert.match(first.generationId, /^sha256:[0-9a-f]{64}$/);
  assert.equal(first.writerLeaseKey, 'capital-ai-pr-writer-1134');
  assert.equal(first.repository, 'capital-ai-online/finance');
});

test('head movement creates a new generation', () => {
  const before = buildPrConvergenceGeneration(fixture());
  const after = buildPrConvergenceGeneration(fixture({ headSha: 'c'.repeat(40) }));
  assert.notEqual(before.generationId, after.generationId);
});

test('main movement fails closed until the PR base is re-correlated', () => {
  assert.throws(
    () => buildPrConvergenceGeneration(fixture({ currentMainSha: 'c'.repeat(40) })),
    /PR base\/current-main drift/,
  );
});

test('control-plane movement creates a new generation', () => {
  const before = buildPrConvergenceGeneration(fixture());
  const after = buildPrConvergenceGeneration(fixture({ controlPlaneVersion: '4.7.0' }));
  assert.notEqual(before.generationId, after.generationId);
});

test('AGENTS control-plane version is parsed exactly', () => {
  assert.equal(
    readControlPlaneVersion('# Trust Root\n\n**Control Plane Version:** `4.6.0`\n'),
    '4.6.0',
  );
  assert.throws(() => readControlPlaneVersion('**Control Plane Version:** latest'), /does not expose/);
});
