import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

test('trusted PR policy bundle includes local classifier/planner dependency', () => {
  const workflow = fs.readFileSync('.github/workflows/ci.yml', 'utf8');

  assert.match(
    workflow,
    /git show "\$PR_BASE_SHA:scripts\/pr\/classifyPrScope\.mjs" > "\$policy_dir\/classifyPrScope\.mjs"/,
  );
  assert.match(
    workflow,
    /git show "\$PR_BASE_SHA:scripts\/pr\/runtimeConsumedArtifacts\.mjs" > "\$policy_dir\/runtimeConsumedArtifacts\.mjs"/,
  );
  assert.match(
    workflow,
    /git show "\$PR_BASE_SHA:scripts\/pr\/planPrValidation\.mjs" > "\$policy_dir\/planPrValidation\.mjs"/,
  );
});
