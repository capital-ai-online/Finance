import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

test('writes bounded non-sensitive controlled-autofix evidence', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'autofix-evidence-'));
  const target = path.join(dir, 'decision.json');
  const result = spawnSync(process.execPath, ['scripts/security/writeCodeScanningAutofixEvidence.mjs', target], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      GITHUB_RUN_ID: '123',
      GITHUB_RUN_ATTEMPT: '1',
      GITHUB_REPOSITORY: 'capital-ai-online/Finance',
      GITHUB_EVENT_NAME: 'workflow_dispatch',
      GITHUB_REF: 'refs/heads/main',
      GITHUB_SHA: 'a'.repeat(40),
      CANDIDATE_CREATED: 'false',
      CANDIDATE_SAFE: 'false',
      ALERT_NUMBER: '',
      BASE_SHA: '',
      BRANCH: '',
      COMMIT_SHA: '',
      LANGUAGES: '',
      DECISION: 'NO_ELIGIBLE_ALERT',
      REASON: 'no-open-high-critical-codeql-alert-on-main',
    },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(await fs.readFile(target, 'utf8'));
  assert.equal(parsed.decision, 'NO_ELIGIBLE_ALERT');
  assert.equal(parsed.candidate.created, false);
  assert.equal(parsed.candidate.alert_number, null);
  assert.deepEqual(parsed.candidate.languages, []);
  assert.equal('token' in parsed, false);
});
