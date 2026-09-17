import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseTargets,
  repairProjectionText,
  repairCurrentStateProjectionBaselines,
} from './repairCurrentStateProjectionBaselines.mjs';

const MAIN_SHA = 'a'.repeat(40);

test('replaces a stale recognized Baseline field with exact current main', () => {
  const before = `# Roadmap\n\n**Baseline:** \`main@${'b'.repeat(40)}\`\n\nBody\n`;
  const after = repairProjectionText(before, MAIN_SHA);
  assert.match(after, new RegExp(`\\*\\*Baseline:\\*\\* \\`main@${MAIN_SHA}\\``));
  assert.equal(after.includes('b'.repeat(40)), false);
});

test('inserts a recognized Baseline field when missing', () => {
  const after = repairProjectionText('# Roadmap\n\nBody\n', MAIN_SHA);
  assert.match(after, new RegExp(`\\*\\*Baseline:\\*\\* \\`main@${MAIN_SHA}\\``));
  assert.match(after, /^# Roadmap\n\n\*\*Baseline:/);
});

test('preserves an existing recognized alternative baseline label', () => {
  const before = `# Roadmap\n\n**Correlation baseline:** \`main@${'c'.repeat(40)}\`\n`;
  const after = repairProjectionText(before, MAIN_SHA);
  assert.match(after, new RegExp(`\\*\\*Correlation baseline:\\*\\* \\`main@${MAIN_SHA}\\``));
});

test('accepts only project ROADMAP/TASK_REGISTER targets', () => {
  assert.deepEqual(parseTargets('["docs/projects/fintech/ROADMAP.md","docs/projects/fintech/TASK_REGISTER.md"]'), [
    'docs/projects/fintech/ROADMAP.md',
    'docs/projects/fintech/TASK_REGISTER.md',
  ]);
  assert.throws(() => parseTargets('["AGENTS.md"]'), /outside exact current-state projection scope/);
  assert.throws(() => parseTargets('["docs/governance/ROADMAP.md"]'), /outside exact current-state projection scope/);
});

test('repairs only requested regular files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-autofix-'));
  const target = 'docs/projects/governance/ROADMAP.md';
  const absolute = path.join(root, target);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, '# Governance\n\nNo baseline yet.\n', 'utf8');
  const changed = repairCurrentStateProjectionBaselines({
    worktree: root,
    targets: [target],
    expectedMainSha: MAIN_SHA,
  });
  assert.deepEqual(changed, [target]);
  assert.match(fs.readFileSync(absolute, 'utf8'), new RegExp(`main@${MAIN_SHA}`));
});
