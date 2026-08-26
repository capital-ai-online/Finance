import test from 'node:test';
import assert from 'node:assert/strict';
import {
  claimScopesOverlap,
  computeProductionBaselineId,
  findClaimConflicts,
  gitSucceeds,
  globToRegExp,
  pathMatchesClaim,
  renderProductionBaselineBlock,
  validateClaimShape,
  validateProductionBaselineForPr,
} from './lib.mjs';

test('claimed globs match only intended repository paths', () => {
  assert.equal(globToRegExp('server/googleMarketing/**').test('server/googleMarketing/policy/gate.ts'), true);
  assert.equal(globToRegExp('server/googleMarketing/**').test('server/stripe.ts'), false);
  assert.equal(pathMatchesClaim('server/logger.ts', ['server/logger.ts']), true);
});

test('claim overlap is conservative for directory globs but not unrelated exact files', () => {
  assert.equal(claimScopesOverlap('server/**', 'server/logger.ts'), true);
  assert.equal(claimScopesOverlap('server/googleMarketing/**', 'server/googleMarketing/policy/**'), true);
  assert.equal(claimScopesOverlap('server/logger.ts', 'server/stripe.ts'), false);
});

test('claim metadata directory does not create false inter-agent conflicts', () => {
  assert.equal(claimScopesOverlap('.ai/work-claims/**', '.ai/work-claims/PR-123.json'), false);
});

test('conflict list identifies overlapping scopes', () => {
  assert.deepEqual(
    findClaimConflicts(['src/platform/Security/**'], ['src/platform/Security/authMiddleware.ts']),
    [{ current: 'src/platform/Security/**', other: 'src/platform/Security/authMiddleware.ts' }],
  );
});

test('work claim rejects repository-wide wildcard ownership', () => {
  const errors = validateClaimShape({
    schemaVersion: '1.0.0',
    claimId: 'test',
    status: 'active',
    exclusive: true,
    agent: { provider: 'test', model: 'test', executionSurface: 'test' },
    workItem: 'test',
    startedAt: new Date().toISOString(),
    baseBranch: 'main',
    baseSha: 'a'.repeat(40),
    claimedPaths: ['**'],
  }, '.ai/work-claims/test.json');

  assert.equal(errors.some((error) => error.includes('repository-wide wildcard')), true);
});

test('silent git commands report success independently of stdout', () => {
  assert.equal(gitSucceeds(['cat-file', '-e', 'HEAD^{commit}']), true);
  assert.equal(gitSucceeds(['cat-file', '-e', '0000000000000000000000000000000000000000^{commit}']), false);
});

function validBaseline() {
  const baseline = {
    schemaVersion: '1.2.0',
    generatedAt: new Date().toISOString(),
    productionUrl: 'https://capital-ai.online/',
    productionHealthUrl: 'https://capital-ai.online/healthz',
    bootstrap: false,
    production: {
      status: 'ok',
      version: '0.6.0',
      commitSha: '1'.repeat(40),
      branch: 'main',
      repoSlug: 'SvenKulessa/Finance',
      provider: 'render',
    },
    main: { sha: '2'.repeat(40) },
    head: { sha: '3'.repeat(40), version: '0.6.0' },
    drift: { productionToMainCommits: 4, mainToHeadCommits: 2 },
    checks: {
      productionHealthy: true,
      immutableProductionIdentity: true,
      productionBranchIsMain: true,
      productionIsAncestorOfMain: true,
      branchContainsCurrentMain: true,
    },
  };
  baseline.baselineId = computeProductionBaselineId(baseline);
  return baseline;
}

test('production baseline id atomically binds production, main, head and drift', () => {
  const baseline = validBaseline();
  assert.deepEqual(validateProductionBaselineForPr(baseline), []);

  const originalId = baseline.baselineId;
  baseline.head.sha = '4'.repeat(40);
  assert.notEqual(computeProductionBaselineId(baseline), originalId);
  assert.equal(
    validateProductionBaselineForPr(baseline).some((error) => error.includes('baselineId mismatch')),
    true,
  );
});

test('production website URL and health endpoint are distinct baseline identities', () => {
  const baseline = validBaseline();
  const originalId = baseline.baselineId;

  baseline.productionUrl = baseline.productionHealthUrl;
  assert.notEqual(computeProductionBaselineId(baseline), originalId);
  assert.equal(
    validateProductionBaselineForPr(baseline).some((error) => error.includes('productionUrl must be https://capital-ai.online/')),
    true,
  );

  const healthBaseline = validBaseline();
  healthBaseline.productionHealthUrl = healthBaseline.productionUrl;
  assert.equal(
    validateProductionBaselineForPr(healthBaseline).some((error) => error.includes('productionHealthUrl must be https://capital-ai.online/healthz')),
    true,
  );
});

test('production baseline block is rendered from one validated object without fallback values', () => {
  const baseline = validBaseline();
  const block = renderProductionBaselineBlock(baseline);

  assert.match(block, /Baseline-ID/);
  assert.match(block, new RegExp(baseline.baselineId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(block, /\*\*Produktions-URL:\*\* `https:\/\/capital-ai\.online\/`/);
  assert.match(block, /\*\*Produktions-Health-URL:\*\* `https:\/\/capital-ai\.online\/healthz`/);
  assert.match(block, new RegExp(baseline.production.commitSha));
  assert.match(block, new RegExp(baseline.main.sha));
  assert.match(block, new RegExp(baseline.head.sha));
  assert.doesNotMatch(block, /nicht-verfügbar|unbekannt|legacy-unavailable/);
});
