import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const workflowPath = '.github/workflows/controlled-pr-ci-autofix.yml';

async function workflow() {
  return fs.readFile(workflowPath, 'utf8');
}

function jobSection(yaml, jobName, nextJobName) {
  const start = yaml.indexOf(`  ${jobName}:\n`);
  assert.notEqual(start, -1, `${jobName} job missing`);
  const end = nextJobName ? yaml.indexOf(`  ${nextJobName}:\n`, start + 1) : yaml.length;
  return yaml.slice(start, end === -1 ? yaml.length : end);
}

test('runs only as a post-CI workflow_run controller and never uses pull_request_target', async () => {
  const yaml = await workflow();
  assert.match(yaml, /workflow_run:\s*\n\s+workflows: \[CI\]/);
  assert.match(yaml, /github\.event\.workflow_run\.conclusion == 'failure'/);
  assert.doesNotMatch(yaml, /pull_request_target\s*:/);
  assert.match(yaml, /^permissions: \{\}$/m);
});

test('contains no agentic provider execution or ad-hoc package installation', async () => {
  const yaml = await workflow();
  assert.doesNotMatch(yaml, /copilot-requests/);
  assert.doesNotMatch(yaml, /@github\/copilot/);
  assert.doesNotMatch(yaml, /\bnpm install\b/);
  assert.doesNotMatch(yaml, /CAPITAL_AI_CI_AUTOFIX_COPILOT_ENABLED/);
  assert.match(yaml, /productive fixer: `deterministic-readme` only/);
});

test('keeps the write-capable job free of PR checkout and PR code execution', async () => {
  const yaml = await workflow();
  const apply = jobSection(yaml, 'apply-and-push');
  assert.match(apply, /actions: write/);
  assert.match(apply, /contents: write/);
  assert.doesNotMatch(apply, /actions\/checkout@/);
  assert.doesNotMatch(apply, /\bnpm (?:ci|install|test|run)\b/);
  assert.doesNotMatch(apply, /\bnpx\b/);
  assert.doesNotMatch(apply, /git -C work/);
  assert.match(apply, /git\.createBlob/);
  assert.match(apply, /git\.createTree/);
  assert.match(apply, /git\.createCommit/);
  assert.match(apply, /git\.updateRef/);
  assert.match(apply, /force: false/);
});

test('binds patch, README blob and exact validated tree before privileged write', async () => {
  const yaml = await workflow();
  const validate = jobSection(yaml, 'validate', 'apply-and-push');
  const apply = jobSection(yaml, 'apply-and-push');
  assert.match(validate, /validated_tree/);
  assert.match(validate, /validated_blob/);
  assert.match(validate, /verifyPrCiAutofixPatch\.mjs/);
  assert.match(apply, /EXPECTED_PATCH_SHA/);
  assert.match(apply, /EXPECTED_VALIDATED_TREE/);
  assert.match(apply, /EXPECTED_VALIDATED_BLOB/);
  assert.match(apply, /CURRENT_MAIN moved before autofix write/);
  assert.match(apply, /compare\/\{basehead\}/);
  assert.match(apply, /PR head drift/);
});

test('pins every external action to a full immutable commit SHA', async () => {
  const yaml = await workflow();
  const uses = [...yaml.matchAll(/^\s*uses:\s*([^\s#]+).*$/gm)].map((match) => match[1]);
  assert.ok(uses.length > 0);
  for (const action of uses) {
    if (action.startsWith('./') || action.startsWith('docker://')) continue;
    assert.match(action, /@[0-9a-f]{40}$/i, action);
  }
});

test('never fabricates required CI or merge authority', async () => {
  const yaml = await workflow();
  assert.doesNotMatch(yaml, /checks\.create/);
  assert.doesNotMatch(yaml, /statuses\.create/);
  assert.doesNotMatch(yaml, /gh\s+pr\s+merge/);
  assert.doesNotMatch(yaml, /auto-merge/);
  assert.match(yaml, /no synthetic `build-and-test` PASS was created/);
});


test('serializes the privileged branch writer through the canonical per-PR lease', async () => {
  const yaml = await workflow();
  const apply = jobSection(yaml, 'apply-and-push');
  assert.match(apply, /group: capital-ai-pr-writer-\$\{\{ needs\.plan\.outputs\.pr_number \}\}/);
  assert.match(apply, /cancel-in-progress: false/);
});


test('stale CI fixes delegate to exact Update Branch before mutation and revalidate after the fix', async () => {
  const yaml = await workflow();
  const sync = jobSection(yaml, 'sync-before-fix', 'deterministic-patch');
  const apply = jobSection(yaml, 'apply-and-push');
  assert.match(yaml, /sync_required: \$\{\{ steps\.pr\.outputs\.sync_required \}\}/);
  assert.ok(yaml.includes("basehead: `${mainSha}...${pr.head.sha}`"));
  assert.match(sync, /workflow_id: 'sync-agent-pr-branches\.yml'/);
  assert.match(sync, /CURRENT_MAIN correlation dispatched before any CI autofix mutation/);
  assert.match(apply, /workflow_id: 'sync-agent-pr-branches\.yml'/);
  assert.match(apply, /workflow_id: 'ci\.yml'/);
  assert.match(apply, /expected_base_sha: postMain\.commit\.sha/);
});


test('exact CI workflow_dispatch revalidation can re-enter bounded autofix and is branch-bound', async () => {
  const yaml = await workflow();
  assert.match(yaml, /github\.event\.workflow_run\.event == 'workflow_dispatch'/);
  assert.match(yaml, /run\.event === 'workflow_dispatch'/);
  assert.match(yaml, /String\(run\.head_branch \|\| ''\) !== pr\.head\.ref/);
  assert.match(yaml, /github\.event\.workflow_run\.path == '\.github\/workflows\/ci\.yml'/);
});
