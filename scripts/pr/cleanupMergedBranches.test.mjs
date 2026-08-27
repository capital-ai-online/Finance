import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isMergedComparisonStatus,
  isOldEnough,
  isProtectedName,
} from '../governance/cleanupMergedBranches.mjs';

test('protected branch names and prefixes fail closed', () => {
  for (const name of ['main', 'master', 'develop', 'development', 'staging', 'production', 'release/1.0', 'hotfix/security', 'protected/baseline']) {
    assert.equal(isProtectedName(name), true, name);
  }
  assert.equal(isProtectedName('agent/merged-feature'), false);
});

test('grace period uses commit timestamp and rejects invalid timestamps', () => {
  const now = new Date('2026-08-27T20:00:00Z');
  assert.equal(isOldEnough('2026-08-13T19:59:59Z', now, 14), true);
  assert.equal(isOldEnough('2026-08-14T20:00:01Z', now, 14), false);
  assert.equal(isOldEnough('invalid', now, 14), false);
});

test('only ancestry statuses proving branch tip is contained in main are accepted', () => {
  assert.equal(isMergedComparisonStatus('ahead'), true);
  assert.equal(isMergedComparisonStatus('identical'), true);
  assert.equal(isMergedComparisonStatus('behind'), false);
  assert.equal(isMergedComparisonStatus('diverged'), false);
});
