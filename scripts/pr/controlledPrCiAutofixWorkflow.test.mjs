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

test('keeps patch generation and candidate execution out of the write-capable job', async () => {
  const yaml = await workflow();
  const apply = jobSection(yaml, 'apply-and-push');
  assert.match(apply, /contents: write/);
  assert.match(apply, /git -C work write-tree/);
  assert.match(apply, /current main drift/);
  assert.match(apply, /push origin "HEAD:refs\/heads\/\$HEAD_REF"/);
  assert.doesNotMatch(apply, /--force(?:-with-lease)?/);
  assert.doesNotMatch(apply, /\bnpm (?:ci|test|run)\b/);
  assert.doesNotMatch(apply, /\bnpx\b/);
  assert.doesNotMatch(apply, /copilot\s+-p/);
});

test('keeps Copilot provider execution explicitly cost-gated and non-writing', async () => {
  const yaml = await workflow();
  const copilot = jobSection(yaml, 'copilot-patch', 'bind-tree');
  assert.match(copilot, /CAPITAL_AI_CI_AUTOFIX_COPILOT_ENABLED == 'true'/);
  assert.match(copilot, /copilot-requests: write/);
  assert.match(copilot, /contents: read/);
  assert.doesNotMatch(copilot, /contents: write/);
  assert.match(copilot, /@github\/copilot@1\.0\.83/);
  assert.match(copilot, /--available-tools='view,grep,glob,edit'/);
  assert.match(copilot, /--deny-tool='shell'/);
  assert.match(copilot, /--deny-tool='url'/);
  assert.match(copilot, /--deny-tool='memory'/);
  assert.match(copilot, /never modify tests or assertions/);
});

test('binds the exact patch tree in a clean job separate from candidate-code validation', async () => {
  const yaml = await workflow();
  const bind = jobSection(yaml, 'bind-tree', 'validate');
  const validate = jobSection(yaml, 'validate', 'apply-and-push');
  const apply = jobSection(yaml, 'apply-and-push');
  assert.match(bind, /verifyPrCiAutofixPatch\.mjs/);
  assert.match(bind, /git -C work write-tree/);
  assert.doesNotMatch(bind, /\bnpm (?:ci|test|run)\b/);
  assert.match(validate, /verifyPrCiAutofixPatch\.mjs/);
  assert.match(validate, /ACTIONS_RUNTIME_TOKEN/);
  assert.doesNotMatch(validate, /cache:\s*npm/);
  assert.match(apply, /verifyPrCiAutofixPatch\.mjs/);
  assert.match(apply, /EXPECTED_VALIDATED_TREE/);
  assert.match(apply, /observed_tree/);
});

test('pins every third-party action to a full immutable commit SHA', async () => {
  const yaml = await workflow();
  const uses = [...yaml.matchAll(/^\s*uses:\s*([^\s#]+).*$/gm)].map((match) => match[1]);
  assert.ok(uses.length > 0);
  for (const action of uses) {
    if (action.startsWith('./') || action.startsWith('docker://')) continue;
    assert.match(action, /@[0-9a-f]{40}$/i, action);
  }
});

test('never fabricates the required build-and-test result or merge authority', async () => {
  const yaml = await workflow();
  assert.doesNotMatch(yaml, /checks\.create/);
  assert.doesNotMatch(yaml, /statuses\.create/);
  assert.doesNotMatch(yaml, /gh\s+pr\s+merge/);
  assert.doesNotMatch(yaml, /auto-merge/);
  assert.match(yaml, /no synthetic `build-and-test` PASS was created/);
});
