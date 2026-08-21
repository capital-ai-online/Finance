import {
  FINTECH_CORE_CONTRACT_VERSION,
  type FinTechCoreDecisionRecord,
  type FinTechCoreWorkflowContext,
} from '../CoreContracts';
import {
  FINTECH_CORE_COMPLIANCE_DECISION_TYPE,
  FINTECH_CORE_RISK_DECISION_TYPE,
  type FinTechCorePreTradeAuthorizationDecision,
} from './RiskComplianceContracts';

export interface FinTechCoreRiskComplianceDecisionRecordInput {
  readonly context: FinTechCoreWorkflowContext;
  readonly authorization: FinTechCorePreTradeAuthorizationDecision;
  readonly riskDecisionId: string;
  readonly complianceDecisionId: string;
  readonly riskInputHash: string;
  readonly riskOutputHash: string;
  readonly complianceInputHash: string;
  readonly complianceOutputHash: string;
}

function required(value: string, field: string): string {
  if (!value.trim()) throw new Error(`[FinTechCore][FT5] ${field} is required.`);
  return value;
}

/**
 * Produces canonical FT-3 decision records from FT-5 results. Hash computation remains an
 * infrastructure concern so the domain does not import Node/WebCrypto or create a second hashing
 * authority. The returned records are append-only evidence and do not execute an order.
 */
export function buildRiskComplianceDecisionRecords(
  input: FinTechCoreRiskComplianceDecisionRecordInput,
): readonly [FinTechCoreDecisionRecord, FinTechCoreDecisionRecord] {
  const { context, authorization } = input;
  const risk: FinTechCoreDecisionRecord = Object.freeze({
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    decisionId: required(input.riskDecisionId, 'riskDecisionId'),
    decisionType: FINTECH_CORE_RISK_DECISION_TYPE,
    decisionVersion: context.decisionVersion,
    outcome: authorization.risk.outcome,
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    moduleId: context.moduleId,
    assetId: context.asset.assetId,
    policyId: authorization.risk.policyId,
    policyVersion: authorization.risk.policyVersion,
    inputHash: required(input.riskInputHash, 'riskInputHash'),
    outputHash: required(input.riskOutputHash, 'riskOutputHash'),
    evidenceRefs: authorization.risk.evidenceRefs,
    decidedAt: authorization.evaluatedAt,
  });

  const compliance: FinTechCoreDecisionRecord = Object.freeze({
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    decisionId: required(input.complianceDecisionId, 'complianceDecisionId'),
    decisionType: FINTECH_CORE_COMPLIANCE_DECISION_TYPE,
    decisionVersion: context.decisionVersion,
    outcome: authorization.compliance.outcome,
    runId: context.runId,
    traceId: context.traceId,
    correlationId: context.correlationId,
    moduleId: context.moduleId,
    assetId: context.asset.assetId,
    policyId: authorization.compliance.policyId,
    policyVersion: authorization.compliance.policyVersion,
    inputHash: required(input.complianceInputHash, 'complianceInputHash'),
    outputHash: required(input.complianceOutputHash, 'complianceOutputHash'),
    evidenceRefs: authorization.compliance.evidenceRefs,
    decidedAt: authorization.evaluatedAt,
  });

  return Object.freeze([risk, compliance]) as readonly [FinTechCoreDecisionRecord, FinTechCoreDecisionRecord];
}
