import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const WORKFLOW = '.github/workflows/oss-code-review.yml';

test('OSS code review is superseded and has no automatic trigger', async () => {
  const workflow = await fs.readFile(WORKFLOW, 'utf8');

  assert.match(workflow, /^name:\s*OSS Code Review \(SUPERSEDED\)$/m);
  assert.match(workflow, /\bon:\s*\n\s+workflow_dispatch\s*:/);
  assert.doesNotMatch(
    workflow,
    /^\s{0,2}(pull_request_target|pull_request|push|schedule|workflow_run|repository_dispatch|issue_comment|release|issues|check_run|check_suite|merge_group)\s*:/m,
  );
});

test('superseded OSS code review cannot allocate a runner', async () => {
  const workflow = await fs.readFile(WORKFLOW, 'utf8');

  assert.match(workflow, /^\s+if:\s*false\s*$/m);
  assert.match(workflow, /permissions:\s*\{\}/);
  assert.doesNotMatch(workflow, /pull-requests:\s*write/);
  assert.doesNotMatch(workflow, /models:\s*read/);
  assert.doesNotMatch(workflow, /^\s*-?\s*uses\s*:/m);
});

test('retired semantic review implementations cannot silently reactivate', async () => {
  const workflow = await fs.readFile(WORKFLOW, 'utf8');

  assert.doesNotMatch(workflow, /hustcer\/deepseek-review@/);
  assert.doesNotMatch(workflow, /deepseek\/DeepSeek-R1/);
  assert.doesNotMatch(workflow, /semgrep\s+scan/);
  assert.doesNotMatch(workflow, /reviewdog/);
  assert.doesNotMatch(workflow, /actions\/upload-artifact@/);
});
