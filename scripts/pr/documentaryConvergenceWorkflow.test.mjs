import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

test('WP-06E remains subordinate to SH-02 and emits evidence only', async () => {
  const workflow = await fs.readFile('.github/workflows/documentary-change-impact.yml', 'utf8');

  assert.match(workflow, /documentary:convergence:evidence/);
  assert.match(workflow, /Self-Healing parent: `OPS-08-B-SH-02`/);
  assert.match(workflow, /Evidence role: `EVIDENCE_PROJECTION_ONLY`/);
  assert.match(workflow, /does not create Finding\/Action\/Budget authority/);
});

test('WP-06E verifies an existing AUTO_SYNC branch exactly before idempotent reuse', async () => {
  const workflow = await fs.readFile('.github/workflows/documentary-change-impact.yml', 'utf8');

  assert.match(workflow, /group:\s*documentary-change-impact-main/);
  assert.match(workflow, /cancel-in-progress:\s*true/);
  assert.match(workflow, /Staler Documentary-Impact-Run/);
  assert.match(workflow, /CURRENT_MAIN drift before AUTO_SYNC write/);
  assert.match(workflow, /Existing AUTO_SYNC branch is not a single commit over exact source SHA/);
  assert.match(workflow, /compare\/\{basehead\}/);
  assert.match(workflow, /Existing AUTO_SYNC branch changed-file set does not match the fresh plan/);
  assert.match(workflow, /Existing AUTO_SYNC branch patch content mismatch/);
  assert.match(workflow, /Existing AUTO_SYNC branch claim mismatch against the fresh maintenance handoff/);
  assert.match(workflow, /verified idempotent reuse/);
  assert.match(workflow, /Branch collision: `IDEMPOTENT_REUSE_AFTER_EXACT_TREE_AND_CLAIM_VERIFICATION`/);
});
test('WP-06E keeps protected authority out of the Documentary workflow', async () => {
  const workflow = await fs.readFile('.github/workflows/documentary-change-impact.yml', 'utf8');

  assert.doesNotMatch(workflow, /selfHealingContract\.(register|authorize|execute)/);
  assert.doesNotMatch(workflow, /auto-merge|gh\s+pr\s+merge|id-token:\s*write/i);
  assert.match(workflow, /Supervisor -> Platform Director APPROVED -> Agent IAM/);
});


test('Documentary freshness uses authenticated GitHub API readback and local before-snapshot transport', async () => {
  const workflow = await fs.readFile('.github/workflows/documentary-change-impact.yml', 'utf8');

  assert.match(workflow, /Stalen Main-Run per GitHub-API verwerfen/);
  assert.match(workflow, /github\.rest\.repos\.getBranch/);
  assert.match(workflow, /Before-Snapshot ohne persistierte Zugangsdaten auschecken/);
  assert.match(workflow, /git fetch --no-tags before-snapshot/);
  assert.match(workflow, /rm -rf before-snapshot/);
  assert.doesNotMatch(workflow, /git fetch --no-tags origin main/);
  assert.doesNotMatch(workflow, /git fetch --no-tags origin "\$base"/);
});

test('Documentary reusable Draft-PR handoff exposes the permission ceiling required by the called workflow', async () => {
  const workflow = await fs.readFile('.github/workflows/documentary-change-impact.yml', 'utf8');
  const calledWorkflow = await fs.readFile('.github/workflows/open-agent-draft-pr.yml', 'utf8');

  assert.match(
    calledWorkflow,
    /converge-project-labels:[\s\S]*?permissions:[\s\S]*?issues:\s*write/,
  );
  assert.match(
    workflow,
    /autosync-draft-pr:[\s\S]*?permissions:\s*\n\s+contents:\s*read\s*\n\s+issues:\s*write\s*\n\s+pull-requests:\s*write[\s\S]*?uses:\s*\.\/\.github\/workflows\/open-agent-draft-pr\.yml/,
  );
});
