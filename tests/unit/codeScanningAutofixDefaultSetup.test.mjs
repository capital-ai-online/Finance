import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

test('controlled autofix uses canonical provider evidence instead of advanced CodeQL setup', async () => {
  const workflow = await fs.readFile('.github/workflows/code-scanning-controlled-autofix.yml', 'utf8');
  assert.doesNotMatch(workflow, /github\/codeql-action\/(?:init|analyze)@/);
  assert.match(workflow, /verifyControlledAutofixCodeqlProvider\.mjs/);
  assert.match(workflow, /codeql_status != 'PASS'/);
  assert.match(workflow, /Provider-CodeQL-Gate fail-closed/);
});

test('provider verifier requires exact base SHA and fails closed as NOT_PROVEN', async () => {
  const verifier = await fs.readFile('scripts/security/verifyControlledAutofixCodeqlProvider.mjs', 'utf8');
  assert.match(verifier, /commitSha !== baseSha/);
  assert.match(verifier, /provider-evidence-not-exact-base-sha/);
  assert.match(verifier, /provider-alert-still-open-on-exact-base/);
  assert.match(verifier, /provider-read-failed/);
  assert.doesNotMatch(verifier, /contents:\s*write|security-events:\s*write/i);
});
