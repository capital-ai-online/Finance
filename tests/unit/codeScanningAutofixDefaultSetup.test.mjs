import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

const candidateRef = 'refs/heads/agent/security-codeql-autofix-alert-42-20260915';
const candidateSha = 'c'.repeat(40);
const baseSha = 'b'.repeat(40);

async function runVerifier(instances) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeql-candidate-evidence-'));
  const alertPath = path.join(dir, 'alert.json');
  const instancesPath = path.join(dir, 'instances.json');
  const outputPath = path.join(dir, 'output.txt');
  await fs.writeFile(alertPath, JSON.stringify({ number: 42, tool: { name: 'CodeQL' } }));
  await fs.writeFile(instancesPath, JSON.stringify(instances));
  await fs.writeFile(outputPath, '');

  const result = spawnSync(process.execPath, ['scripts/security/verifyControlledAutofixCodeqlProvider.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CANDIDATE_REF: candidateRef,
      CANDIDATE_SHA: candidateSha,
      BASE_SHA: baseSha,
      ALERT_NUMBER: '42',
      CODEQL_ALERT_JSON: alertPath,
      CODEQL_INSTANCES_JSON: instancesPath,
      GITHUB_OUTPUT: outputPath,
    },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const entries = Object.fromEntries((await fs.readFile(outputPath, 'utf8')).trim().split('\n').filter(Boolean)
    .map((line) => line.split(/=(.*)/s).slice(0, 2)));
  return entries;
}

test('controlled autofix uses canonical provider evidence instead of advanced CodeQL setup', async () => {
  const workflow = await fs.readFile('.github/workflows/code-scanning-controlled-autofix.yml', 'utf8');
  assert.doesNotMatch(workflow, /github\/codeql-action\/(?:init|analyze)@/);
  assert.match(workflow, /verifyControlledAutofixCodeqlProvider\.mjs/);
  assert.match(workflow, /code-scanning\/alerts\/\$\{ALERT_NUMBER\}\/instances/);
  assert.match(workflow, /-f "ref=\$\{CANDIDATE_REF\}"/);
  assert.match(workflow, /CANDIDATE_REF: refs\/heads\/\$\{\{ needs\.generate\.outputs\.branch \}\}/);
  assert.match(workflow, /CANDIDATE_SHA: \$\{\{ needs\.generate\.outputs\.commit_sha \}\}/);
  assert.match(workflow, /BASE_SHA: \$\{\{ needs\.generate\.outputs\.base_sha \}\}/);
  assert.match(workflow, /codeql_status != 'PASS'/);
  assert.match(workflow, /Provider-CodeQL-Gate fail-closed/);
});

test('provider verifier binds authority to exact candidate ref and SHA while base SHA is provenance only', async () => {
  const verifier = await fs.readFile('scripts/security/verifyControlledAutofixCodeqlProvider.mjs', 'utf8');
  assert.match(verifier, /process\.env\.CANDIDATE_REF/);
  assert.match(verifier, /process\.env\.CANDIDATE_SHA/);
  assert.match(verifier, /process\.env\.BASE_SHA/);
  assert.match(verifier, /instance\?\.ref/);
  assert.match(verifier, /instance\?\.commit_sha/);
  assert.doesNotMatch(verifier, /most_recent_instance/);
  assert.doesNotMatch(verifier, /commitSha\s*!==\s*baseSha/);
  assert.doesNotMatch(verifier, /provider-evidence-not-exact-base-sha/);
  assert.doesNotMatch(verifier, /Authorization|Bearer|GH_TOKEN|security-events:\s*write/i);
});

test('missing exact candidate analysis is reproducibly NOT_PROVEN', async () => {
  const result = await runVerifier([{ ref: candidateRef, commit_sha: 'd'.repeat(40), state: 'fixed' }]);
  assert.equal(result.codeql_status, 'NOT_PROVEN');
  assert.equal(result.codeql_reason, 'provider-analysis-missing-for-exact-candidate');
});

test('open exact candidate analysis remains NOT_PROVEN', async () => {
  const result = await runVerifier([{ ref: candidateRef, commit_sha: candidateSha, state: 'open' }]);
  assert.equal(result.codeql_status, 'NOT_PROVEN');
  assert.equal(result.codeql_reason, 'provider-alert-still-open-on-exact-candidate');
});

test('fixed exact candidate analysis is the only PASS path', async () => {
  const result = await runVerifier([{ ref: candidateRef, commit_sha: candidateSha, state: 'fixed' }]);
  assert.equal(result.codeql_status, 'PASS');
  assert.equal(result.codeql_reason, 'provider-alert-fixed-on-exact-candidate');
});
