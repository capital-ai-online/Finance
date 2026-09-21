import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflowPath = '.github/workflows/oss-quality-assurance.yml';
const workflow = fs.readFileSync(workflowPath, 'utf8');

test('OSS quality assurance is exact-head, read-only and never pull_request_target', () => {
  assert.match(workflow, /pull_request:\n/);
  assert.doesNotMatch(workflow, /pull_request_target/);
  assert.match(workflow, /permissions:\s*\{\}/);
  assert.match(workflow, /permissions:\n\s+contents: read/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /actions:\s*write/);
  assert.doesNotMatch(workflow, /checks:\s*write/);
  assert.doesNotMatch(workflow, /id-token:\s*write/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
});

test('OSS quality assurance pins every new quality tool version', () => {
  assert.match(workflow, /GITLEAKS_VERSION: '8\.30\.1'/);
  assert.match(workflow, /551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb/);
  assert.match(workflow, /google\/osv-scanner-action\/osv-scanner-action@7f58dd6750d78fc29a900ba64b1a0f946f62fba4/);
  assert.match(workflow, /OSV_SCANNER_VERSION: '2\.6\.0'/);
  assert.match(workflow, /KNIP_VERSION: '6\.31\.0'/);
  assert.match(workflow, /JSCPD_VERSION: '5\.0\.12'/);
  assert.match(workflow, /VITEST_VERSION: '4\.1\.11'/);
  assert.match(workflow, /@vitest\/coverage-v8@\$\{VITEST_VERSION\}/);
});

test('OSS quality assurance produces unified and existing Quality Center evidence', () => {
  assert.match(workflow, /artifacts\/oss-quality\/unified-findings\.json/);
  assert.match(workflow, /scripts\/quality\/normalizeOssQualityFindings\.ts/);
  assert.match(workflow, /npm run repository:quality:snapshot/);
  assert.match(workflow, /Quality Center did not consume real coverage evidence/);
  assert.match(workflow, /New Gitleaks findings/);
  assert.match(workflow, /New OSV dependency vulnerabilities/);
});

test('Knip and jscpd remain advisory while missing evidence fails closed', () => {
  assert.match(workflow, /sourceTool === 'knip' \|\| finding\.sourceTool === 'jscpd'/);
  assert.match(workflow, /Required OSS quality tool evidence unavailable/);
  assert.doesNotMatch(workflow, /deploy-production/);
  assert.doesNotMatch(workflow, /RENDER_DEPLOY_HOOK_URL/);
});
