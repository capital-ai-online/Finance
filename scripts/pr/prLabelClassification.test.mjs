import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { classifyPrLabels } from './prLabelClassification.mjs';

test('consumes every attached label and classifies across dimensions', () => {
  const result = classifyPrLabels([
    { name: 'project:CAPITAL-AI-GOV', color: 'a1a1aa' },
    { name: 'priority:P1' },
    { name: 'security' },
    { name: 'feature' },
    { name: 'version:minor' },
    { name: 'workflow' },
    { name: 'agent:ChatGPT' },
    { name: 'component:pull-request' },
    { name: 'customer-visible-note' },
  ]);

  assert.equal(result.label_count, 9);
  assert.equal(result.all_labels.length, 9);
  assert.equal(result.effective.priority, 'P1');
  assert.equal(result.effective.version_impact, 'MINOR');
  assert.deepEqual(result.dimensions.risk_security, ['security']);
  assert.deepEqual(result.unmapped.map((label) => label.name), ['customer-visible-note']);
  assert.equal(result.state, 'PARTIAL_CLASSIFICATION');
  assert.equal(result.authority.labels_can_authorize_merge, false);
});

test('selects the strictest priority while exposing contradictory priority labels as drift', () => {
  const result = classifyPrLabels(['priority:P2', 'P0', 'docs']);
  assert.equal(result.effective.priority, 'P0');
  assert.equal(result.state, 'LABEL_DRIFT');
  assert.ok(result.drift.some((item) => item.code === 'PRIORITY_CONFLICT'));
});

test('selects the strictest version impact while preserving all version labels', () => {
  const result = classifyPrLabels(['version:patch', 'semver:major']);
  assert.equal(result.effective.version_impact, 'MAJOR');
  assert.equal(result.dimensions.version_impact.length, 2);
  assert.ok(result.drift.some((item) => item.code === 'VERSION_IMPACT_CONFLICT'));
});

test('blocked plus ready is fail-closed label drift and never merge authority', () => {
  const result = classifyPrLabels(['blocked', 'ready']);
  assert.equal(result.effective.blocked_by_label, true);
  assert.ok(result.drift.some((item) => item.code === 'STATUS_CONFLICT'));
  assert.equal(result.authority.merge_authority, 'HUMAN_OWNER_ONLY');
});

test('unknown labels are retained verbatim instead of dropped', () => {
  const result = classifyPrLabels([{ name: 'experimental-x', color: '123456', description: 'future taxonomy' }]);
  assert.equal(result.state, 'PARTIAL_CLASSIFICATION');
  assert.deepEqual(result.unmapped, [{ name: 'experimental-x', color: '123456', description: 'future taxonomy' }]);
  assert.equal(result.all_labels[0].name, 'experimental-x');
});

test('empty label set is explicit and non-authorizing', () => {
  const result = classifyPrLabels([]);
  assert.equal(result.state, 'NO_LABELS');
  assert.equal(result.label_count, 0);
  assert.equal(result.coverage.mapped_ratio, 0);
  assert.equal(result.authority.labels_can_authorize_merge, false);
});

test('workflow evaluates the complete pull_request label payload read-only', () => {
  const workflow = fs.readFileSync(new URL('../../.github/workflows/pr-label-classification.yml', import.meta.url), 'utf8');
  for (const action of ['opened', 'reopened', 'synchronize', 'edited', 'labeled', 'unlabeled', 'ready_for_review', 'converted_to_draft']) {
    assert.ok(workflow.includes(action), 'missing pull_request action ' + action);
  }
  assert.match(workflow, /PR_LABELS_JSON:\s*\$\{\{\s*toJSON\(github\.event\.pull_request\.labels\)\s*\}\}/);
  assert.match(workflow, /node scripts\/pr\/prLabelClassification\.mjs --fail-on-drift/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /pull-requests:\s*read/);
  assert.doesNotMatch(workflow, /pull_request_target|contents:\s*write|pull-requests:\s*write|auto-merge|gh\s+pr\s+merge/i);
});
