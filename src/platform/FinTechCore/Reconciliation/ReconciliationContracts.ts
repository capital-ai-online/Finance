import { createHash } from 'node:crypto';
import type { FinTechCoreDecisionRecord } from '../CoreContracts';
import type { FinTechCoreBoundOrderIntent } from '../OrderIntent/OrderIntentBinding';
import {
  FINTECH_CORE_COMPLIANCE_DECISION_TYPE,
  FINTECH_CORE_RISK_DECISION_TYPE,
} from '../RiskCompliance/RiskComplianceContracts';

export const FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION =
  'fintech-core/reconciliation/0.1.0' as const;

export type FinTechCoreReconciliationType =
  | 'ORDER_INTENT_DECISION_BINDING'
  | 'ORDER_INTENT_PAPER_FILL';

export type FinTechCoreReconciliationStatus =
  | 'MATCHED'
  | 'MISMATCH'
  | 'PENDING'
  | 'NOT_COMPUTABLE';

export interface FinTechCoreReconciliationRecord {
  readonly reconciliationId: string;
  readonly reconciliationContractVersion: typeof FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly orderIntentId: string;
  readonly reconciliationType: FinTechCoreReconciliationType;
  readonly status: FinTechCoreReconciliationStatus;
  readonly sourceSystem: string;
  readonly targetSystem: string;
  readonly assetId: string;
  readonly observedAt: string;
  readonly inputHash: string;
  readonly outputHash: string;
  readonly evidenceRefs: readonly string[];
  readonly details: Readonly<Record<string, unknown>>;
}

export interface FinTechCoreOrderIntentDecisionReconciliationInput {
  readonly reconciliationId: string;
  readonly intent: FinTechCoreBoundOrderIntent;
  readonly riskDecision: FinTechCoreDecisionRecord;
  readonly complianceDecision: FinTechCoreDecisionRecord;
  readonly observedAt: string;
}

function sha256(value: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

function uniqueEvidenceRefs(...groups: readonly (readonly string[])[]): readonly string[] {
  return Object.freeze([
    ...new Set(groups.flat().map((value) => value.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b)));
}

function sameIdentity(intent: FinTechCoreBoundOrderIntent, decision: FinTechCoreDecisionRecord): boolean {
  return decision.runId === intent.runId
    && decision.traceId === intent.traceId
    && decision.correlationId === intent.correlationId
    && decision.assetId === intent.assetId
    && decision.decisionVersion === intent.decisionVersion;
}

/**
 * Re-validates the FT-6 decision-to-intent binding for durable replay/audit purposes.
 * A mismatch is evidence of drift/tampering and never upgrades execution eligibility.
 */
export function reconcileOrderIntentDecisionBinding(
  input: FinTechCoreOrderIntentDecisionReconciliationInput,
): FinTechCoreReconciliationRecord {
  if (!input.reconciliationId.trim()) {
    throw new Error('[FinTechCore][FT6] reconciliationId is required.');
  }
  if (!Number.isFinite(Date.parse(input.observedAt))) {
    throw new Error('[FinTechCore][FT6] observedAt must be a valid timestamp.');
  }

  const { intent, riskDecision, complianceDecision } = input;
  const checks = Object.freeze({
    riskType: riskDecision.decisionType === FINTECH_CORE_RISK_DECISION_TYPE,
    complianceType: complianceDecision.decisionType === FINTECH_CORE_COMPLIANCE_DECISION_TYPE,
    riskApproved: riskDecision.outcome === 'APPROVED',
    complianceApproved: complianceDecision.outcome === 'APPROVED',
    riskIdentity: sameIdentity(intent, riskDecision),
    complianceIdentity: sameIdentity(intent, complianceDecision),
    riskDecisionId: intent.riskDecisionId === riskDecision.decisionId,
    complianceDecisionId: intent.complianceDecisionId === complianceDecision.decisionId,
    riskDecisionHash: intent.riskDecisionOutputHash === riskDecision.outputHash,
    complianceDecisionHash: intent.complianceDecisionOutputHash === complianceDecision.outputHash,
    derivedApprovals: intent.riskApproval === 'APPROVED' && intent.complianceApproval === 'APPROVED',
  });

  const status: FinTechCoreReconciliationStatus = Object.values(checks).every(Boolean)
    ? 'MATCHED'
    : 'MISMATCH';

  const evidenceRefs = uniqueEvidenceRefs(
    riskDecision.evidenceRefs,
    complianceDecision.evidenceRefs,
    [
      `decision://${riskDecision.decisionId}`,
      `decision://${complianceDecision.decisionId}`,
      `order-intent://${intent.orderIntentId}`,
    ],
  );

  const inputCanonical = Object.freeze({
    reconciliationContractVersion: FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION,
    reconciliationId: input.reconciliationId,
    orderIntentId: intent.orderIntentId,
    intentHash: intent.intentHash,
    riskDecisionId: riskDecision.decisionId,
    riskDecisionOutputHash: riskDecision.outputHash,
    complianceDecisionId: complianceDecision.decisionId,
    complianceDecisionOutputHash: complianceDecision.outputHash,
    observedAt: input.observedAt,
  });
  const outputCanonical = Object.freeze({ status, checks, evidenceRefs });

  return Object.freeze({
    reconciliationId: input.reconciliationId,
    reconciliationContractVersion: FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION,
    runId: intent.runId,
    traceId: intent.traceId,
    correlationId: intent.correlationId,
    orderIntentId: intent.orderIntentId,
    reconciliationType: 'ORDER_INTENT_DECISION_BINDING' as const,
    status,
    sourceSystem: 'fintech_core.decision_records',
    targetSystem: 'fintech_core.order_intents',
    assetId: intent.assetId,
    observedAt: input.observedAt,
    inputHash: sha256(inputCanonical),
    outputHash: sha256(outputCanonical),
    evidenceRefs,
    details: Object.freeze({
      bindingVersion: intent.bindingVersion,
      intentHash: intent.intentHash,
      checks,
      settlementFinalityAsserted: false,
      realExecutionAsserted: false,
    }),
  });
}
