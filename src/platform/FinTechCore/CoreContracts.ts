import type { UniversalAssetIdentity } from '../Scoring/contracts';

export const FINTECH_CORE_CONTRACT_VERSION = 'fintech-core/contracts/0.1.0' as const;

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

/**
 * Intent contract only. Creation/signing/execution is intentionally absent in FT-0.
 * A future execution adapter must additionally prove Risk=APPROVED and Compliance=APPROVED.
 */
export interface FinTechCoreOrderIntent {
  readonly contractVersion: typeof FINTECH_CORE_CONTRACT_VERSION;
  readonly orderIntentId: string;
  readonly runId: string;
  readonly traceId: string;
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly assetId: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly orderType: 'MARKET' | 'LIMIT' | 'POST_ONLY' | 'IOC' | 'FOK' | 'TWAP' | 'VWAP';
  readonly limitPrice?: number;
  readonly maxSlippageBps: number;
  readonly strategyId?: string;
  readonly portfolioId?: string;
  readonly decisionVersion: string;
  readonly riskApproval: FinTechCoreApprovalState;
  readonly complianceApproval: FinTechCoreApprovalState;
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
    realExecutionAllowed: true,
    simulatedExecutionAllowed: true,
    newOrdersAllowed: true,
  },
  PRODUCTION: {
    realExecutionAllowed: true,
    simulatedExecutionAllowed: true,
    newOrdersAllowed: true,
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
 * Fail-closed guard for future real execution adapters.
 * This is not a risk/compliance engine; it only enforces the orchestration contract that both
 * authoritative approvals must already exist and the current mode must permit real execution.
 */
export function isOrderIntentEligibleForRealExecution(
  intent: FinTechCoreOrderIntent,
  operatingMode: FinTechCoreOperatingMode,
): boolean {
  const mode = FINTECH_CORE_OPERATING_MODE_POLICY[operatingMode];
  return mode.realExecutionAllowed
    && mode.newOrdersAllowed
    && intent.effectClass === 'SIDE_EFFECTING'
    && intent.riskApproval === 'APPROVED'
    && intent.complianceApproval === 'APPROVED';
}
