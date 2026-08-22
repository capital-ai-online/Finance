import type { UniversalAssetIdentity } from '../Scoring/contracts';
import type { FinTechCoreFixedPoint } from './Financial/FixedPoint';

export const FINTECH_CORE_CONTRACT_VERSION = 'fintech-core/contracts/0.1.0' as const;
export const FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION =
  'fintech-core/order-intent/0.2.0' as const;

export type FinTechCoreOperatingMode =
  | 'RESEARCH'
  | 'PAPER'
  | 'GUARDED_LIVE'
  | 'PRODUCTION'
  | 'EMERGENCY';

/**
 * RETRY_SAFE means the operation is side-effect free or has deterministic replay semantics.
 * SIDE_EFFECTING means the operation can alter external financial state and must not be retried
 * unless an end-to-end idempotency/recovery contract has been proven for that adapter.
 */
export type FinTechCoreEffectClass = 'RETRY_SAFE' | 'SIDE_EFFECTING';

export type FinTechCoreWorkflowStatus =
  | 'CREATED'
  | 'RUNNING'
  | 'WAITING_FOR_APPROVAL'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED'
  | 'EMERGENCY_STOPPED';

export interface FinTechCoreWorkflowContext {
  readonly contractVersion: typeof FINTECH_CORE_CONTRACT_VERSION;
  readonly moduleId: string;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly strategyId?: string;
  readonly portfolioId?: string;
  readonly decisionVersion: string;
  readonly operatingMode: FinTechCoreOperatingMode;
  readonly asset: UniversalAssetIdentity;
  readonly startedAt: string;
}

export interface FinTechCoreDomainEvent<TPayload extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>> {
  readonly contractVersion: typeof FINTECH_CORE_CONTRACT_VERSION;
  readonly eventId: string;
  readonly eventType: string;
  readonly eventVersion: string;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly moduleId: string;
  readonly assetId: string;
  readonly decisionVersion: string;
  readonly occurredAt: string;
  readonly evidenceRefs: readonly string[];
  readonly payload: TPayload;
}

export type FinTechCoreDecisionOutcome = 'APPROVED' | 'REJECTED' | 'NOT_COMPUTABLE' | 'REVIEW_REQUIRED';

export interface FinTechCoreDecisionRecord {
  readonly contractVersion: typeof FINTECH_CORE_CONTRACT_VERSION;
  readonly decisionId: string;
  readonly decisionType: string;
  readonly decisionVersion: string;
  readonly outcome: FinTechCoreDecisionOutcome;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly moduleId: string;
  readonly assetId: string;
  readonly policyId?: string;
  readonly policyVersion?: string;
  readonly inputHash: string;
  readonly outputHash: string;
  readonly evidenceRefs: readonly string[];
  readonly decidedAt: string;
}

export type FinTechCoreApprovalState = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type FinTechCoreOrderIntentBindingState = 'UNBOUND' | 'BOUND';

export interface FinTechCoreOrderPriceBounds {
  readonly limitPrice?: FinTechCoreFixedPoint;
  readonly minPrice?: FinTechCoreFixedPoint;
  readonly maxPrice?: FinTechCoreFixedPoint;
}

/**
 * Single canonical OrderIntent contract. FT-6B extends the FT-3 scaffold in place rather than
 * introducing a competing bound-intent type. Every execution-relevant quantity/price uses the
 * canonical `atoms + scale` fixed-point representation.
 *
 * `bindingState=UNBOUND` represents legacy/research persistence evidence only. A BOUND intent must
 * be produced by the deterministic FT-6 binder, which derives approvals, client-order identity and
 * idempotency from authoritative FT-5 decisions. Neither state authorizes real execution in FT-6.
 */
export interface FinTechCoreOrderIntent {
  readonly contractVersion: typeof FINTECH_CORE_CONTRACT_VERSION;
  readonly orderIntentContractVersion: typeof FINTECH_CORE_ORDER_INTENT_CONTRACT_VERSION;
  readonly bindingState: FinTechCoreOrderIntentBindingState;
  readonly bindingVersion?: string;
  readonly orderIntentId: string;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly clientOrderId?: string;
  readonly assetId: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: FinTechCoreFixedPoint;
  readonly orderType: 'MARKET' | 'LIMIT' | 'POST_ONLY' | 'IOC' | 'FOK' | 'TWAP' | 'VWAP';
  readonly priceBounds: FinTechCoreOrderPriceBounds;
  readonly maxSlippageBps: number;
  readonly strategyId?: string;
  readonly portfolioId?: string;
  readonly decisionVersion: string;
  readonly riskApproval: FinTechCoreApprovalState;
  readonly complianceApproval: FinTechCoreApprovalState;
  readonly riskDecisionId?: string;
  readonly riskDecisionHash?: string;
  readonly riskPolicyId?: string;
  readonly riskPolicyVersion?: string;
  readonly complianceDecisionId?: string;
  readonly complianceDecisionHash?: string;
  readonly compliancePolicyId?: string;
  readonly compliancePolicyVersion?: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly intentHash: string;
  readonly effectClass: 'SIDE_EFFECTING';
}

export interface FinTechCoreModuleDescriptor {
  readonly moduleId: string;
  readonly moduleVersion: string;
  readonly supportedAssetClasses: readonly UniversalAssetIdentity['assetClass'][];
  readonly supportedOperatingModes: readonly FinTechCoreOperatingMode[];
}

export interface FinTechCoreModule {
  readonly descriptor: FinTechCoreModuleDescriptor;
}

/**
 * Effective FT-6 operating-mode policy.
 *
 * GUARDED_LIVE and PRODUCTION remain vocabulary reserved for FT-7+ forward compatibility, but
 * they intentionally expose no order or execution capability until a separately reviewed
 * architecture/security decision changes this policy. Keeping the declarative policy fail-closed
 * prevents future callers from inferring a capability that the FT-6 execution gate does not grant.
 */
export const FINTECH_CORE_OPERATING_MODE_POLICY = Object.freeze({
  RESEARCH: {
    realExecutionAllowed: false,
    simulatedExecutionAllowed: false,
    newOrdersAllowed: false,
  },
  PAPER: {
    realExecutionAllowed: false,
    simulatedExecutionAllowed: true,
    newOrdersAllowed: true,
  },
  GUARDED_LIVE: {
    realExecutionAllowed: false,
    simulatedExecutionAllowed: false,
    newOrdersAllowed: false,
  },
  PRODUCTION: {
    realExecutionAllowed: false,
    simulatedExecutionAllowed: false,
    newOrdersAllowed: false,
  },
  EMERGENCY: {
    realExecutionAllowed: false,
    simulatedExecutionAllowed: false,
    newOrdersAllowed: false,
  },
} as const satisfies Readonly<Record<FinTechCoreOperatingMode, {
  readonly realExecutionAllowed: boolean;
  readonly simulatedExecutionAllowed: boolean;
  readonly newOrdersAllowed: boolean;
}>>);

/**
 * FT-6 hard block. Contract-level modes are retained for forward compatibility, but Crypto Module
 * 01 does not gain a real-execution handoff before the separately reviewed FT-7 cutover.
 */
export function isOrderIntentEligibleForRealExecution(
  intent: FinTechCoreOrderIntent,
  operatingMode: FinTechCoreOperatingMode,
): boolean {
  void intent;
  void operatingMode;
  return false;
}
