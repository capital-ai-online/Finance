import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const CODEQL_ACTION_SHA = 'b96794f015dfd88f77b49b1c93e0fa7110f94c63';

test('selective CodeQL is activation-safe while GitHub Default Setup is active', async () => {
  const workflow = await fs.readFile('.github/workflows/selective-codeql.yml', 'utf8');
  assert.match(workflow, /dynamic\/github-code-scanning\/codeql/);
  assert.match(workflow, /default_setup_active != 'true'/);
  assert.match(workflow, /scripts\/pr\/planPrValidation\.mjs/);
  assert.match(workflow, /github\.event\.pull_request\.base\.sha/);
  assert.doesNotMatch(workflow, /\bpull_request_target\s*:/);
  assert.match(workflow, new RegExp(`github/codeql-action/init@${CODEQL_ACTION_SHA}`));
  assert.match(workflow, new RegExp(`github/codeql-action/analyze@${CODEQL_ACTION_SHA}`));
});

test('selective Copilot review runs only after successful CI from trusted workflow_run', async () => {
  const workflow = await fs.readFile('.github/workflows/selective-copilot-code-review.yml', 'utf8');
  assert.match(workflow, /\bworkflow_run\s*:/);
  assert.match(workflow, /workflows:\s*\[CI\]/);
  assert.match(workflow, /workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /copilot-pull-request-reviewer\[bot\]/);
  assert.match(workflow, /scripts\/pr\/planPrValidation\.mjs/);
  assert.match(workflow, /ref:\s*\$\{\{\s*steps\.pr\.outputs\.base_sha\s*\}\}/);
  assert.doesNotMatch(workflow, /\bpull_request_target\s*:/);
  assert.doesNotMatch(workflow, /ref:\s*\$\{\{\s*steps\.pr\.outputs\.head_sha\s*\}\}/);
});

test('selective Copilot review keeps write permission scoped to pull requests only', async () => {
  const workflow = await fs.readFile('.github/workflows/selective-copilot-code-review.yml', 'utf8');
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /actions:\s*read/);
  assert.match(workflow, /pull-requests:\s*write/);
  assert.doesNotMatch(workflow, /permissions:\s*write-all/);
});
