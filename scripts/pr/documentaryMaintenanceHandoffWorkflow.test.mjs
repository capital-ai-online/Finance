import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

test('Documentary AUTO_SYNC uses exactly one trusted Draft-PR handoff', async () => {
  const workflow = await fs.readFile('.github/workflows/documentary-change-impact.yml', 'utf8');

  assert.equal(
    workflow.match(/uses:\s*\.\/\.github\/workflows\/open-agent-draft-pr\.yml/g)?.length,
    1,
  );
  assert.match(workflow, /trusted_handoff:\s*documentary-autosync/);
  assert.match(workflow, /needs\.autosync-branch\.outputs\.branch/);
  assert.match(workflow, /permissions:\s*\n\s+contents:\s*read\s*\n\s+issues:\s*write\s*\n\s+pull-requests:\s*write/);
  assert.doesNotMatch(workflow, /pull_request_target/);
});

test('AUTO_SYNC branch writer remains separated from PR and production authority', async () => {
  const workflow = await fs.readFile('.github/workflows/documentary-change-impact.yml', 'utf8');

  const branchJob = workflow.slice(
    workflow.indexOf('  autosync-branch:'),
    workflow.indexOf('  autosync-draft-pr:'),
  );

  assert.match(branchJob, /contents:\s*write/);
  assert.doesNotMatch(branchJob, /pull-requests:\s*write/);
  assert.doesNotMatch(branchJob, /id-token:\s*write|pull-requests:\s*write|gh\s+pr\s+create|render\s+deploy|deploy-production/i);
  assert.match(branchJob, /CURRENT_MAIN drift before AUTO_SYNC write/);
  assert.match(branchJob, /Maintenance handoff is not bound to this AUTO_SYNC source\/state/);
  assert.match(branchJob, /reviewRequiredPaths/);
});

test('reusable Draft-PR workflow accepts only trusted main-push Documentary AUTO_SYNC branches', async () => {
  const workflow = await fs.readFile('.github/workflows/open-agent-draft-pr.yml', 'utf8');

  assert.match(workflow, /workflow_call:/);
  assert.match(workflow, /trusted_handoff:/);
  assert.match(workflow, /inputs\.trusted_handoff == 'documentary-autosync'/);
  assert.match(workflow, /github\.event_name == 'push'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /agent\/documentary-autosync-\*/);
  assert.match(workflow, /gh pr create/);
  assert.doesNotMatch(workflow, /gh pr merge|auto-merge|deploy/i);
});

test('semantic maintenance stays fail-closed behind the existing authorization chain', async () => {
  const workflow = await fs.readFile('.github/workflows/documentary-change-impact.yml', 'utf8');

  assert.match(workflow, /SEMANTIC_AUTHORIZATION_REQUIRED/);
  assert.match(workflow, /Supervisor -> Platform Director APPROVED -> Agent IAM/);
  assert.match(workflow, /synthetic approval: \`FORBIDDEN\`/);
  assert.match(workflow, /scripts\/automation\/runDocumentaryMaintenanceControlLoop\.ts/);
});
