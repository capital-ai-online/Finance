import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  parseProjectionYaml,
  validateProjectionContracts,
  validateProjectExecutionDirective,
} from './validateProjectExecutionDirective.mjs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('three-part projection parses as a deterministic nested contract', () => {
  const part3 = parseProjectionYaml(read('docs/projects/PROJECT_EXECUTION_DIRECTIVE_03_IDLE_PVC.yaml'));
  assert.equal(part3.status, 'NON_AUTHORIZING_PROJECTION');
  assert.equal(part3.pvc_review.count, 3);
  assert.deepEqual(part3.work_package_derivation.allowed_categories, [
    'verification',
    'maintenance',
    'remediation',
    'improvement',
  ]);
  assert.equal(part3.work_package_derivation.no_action_behavior.create_artificial_mutation, false);
});

test('projection contract fails closed when the idle PVC cardinality drifts', () => {
  const part1 = parseProjectionYaml(read('docs/projects/PROJECT_EXECUTION_DIRECTIVE_01_AUTHORITY.yaml'));
  const part2 = parseProjectionYaml(read('docs/projects/PROJECT_EXECUTION_DIRECTIVE_02_POST_MERGE.yaml'));
  const part3 = parseProjectionYaml(read('docs/projects/PROJECT_EXECUTION_DIRECTIVE_03_IDLE_PVC.yaml'));
  part3.pvc_review.count = 2;

  const findings = validateProjectionContracts({ part1, part2, part3 });
  assert.ok(findings.some((finding) => finding.code === 'IDLE_PVC_COUNT_INVALID'));
});

test('repository implementation is homogeneous and authority-safe', () => {
  const result = validateProjectExecutionDirective({ root: process.cwd() });
  assert.equal(result.ok, true, result.errors.map((finding) => `${finding.code}: ${finding.message}`).join('\n'));
  assert.equal(result.summary.directiveParts, 3);
  assert.equal(result.summary.idleReviewCount, 3);
  assert.equal(result.summary.mode, 'READ_ONLY_FAIL_CLOSED_VALIDATION');
});
