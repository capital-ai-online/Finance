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

test('delegates v1.8 Decision/Evidence drift only to the live reconciler', () => {
  for (const logText of [
    'Error: PR #1173 enthält keinen gültigen automatisch ableitbaren Entscheidungsstatus der Vorlage v1.8.0.',
    'Error: PR #1173 fehlt kanonische Decision-Evidence: Required Checks.',
    'Error: PR #1173 behauptet Decision Status EVIDENCE_PENDING, aber die sichtbaren Gate-Zustände ergeben READY_FOR_HUMAN_DECISION. Decision Status darf nicht manuell von der Evidence abweichen.',
    'Error: PR #1173 enthält kein vollständiges proaktives Live Dashboard der Vorlage v1.8.0.',
    'Error: PR #1173 enthält ein vom kanonischen Evidence-Zustand abweichendes Live Dashboard. Dashboard-Projektionen dürfen ausschließlich vom Evidence → Decision Reconciler abgeleitet werden.',
    'Error: PR #1264 muss technische Traceability in v1.8.0 standardmäßig einklappen.',
    'Error: PR #1264 muss die maschinenlesbare Baseline in v1.8.0 standardmäßig einklappen.',
  ]) {
    const result = classifyPrAutofixFailure({
      sourceWorkflow: '.github/workflows/pr-governance.yml',
      logText,
      prMetadataShape: 'CURRENT_V18_CANONICAL',
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
      'Error: PR #1179 verwendet keinen unterstützten PR-Vorlagenmarker. Aktuell kanonisch ist v1.8.0; markerlose oder unbekannte Vorlagen sind nicht mergefähig.',
      '##[error]Process completed with exit code 1.',
    ].join('\n'),
    prMetadataShape: 'OTHER',
  });
  assert.equal(result.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
  assert.equal(result.reason, 'single-pr-body-convergence-reconciler-owned');
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

test('v1.7 contract drift delegates only to the live reconciler', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: PR #1198 verwendet die Legacy-Vorlage v1.7.0. Legacy-Vorlagen sind nur Migrations-Evidence und dürfen nicht gemerged werden; erforderlich ist v1.8.0.',
    prMetadataShape: 'OTHER',
  });
  assert.equal(result.classification, 'PR_TEMPLATE_VERSION_MIGRATION');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_DECISION_EVIDENCE);
  assert.equal(result.reason, 'v1.7-to-v1.8-live-reconciler-owned');
  assert.equal(result.findingClass, 'REPOSITORY_PR_TEMPLATE_VERSION_DRIFT');
  assert.equal(result.actionId, 'RECONCILE_PR_DECISION_EVIDENCE');
});

test('v1.6 legacy template block outranks baseline repair and cannot re-enter the old autofix lane', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: [
      'Error: PR #1199 verwendet die Legacy-Vorlage v1.6.0. Legacy-Vorlagen sind nur Migrations-Evidence und dürfen nicht gemerged werden; erforderlich ist v1.8.0.',
      'Error: PR #1199 enthält eine veraltete oder inkonsistent korrelierte Produktions-Baseline.',
    ].join('\n'),
    prMetadataShape: 'CURRENT_V16_GENERIC_MISSING_SECTIONS',
  });
  assert.equal(result.classification, 'PR_LEGACY_TEMPLATE_BLOCK');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN);
  assert.equal(result.reason, 'legacy-template-must-migrate-to-current-contract');
  assert.equal(result.findingClass, 'REPOSITORY_PR_LEGACY_TEMPLATE');
  assert.equal(result.actionId, 'MIGRATE_PR_TEMPLATE_TO_CURRENT');
});

test('delegates an exact stale production baseline before broad protected-provider vocabulary', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: [
      'const example = "supabase migration";',
      'Error: PR #1143 enthält eine veraltete oder inkonsistent korrelierte Produktions-Baseline. Erwartete aktuelle Baseline-ID: sha256:test.',
    ].join('\n'),
    prMetadataShape: 'CURRENT_V18_CANONICAL',
  });
  assert.equal(result.classification, 'PR_PRODUCTION_BASELINE_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
  assert.equal(result.reason, 'single-pr-body-convergence-reconciler-owned');
});

test('PR #1364 structure drift and later Production-generation drift stay on one Self-Healing action', () => {
  const structure = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: PR #1364 enthält nicht alle Pflichtabschnitte der kanonischen Vorlage: ## 1. 🧭 Entscheidung, ## 2. ✅ Evidence, ## 3. 🔍 Technical Evidence',
    prMetadataShape: 'CURRENT_V18_OTHER',
  });
  const productionGeneration = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: PR #1364 enthält eine veraltete oder inkonsistent korrelierte Produktions-Baseline. Erwartete aktuelle Baseline-ID: sha256:45628ef9381b8f6827d00c50b33d19da7a31d46ed032cfc040158f783319c2aa.',
    prMetadataShape: 'CURRENT_V18_CANONICAL',
  });

  assert.equal(structure.classification, 'PR_DECISION_EVIDENCE_DRIFT');
  assert.equal(productionGeneration.classification, 'PR_PRODUCTION_BASELINE_DRIFT');
  assert.equal(structure.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_DECISION_EVIDENCE);
  assert.equal(productionGeneration.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_DECISION_EVIDENCE);
  assert.equal(structure.findingClass, 'REPOSITORY_PR_DECISION_EVIDENCE_DRIFT');
  assert.equal(productionGeneration.findingClass, 'REPOSITORY_PR_DECISION_EVIDENCE_DRIFT');
  assert.equal(structure.actionId, 'RECONCILE_PR_DECISION_EVIDENCE');
  assert.equal(productionGeneration.actionId, 'RECONCILE_PR_DECISION_EVIDENCE');
});

test('delegates the exact observed v1.8 P0-HIGHEST priority drift only for canonical bodies', () => {
  const logText =
    'Error: PR #1147 enthält keine gültige Prioritätsbewertung (P0–P3) der Vorlage v1.8.0.';

  const allowed = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText,
    prMetadataShape: 'CURRENT_V18_CANONICAL',
  });
  assert.equal(allowed.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(allowed.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
  assert.equal(allowed.reason, 'current-v1.8-priority-convergence-reconciler-owned');

  const denied = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText,
    prMetadataShape: 'CURRENT_V18_OTHER',
  });
  assert.equal(denied.decision, PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN);
  assert.equal(denied.reason, 'current-v1.8-priority-drift-requires-canonical-shape');
});

test('delegates only the exact allowlisted v1.8 legacy baseline-section drift', () => {
  const logText = 'Error: PR #1142 muss in v1.8.0 exakt drei sichtbare Hauptabschnitte besitzen: ## 1. 🧭 Entscheidung, ## 2. ✅ Evidence, ## 3. 🔍 Technical Evidence';

  const allowed = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText,
    prMetadataShape: 'CURRENT_V18_LEGACY_BASELINE_SECTION',
  });
  assert.equal(allowed.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(allowed.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
  assert.equal(allowed.reason, 'current-v1.8-legacy-baseline-convergence-reconciler-owned');

  const routed = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText,
    prMetadataShape: 'CURRENT_V18_OTHER',
  });
  assert.equal(routed.classification, 'PR_DECISION_EVIDENCE_DRIFT');
  assert.equal(routed.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_DECISION_EVIDENCE);
  assert.equal(routed.reason, 'current-v1.8-structure-bootstrap-reconciler-owned');
  assert.equal(routed.findingClass, 'REPOSITORY_PR_DECISION_EVIDENCE_DRIFT');
  assert.equal(routed.actionId, 'RECONCILE_PR_DECISION_EVIDENCE');
});

test('routes the exact PR #1298 hybrid v1.8 baseline shape to the single PR-body convergence writer', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: PR #1298 muss in v1.8.0 exakt drei sichtbare Hauptabschnitte besitzen: ## 1. 🧭 Entscheidung, ## 2. ✅ Evidence, ## 3. 🔍 Technical Evidence',
    prMetadataShape: 'CURRENT_V18_HYBRID_BASELINE_SECTION',
  });
  assert.equal(result.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_DECISION_EVIDENCE);
  assert.equal(result.reason, 'current-v1.8-hybrid-baseline-convergence-reconciler-owned');
  assert.equal(result.findingClass, 'REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT');
  assert.equal(result.actionId, 'RECONCILE_PR_DECISION_EVIDENCE');
});
test('routes current v1.8 missing-section drift to the single Decision Evidence writer', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: PR #1224 enthält nicht alle Pflichtabschnitte der kanonischen Vorlage: ## 1. 🧭 Entscheidung, ## 2. ✅ Evidence, ## 3. 🔍 Technical Evidence',
    prMetadataShape: 'CURRENT_V18_OTHER',
  });
  assert.equal(result.classification, 'PR_DECISION_EVIDENCE_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_DECISION_EVIDENCE);
  assert.equal(result.reason, 'current-v1.8-structure-bootstrap-reconciler-owned');
  assert.equal(result.findingClass, 'REPOSITORY_PR_DECISION_EVIDENCE_DRIFT');
  assert.equal(result.actionId, 'RECONCILE_PR_DECISION_EVIDENCE');
});

test('delegates repairable PR metadata drift to the single PR-body convergence writer', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: PR #1 enthält nicht alle Pflichtabschnitte der kanonischen Vorlage: ## 4. 📌 Priorität & Roadmap',
    prMetadataShape: 'OTHER',
  });
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
});


test('delegates the exact PR #1123 missing-sections failure to the single PR-body convergence writer', () => {
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
  assert.equal(result.reason, 'single-pr-body-convergence-reconciler-owned');
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

test('delegates canonical Human/CODEOWNER merge-gate drift to the single PR-body convergence writer', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/pr-governance.yml',
    logText: 'Error: Der kanonische PR muss die Human-/CODEOWNER-Freigabe ausdrücklich beibehalten.',
  });
  assert.equal(result.classification, 'PR_TEMPLATE_METADATA_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA);
});

test('delegates missing template marker drift to the single PR-body convergence writer', () => {
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


test('routes the exact merge-cadence PATCH signature only through the registered OPS repairer', () => {
  const registry = [
    {
      id: 'MERGE_CADENCE_PATCH_V1',
      owner: 'CAPITAL-AI-OPS',
      sourceWorkflow: '.github/workflows/ci.yml',
      exactSignatures: ['MERGE_CADENCE_PATCH_V1'],
      repairerPath: 'scripts/pr/repairers/mergeCadencePatchV1.mjs',
      allowedPaths: ['package.json', 'package-lock.json'],
      evidenceBinding: {
        kind: 'EXACT_LOG_TOKENS_V1',
        requiredTokens: [
          'ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT: MERGE_CADENCE_PATCH_V1',
          'mergeOrdinal=',
          'expectedNextPatch=',
          'package.json/package-lock.json',
        ],
      },
    },
  ];

  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: [
      'ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT: MERGE_CADENCE_PATCH_V1',
      'mergeOrdinal=9; expectedNextPatch=0.6.1; package.json/package-lock.json must be materialized atomically on the candidate branch before Human/CODEOWNER merge.',
    ].join('\n'),
  }, registry);

  assert.equal(result.classification, 'DETERMINISTIC_TEST_EXPECTATION_DRIFT');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.REGISTERED_TEST_REPAIR);
  assert.equal(result.repairerId, 'MERGE_CADENCE_PATCH_V1');
  assert.equal(result.repairerPath, 'scripts/pr/repairers/mergeCadencePatchV1.mjs');
});

test('default repair registry remains valid after adding merge cadence PATCH repair', () => {
  assert.doesNotThrow(() => validatePrAutofixRepairRegistry());
});


test('empty completed-run failure evidence is explicit fail-closed, not UNKNOWN_FAILURE', () => {
  const result = classifyPrAutofixFailure({
    sourceWorkflow: '.github/workflows/ci.yml',
    logText: '',
  });
  assert.equal(result.classification, 'FAILURE_EVIDENCE_UNAVAILABLE');
  assert.equal(result.decision, PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN);
  assert.equal(result.reason, 'source-failure-evidence-unavailable');
  assert.equal(result.findingClass, 'REPOSITORY_FAILURE_EVIDENCE_UNAVAILABLE');
  assert.equal(result.actionId, 'OBSERVE_ONLY');
});
