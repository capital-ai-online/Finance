import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const CHECKOUT_ACTION_SHA = 'fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09';
const OLD_CHECKOUT_ACTION_SHA = '08c6903cd8c0fde910a37f88322edcfb5dd907a8';
const CODEQL_ACTION_SHA = 'b96794f015dfd88f77b49b1c93e0fa7110f94c63';

test('selective CodeQL is activation-safe while GitHub Default Setup is active', async () => {
  const workflow = await fs.readFile('.github/workflows/selective-codeql.yml', 'utf8');
  assert.match(workflow, /dynamic\/github-code-scanning\/codeql/);
  assert.match(workflow, /default_setup_active != 'true'/);
  assert.match(workflow, /scripts\/pr\/planPrValidation\.mjs/);
  assert.match(workflow, /github\.event\.pull_request\.base\.sha/);
  assert.match(workflow, /changed_files_json/);
  assert.match(workflow, /CHANGED_FILES_JSON:/);
  assert.doesNotMatch(workflow, /\bpull_request_target\s*:/);
  assert.equal(
    workflow.match(new RegExp(`actions/checkout@${CHECKOUT_ACTION_SHA}`, 'g'))?.length,
    2,
  );
  assert.doesNotMatch(workflow, new RegExp(OLD_CHECKOUT_ACTION_SHA));
  assert.match(workflow, new RegExp(`github/codeql-action/init@${CODEQL_ACTION_SHA}`));
  assert.match(workflow, new RegExp(`github/codeql-action/analyze@${CODEQL_ACTION_SHA}`));
});

test('selective Copilot review plans only after successful CI from trusted workflow_run', async () => {
  const workflow = await fs.readFile('.github/workflows/selective-copilot-code-review.yml', 'utf8');
  assert.match(workflow, /on:\s*# zizmor: ignore\[dangerous-triggers\]/);
  assert.match(workflow, /\bworkflow_run\s*:/);
  assert.match(workflow, /workflows:\s*\[CI\]/);
  assert.match(workflow, /workflow_run\.repository\.full_name == github\.repository/);
  assert.match(workflow, /workflow_run\.head_repository\.full_name == github\.repository/);
  assert.match(workflow, /workflow_run\.path == '\.github\/workflows\/ci\.yml'/);
  assert.match(workflow, /workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /copilot-pull-request-reviewer\[bot\]/);
  assert.match(workflow, /scripts\/pr\/planPrValidation\.mjs/);
  assert.match(workflow, /changed_files_json/);
  assert.match(workflow, /CHANGED_FILES_JSON:/);
  assert.match(workflow, /ref:\s*\$\{\{\s*steps\.pr\.outputs\.base_sha\s*\}\}/);
  assert.match(workflow, new RegExp(`actions/checkout@${CHECKOUT_ACTION_SHA}`));
  assert.doesNotMatch(workflow, new RegExp(OLD_CHECKOUT_ACTION_SHA));
  assert.doesNotMatch(workflow, /\bpull_request_target\s*:/);
  assert.doesNotMatch(workflow, /ref:\s*\$\{\{\s*steps\.pr\.outputs\.head_sha\s*\}\}/);
});

test('selective Copilot review separates read-only planning from write authority', async () => {
  const workflow = await fs.readFile('.github/workflows/selective-copilot-code-review.yml', 'utf8');
  const planStart = workflow.indexOf('  plan:');
  const requestStart = workflow.indexOf('  request-review:');

  assert.ok(planStart >= 0, 'plan job missing');
  assert.ok(requestStart > planStart, 'request-review job missing or precedes plan');
  assert.match(workflow, /permissions:\s*\{\}/);

  const plan = workflow.slice(planStart, requestStart);
  const request = workflow.slice(requestStart);

  assert.match(plan, /contents:\s*read/);
  assert.match(plan, /pull-requests:\s*read/);
  assert.doesNotMatch(plan, /pull-requests:\s*write/);
  assert.match(plan, /scripts\/pr\/planPrValidation\.mjs/);
  assert.match(plan, /actions\/checkout@/);

  assert.match(request, /needs:\s*\[plan\]/);
  assert.match(request, /pull-requests:\s*write/);
  assert.doesNotMatch(request, /contents:\s*write/);
  assert.doesNotMatch(request, /scripts\/pr\/planPrValidation\.mjs/);
  assert.doesNotMatch(request, /actions\/checkout@/);
  assert.doesNotMatch(workflow, /permissions:\s*write-all/);
});
