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

test('uses the existing Codex GitHub integration without installing an agentic runtime or API key', async () => {
  const yaml = await workflow();
  assert.match(yaml, /@codex fix the CI failures/);
  assert.match(yaml, /needs\.plan\.outputs\.engine == 'codex-cloud'/);
  assert.match(yaml, /needs\.plan\.outputs\.failure_class == 'typescript'/);
  assert.doesNotMatch(yaml, /openai\/codex-action/);
  assert.doesNotMatch(yaml, /OPENAI_API_KEY/);
  assert.doesNotMatch(yaml, /@github\/copilot/);
  assert.doesNotMatch(yaml, /copilot-requests/);
  assert.doesNotMatch(yaml, /\bnpm install\b/);
});

test('keeps Codex handoff free of PR checkout, dependency execution and repository write permission', async () => {
  const yaml = await workflow();
  const codex = jobSection(yaml, 'codex-handoff', 'deterministic-patch');
  assert.match(codex, /issues: write/);
  assert.doesNotMatch(codex, /contents: write/);
  assert.doesNotMatch(codex, /actions\/checkout@/);
  assert.doesNotMatch(codex, /\bnpm (?:ci|install|test|run)\b/);
  assert.doesNotMatch(codex, /\bnpx\b/);
  assert.match(codex, /PR head drift/);
  assert.match(codex, /current main drift/);
  assert.match(codex, /CAPITAL_AI_CI_AUTOFIX_CODEX_ATTEMPT/);
  assert.match(codex, /no duplicate task created/);
});

test('keeps the deterministic write-capable job free of PR checkout and PR code execution', async () => {
  const yaml = await workflow();
  const apply = jobSection(yaml, 'apply-and-push');
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

test('binds deterministic patch, README blob and exact validated tree before privileged write', async () => {
  const yaml = await workflow();
  const validate = jobSection(yaml, 'validate', 'apply-and-push');
  const apply = jobSection(yaml, 'apply-and-push');
  assert.match(validate, /validated_tree/);
  assert.match(validate, /validated_blob/);
  assert.match(validate, /verifyPrCiAutofixPatch\.mjs/);
  assert.match(apply, /EXPECTED_PATCH_SHA/);
  assert.match(apply, /EXPECTED_VALIDATED_TREE/);
  assert.match(apply, /EXPECTED_VALIDATED_BLOB/);
  assert.match(apply, /current main drift/);
  assert.match(apply, /PR head drift/);
});

test('counts deterministic and Codex attempts under one two-attempt loop guard', async () => {
  const yaml = await workflow();
  const plan = jobSection(yaml, 'plan', 'codex-handoff');
  assert.match(plan, /deterministicAttempts/);
  assert.match(plan, /codexAttempts/);
  assert.match(plan, /const attempts = deterministicAttempts \+ codexAttempts/);
  assert.match(plan, /CAPITAL_AI_CI_AUTOFIX_CODEX_ATTEMPT/);
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
  assert.match(yaml, /No synthetic build-and-test result is created|No synthetic `build-and-test` PASS was created/);
});
