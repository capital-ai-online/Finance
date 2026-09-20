#!/usr/bin/env node

import fs from 'node:fs';
import { appendGithubOutput, fail } from './lib.mjs';
import {
  PR_AUTOFIX_REPAIR_REGISTRY,
  resolveRegisteredPrAutofixRepair,
} from './prAutofixRepairRegistry.mjs';

export const PR_AUTOFIX_DECISIONS = Object.freeze({
  DELEGATE_CURRENT_STATE_BASELINE: 'DELEGATE_CURRENT_STATE_BASELINE_AUTOFIX',
  DELEGATE_PR_METADATA: 'DELEGATE_PR_PRODUCTION_BASELINE_REFRESH',
  DELEGATE_PR_DECISION_EVIDENCE: 'DELEGATE_PR_DECISION_EVIDENCE_RECONCILER',
  REGISTERED_TEST_REPAIR: 'REGISTERED_TEST_REPAIR',
  BLOCKED_SECURITY_COMPLIANCE: 'BLOCKED_SECURITY_COMPLIANCE',
  BLOCKED_PROTECTED_ACTION: 'BLOCKED_PROTECTED_ACTION',
  BLOCKED_NOT_PROVEN: 'BLOCKED_NOT_PROVEN',
  BLOCKED_REPEAT_AUTOFIX: 'BLOCKED_REPEAT_AUTOFIX',
  BLOCKED_UNKNOWN: 'BLOCKED_UNKNOWN',
});

const SECURITY_FAILURE = [
  /(?:^|\b)(?:error|failed|failure|fatal|denied|violation)\b[^\n]*(?:workflow security|credential exposure|secret scanning|gitguardian|dependency security|provenance|signature verification|cosign|high\+critical cve|trivy)/i,
  /(?:secret|credential)[^\n]*(?:exposed|leak|detected|found)/i,
];

const PROTECTED_FAILURE = [
  /(?:^|\b)(?:error|failed|failure|fatal|denied)\b[^\n]*(?:render|production deploy|registry auth|ghcr auth|deployment identity|\biam\b|billing|database mutation|supabase migration)/i,
];

const PROTECTED_ACTIONS_MINUTE_BLOCKER = [
  /GitHub Actions Hard-Blocker aktiv: Issue #\d+/i,
  /Der monatliche Enterprise-Actions-Verbrauch hat 45\.000 Minuten erreicht/i,
  /Mehrere offene Actions-Minuten-Blocker gefunden:/i,
];

const EXACT_STALE_PRODUCTION_BASELINE =
  /Error: PR #\d+ enthält eine veraltete oder inkonsistent korrelierte Produktions-Baseline\./i;

const EXACT_V17_STRUCTURE_DRIFT =
  /Error: PR #\d+ muss in v1\.7\.0 exakt drei sichtbare Hauptabschnitte besitzen:/i;

const EXACT_V17_PRIORITY_DRIFT =
  /Error: PR #\d+ enthält keine gültige Prioritätsbewertung \(P0[–-]P3\) der Vorlage v1\.7\.0\./i;

const DECISION_EVIDENCE_DRIFT_PATTERNS = [
  /Error: PR #\d+ enthält keinen gültigen automatisch ableitbaren Entscheidungsstatus der Vorlage v1\.7\.0\./i,
  /Error: PR #\d+ fehlt kanonische Decision-Evidence:/i,
  /Error: PR #\d+ behauptet Decision Status (?:READY_FOR_HUMAN_DECISION|EVIDENCE_PENDING|BLOCKED), aber die sichtbaren Gate-Zustände ergeben (?:READY_FOR_HUMAN_DECISION|EVIDENCE_PENDING|BLOCKED)\./i,
];

const SELF_HEALING_NEXT_SLICE_SIGNATURE = 'SELF_HEALING_NEXT_SLICE_INVARIANT_V1';
const EXACT_SELF_HEALING_NEXT_SLICE_TEST =
  /FAIL\s+tests\/unit\/selfHealingSupersession\.test\.ts\s*>\s*self-healing supersession surfaces\s*>\s*releases merged SH-02 claims and advances the canonical work graph/i;
const EXACT_SELF_HEALING_NEXT_SLICE_LITERAL =
  /expected[^\n]*to contain '\*\*Next functional slice:\*\* \`SH-02\.\d+[A-Z]?\`'/i;

const TEMPLATE_DELEGATION_PATTERNS = [
  /verwendet keinen unterstützten PR-Vorlagenmarker/i,
  /enthält nicht alle Pflichtabschnitte der kanonischen Vorlage:/i,
  /fehlt mindestens eine maschinenlesbare Governance-ID:/i,
  /enthält eine veraltete oder inkonsistent korrelierte Produktions-Baseline/i,
  /enthält keinen eindeutig abgegrenzten Produktions-Baseline-Block/i,
  /enthält nicht aufgelöste Vorlagenplatzhalter:/i,
  /Der kanonische PR muss die Human-\/CODEOWNER-Freigabe ausdrücklich beibehalten\./i,
];

const TEMPLATE_UNSUPPORTED_PATTERNS = [
  /enthält keine gültige Prioritätsbewertung/i,
  /enthält keinen gültigen Versionsimpact/i,
  /enthält keinen Version-Manager-Check-Status/i,
];

function normalizedFailureLines(logText) {
  return String(logText || '')
    .split(/\r?\n/)
    .filter((line) => /error|fail|fatal|denied|violation|exposed|leak|vulnerab|critical|blocker/i.test(line))
    .join('\n');
}

function result({
  classification,
  decision,
  reason,
  failureSignature = '',
  repairerId = '',
  repairerPath = '',
  allowedPaths = [],
  findingClass = '',
  actionId = '',
}) {
  return {
    classification,
    decision,
    reason,
    failureSignature,
    repairerId,
    repairerPath,
    allowedPaths,
    findingClass,
    actionId,
  };
}

export function classifyPrAutofixFailure(
  {
    sourceWorkflow,
    logText,
    previousAutofixSignature = '',
    prMetadataShape = '',
  },
  registry = PR_AUTOFIX_REPAIR_REGISTRY,
) {
  const source = String(sourceWorkflow || '').trim();
  const log = String(logText || '');
  const metadataShape = String(prMetadataShape || '').trim();
  const failureLines = normalizedFailureLines(log);

  if (!['.github/workflows/ci.yml', '.github/workflows/pr-governance.yml'].includes(source)) {
    return result({
      classification: 'UNKNOWN_FAILURE',
      decision: PR_AUTOFIX_DECISIONS.BLOCKED_UNKNOWN,
      reason: 'unsupported-source-workflow',
    });
  }

  if (PROTECTED_ACTIONS_MINUTE_BLOCKER.some((pattern) => pattern.test(log))) {
    return result({
      classification: 'PROTECTED_ACTIONS_MINUTE_COST_BLOCKER',
      decision: PR_AUTOFIX_DECISIONS.BLOCKED_PROTECTED_ACTION,
      reason: 'protected-45k-actions-minute-blocker',
      findingClass: 'PROTECTED_GITHUB_ACTIONS_COST_BLOCKER',
      actionId: 'OBSERVE_ONLY',
    });
  }

  // Exact PR-Governance contract failures take precedence over broad provider/security
  // vocabulary found in shell/source excerpts inside gh --log-failed output.
  if (source === '.github/workflows/pr-governance.yml') {
    if (DECISION_EVIDENCE_DRIFT_PATTERNS.some((pattern) => pattern.test(log))) {
      return result({
        classification: 'PR_DECISION_EVIDENCE_DRIFT',
        decision: PR_AUTOFIX_DECISIONS.DELEGATE_PR_DECISION_EVIDENCE,
        reason: 'decision-evidence-reconciler-owns-write',
        findingClass: 'REPOSITORY_PR_DECISION_EVIDENCE_DRIFT',
        actionId: 'RECONCILE_PR_DECISION_EVIDENCE',
      });
    }

    if (EXACT_STALE_PRODUCTION_BASELINE.test(log)) {
      return result({
        classification: 'PR_PRODUCTION_BASELINE_DRIFT',
        decision: PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA,
        reason: 'stale-production-baseline-specialist-owned',
      });
    }

    if (EXACT_V17_PRIORITY_DRIFT.test(log)) {
      if (metadataShape === 'CURRENT_V17_CANONICAL') {
        return result({
          classification: 'PR_TEMPLATE_METADATA_DRIFT',
          decision: PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA,
          reason: 'current-v1.7-priority-token-repairable',
        });
      }
      return result({
        classification: 'PR_TEMPLATE_METADATA_DRIFT',
        decision: PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN,
        reason: 'current-v1.7-priority-drift-requires-canonical-shape',
      });
    }

    if (EXACT_V17_STRUCTURE_DRIFT.test(log)) {
      if (metadataShape === 'CURRENT_V17_LEGACY_BASELINE_SECTION') {
        return result({
          classification: 'PR_TEMPLATE_METADATA_DRIFT',
          decision: PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA,
          reason: 'current-v1.7-legacy-baseline-section-repairable',
        });
      }
      return result({
        classification: 'PR_TEMPLATE_METADATA_DRIFT',
        decision: PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN,
        reason: 'current-v1.7-structure-drift-not-allowlisted',
      });
    }
  }

  if (
    source === '.github/workflows/ci.yml' &&
    EXACT_SELF_HEALING_NEXT_SLICE_TEST.test(log) &&
    EXACT_SELF_HEALING_NEXT_SLICE_LITERAL.test(log)
  ) {
    const failureSignature = SELF_HEALING_NEXT_SLICE_SIGNATURE;
    if (failureSignature === String(previousAutofixSignature || '').trim()) {
      return result({
        classification: 'DETERMINISTIC_TEST_EXPECTATION_DRIFT',
        decision: PR_AUTOFIX_DECISIONS.BLOCKED_REPEAT_AUTOFIX,
        reason: 'same-autofix-signature-repeated-on-autofix-head',
        failureSignature,
      });
    }

    const repair = resolveRegisteredPrAutofixRepair(
      { sourceWorkflow: source, signature: failureSignature, evidenceText: log },
      registry,
    );
    if (!repair.registered) {
      return result({
        classification: 'DETERMINISTIC_TEST_EXPECTATION_DRIFT',
        decision: PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN,
        reason: repair.reason,
        failureSignature,
      });
    }

    return result({
      classification: 'DETERMINISTIC_TEST_EXPECTATION_DRIFT',
      decision: PR_AUTOFIX_DECISIONS.REGISTERED_TEST_REPAIR,
      reason: 'stale-self-healing-next-slice-literal-replaced-by-work-graph-invariant',
      failureSignature,
      repairerId: repair.repairerId,
      repairerPath: repair.repairerPath,
      allowedPaths: repair.allowedPaths,
      findingClass: 'REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT',
      actionId: 'RECONCILE_REPOSITORY_PROJECTION',
    });
  }

  if (SECURITY_FAILURE.some((pattern) => pattern.test(failureLines))) {
    return result({
      classification: 'SECURITY_OR_COMPLIANCE_FAILURE',
      decision: PR_AUTOFIX_DECISIONS.BLOCKED_SECURITY_COMPLIANCE,
      reason: 'security-or-compliance-failure-detected',
    });
  }

  if (PROTECTED_FAILURE.some((pattern) => pattern.test(failureLines))) {
    return result({
      classification: 'PRODUCTION_OR_PROVIDER_FAILURE',
      decision: PR_AUTOFIX_DECISIONS.BLOCKED_PROTECTED_ACTION,
      reason: 'protected-production-or-provider-failure-detected',
    });
  }

  if (
    source === '.github/workflows/ci.yml' &&
    /ERROR CURRENT_STATE_PROJECTION_BASELINE_(?:MISSING|STALE): docs\/projects\/[^ :]+\/(?:ROADMAP|TASK_REGISTER)\.md/.test(log)
  ) {
    return result({
      classification: 'CURRENT_STATE_BASELINE_DRIFT',
      decision: PR_AUTOFIX_DECISIONS.DELEGATE_CURRENT_STATE_BASELINE,
      reason: 'existing-current-state-baseline-specialist-owns-write',
      findingClass: 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
      actionId: 'RECONCILE_REPOSITORY_PROJECTION',
    });
  }

  if (source === '.github/workflows/pr-governance.yml') {
    const missingSectionsFailure =
      /enthält nicht alle Pflichtabschnitte der kanonischen Vorlage:/i.test(log);
    if (
      missingSectionsFailure &&
      ![
        'CURRENT_V16_GENERIC_MISSING_SECTIONS',
        'CURRENT_V16_SECURITY_BOUNDARY_EXACT',
        'OTHER',
      ].includes(metadataShape)
    ) {
      return result({
        classification: 'PR_TEMPLATE_METADATA_DRIFT',
        decision: PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN,
        reason:
          metadataShape === 'CURRENT_V16_SECURITY_BOUNDARY_LOOKALIKE'
            ? 'current-v1.6-security-boundary-lookalike-not-allowlisted'
            : 'pr-metadata-shape-unavailable-or-unsupported',
      });
    }

    if (TEMPLATE_UNSUPPORTED_PATTERNS.some((pattern) => pattern.test(log))) {
      return result({
        classification: 'PR_TEMPLATE_METADATA_DRIFT',
        decision: PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN,
        reason: 'metadata-drift-not-deterministically-repairable-by-current-specialist',
      });
    }

    if (TEMPLATE_DELEGATION_PATTERNS.some((pattern) => pattern.test(log))) {
      return result({
        classification: 'PR_TEMPLATE_METADATA_DRIFT',
        decision: PR_AUTOFIX_DECISIONS.DELEGATE_PR_METADATA,
        reason: 'existing-pr-production-baseline-refresh-specialist-owns-write',
      });
    }
  }

  if (source === '.github/workflows/ci.yml') {
    const signatureMatch = log.match(/ERROR DETERMINISTIC_TEST_EXPECTATION_DRIFT:\s*([A-Z0-9][A-Z0-9_.:-]{0,127})/);
    if (signatureMatch) {
      const failureSignature = signatureMatch[1];
      if (failureSignature === String(previousAutofixSignature || '').trim()) {
        return result({
          classification: 'DETERMINISTIC_TEST_EXPECTATION_DRIFT',
          decision: PR_AUTOFIX_DECISIONS.BLOCKED_REPEAT_AUTOFIX,
          reason: 'same-autofix-signature-repeated-on-autofix-head',
          failureSignature,
        });
      }

      const repair = resolveRegisteredPrAutofixRepair(
        { sourceWorkflow: source, signature: failureSignature, evidenceText: log },
        registry,
      );
      if (!repair.registered) {
        return result({
          classification: 'DETERMINISTIC_TEST_EXPECTATION_DRIFT',
          decision: PR_AUTOFIX_DECISIONS.BLOCKED_NOT_PROVEN,
          reason: repair.reason,
          failureSignature,
        });
      }

      return result({
        classification: 'DETERMINISTIC_TEST_EXPECTATION_DRIFT',
        decision: PR_AUTOFIX_DECISIONS.REGISTERED_TEST_REPAIR,
        reason: repair.reason,
        failureSignature,
        repairerId: repair.repairerId,
        repairerPath: repair.repairerPath,
        allowedPaths: repair.allowedPaths,
      });
    }
  }

  return result({
    classification: 'UNKNOWN_FAILURE',
    decision: PR_AUTOFIX_DECISIONS.BLOCKED_UNKNOWN,
    reason: 'no-exact-allowlisted-failure-class',
  });
}

function emitClassification(value) {
  appendGithubOutput({
    classification: value.classification,
    decision: value.decision,
    reason: value.reason,
    failure_signature: value.failureSignature,
    repairer_id: value.repairerId,
    repairer_path: value.repairerPath,
    allowed_paths_json: JSON.stringify(value.allowedPaths),
    self_healing_finding_class: value.findingClass,
    self_healing_action_id: value.actionId,
  });
}

if (process.argv[1]?.endsWith('classifyPrAutofixFailure.mjs')) {
  const logPath = String(process.env.FAILURE_LOG || '').trim();
  const sourceWorkflow = String(process.env.SOURCE_WORKFLOW_PATH || '').trim();
  const previousAutofixSignature = String(process.env.PREVIOUS_AUTOFIX_SIGNATURE || '').trim();
  const prMetadataShape = String(process.env.PR_METADATA_SHAPE || '').trim();

  if (!logPath || !fs.existsSync(logPath)) fail('FAILURE_LOG fehlt oder existiert nicht.');
  const logText = fs.readFileSync(logPath, 'utf8');
  const classification = classifyPrAutofixFailure({
    sourceWorkflow,
    logText,
    previousAutofixSignature,
    prMetadataShape,
  });
  emitClassification(classification);
  console.log(
    `[PR-AUTOFIX] classification=${classification.classification} decision=${classification.decision} reason=${classification.reason}`,
  );
}
