import type { FinTechCoreWorkflowContext } from '../CoreContracts';
import type { FinTechCoreFixedPoint } from '../Financial/FixedPoint';

export const FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION =
  'fintech-core/portfolio-allocation/0.1.0' as const;

export type FinTechCorePortfolioAllocationStatus =
  | 'PROPOSED'
  | 'NOT_COMPUTABLE'
  | 'BLOCKED';

export type FinTechCorePortfolioAllocationFailureCode =
  | 'MODE_NOT_ALLOWED'
  | 'WORKFLOW_CONTEXT_INVALID'
  | 'PORTFOLIO_ID_REQUIRED'
  | 'PORTFOLIO_ID_MISMATCH'
  | 'POLICY_INVALID'
  | 'POLICY_EVIDENCE_MISSING'
  | 'PORTFOLIO_EVIDENCE_INVALID'
  | 'TARGET_AUTHORITY_MISSING'
  | 'TARGET_EVIDENCE_MISSING'
  | 'DUPLICATE_ASSET'
  | 'QUOTE_ASSET_CONFLICT'
  | 'INVALID_FIXED_POINT'
  | 'PORTFOLIO_BALANCE_MISMATCH'
  | 'TARGET_WEIGHT_INVALID'
  | 'TARGET_WEIGHT_EXCEEDS_ASSET_LIMIT'
  | 'PORTFOLIO_DEPLOYMENT_EXCEEDED'
  | 'CASH_RESERVE_VIOLATION'
  | 'UNSUPPORTED_SHORT_OR_LEVERAGE';

/**
 * External, versioned portfolio-allocation policy snapshot.
 *
 * FinTechCore evaluates these constraints deterministically but does not own the investment
 * objective, suitability assessment, client risk tolerance or strategy logic that produced them.
 * P1 deliberately supports long-only, unlevered target allocations only; short/leverage semantics
 * require a later explicit architecture/security decision.
 */
export interface FinTechCorePortfolioAllocationPolicySnapshot {
  readonly contractVersion: typeof FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly quoteAssetId: string;
  readonly quoteScale: number;
  readonly maxAssetWeightBps: number;
  readonly maxPortfolioDeploymentBps: number;
  readonly minCashReserveBps: number;
  readonly rebalanceThresholdBps: number;
  readonly longOnly: true;
  readonly leverageAllowed: false;
  readonly evidenceRefs: readonly string[];
}

export interface FinTechCorePortfolioPositionEvidence {
  readonly assetId: string;
  readonly marketValue: FinTechCoreFixedPoint;
  readonly evidenceRefs: readonly string[];
}

/**
 * Complete long-only portfolio valuation snapshot used by the deterministic allocator.
 * `cashBalance + sum(position.marketValue)` must equal `totalEquity` exactly at `quoteScale`.
 */
export interface FinTechCorePortfolioEvidenceSnapshot {
  readonly portfolioId: string;
  readonly quoteAssetId: string;
  readonly totalEquity: FinTechCoreFixedPoint;
  readonly cashBalance: FinTechCoreFixedPoint;
  readonly positions: readonly FinTechCorePortfolioPositionEvidence[];
  readonly evidenceAuthorityId: string;
  readonly observedAt: string;
  readonly evidenceRefs: readonly string[];
}

/**
 * Target weights are explicit governed inputs. They are not derived from caller tier/confidence,
 * an LLM, a raw provider value or an implicit score-to-weight formula inside FinTechCore.
 * Authority identity/version make the strategy/allocation source explicit and replay-bindable.
 */
export interface FinTechCorePortfolioTargetAllocation {
  readonly assetId: string;
  readonly targetWeightBps: number;
  readonly targetAuthorityId: string;
  readonly targetAuthorityVersion: string;
  readonly evidenceRefs: readonly string[];
}

export interface FinTechCorePortfolioAllocationInput {
  readonly context: FinTechCoreWorkflowContext;
  readonly evaluatedAt: string;
  readonly policy: FinTechCorePortfolioAllocationPolicySnapshot;
  readonly portfolio: FinTechCorePortfolioEvidenceSnapshot;
  readonly targets: readonly FinTechCorePortfolioTargetAllocation[];
}

export interface FinTechCorePortfolioAllocationDelta {
  readonly assetId: string;
  readonly currentWeightBps: number;
  readonly targetWeightBps: number;
  readonly currentNotional: FinTechCoreFixedPoint;
  readonly targetNotional: FinTechCoreFixedPoint;
  /** Signed target minus current notional. Positive means buy pressure; negative means sell pressure. */
  readonly deltaNotional: FinTechCoreFixedPoint;
  readonly rebalanceRequired: boolean;
  readonly side: 'BUY' | 'SELL' | null;
  readonly evidenceRefs: readonly string[];
}

export interface FinTechCorePortfolioAllocationProposal {
  readonly status: 'PROPOSED';
  readonly allocationContractVersion: typeof FINTECH_CORE_PORTFOLIO_ALLOCATION_CONTRACT_VERSION;
  readonly portfolioId: string;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly decisionVersion: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly quoteAssetId: string;
  readonly quoteScale: number;
  readonly totalTargetWeightBps: number;
  readonly reservedCashWeightBps: number;
  readonly reservedCashNotional: FinTechCoreFixedPoint;
  readonly deltas: readonly FinTechCorePortfolioAllocationDelta[];
  readonly inputHash: string;
  readonly outputHash: string;
  readonly evidenceRefs: readonly string[];
  readonly evaluatedAt: string;
  /** P1 creates an allocation proposal only; FT-5/FT-6 remain the approval/binding authorities. */
  readonly executionHandoffEligible: false;
}

export interface FinTechCorePortfolioAllocationFailure {
  readonly status: 'NOT_COMPUTABLE' | 'BLOCKED';
  readonly code: FinTechCorePortfolioAllocationFailureCode;
  readonly reason: string;
  readonly executionHandoffEligible: false;
}

export type FinTechCorePortfolioAllocationResult =
  | FinTechCorePortfolioAllocationProposal
  | FinTechCorePortfolioAllocationFailure;
