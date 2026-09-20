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
    evidenceBinding: Object.freeze({
      kind: 'EXACT_LOG_TOKENS_V1',
      requiredTokens: Object.freeze([
        'tests/unit/sample.test.ts',
        'expected 2 to equal 3',
      ]),
    }),
  }),
]);

test('delegates v1.7 Decision/Evidence drift only to the live reconciler', () => {
  for (const logText of [
    'Error: PR #1173 enthält keinen gültigen automatisch ableitbaren Entscheidungsstatus der Vorlage v1.7.0.',
    'Error: PR #1173 fehlt kanonische Decision-Evidence: Required Checks.',
    'Error: PR #1173 behauptet Decision Status EVIDENCE_PENDING, aber die sichtbaren Gate-Zustände ergeben READY_FOR_HUMAN_DECISION. Decision Status darf nicht manuell von der Evidence abweichen.',
  ]) {
    const result = classifyPrAutofixFailure({
      sourceWorkflow: '.github/workflows/pr-governance.yml',
      logText,
      prMetadataShape: 'CURRENT_V17_CANONICAL',
    });
    assert.equal(result.classification, 'PR_DECISION_EVIDENCE_DRIFT');
    assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_DECISION_EVIDENCE);
    assert.equal(result.reason, 'decision-evidence-reconciler-owns-write');
    assert.equal(result.findingClass, 'REPOSITORY_PR_DECISION_EVIDENCE_DRIFT');
    assert.equal(result.actionId, 'RECONCILE_PR_DECISION_EVIDENCE');
  }
});

test('classifies the 45k Actions minute gate only from the explicit core.setFailed runtime record', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: [
      '2026-09-20T00:00:00Z ##[error]GitHub Actions Hard-Blocker aktiv: Issue #2001. Der monatliche Enterprise-Actions-Verbrauch hat 45.000 Minuten erreicht; kostenrelevante Required-Workflow-Arbeit wird fail-closed gestoppt.',
      '2026-09-20T00:00:00Z ##[error]Process completed with exit code 1.',
    ].join('\n'),
  });
  assert.equal(result.classification, 'PROTECTED_ACTIONS_MINUTE_COST_BLOCKER');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.BLOCKED_PROTECTED_ACTION);
  assert.equal(result.reason, 'protected-45k-actions-minute-blocker');
  assert.equal(result.findingClass, 'PROTECTED_GITHUB_ACTIONS_COST_BLOCKER');
  assert.equal(result.actionId, 'OBSERVE_ONLY');
});

test('does not treat the 45k guard source echoed in failed Governance logs as an active blocker', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: [
      'if (blockers.length === 1) {',
      '  core.setFailed(',
      '    `GitHub Actions Hard-Blocker aktiv: Issue #${blockers[0].number}. ` +',
      "    'Der monatliche Enterprise-Actions-Verbrauch hat 45.000 Minuten erreicht; ' +",
      "    'kostenrelevante Required-Workflow-Arbeit wird fail-closed gestoppt.',",
      '  );',
      '}',
      'Error: PR #1179 verwendet keinen unterstützten PR-Vorlagenmarker. Aktuell kanonisch ist v1.7.0; v1.6.0 und v1.5.0 bleiben nur für bereits offene PRs kompatibel.',
      '##[error]Process completed with exit code 1.',
    ].join('\n'),
    prMetadataShape: 'OTHER',
  });
  assert.equal(result.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
  assert.equal(result.reason, 'existing-pr-production-baseline-refresh-specialist-owns-write');
});

test('does not let echoed 45k guard source hide an unrelated CI failure', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: [
      'core.setFailed(`GitHub Actions Hard-Blocker aktiv: Issue #${blockers[0].number}. ` +',
      "  'Der monatliche Enterprise-Actions-Verbrauch hat 45.000 Minuten erreicht; ' +",
      "  'kostenrelevante Required-Workflow-Arbeit wird fail-closed gestoppt.');",
      'FAIL tests/unit/frontend1608AppearanceContract.test.ts > GOV-CHAT-079 16.08 appearance contract',
      'AssertionError: expected "Montserrat" to contain \'Poppins\'',
      '##[error]Process completed with exit code 1.',
    ].join('\n'),
  });
  assert.equal(result.classification, 'UNKNOWN_FAILURE');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.BLOCKED_UNKNOWN);
  assert.equal(result.reason, 'no-exact-allowlisted-failure-class');
});

test('delegates exact current-state baseline drift to the existing specialist', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: 'ERROR CURRENT_STATE_PROJECTION_BASELINE_STALE: docs/projects/operations/ROADMAP.md',
  });
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_CURRENT_STATE_BASELINE);
  assert.equal(result.findingClass, 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT');
  assert.equal(result.actionId, 'RECONCILE_REPOSITORY_PROJECTION');
});

test('delegates an exact stale production baseline before broad protected-provider vocabulary', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: [
      'const example = "supabase migration";',
      'Error: PR #1143 enthält eine veraltete oder inkonsistent korrelierte Produktions-Baseline. Erwartete aktuelle Baseline-ID: sha256:test.',
    ].join('\n'),
    prMetadataShape: 'CURRENT_V17_CANONICAL',
  });
  assert.equal(result.classification, 'PR_PRODUCTION_BASELINE_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
  assert.equal(result.reason, 'stale-production-baseline-specialist-owned');
});

test('delegates the exact observed v1.7 P0-HIGHEST priority drift only for canonical bodies', () => {
  const logText =
    'Error: PR #1147 enthält keine gültige Prioritätsbewertung (P0–P3) der Vorlage v1.7.0.';

  const allowed = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText,
    prMetadataShape: 'CURRENT_V17_CANONICAL',
  });
  assert.equal(allowed.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(allowed.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
  assert.equal(allowed.reason, 'current-v1.7-priority-token-repairable');

  const denied = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText,
    prMetadataShape: 'CURRENT_V17_OTHER',
  });
  assert.equal(denied.decision, PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN);
  assert.equal(denied.reason, 'current-v1.7-priority-drift-requires-canonical-shape');
});

test('delegates only the exact allowlisted v1.7 legacy baseline-section drift', () => {
  const logText = 'Error: PR #1142 muss in v1.7.0 exakt drei sichtbare Hauptabschnitte besitzen: ## 1. 🧭 Entscheidung, ## 2. ✅ Evidence, ## 3. 🔍 Technical Evidence';

  const allowed = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText,
    prMetadataShape: 'CURRENT_V17_LEGACY_BASELINE_SECTION',
  });
  assert.equal(allowed.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(allowed.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
  assert.equal(allowed.reason, 'current-v1.7-legacy-baseline-section-repairable');

  const denied = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText,
    prMetadataShape: 'CURRENT_V17_OTHER',
  });
  assert.equal(denied.decision, PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN);
  assert.equal(denied.reason, 'current-v1.7-structure-drift-not-allowlisted');
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
    logText: [
      'ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT: EXPECTATION_SAMPLE_V1',
      'tests/unit/sample.test.ts',
      'expected 2 to equal 3',
    ].join('\n'),
  }, REGISTERED);
  assert.equal(allowed.decision, PR_AUTOFIX_DECISIONS.REGISTERED_TEST_REPAIR);
  assert.equal(allowed.repairerId, 'EXPECTATION_SAMPLE_V1');
  assert.deepEqual(allowed.allowedPaths, ['tests/unit/sample.test.ts']);
  assert.equal(allowed.reason, 'exact-registered-evidence-bound-repairer');

  const evidenceMissing = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: 'ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT: EXPECTATION_SAMPLE_V1',
  }, REGISTERED);
  assert.equal(evidenceMissing.decision, PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN);
  assert.equal(evidenceMissing.reason, 'registered-repairer-evidence-not-proven');

  const denied = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: 'ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT: UNKNOWN_EXPECTATION',
  }, REGISTERED);
  assert.equal(denied.decision, PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN);
});

test('repeated same-signature autofix heads are blocked', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: [
      'ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT: EXPECTATION_SAMPLE_V1',
      'tests/unit/sample.test.ts',
      'expected 2 to equal 3',
    ].join('\n'),
    previousAutofixSignature: 'EXPECTATION_SAMPLE_V1',
  }, REGISTERED);
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.BLOCKED_REPEAT_AUTOFIX);
});

test('registers the exact stale Self-Healing next-slice assertion as an invariant repair', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: [
      'FAIL tests/unit/selfHealingSupersession.test.ts > self-healing supersession surfaces > releases merged SH-02 claims and advances the canonical work graph',
      "AssertionError: expected '# OPS-08-B-SH-02' to contain '**Next functional slice:** \`SH-02.6\`'",
    ].join('\n'),
  });
  assert.equal(result.classification, 'DETERMINISTIC_TEST_EXPECTATION_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.REGISTERED_TEST_REPAIR);
  assert.equal(result.failureSignature, 'SELF_HEALING_NEXT_SLICE_INVARIANT_V1');
  assert.equal(result.repairerId, 'SELF_HEALING_NEXT_SLICE_INVARIANT_V1');
  assert.deepEqual(result.allowedPaths, ['tests/unit/selfHealingSupersession.test.ts']);
  assert.equal(result.findingClass, 'REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT');
  assert.equal(result.actionId, 'RECONCILE_REPOSITORY_PROJECTION');
});

test('does not generalize unrelated assertion failures into a work-graph autofix', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: [
      'FAIL tests/unit/other.test.ts > unrelated test',
      "AssertionError: expected value to contain '**Next functional slice:** \`SH-02.6\`'",
    ].join('\n'),
  });
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.BLOCKED_UNKNOWN);
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

  const { evidenceBinding: _binding, ...withoutEvidenceBinding } = REGISTERED[0];
  assert.throws(() => validatePrAutofixRepairRegistry([
    withoutEvidenceBinding,
  ]), /evidenceBinding/);
});
