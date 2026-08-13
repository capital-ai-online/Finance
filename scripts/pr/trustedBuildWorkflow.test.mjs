import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflowPath = new URL('../../.github/workflows/pr-build-and-test.yml', import.meta.url);
const workflow = fs.readFileSync(workflowPath, 'utf8');

test('trusted build keeps Human Evidence separate from PR preflight', () => {
  assert.match(workflow, /^  owner-evidence:\n/m);
  assert.match(workflow, /^  pr-preflight:\n/m);
  assert.match(workflow, /needs: \[owner-evidence\]/);
  assert.match(workflow, /needs: \[owner-evidence, pr-preflight\]/);
  assert.doesNotMatch(workflow, /git fetch --no-tags \.\.\/policy main:refs\/remotes\/origin\/main/);
});

test('PR-head reporter exposes precise phase results and the real Actions log URL', () => {
  assert.match(workflow, /Human-Evidence=\$\{HUMAN_RESULT\}; PR-Preflight=\$\{PREFLIGHT_RESULT\}; Build\/Test=\$\{BUILD_RESULT\}\./);
  assert.match(workflow, /details_url="\$run_url"/);
  assert.match(workflow, /Vollständige CMD-\/Step-Ausgaben und Job-Logs:/);
});
