import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { detectCurrentStateProjectionBaselineFailures } from './detectCurrentStateProjectionBaselineFailures.mjs';

const EXPECTED = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const STALE = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-baseline-detect-'));
  for (const [relativePath, text] of Object.entries(files)) {
    const absolute = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, text, 'utf8');
  }
  return root;
}

test('reproduces exact stale current-state baseline from repository evidence', () => {
  const target = 'docs/projects/documentary/ROADMAP.md';
  const root = fixture({
    [target]: `# Documentary\n\n**Baseline:** \`main@${STALE}\`\n`,
  });
  const result = detectCurrentStateProjectionBaselineFailures({
    worktree: root,
    changedFiles: [target, 'src/other.ts'],
    expectedMainSha: EXPECTED,
  });
  assert.equal(result.eligible, true);
  assert.equal(result.reason, 'reproduced-current-state-baseline-drift');
  assert.deepEqual(result.targets, [target]);
  assert.equal(result.findings[0].code, 'CURRENT_STATE_PROJECTION_BASELINE_STALE');
});

test('reproduces exact missing baseline from repository evidence', () => {
  const target = 'docs/projects/operations/TASK_REGISTER.md';
  const root = fixture({ [target]: '# Operations\n' });
  const result = detectCurrentStateProjectionBaselineFailures({
    worktree: root,
    changedFiles: [target],
    expectedMainSha: EXPECTED,
  });
  assert.equal(result.eligible, true);
  assert.deepEqual(result.targets, [target]);
  assert.equal(result.findings[0].code, 'CURRENT_STATE_PROJECTION_BASELINE_MISSING');
});

test('does not repair current projections that already match CURRENT_MAIN', () => {
  const target = 'docs/projects/operations/ROADMAP.md';
  const root = fixture({
    [target]: `# Operations\n\n**Baseline:** \`main@${EXPECTED}\`\n`,
  });
  const result = detectCurrentStateProjectionBaselineFailures({
    worktree: root,
    changedFiles: [target],
    expectedMainSha: EXPECTED,
  });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, 'no-reproducible-current-state-baseline-drift');
  assert.deepEqual(result.targets, []);
});

test('ignores unrelated changed files and fails closed when candidate evidence is unavailable', () => {
  const root = fixture({ 'src/example.ts': 'export {}\n' });
  const unrelated = detectCurrentStateProjectionBaselineFailures({
    worktree: root,
    changedFiles: ['src/example.ts'],
    expectedMainSha: EXPECTED,
  });
  assert.equal(unrelated.eligible, false);
  assert.equal(unrelated.reason, 'no-current-state-projection-candidate');

  assert.throws(() => detectCurrentStateProjectionBaselineFailures({
    worktree: root,
    changedFiles: ['docs/projects/operations/ROADMAP.md'],
    expectedMainSha: EXPECTED,
  }), /EVIDENCE_UNAVAILABLE: candidate file is unavailable/);
});
