import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  SIGNATURE,
  TARGET_PATH,
  repairPrAutofix,
} from './prGovernanceReadyEventContractV1.mjs';

const STALE_BLOCK = [
  "  it('runs governance only for non-draft pull requests including ready_for_review', () => {",
  "    const yaml = read('.github/workflows/pr-governance.yml');",
  "    expect(yaml).toContain('types: [opened, reopened, synchronize, ready_for_review, edited]');",
  "    expect(jobBlock(yaml, 'governance')).toContain(",
  "      \"if: github.event_name == 'pull_request' && github.event.pull_request.draft == false\",",
  '    );',
  '  });',
].join('\n');

async function fixture(block = STALE_BLOCK) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'capital-ai-ready-event-'));
  const target = path.join(root, TARGET_PATH);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, [
    "describe('PR Draft -> Ready pipeline gate', () => {",
    block,
    '});',
    '',
  ].join('\n'));
  return { root, target };
}

test('converges only the historical Ready-Event stale assertion to the current invariant', async () => {
  const { root, target } = await fixture();
  await repairPrAutofix({ worktree: root, signature: SIGNATURE });
  const content = await fs.readFile(target, 'utf8');

  assert.match(content, /runs governance for code-snapshot lifecycle events without body-only edited retriggers/);
  assert.ok(content.includes('types: [opened, reopened, synchronize, ready_for_review]'));
  assert.ok(content.includes("expect(yaml).not.toMatch(/types: \\[[^\\]]*\\bedited\\b[^\\]]*\\]/);"));
  assert.ok(content.includes("format('pr-governance-pr-{0}-{1}-{2}'"));
  assert.ok(content.includes("expect(yaml).not.toContain('github.event.action)');"));
  assert.doesNotMatch(content, /ready_for_review, edited/);
});

test('second attempt is bounded and leaves the converged file unchanged', async () => {
  const { root, target } = await fixture();
  await repairPrAutofix({ worktree: root, signature: SIGNATURE });
  const converged = await fs.readFile(target, 'utf8');

  await assert.rejects(
    () => repairPrAutofix({ worktree: root, signature: SIGNATURE }),
    /Expected exactly one historical Ready-Event stale block; found 0/,
  );
  assert.equal(await fs.readFile(target, 'utf8'), converged);
});

test('fails closed for altered evidence or an unrelated signature', async () => {
  const altered = await fixture(
    STALE_BLOCK.replace('ready_for_review, edited', 'ready_for_review, labeled'),
  );
  await assert.rejects(
    () => repairPrAutofix({ worktree: altered.root, signature: SIGNATURE }),
    /Refusing semantic guess/,
  );

  const other = await fixture();
  await assert.rejects(
    () => repairPrAutofix({ worktree: other.root, signature: 'OTHER' }),
    /Unsupported PR Governance Ready-Event repair signature/,
  );
});
