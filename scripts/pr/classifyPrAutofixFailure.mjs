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

const EXACT_STALE_PRODUCTION_BASELINE =
  /Error: PR #\d+ enthält eine veraltete oder inkonsistent korrelierte Produktions-Baseline\./i;

const EXACT_V17_STRUCTURE_DRIFT =
  /Error: PR #\d+ muss in v1\.7\.0 exakt drei sichtbare Hauptabschnitte besitzen:/i;

const EXACT_V17_PRIORITY_DRIFT =
  /Error: PR #\\d+ enthält keine gültige Prioritätsbewertung \\(P0[–-]P3\\) der Vorlage v1\\.7\\.0\\./i;

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
    .filter((line) => /error|fail|fatal|denied|violation|exposed|leak|vulnerab|critical/i.test(line))
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
}) {
  return {
    classification,
    decision,
    reason,
    failureSignature,
    repairerId,
    repairerPath,
    allowedPaths,
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

  // Exact PR-Governance contract failures take precedence over broad provider/security
  // vocabulary found in shell/source excerpts inside gh --log-failed output.
  if (source === '.github/workflows/pr-governance.yml') {
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
        { sourceWorkflow: source, signature: failureSignature },
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
