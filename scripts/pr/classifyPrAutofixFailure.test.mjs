import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PR_AUTOFIX_DECISIONS,
  classifyPrAutofixFailure,
} from './classifyPrAutofixFailure.mjs';
import { validatePrAutofixRepairRegistry } from './prAutofixRepairRegistry.mjs';

const REGISTERED = Object.freeze([
  Object.freeze({
    id: 'EXPECTATION_SAMPLE_V1',
    owner: 'CAPITAL-AI-OPS',
    sourceWorkflow: '.github/workflows/ci.yml',
    exactSignatures: Object.freeze(['EXPECTATION_SAMPLE_V1']),
    repairerPath: 'scripts/pr/repairers/expectationSampleV1.mjs',
    allowedPaths: Object.freeze(['tests/unit/sample.test.ts']),
  }),
]);

test('delegates exact current-state baseline drift to the existing specialist', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: 'ERROR CURRENT_STATE_PROJECTION_BASELINE_STALE: docs/projects/operations/ROADMAP.md',
  });
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_CURRENT_STATE_BASELINE);
});

test('delegates repairable PR metadata drift to the existing baseline/template writer', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: PR #1 enthält nicht alle Pflichtabschnitte der kanonischen Vorlage: ## 4. 📌 Priorität & Roadmap',
    prMetadataShape: 'OTHER',
  });
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
});


test('delegates the exact PR #1123 missing-sections failure to the metadata specialist', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: [
      'Error: PR #1123 enthält nicht alle Pflichtabschnitte der kanonischen Vorlage:',
      '## 4. 📌 Priorität & Roadmap, ## 5. 🔢 Version & PR-Klasse, ## 6. ✅ Prüfung & Merge',
    ].join(' '),
    prMetadataShape: 'CURRENT_V16_GENERIC_MISSING_SECTIONS',
  });
  assert.equal(result.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
  assert.equal(result.reason, 'existing-pr-production-baseline-refresh-specialist-owns-write');
});

test('delegates the exact current v1.6 security-boundary shape but blocks semantic lookalikes', () => {
  const logText = [
    'Error: PR #1123 enthält nicht alle Pflichtabschnitte der kanonischen Vorlage:',
    '## 4. 📌 Priorität & Roadmap, ## 5. 🔢 Version & PR-Klasse, ## 6. ✅ Prüfung & Merge',
  ].join(' ');

  const exact = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText,
    prMetadataShape: 'CURRENT_V16_SECURITY_BOUNDARY_EXACT',
  });
  assert.equal(exact.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);

  const lookalike = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText,
    prMetadataShape: 'CURRENT_V16_SECURITY_BOUNDARY_LOOKALIKE',
  });
  assert.equal(lookalike.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(lookalike.decision, PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN);
  assert.equal(lookalike.reason, 'current-v1.6-security-boundary-lookalike-not-allowlisted');
});

test('missing-section delegation requires a controller-provided semantic body shape', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: PR #1 enthält nicht alle Pflichtabschnitte der kanonischen Vorlage: ## 4. 📌 Priorität & Roadmap',
  });
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN);
  assert.equal(result.reason, 'pr-metadata-shape-unavailable-or-unsupported');
});

test('delegates canonical Human/CODEOWNER merge-gate drift to the existing metadata writer', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: Der kanonische PR muss die Human-/CODEOWNER-Freigabe ausdrücklich beibehalten.',
  });
  assert.equal(result.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
});

test('delegates missing template marker drift to the deterministic metadata writer', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: PR #1 verwendet keinen unterstützten PR-Vorlagenmarker.',
  });
  assert.equal(result.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
});

test('security and protected-provider failures always fail closed', () => {
  const security = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: 'Error dependency security HIGH+CRITICAL CVE gate failed',
  });
  assert.equal(security.decision, PR_AUTOFIX_DECISIONS.BLOCKED_SECURITY_COMPLIANCE);

  const provider = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: 'Error: Render production deploy failed',
  });
  assert.equal(provider.decision, PR_AUTOFIX_DECISIONS.BLOCKED_PROTECTED_ACTION);
});

test('only an exact registered deterministic expectation signature becomes repairable', () => {
  validatePrAutofixRepairRegistry(REGISTERED);
  const allowed = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: 'ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT: EXPECTATION_SAMPLE_V1',
  }, REGISTERED);
  assert.equal(allowed.decision, PR_AUTOFIX_DECISIONS.REGISTERED_TEST_REPAIR);
  assert.equal(allowed.repairerId, 'EXPECTATION_SAMPLE_V1');
  assert.deepEqual(allowed.allowedPaths, ['tests/unit/sample.test.ts']);

  const denied = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: 'ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT: UNKNOWN_EXPECTATION',
  }, REGISTERED);
  assert.equal(denied.decision, PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN);
});

test('repeated same-signature autofix heads are blocked', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: 'ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT: EXPECTATION_SAMPLE_V1',
    previousAutofixSignature: 'EXPECTATION_SAMPLE_V1',
  }, REGISTERED);
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.BLOCKED_REPEAT_AUTOFIX);
});

test('ordinary unknown test failures remain blocked', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: 'AssertionError: expected 2 to equal 3',
  });
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.BLOCKED_UNKNOWN);
});

test('registry rejects duplicate signatures and foreign ownership', () => {
  assert.throws(() => validatePrAutofixRepairRegistry([
    ...REGISTERED,
    { ...REGISTERED[0], id: 'OTHER_REPAIRER' },
  ]), /Duplicate PR autofix exact signature/);

  assert.throws(() => validatePrAutofixRepairRegistry([
    { ...REGISTERED[0], owner: 'CAPITAL-AI-FE' },
  ]), /CAPITAL-AI-OPS/);
});
