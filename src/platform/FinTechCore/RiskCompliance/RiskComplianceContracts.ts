import type {
  FinTechCoreDecisionOutcome,
  FinTechCoreOrderIntent,
  FinTechCoreWorkflowContext,
} from '../CoreContracts';
import type { PaperFixedPoint } from '../PaperTrading/PaperTradingContracts';

export const FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION =
  'fintech-core/risk-compliance/0.1.0' as const;

export const FINTECH_CORE_RISK_DECISION_TYPE = 'PRE_TRADE_RISK_GATE' as const;
export const FINTECH_CORE_COMPLIANCE_DECISION_TYPE = 'PRE_TRADE_COMPLIANCE_GATE' as const;

export type RiskGateId =
  | 'ORDER_NOTIONAL'
  | 'GROSS_EXPOSURE'
  | 'DRAWDOWN'
  | 'LIQUIDITY'
  | 'STALENESS'
  | 'COUNTERPARTY';

export type ComplianceControlId =
  | 'KYC'
  | 'KYB'
  | 'AML'
  | 'SANCTIONS'
  | 'WALLET_SCREENING'
  | 'JURISDICTION'
  | 'TRAVEL_RULE';

export type ExternalControlState =
  | 'PASS'
  | 'FAIL'
  | 'MISSING'
  | 'STALE'
  | 'REVIEW_REQUIRED';

export interface ExternalControlEvidence<TControl extends string = string> {
  readonly controlId: TControl;
  readonly state: ExternalControlState;
  readonly provider: string;
  readonly observedAt: string;
  readonly evidenceRefs: readonly string[];
  readonly reason?: string;
}

/**
 * Thresholds are supplied by an external, versioned policy authority. FinTechCore evaluates the
 * snapshot deterministically but does not own the business/regulatory truth behind the values.
 */
export interface FinTechCoreRiskPolicySnapshot {
  readonly contractVersion: typeof FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly quoteScale: number;
  readonly maxOrderNotional: PaperFixedPoint;
  readonly maxGrossExposure: PaperFixedPoint;
  readonly maxDrawdownBps: number;
  readonly minLiquidityCoverageBps: number;
  readonly maxMarketDataAgeSeconds: number;
  readonly maxCounterpartyEvidenceAgeSeconds: number;
  readonly evidenceRefs: readonly string[];
}

export interface FinTechCoreRiskEvidenceSnapshot {
  readonly orderNotional: PaperFixedPoint;
  readonly projectedGrossExposure: PaperFixedPoint;
  readonly peakEquity: PaperFixedPoint;
  readonly currentEquity: PaperFixedPoint;
  readonly availableLiquidity: PaperFixedPoint;
  readonly marketDataObservedAt: string;
  readonly marketEvidenceRefs: readonly string[];
  readonly counterparty: ExternalControlEvidence<'COUNTERPARTY'>;
}

/**
 * `requiredControls` is intentionally explicit. FinTechCore does not infer whether KYC, KYB,
 * Travel Rule or another control is legally required for a transaction or jurisdiction.
 */
export interface FinTechCoreCompliancePolicySnapshot {
  readonly contractVersion: typeof FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly requiredControls: readonly ComplianceControlId[];
  readonly maxEvidenceAgeSeconds: number;
  readonly evidenceRefs: readonly string[];
}

export interface FinTechCoreComplianceEvidenceSnapshot {
  readonly controls: Readonly<Partial<Record<ComplianceControlId, ExternalControlEvidence<ComplianceControlId>>>>;
}

export interface FinTechCoreGateEvaluation<TGate extends string = string> {
  readonly gateId: TGate;
  readonly outcome: FinTechCoreDecisionOutcome;
  readonly reason: string;
  readonly evidenceRefs: readonly string[];
}

export interface FinTechCoreRiskGateDecision {
  readonly contractVersion: typeof FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly outcome: FinTechCoreDecisionOutcome;
  readonly gates: readonly FinTechCoreGateEvaluation<RiskGateId>[];
  readonly evidenceRefs: readonly string[];
  readonly evaluatedAt: string;
}

export interface FinTechCoreComplianceGateDecision {
  readonly contractVersion: typeof FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly outcome: FinTechCoreDecisionOutcome;
  readonly controls: readonly FinTechCoreGateEvaluation<ComplianceControlId>[];
  readonly evidenceRefs: readonly string[];
  readonly evaluatedAt: string;
}

export interface FinTechCorePreTradeAuthorizationDecision {
  readonly contractVersion: typeof FINTECH_CORE_RISK_COMPLIANCE_CONTRACT_VERSION;
  readonly risk: FinTechCoreRiskGateDecision;
  readonly compliance: FinTechCoreComplianceGateDecision;
  readonly executionHandoffEligible: boolean;
  readonly evaluatedAt: string;
}

export interface FinTechCorePreTradeEvaluationInput {
  readonly context: FinTechCoreWorkflowContext;
  readonly evaluatedAt: string;
  readonly riskPolicy: FinTechCoreRiskPolicySnapshot;
  readonly riskEvidence: FinTechCoreRiskEvidenceSnapshot;
  readonly compliancePolicy: FinTechCoreCompliancePolicySnapshot;
  readonly complianceEvidence: FinTechCoreComplianceEvidenceSnapshot;
}

export type FinTechCoreAuthorizedOrderIntent = Omit<
  FinTechCoreOrderIntent,
  'riskApproval' | 'complianceApproval'
> & {
  readonly riskApproval: 'APPROVED';
  readonly complianceApproval: 'APPROVED';
};

export type FinTechCoreOrderIntentAuthorizationResult =
  | {
      readonly status: 'AUTHORIZED';
      readonly intent: FinTechCoreAuthorizedOrderIntent;
    }
  | {
      readonly status: 'BLOCKED';
      readonly reason: string;
    };

/**
 * Integration point only. Concrete KYC/KYB/AML/Sanctions/Wallet/Jurisdiction providers remain
 * outside FinTechCore and must return attributable evidence rather than an LLM-generated guess.
 */
export interface FinTechCoreComplianceEvidenceProviderPort {
  evaluateControl(input: Readonly<{
    context: FinTechCoreWorkflowContext;
    controlId: ComplianceControlId;
    evaluatedAt: string;
  }>): Promise<ExternalControlEvidence<ComplianceControlId>>;
}
