import type { FinTechCoreDecisionOutcome } from '../CoreContracts';
import type { PaperFixedPoint } from '../PaperTrading/PaperTradingContracts';
import {
  FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
  type ComplianceControlId,
  type ExternalControlEvidence,
  type FinTechCoreComplianceGateDecision,
  type FinTechCoreCompliancePolicySnapshot,
  type FinTechCoreGateEvaluation,
  type FinTechCorePreTradeAuthorizationDecision,
  type FinTechCorePreTradeEvaluationInput,
  type FinTechCoreRiskGateDecision,
  type FinTechCoreRiskPolicySnapshot,
  type RiskGateId,
} from './RiskComplianceContracts';

const INTEGER_PATTERN = /^-?(?:0|[1-9]\d*)$/;
const BPS_DENOMINATOR = 10_000n;

function parseFixedPoint(value: PaperFixedPoint, scale: number): bigint | null {
  if (!Number.isInteger(value.scale) || value.scale !== scale || !INTEGER_PATTERN.test(value.atoms)) {
    return null;
  }
  return BigInt(value.atoms);
}

function uniqueRefs(...groups: readonly (readonly string[])[]): readonly string[] {
  return Object.freeze([...new Set(groups.flat().filter((ref) => Boolean(ref.trim())))].sort());
}

function validRefs(refs: readonly string[]): boolean {
  return refs.length > 0 && refs.every((ref) => Boolean(ref.trim()));
}

function validTimestamp(value: string): number | null {
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : null;
}

function ageSeconds(observedAt: string, evaluatedAt: string): number | null {
  const observed = validTimestamp(observedAt);
  const evaluated = validTimestamp(evaluatedAt);
  if (observed === null || evaluated === null || evaluated < observed) return null;
  return Math.floor((evaluated - observed) / 1000);
}

const OUTCOME_PRIORITY: Readonly<Record<FinTechCoreDecisionOutcome, number>> = Object.freeze({
  APPROVED: 0,
  REVIEW_REQUIRED: 1,
  NOT_COMPUTABLE: 2,
  REJECTED: 3,
});

function aggregateOutcome(items: readonly { readonly outcome: FinTechCoreDecisionOutcome }[]): FinTechCoreDecisionOutcome {
  return items.reduce<FinTechCoreDecisionOutcome>(
    (current, item) => OUTCOME_PRIORITY[item.outcome] > OUTCOME_PRIORITY[current] ? item.outcome : current,
    'APPROVED',
  );
}

function gate<TGate extends string>(
  gateId: TGate,
  outcome: FinTechCoreDecisionOutcome,
  reason: string,
  evidenceRefs: readonly string[],
): FinTechCoreGateEvaluation<TGate> {
  return Object.freeze({ gateId, outcome, reason, evidenceRefs: uniqueRefs(evidenceRefs) });
}

function authorityMatches(actual: string, expected: string): boolean {
  return Boolean(actual.trim()) && actual === expected;
}

function invalidRiskPolicy(policy: FinTechCoreRiskPolicySnapshot): string | null {
  if (policy.contractVersion !== FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION) return 'risk policy contract version is invalid';
  if (!policy.policyId.trim() || !policy.policyVersion.trim() || !validRefs(policy.evidenceRefs)) return 'risk policy identity/evidence is incomplete';
  if (!Number.isInteger(policy.quoteScale) || policy.quoteScale < 0 || policy.quoteScale > 18) return 'risk policy quoteScale is invalid';
  const maxOrder = parseFixedPoint(policy.maxOrderNotional, policy.quoteScale);
  const maxExposure = parseFixedPoint(policy.maxGrossExposure, policy.quoteScale);
  if (maxOrder === null || maxExposure === null || maxOrder <= 0n || maxExposure <= 0n) return 'risk policy monetary limits are invalid';
  if (!Number.isInteger(policy.maxDrawdownBps) || policy.maxDrawdownBps < 0 || policy.maxDrawdownBps > 10_000) return 'risk policy maxDrawdownBps is invalid';
  if (!Number.isInteger(policy.minLiquidityCoverageBps) || policy.minLiquidityCoverageBps < 0) return 'risk policy minLiquidityCoverageBps is invalid';
  if (!Number.isInteger(policy.maxMarketDataAgeSeconds) || policy.maxMarketDataAgeSeconds < 0) return 'risk policy maxMarketDataAgeSeconds is invalid';
  if (!Number.isInteger(policy.maxCounterpartyEvidenceAgeSeconds) || policy.maxCounterpartyEvidenceAgeSeconds < 0) return 'risk policy maxCounterpartyEvidenceAgeSeconds is invalid';
  if (!policy.portfolioEvidenceAuthorityId.trim()
    || !policy.liquidityEvidenceAuthorityId.trim()
    || !policy.marketEvidenceAuthorityId.trim()
    || !policy.counterpartyAuthorityId.trim()) {
    return 'risk policy evidence authority bindings are incomplete';
  }
  return null;
}

function evaluateExternalControl<TControl extends string>(
  evidence: ExternalControlEvidence<TControl> | undefined,
  controlId: TControl,
  expectedAuthorityId: string,
  evaluatedAt: string,
  maxAgeSeconds: number,
): FinTechCoreGateEvaluation<TControl> {
  if (!evidence) return gate(controlId, 'NOT_COMPUTABLE', `${controlId} evidence is missing.`, []);
  const refs = evidence.evidenceRefs;
  if (evidence.controlId !== controlId) {
    return gate(controlId, 'NOT_COMPUTABLE', `${controlId} evidence control identity does not match the requested gate.`, refs);
  }
  if (!authorityMatches(evidence.authorityId, expectedAuthorityId)) {
    return gate(controlId, 'NOT_COMPUTABLE', `${controlId} evidence authority does not match the versioned policy binding.`, refs);
  }
  if (!evidence.provider.trim() || !validRefs(refs)) {
    return gate(controlId, 'NOT_COMPUTABLE', `${controlId} evidence provenance is incomplete.`, refs);
  }
  const age = ageSeconds(evidence.observedAt, evaluatedAt);
  if (age === null) return gate(controlId, 'NOT_COMPUTABLE', `${controlId} evidence timestamp is invalid.`, refs);
  if (age > maxAgeSeconds || evidence.state === 'STALE') {
    return gate(controlId, 'NOT_COMPUTABLE', `${controlId} evidence is stale.`, refs);
  }
  switch (evidence.state) {
    case 'PASS':
      return gate(controlId, 'APPROVED', `${controlId} evidence passed.`, refs);
    case 'FAIL':
      return gate(controlId, 'REJECTED', evidence.reason?.trim() || `${controlId} evidence failed.`, refs);
    case 'REVIEW_REQUIRED':
      return gate(controlId, 'REVIEW_REQUIRED', evidence.reason?.trim() || `${controlId} requires review.`, refs);
    case 'MISSING':
      return gate(controlId, 'NOT_COMPUTABLE', evidence.reason?.trim() || `${controlId} evidence is missing.`, refs);
  }
}

export function evaluateDeterministicRiskGates(
  input: Pick<FinTechCorePreTradeEvaluationInput, 'evaluatedAt' | 'riskPolicy' | 'riskEvidence'>,
): FinTechCoreRiskGateDecision {
  const { evaluatedAt, riskPolicy: policy, riskEvidence: evidence } = input;
  const policyError = invalidRiskPolicy(policy);
  const policyRefs = policy.evidenceRefs;
  const riskGateIds: readonly RiskGateId[] = ['ORDER_NOTIONAL', 'GROSS_EXPOSURE', 'DRAWDOWN', 'LIQUIDITY', 'STALENESS', 'COUNTERPARTY'];

  if (policyError) {
    const gates = riskGateIds.map((gateId) => gate(gateId, 'NOT_COMPUTABLE', policyError, policyRefs));
    return Object.freeze({
      contractVersion: FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
      policyId: policy.policyId,
      policyVersion: policy.policyVersion,
      outcome: 'NOT_COMPUTABLE',
      gates: Object.freeze(gates),
      evidenceRefs: uniqueRefs(policyRefs),
      evaluatedAt,
    });
  }

  const scale = policy.quoteScale;
  const orderNotional = parseFixedPoint(evidence.orderNotional, scale);
  const projectedExposure = parseFixedPoint(evidence.projectedGrossExposure, scale);
  const peakEquity = parseFixedPoint(evidence.peakEquity, scale);
  const currentEquity = parseFixedPoint(evidence.currentEquity, scale);
  const availableLiquidity = parseFixedPoint(evidence.availableLiquidity, scale);
  const maxOrder = parseFixedPoint(policy.maxOrderNotional, scale)!;
  const maxExposure = parseFixedPoint(policy.maxGrossExposure, scale)!;

  const gates: FinTechCoreGateEvaluation<RiskGateId>[] = [];

  gates.push(orderNotional === null || orderNotional <= 0n || !validRefs(evidence.orderEvidenceRefs)
    ? gate('ORDER_NOTIONAL', 'NOT_COMPUTABLE', 'order notional/provenance is invalid or incomplete.', evidence.orderEvidenceRefs)
    : orderNotional > maxOrder
      ? gate('ORDER_NOTIONAL', 'REJECTED', 'order notional exceeds the versioned policy limit.', uniqueRefs(policyRefs, evidence.orderEvidenceRefs))
      : gate('ORDER_NOTIONAL', 'APPROVED', 'order notional is within the versioned policy limit.', uniqueRefs(policyRefs, evidence.orderEvidenceRefs)));

  const portfolioAuthorityValid = authorityMatches(
    evidence.portfolioEvidenceAuthorityId,
    policy.portfolioEvidenceAuthorityId,
  ) && validRefs(evidence.portfolioEvidenceRefs);

  gates.push(projectedExposure === null || projectedExposure < 0n || !portfolioAuthorityValid
    ? gate('GROSS_EXPOSURE', 'NOT_COMPUTABLE', 'projected gross exposure authority/provenance is invalid or incomplete.', evidence.portfolioEvidenceRefs)
    : projectedExposure > maxExposure
      ? gate('GROSS_EXPOSURE', 'REJECTED', 'projected gross exposure exceeds the versioned policy limit.', uniqueRefs(policyRefs, evidence.portfolioEvidenceRefs))
      : gate('GROSS_EXPOSURE', 'APPROVED', 'projected gross exposure is within the versioned policy limit.', uniqueRefs(policyRefs, evidence.portfolioEvidenceRefs)));

  if (peakEquity === null || currentEquity === null || peakEquity <= 0n || currentEquity < 0n || !portfolioAuthorityValid) {
    gates.push(gate('DRAWDOWN', 'NOT_COMPUTABLE', 'equity authority/provenance is invalid or incomplete.', evidence.portfolioEvidenceRefs));
  } else {
    const drawdownBps = currentEquity >= peakEquity
      ? 0n
      : ((peakEquity - currentEquity) * BPS_DENOMINATOR + peakEquity - 1n) / peakEquity;
    gates.push(drawdownBps > BigInt(policy.maxDrawdownBps)
      ? gate('DRAWDOWN', 'REJECTED', `drawdown ${drawdownBps} bps exceeds the versioned policy limit.`, uniqueRefs(policyRefs, evidence.portfolioEvidenceRefs))
      : gate('DRAWDOWN', 'APPROVED', `drawdown ${drawdownBps} bps is within the versioned policy limit.`, uniqueRefs(policyRefs, evidence.portfolioEvidenceRefs)));
  }

  const liquidityAuthorityValid = authorityMatches(
    evidence.liquidityEvidenceAuthorityId,
    policy.liquidityEvidenceAuthorityId,
  ) && validRefs(evidence.liquidityEvidenceRefs);

  if (availableLiquidity === null || availableLiquidity < 0n || orderNotional === null || orderNotional <= 0n || !liquidityAuthorityValid) {
    gates.push(gate('LIQUIDITY', 'NOT_COMPUTABLE', 'liquidity authority/provenance is invalid or coverage cannot be computed.', evidence.liquidityEvidenceRefs));
  } else {
    const coverageBps = (availableLiquidity * BPS_DENOMINATOR) / orderNotional;
    gates.push(coverageBps < BigInt(policy.minLiquidityCoverageBps)
      ? gate('LIQUIDITY', 'REJECTED', `liquidity coverage ${coverageBps} bps is below the versioned policy minimum.`, uniqueRefs(policyRefs, evidence.liquidityEvidenceRefs))
      : gate('LIQUIDITY', 'APPROVED', `liquidity coverage ${coverageBps} bps meets the versioned policy minimum.`, uniqueRefs(policyRefs, evidence.liquidityEvidenceRefs)));
  }

  const marketAge = ageSeconds(evidence.marketDataObservedAt, evaluatedAt);
  const marketAuthorityValid = authorityMatches(
    evidence.marketEvidenceAuthorityId,
    policy.marketEvidenceAuthorityId,
  );

  gates.push(marketAge === null || !validRefs(evidence.marketEvidenceRefs) || !marketAuthorityValid
    ? gate('STALENESS', 'NOT_COMPUTABLE', 'market evidence freshness/authority/provenance is incomplete.', evidence.marketEvidenceRefs)
    : marketAge > policy.maxMarketDataAgeSeconds
      ? gate('STALENESS', 'NOT_COMPUTABLE', `market evidence age ${marketAge}s exceeds the versioned policy maximum.`, evidence.marketEvidenceRefs)
      : gate('STALENESS', 'APPROVED', `market evidence age ${marketAge}s is within the versioned policy maximum.`, evidence.marketEvidenceRefs));

  gates.push(evaluateExternalControl(
    evidence.counterparty,
    'COUNTERPARTY' as const,
    policy.counterpartyAuthorityId,
    evaluatedAt,
    policy.maxCounterpartyEvidenceAgeSeconds,
  ));

  const outcome = aggregateOutcome(gates);
  return Object.freeze({
    contractVersion: FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
    policyId: policy.policyId,
    policyVersion: policy.policyVersion,
    outcome,
    gates: Object.freeze(gates),
    evidenceRefs: uniqueRefs(
      policyRefs,
      evidence.orderEvidenceRefs,
      evidence.portfolioEvidenceRefs,
      evidence.liquidityEvidenceRefs,
      evidence.marketEvidenceRefs,
      evidence.counterparty.evidenceRefs,
    ),
    evaluatedAt,
  });
}

function invalidCompliancePolicy(policy: FinTechCoreCompliancePolicySnapshot): string | null {
  if (policy.contractVersion !== FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION) return 'compliance policy contract version is invalid';
  if (!policy.policyId.trim() || !policy.policyVersion.trim() || !validRefs(policy.evidenceRefs)) return 'compliance policy identity/evidence is incomplete';
  if (!Number.isInteger(policy.maxEvidenceAgeSeconds) || policy.maxEvidenceAgeSeconds < 0) return 'compliance maxEvidenceAgeSeconds is invalid';
  if (policy.requiredControls.length === 0) return 'compliance policy must explicitly declare at least one required control';
  if (new Set(policy.requiredControls).size !== policy.requiredControls.length) return 'compliance policy contains duplicate required controls';
  if (policy.requiredControls.some((controlId) => !policy.controlAuthorityIds[controlId]?.trim())) {
    return 'compliance policy must bind every required control to an evidence authority';
  }
  return null;
}

export function evaluateDeterministicComplianceGates(
  input: Pick<FinTechCorePreTradeEvaluationInput, 'evaluatedAt' | 'compliancePolicy' | 'complianceEvidence'>,
): FinTechCoreComplianceGateDecision {
  const { evaluatedAt, compliancePolicy: policy, complianceEvidence: evidence } = input;
  const policyError = invalidCompliancePolicy(policy);
  const requiredControls = [...policy.requiredControls];

  if (policyError) {
    const controls = (requiredControls.length > 0 ? requiredControls : ['AML' as ComplianceControlId])
      .map((controlId) => gate(controlId, 'NOT_COMPUTABLE', policyError, policy.evidenceRefs));
    return Object.freeze({
      contractVersion: FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
      policyId: policy.policyId,
      policyVersion: policy.policyVersion,
      outcome: 'NOT_COMPUTABLE',
      controls: Object.freeze(controls),
      evidenceRefs: uniqueRefs(policy.evidenceRefs),
      evaluatedAt,
    });
  }

  const controls = requiredControls.map((controlId) => evaluateExternalControl(
    evidence.controls[controlId],
    controlId,
    policy.controlAuthorityIds[controlId]!,
    evaluatedAt,
    policy.maxEvidenceAgeSeconds,
  ));
  const outcome = aggregateOutcome(controls);

  return Object.freeze({
    contractVersion: FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
    policyId: policy.policyId,
    policyVersion: policy.policyVersion,
    outcome,
    controls: Object.freeze(controls),
    evidenceRefs: uniqueRefs(policy.evidenceRefs, ...controls.map((item) => item.evidenceRefs)),
    evaluatedAt,
  });
}

/**
 * FT-5 evaluates and records Risk/Compliance decisions only. It deliberately never makes an
 * OrderIntent execution-handoff eligible; approval binding to OrderIntent is an FT-6 concern.
 */
export function evaluatePreTradeAuthorization(
  input: FinTechCorePreTradeEvaluationInput,
): FinTechCorePreTradeAuthorizationDecision {
  const risk = evaluateDeterministicRiskGates(input);
  const compliance = evaluateDeterministicComplianceGates(input);

  return Object.freeze({
    contractVersion: FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION,
    risk,
    compliance,
    executionHandoffEligible: false as const,
    evaluatedAt: input.evaluatedAt,
  });
}
