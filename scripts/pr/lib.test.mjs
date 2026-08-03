import test from 'node:test';
import assert from 'node:assert/strict';
import {
  claimScopesOverlap,
  findClaimConflicts,
  globToRegExp,
  pathMatchesClaim,
  validateClaimShape,
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
  assert.equal(claimScopesOverlap('.github/workflows/a.yml', '.github/workflows/b.yml'), false);
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
