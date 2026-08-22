import { createHash } from 'node:crypto';
import type {
  FinTechCoreDecisionRecord,
  FinTechCoreOrderIntent,
  FinTechCoreOrderPriceBounds,
} from '../CoreContracts';
import {
  compareFinTechCoreFixedPoint,
  finTechCoreFixedPointEquals,
  normalizeFinTechCoreFixedPoint,
  type FinTechCoreFixedPoint,
} from '../Financial/FixedPoint';
import {
  deriveOrderIntentIntegrity,
  isOrderIntentExpired,
  type FinTechCoreOrderIntentIntegritySource,
} from '../OrderIntent/OrderIntentBinding';
import {
  FINTECH_CORE_COMPLIANCE_DECISION_TYPE,
  FINTECH_CORE_RISK_DECISION_TYPE,
} from '../RiskCompliance/RiskComplianceContracts';

export const FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION =
  'fintech-core/reconciliation/0.2.0' as const;

export type FinTechCoreReconciliationType =
  | 'ORDER_INTENT_DECISION_BINDING'
  | 'ORDER_INTENT_PAPER_FILL';

export type FinTechCoreReconciliationStatus =
  | 'MATCHED'
  | 'MISMATCH'
  | 'PENDING'
  | 'NOT_COMPUTABLE';

export type FinTechCoreSettlementState =
  | 'NOT_APPLICABLE'
  | 'PENDING'
  | 'SETTLED'
  | 'FAILED'
  | 'NOT_COMPUTABLE';

export type FinTechCoreFeeEvidenceStatus = 'OBSERVED' | 'NOT_APPLICABLE' | 'MISSING';

export interface FinTechCoreFeeEvidence {
  readonly status: FinTechCoreFeeEvidenceStatus;
  readonly amount?: FinTechCoreFixedPoint;
  readonly assetId?: string;
  readonly evidenceRefs: readonly string[];
  readonly reason?: string;
}

export interface FinTechCoreObservedExecution {
  readonly venueOrderId?: string;
  readonly quantity?: FinTechCoreFixedPoint;
  readonly executionPrice?: FinTechCoreFixedPoint;
  readonly feeEvidence?: FinTechCoreFeeEvidence;
}

export interface FinTechCoreReconciliationRecord {
  readonly reconciliationId: string;
  readonly reconciliationContractVersion: typeof FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly orderIntentId: string;
  readonly clientOrderId: string;
  readonly venueOrderId?: string;
  readonly reconciliationType: FinTechCoreReconciliationType;
  readonly status: FinTechCoreReconciliationStatus;
  readonly settlementState: FinTechCoreSettlementState;
  readonly sourceSystem: string;
  readonly targetSystem: string;
  readonly assetId: string;
  readonly expectedQuantity: FinTechCoreFixedPoint;
  readonly observedQuantity?: FinTechCoreFixedPoint;
  readonly expectedPriceBounds: FinTechCoreOrderPriceBounds;
  readonly observedExecutionPrice?: FinTechCoreFixedPoint;
  readonly feeEvidence?: FinTechCoreFeeEvidence;
  readonly observedAt: string;
  readonly reconciledAt: string;
  readonly inputHash: string;
  readonly outputHash: string;
  readonly evidenceRefs: readonly string[];
  readonly supervisorEscalationRequired: boolean;
  readonly details: Readonly<Record<string, unknown>>;
}

export interface FinTechCoreOrderIntentDecisionReconciliationInput {
  readonly reconciliationId: string;
  readonly intent: FinTechCoreOrderIntent;
  readonly riskDecision: FinTechCoreDecisionRecord;
  readonly complianceDecision: FinTechCoreDecisionRecord;
  readonly observedAt: string;
}

export interface FinTechCorePaperFillReconciliationInput {
  readonly reconciliationId: string;
  readonly intent: FinTechCoreOrderIntent;
  readonly observed: FinTechCoreObservedExecution;
  readonly evidenceRefs: readonly string[];
  readonly reconciledAt: string;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  const source = value as Readonly<Record<string, unknown>>;
  return Object.keys(source).sort().reduce<Record<string, unknown>>((result, key) => {
    const entry = source[key];
    if (entry !== undefined) result[key] = canonicalize(entry);
    return result;
  }, {});
}

function sha256(value: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')}`;
}

function uniqueEvidenceRefs(...groups: readonly (readonly string[])[]): readonly string[] {
  return Object.freeze([
    ...new Set(groups.flat().map((value) => value.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b)));
}

function sameIdentity(intent: FinTechCoreOrderIntent, decision: FinTechCoreDecisionRecord): boolean {
  return decision.runId === intent.runId
    && decision.traceId === intent.traceId
    && decision.correlationId === intent.correlationId
    && decision.assetId === intent.assetId
    && decision.decisionVersion === intent.decisionVersion;
}

function assertBoundIntent(intent: FinTechCoreOrderIntent): asserts intent is FinTechCoreOrderIntent & {
  readonly bindingVersion: string;
  readonly clientOrderId: string;
  readonly riskDecisionId: string;
  readonly riskDecisionHash: string;
  readonly riskPolicyId: string;
  readonly riskPolicyVersion: string;
  readonly complianceDecisionId: string;
  readonly complianceDecisionHash: string;
  readonly compliancePolicyId: string;
  readonly compliancePolicyVersion: string;
} {
  if (
    intent.bindingState !== 'BOUND'
    || !intent.bindingVersion?.trim()
    || !intent.clientOrderId?.trim()
    || !intent.riskDecisionId?.trim()
    || !intent.riskDecisionHash?.trim()
    || !intent.riskPolicyId?.trim()
    || !intent.riskPolicyVersion?.trim()
    || !intent.complianceDecisionId?.trim()
    || !intent.complianceDecisionHash?.trim()
    || !intent.compliancePolicyId?.trim()
    || !intent.compliancePolicyVersion?.trim()
  ) {
    throw new Error('[FinTechCore][FT6] reconciliation requires a canonical BOUND OrderIntent.');
  }
}

function integritySource(intent: ReturnType<typeof boundIntentIdentity>): FinTechCoreOrderIntentIntegritySource {
  return intent;
}

function boundIntentIdentity(intent: FinTechCoreOrderIntent & {
  readonly riskDecisionId: string;
  readonly riskDecisionHash: string;
  readonly riskPolicyId: string;
  readonly riskPolicyVersion: string;
  readonly complianceDecisionId: string;
  readonly complianceDecisionHash: string;
  readonly compliancePolicyId: string;
  readonly compliancePolicyVersion: string;
}): FinTechCoreOrderIntentIntegritySource {
  return Object.freeze({
    orderIntentId: intent.orderIntentId,
    runId: intent.runId,
    traceId: intent.traceId,
    correlationId: intent.correlationId,
    assetId: intent.assetId,
    strategyId: intent.strategyId,
    portfolioId: intent.portfolioId,
    decisionVersion: intent.decisionVersion,
    side: intent.side,
    quantity: intent.quantity,
    orderType: intent.orderType,
    priceBounds: intent.priceBounds,
    maxSlippageBps: intent.maxSlippageBps,
    createdAt: intent.createdAt,
    expiresAt: intent.expiresAt,
    riskDecisionId: intent.riskDecisionId,
    riskDecisionHash: intent.riskDecisionHash,
    riskPolicyId: intent.riskPolicyId,
    riskPolicyVersion: intent.riskPolicyVersion,
    complianceDecisionId: intent.complianceDecisionId,
    complianceDecisionHash: intent.complianceDecisionHash,
    compliancePolicyId: intent.compliancePolicyId,
    compliancePolicyVersion: intent.compliancePolicyVersion,
  });
}

function normalizeFeeEvidence(value: FinTechCoreFeeEvidence | undefined): FinTechCoreFeeEvidence | undefined {
  if (!value) return undefined;
  const evidenceRefs = uniqueEvidenceRefs(value.evidenceRefs);
  if (value.status === 'OBSERVED') {
    if (!value.amount || !value.assetId?.trim() || evidenceRefs.length === 0) {
      throw new Error('[FinTechCore][FT6] OBSERVED fee evidence requires amount, assetId and evidenceRefs.');
    }
    return Object.freeze({
      ...value,
      amount: normalizeFinTechCoreFixedPoint(value.amount, 'feeEvidence.amount', { allowZero: true }),
      evidenceRefs,
    });
  }
  if (value.status === 'NOT_APPLICABLE') {
    if (value.amount || !value.reason?.trim()) {
      throw new Error('[FinTechCore][FT6] NOT_APPLICABLE fee evidence requires no amount and an explicit reason.');
    }
    return Object.freeze({ ...value, evidenceRefs });
  }
  if (value.amount) {
    throw new Error('[FinTechCore][FT6] MISSING fee evidence must not carry a synthetic amount.');
  }
  return Object.freeze({ ...value, evidenceRefs });
}

function isPriceWithinIntentBounds(intent: FinTechCoreOrderIntent, price: FinTechCoreFixedPoint): boolean {
  const { minPrice, maxPrice, limitPrice } = intent.priceBounds;
  if (minPrice && compareFinTechCoreFixedPoint(price, minPrice) < 0) return false;
  if (maxPrice && compareFinTechCoreFixedPoint(price, maxPrice) > 0) return false;
  if (limitPrice) {
    if (intent.side === 'BUY' && compareFinTechCoreFixedPoint(price, limitPrice) > 0) return false;
    if (intent.side === 'SELL' && compareFinTechCoreFixedPoint(price, limitPrice) < 0) return false;
  }
  return true;
}

/**
 * Re-validates the complete FT-6 decision/policy/idempotency/intent-hash binding for durable replay.
 * Drift or expiry is MISMATCH evidence and never upgrades execution eligibility.
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
  assertBoundIntent(intent);
  const expectedIntegrity = deriveOrderIntentIntegrity(integritySource(boundIntentIdentity(intent)));

  const checks = Object.freeze({
    riskType: riskDecision.decisionType === FINTECH_CORE_RISK_DECISION_TYPE,
    complianceType: complianceDecision.decisionType === FINTECH_CORE_COMPLIANCE_DECISION_TYPE,
    riskApproved: riskDecision.outcome === 'APPROVED',
    complianceApproved: complianceDecision.outcome === 'APPROVED',
    riskIdentity: sameIdentity(intent, riskDecision),
    complianceIdentity: sameIdentity(intent, complianceDecision),
    riskDecisionId: intent.riskDecisionId === riskDecision.decisionId,
    complianceDecisionId: intent.complianceDecisionId === complianceDecision.decisionId,
    riskDecisionHash: intent.riskDecisionHash === riskDecision.outputHash,
    complianceDecisionHash: intent.complianceDecisionHash === complianceDecision.outputHash,
    riskPolicyIdentity:
      intent.riskPolicyId === riskDecision.policyId
      && intent.riskPolicyVersion === riskDecision.policyVersion,
    compliancePolicyIdentity:
      intent.compliancePolicyId === complianceDecision.policyId
      && intent.compliancePolicyVersion === complianceDecision.policyVersion,
    derivedApprovals: intent.riskApproval === 'APPROVED' && intent.complianceApproval === 'APPROVED',
    idempotencyKey: intent.idempotencyKey === expectedIntegrity.idempotencyKey,
    clientOrderId: intent.clientOrderId === expectedIntegrity.clientOrderId,
    intentHash: intent.intentHash === expectedIntegrity.intentHash,
    notExpired: !isOrderIntentExpired(intent, input.observedAt),
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
    riskDecisionHash: riskDecision.outputHash,
    complianceDecisionId: complianceDecision.decisionId,
    complianceDecisionHash: complianceDecision.outputHash,
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
    clientOrderId: intent.clientOrderId,
    reconciliationType: 'ORDER_INTENT_DECISION_BINDING' as const,
    status,
    settlementState: 'NOT_APPLICABLE' as const,
    sourceSystem: 'fintech_core.decision_records',
    targetSystem: 'fintech_core.order_intents',
    assetId: intent.assetId,
    expectedQuantity: intent.quantity,
    expectedPriceBounds: intent.priceBounds,
    observedAt: input.observedAt,
    reconciledAt: input.observedAt,
    inputHash: sha256(inputCanonical),
    outputHash: sha256(outputCanonical),
    evidenceRefs,
    supervisorEscalationRequired: status === 'MISMATCH',
    details: Object.freeze({
      bindingVersion: intent.bindingVersion,
      intentHash: intent.intentHash,
      checks,
      settlementFinalityAsserted: false,
      realExecutionAsserted: false,
    }),
  });
}

/**
 * Typed PAPER reconciliation. Missing evidence becomes NOT_COMPUTABLE; mismatches remain durable
 * evidence and require supervisor escalation. The function never corrects balances or asserts real
 * settlement/execution.
 */
export function reconcilePaperOrderIntent(
  input: FinTechCorePaperFillReconciliationInput,
): FinTechCoreReconciliationRecord {
  if (!input.reconciliationId.trim() || !Number.isFinite(Date.parse(input.reconciledAt))) {
    throw new Error('[FinTechCore][FT6] reconciliationId and reconciledAt are required.');
  }
  const { intent } = input;
  assertBoundIntent(intent);

  let observedQuantity: FinTechCoreFixedPoint | undefined;
  let observedExecutionPrice: FinTechCoreFixedPoint | undefined;
  let feeEvidence: FinTechCoreFeeEvidence | undefined;
  try {
    observedQuantity = input.observed.quantity
      ? normalizeFinTechCoreFixedPoint(input.observed.quantity, 'observed.quantity', { allowZero: true })
      : undefined;
    observedExecutionPrice = input.observed.executionPrice
      ? normalizeFinTechCoreFixedPoint(input.observed.executionPrice, 'observed.executionPrice')
      : undefined;
    feeEvidence = normalizeFeeEvidence(input.observed.feeEvidence);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '[FinTechCore][FT6] invalid observed reconciliation evidence.');
  }

  const evidenceRefs = uniqueEvidenceRefs(
    input.evidenceRefs,
    feeEvidence?.evidenceRefs ?? [],
    [`order-intent://${intent.orderIntentId}`],
  );
  const hasComputableObservation = Boolean(observedQuantity && observedExecutionPrice && feeEvidence);
  const feeComputable = feeEvidence?.status === 'OBSERVED' || feeEvidence?.status === 'NOT_APPLICABLE';

  let status: FinTechCoreReconciliationStatus;
  const checks = Object.freeze({
    quantityMatches: observedQuantity
      ? finTechCoreFixedPointEquals(intent.quantity, observedQuantity)
      : false,
    priceWithinBounds: observedExecutionPrice
      ? isPriceWithinIntentBounds(intent, observedExecutionPrice)
      : false,
    feeEvidenceComputable: Boolean(feeComputable),
    paperSettlementState: true,
    notExpiredAtReconciliation: !isOrderIntentExpired(intent, input.reconciledAt),
  });

  if (!hasComputableObservation || !feeComputable) {
    status = 'NOT_COMPUTABLE';
  } else if (Object.values(checks).every(Boolean)) {
    status = 'MATCHED';
  } else {
    status = 'MISMATCH';
  }

  const inputHash = sha256({
    reconciliationId: input.reconciliationId,
    orderIntentId: intent.orderIntentId,
    intentHash: intent.intentHash,
    observed: input.observed,
    reconciledAt: input.reconciledAt,
  });
  const outputHash = sha256({ status, checks, evidenceRefs });

  return Object.freeze({
    reconciliationId: input.reconciliationId,
    reconciliationContractVersion: FINTECH_CORE_RECONCILIATION_CONTRACT_VERSION,
    runId: intent.runId,
    traceId: intent.traceId,
    correlationId: intent.correlationId,
    orderIntentId: intent.orderIntentId,
    clientOrderId: intent.clientOrderId,
    venueOrderId: input.observed.venueOrderId,
    reconciliationType: 'ORDER_INTENT_PAPER_FILL' as const,
    status,
    settlementState: 'NOT_APPLICABLE' as const,
    sourceSystem: 'fintech_core.paper_trading',
    targetSystem: 'fintech_core.order_intents',
    assetId: intent.assetId,
    expectedQuantity: intent.quantity,
    observedQuantity,
    expectedPriceBounds: intent.priceBounds,
    observedExecutionPrice,
    feeEvidence,
    observedAt: input.reconciledAt,
    reconciledAt: input.reconciledAt,
    inputHash,
    outputHash,
    evidenceRefs,
    supervisorEscalationRequired: status === 'MISMATCH',
    details: Object.freeze({
      checks,
      settlementFinalityAsserted: false,
      realExecutionAsserted: false,
      autoRepairAttempted: false,
    }),
  });
}
