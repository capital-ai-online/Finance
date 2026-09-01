import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isInactiveLongEnough,
  isMergedComparisonStatus,
  isProtectedName,
} from '../governance/cleanupMergedBranches.mjs';

test('protected branch names and prefixes fail closed', () => {
  for (const name of ['main', 'master', 'develop', 'development', 'staging', 'production', 'release/1.0', 'hotfix/security', 'protected/baseline']) {
    assert.equal(isProtectedName(name), true, name);
  }
  assert.equal(isProtectedName('agent/merged-feature'), false);
});

test('inactivity window uses commit timestamp and rejects invalid timestamps', () => {
  const now = new Date('2026-09-01T02:00:00Z');
  assert.equal(isInactiveLongEnough('2026-09-01T01:00:00Z', now, 60), true);
  assert.equal(isInactiveLongEnough('2026-09-01T00:59:59Z', now, 60), true);
  assert.equal(isInactiveLongEnough('2026-09-01T01:00:01Z', now, 60), false);
  assert.equal(isInactiveLongEnough('invalid', now, 60), false);
});

test('only ancestry statuses proving branch tip is contained in main are accepted', () => {
  assert.equal(isMergedComparisonStatus('ahead'), true);
  assert.equal(isMergedComparisonStatus('identical'), true);
  assert.equal(isMergedComparisonStatus('behind'), false);
  assert.equal(isMergedComparisonStatus('diverged'), false);
});
