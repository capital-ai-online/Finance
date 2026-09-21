import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const fastWorkflowPath = '.github/workflows/oss-quality-assurance.yml';
const deepWorkflowPath = '.github/workflows/oss-quality-deep-assurance.yml';
const fast = fs.readFileSync(fastWorkflowPath, 'utf8');
const deep = fs.readFileSync(deepWorkflowPath, 'utf8');

test('PR OSS quality stays exact-head, read-only and never pull_request_target', () => {
  assert.match(fast, /pull_request:\n/);
  assert.doesNotMatch(fast, /pull_request_target/);
  assert.match(fast, /permissions:\s*\{\}/);
  assert.match(fast, /permissions:\n\s+contents: read/);
  assert.doesNotMatch(fast, /contents:\s*write/);
  assert.doesNotMatch(fast, /actions:\s*write/);
  assert.doesNotMatch(fast, /checks:\s*write/);
  assert.doesNotMatch(fast, /id-token:\s*write/);
  assert.match(fast, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(fast, /persist-credentials: false/);
  assert.match(fast, /OSS_QUALITY_PROFILE: PR_FAST/);
});

test('PR OSS quality keeps only blocking secret and dependency regression tools', () => {
  assert.match(fast, /GITLEAKS_VERSION: '8\.30\.1'/);
  assert.match(fast, /551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb/);
  assert.match(fast, /google\/osv-scanner-action\/osv-scanner-action@7f58dd6750d78fc29a900ba64b1a0f946f62fba4/);
  assert.match(fast, /OSV_SCANNER_VERSION: '2\.6\.0'/);
  assert.match(fast, /New Gitleaks findings/);
  assert.match(fast, /New OSV dependency vulnerabilities/);
  assert.doesNotMatch(fast, /vitest run/);
  assert.doesNotMatch(fast, /KNIP_VERSION/);
  assert.doesNotMatch(fast, /JSCPD_VERSION/);
  assert.doesNotMatch(fast, /npm ci/);
  assert.doesNotMatch(fast, /repository:quality:snapshot/);
  assert.match(fast, /timeout-minutes: 5/);
});

test('daily deep assurance owns full coverage and advisory maintainability evidence', () => {
  assert.match(deep, /schedule:\n\s+- cron: '17 2 \* \* \*'/);
  assert.match(deep, /workflow_dispatch: \{\}/);
  assert.match(deep, /OSS_QUALITY_PROFILE: DEEP_BASELINE/);
  assert.match(deep, /VITEST_VERSION: '4\.1\.11'/);
  assert.match(deep, /@vitest\/coverage-v8@\$\{VITEST_VERSION\}/);
  assert.match(deep, /KNIP_VERSION: '6\.31\.0'/);
  assert.match(deep, /JSCPD_VERSION: '5\.0\.12'/);
  assert.match(deep, /npm run repository:quality:snapshot/);
  assert.match(deep, /Quality Center did not consume real coverage evidence/);
  assert.doesNotMatch(deep, /pull_request_target/);
  assert.doesNotMatch(deep, /contents:\s*write/);
  assert.doesNotMatch(deep, /id-token:\s*write/);
});

test('both lanes normalize through one explicit profile-aware finding contract', () => {
  assert.match(fast, /scripts\/quality\/normalizeOssQualityFindings\.ts/);
  assert.match(deep, /scripts\/quality\/normalizeOssQualityFindings\.ts/);
  assert.match(fast, /NOT_APPLICABLE/);
  assert.match(deep, /NOT_APPLICABLE/);
  assert.doesNotMatch(fast + deep, /deploy-production/);
  assert.doesNotMatch(fast + deep, /RENDER_DEPLOY_HOOK_URL/);
});
