#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

export const SIGNATURE = 'PR_GOVERNANCE_READY_EVENT_CONTRACT_V1';
export const TARGET_PATH = 'tests/unit/prReadyForReviewPipelineGate.test.ts';

const STALE_BLOCK = [
  "  it('runs governance only for non-draft pull requests including ready_for_review', () => {",
  "    const yaml = read('.github/workflows/pr-governance.yml');",
  "    expect(yaml).toContain('types: [opened, reopened, synchronize, ready_for_review, edited]');",
  "    expect(jobBlock(yaml, 'governance')).toContain(",
  "      \"if: github.event_name == 'pull_request' && github.event.pull_request.draft == false\",",
  '    );',
  '  });',
].join('\n');

const CURRENT_BLOCK = [
  "  it('runs governance for code-snapshot lifecycle events without body-only edited retriggers', () => {",
  "    const yaml = read('.github/workflows/pr-governance.yml');",
  "    expect(yaml).toContain('types: [opened, reopened, synchronize, ready_for_review]');",
  "    expect(yaml).not.toMatch(/types: \\[[^\\]]*\\bedited\\b[^\\]]*\\]/);",
  "    expect(yaml).toContain(\"format('pr-governance-pr-{0}-{1}-{2}'\");",
  "    expect(yaml).not.toContain('github.event.action)');",
  "    expect(jobBlock(yaml, 'governance')).toContain(",
  "      \"if: github.event_name == 'pull_request' && github.event.pull_request.draft == false\",",
  '    );',
  '  });',
].join('\n');

export async function repairPrAutofix({ worktree, signature }) {
  if (signature !== SIGNATURE) {
    throw new Error(`Unsupported PR Governance Ready-Event repair signature: ${signature}`);
  }

  const file = path.join(worktree, TARGET_PATH);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()) {
    throw new Error(`Expected regular target file is missing or unsafe: ${TARGET_PATH}`);
  }

  const before = fs.readFileSync(file, 'utf8');
  const occurrences = before.split(STALE_BLOCK).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Expected exactly one historical Ready-Event stale block; found ${occurrences}. Refusing semantic guess.`);
  }
  if (before.includes(CURRENT_BLOCK)) {
    throw new Error('Current Ready-Event invariant is already present; refusing duplicate repair.');
  }

  const after = before.replace(STALE_BLOCK, CURRENT_BLOCK);
  if (after === before) throw new Error('Ready-Event repair produced no change.');
  if (after.includes('ready_for_review, edited')) {
    throw new Error('Ready-Event repair did not remove the stale edited trigger expectation.');
  }
  if (!after.includes("format('pr-governance-pr-{0}-{1}-{2}'") || after.includes('github.event.action)')) {
    throw new Error('Ready-Event repair did not preserve the exact snapshot-concurrency invariant.');
  }

  fs.writeFileSync(file, after, 'utf8');
}
