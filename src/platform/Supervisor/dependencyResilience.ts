import {
  evaluateRemediationEligibility,
  getRemediationAction,
  getRemediationPolicy,
  resolveConvergence,
  type ConvergenceResult,
  type FindingClass,
  type IdempotencyClass,
  type RemediationActionId,
  type VerificationResult,
} from './selfHealingContract';
import type { ProviderHealthRecord } from './providerHealth';

export const DEPENDENCY_RESILIENCE_CONTRACT_VERSION = 'dependency-resilience/1.0.0' as const;

export type DependencyResilienceOwner =
  | 'DEPENDENCY_NATIVE'
  | 'SUPERVISOR_SAFE_RETRY'
  | 'NO_AUTOMATIC_RETRY';

export interface DependencyOperationContract {
  dependencyId: string;
  capability: string;
  idempotencyClass: IdempotencyClass;
  resilienceOwner: DependencyResilienceOwner;
}

export interface DependencyRecoveryOptions {
  killSwitchActive?: boolean;
  nowMs?: () => number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

export interface DependencyRecoveryEvidence {
  contractVersion: typeof DEPENDENCY_RESILIENCE_CONTRACT_VERSION;
  dependencyId: string;
  capability: string;
  actionId: RemediationActionId;
  resilienceOwner: DependencyResilienceOwner;
  idempotencyClass: IdempotencyClass;
  attempts: number;
  delayMs: number[];
  delegatedNativeResilience: boolean;
  verification: VerificationResult;
  convergence: ConvergenceResult;
  error?: string;
}

export type DependencyRecoveryResult<T> =
  | { status: 'CONVERGED'; value: T; evidence: DependencyRecoveryEvidence }
  | { status: 'NOT_CONVERGED'; value?: T; evidence: DependencyRecoveryEvidence }
  | { status: 'BLOCKED'; reason: string; evidence?: Partial<DependencyRecoveryEvidence> };

export interface ProviderResilienceProjection {
  provider: string;
  capability: string;
  state: ProviderHealthRecord['state'];
  findingClass: FindingClass | null;
  contractPreferredActionId: RemediationActionId | null;
  effectiveActionId: RemediationActionId | null;
  resilienceOwner: 'DEPENDENCY_NATIVE';
  circuitOpen: boolean;
  lastKnownGoodObserved: boolean;
  payloadUsable: boolean | null;
  consecutiveFailures: number;
  diagnosticCode: ProviderHealthRecord['diagnosticCode'];
  evidenceState: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function boundedRandom(random: () => number): number {
  const value = random();
  if (!Number.isFinite(value)) return 0;
  return Math.min(0.999999, Math.max(0, value));
}

export function retryDelayMs(baseMs: number, attempt: number, random: () => number = Math.random): number {
  const safeBase = Math.max(0, Math.floor(baseMs));
  const safeAttempt = Math.max(1, Math.floor(attempt));
  const exponential = safeBase * 2 ** (safeAttempt - 1);
  const jitterCeiling = Math.min(Math.max(1, safeBase), 250);
  return exponential + Math.floor(boundedRandom(random) * jitterCeiling);
}

async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`dependency recovery timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export function isRetrySafeIdempotency(idempotencyClass: IdempotencyClass): boolean {
  return idempotencyClass === 'READ_ONLY' || idempotencyClass === 'IDEMPOTENT';
}

/**
 * Contract-bound generic retry executor.
 *
 * RETRY_SAFE_OPERATION is enabled only for READ_ONLY or explicitly IDEMPOTENT
 * SUPERVISOR_SAFE_RETRY operations under self-healing-contract/1.2.0. Existing
 * provider-native resilience continues to own its own retry/circuit/LKG loop and
 * must never be wrapped by this executor.
 */
export async function executeContractBoundDependencyRecovery<T>(
  contract: DependencyOperationContract,
  operation: (attempt: number) => Promise<T>,
  verify: (value: T) => Promise<VerificationResult> | VerificationResult,
  options: DependencyRecoveryOptions = {},
): Promise<DependencyRecoveryResult<T>> {
  const action = getRemediationAction('RETRY_SAFE_OPERATION');
  const nowMs = options.nowMs ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;

  if (!contract.dependencyId.trim() || !contract.capability.trim()) {
    return { status: 'BLOCKED', reason: 'DEPENDENCY_IDENTITY_REQUIRED' };
  }
  if (!isRetrySafeIdempotency(contract.idempotencyClass)) {
    return { status: 'BLOCKED', reason: 'UNSAFE_OPERATION_CLASS' };
  }
  if (contract.resilienceOwner === 'DEPENDENCY_NATIVE') {
    return { status: 'BLOCKED', reason: 'DEPENDENCY_NATIVE_RESILIENCE_OWNS_RETRY' };
  }
  if (contract.resilienceOwner === 'NO_AUTOMATIC_RETRY') {
    return { status: 'BLOCKED', reason: 'AUTOMATIC_RETRY_NOT_PERMITTED' };
  }

  const eligibility = evaluateRemediationEligibility({
    findingClass: 'DEPENDENCY_TRANSIENT',
    actionId: 'RETRY_SAFE_OPERATION',
    attemptsUsed: 0,
    nowMs: nowMs(),
    killSwitchActive: options.killSwitchActive === true,
    capabilityAuthorized: true,
    verificationAvailable: true,
    operationIdempotency: contract.idempotencyClass,
  });
  if (eligibility.state === 'BLOCKED') {
    return {
      status: 'BLOCKED',
      reason: eligibility.reason,
      evidence: {
        contractVersion: DEPENDENCY_RESILIENCE_CONTRACT_VERSION,
        dependencyId: contract.dependencyId,
        capability: contract.capability,
        actionId: 'RETRY_SAFE_OPERATION',
        resilienceOwner: contract.resilienceOwner,
        idempotencyClass: contract.idempotencyClass,
      },
    };
  }

  const delays: number[] = [];
  let lastValue: T | undefined;
  let lastError: string | undefined;
  let lastVerification: VerificationResult = {
    status: 'NOT_RUN',
    probe: action.verificationProbe,
  };

  for (let attempt = 1; attempt <= action.budget.maxAttempts; attempt += 1) {
    try {
      const value = await withTimeout(() => operation(attempt), action.budget.timeoutMs);
      lastValue = value;
      lastVerification = await verify(value);
      const convergence = resolveConvergence('RETRY_SAFE_OPERATION', lastVerification, attempt);
      const evidence: DependencyRecoveryEvidence = {
        contractVersion: DEPENDENCY_RESILIENCE_CONTRACT_VERSION,
        dependencyId: contract.dependencyId,
        capability: contract.capability,
        actionId: 'RETRY_SAFE_OPERATION',
        resilienceOwner: contract.resilienceOwner,
        idempotencyClass: contract.idempotencyClass,
        attempts: attempt,
        delayMs: [...delays],
        delegatedNativeResilience: false,
        verification: { ...lastVerification },
        convergence,
        ...(lastError ? { error: lastError } : {}),
      };
      if (convergence.converged) return { status: 'CONVERGED', value, evidence };
      if (lastVerification.status === 'BLOCKED' || lastVerification.status === 'NOT_RUN') {
        return { status: 'NOT_CONVERGED', value, evidence };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      lastVerification = {
        status: 'FAIL',
        probe: action.verificationProbe,
        evidenceRef: 'operation-error',
      };
    }

    if (attempt < action.budget.maxAttempts) {
      const delay = retryDelayMs(action.budget.cooldownMs, attempt, random);
      delays.push(delay);
      await sleep(delay);
    }
  }

  const convergence = resolveConvergence(
    'RETRY_SAFE_OPERATION',
    lastVerification,
    action.budget.maxAttempts,
  );
  const evidence: DependencyRecoveryEvidence = {
    contractVersion: DEPENDENCY_RESILIENCE_CONTRACT_VERSION,
    dependencyId: contract.dependencyId,
    capability: contract.capability,
    actionId: 'RETRY_SAFE_OPERATION',
    resilienceOwner: contract.resilienceOwner,
    idempotencyClass: contract.idempotencyClass,
    attempts: action.budget.maxAttempts,
    delayMs: delays,
    delegatedNativeResilience: false,
    verification: lastVerification,
    convergence,
    ...(lastError ? { error: lastError } : {}),
  };
  return {
    status: 'NOT_CONVERGED',
    ...(lastValue !== undefined ? { value: lastValue } : {}),
    evidence,
  };
}

function circuitIsOpen(record: ProviderHealthRecord, nowMs: number): boolean {
  if (!record.circuitOpenUntil) return false;
  const until = Date.parse(record.circuitOpenUntil);
  return Number.isFinite(until) && until > nowMs;
}

/**
 * Normalizes provider-owned resilience into the canonical Self-Healing finding model.
 * Provider-native retry/circuit/LKG remains the executor; the Supervisor observes it
 * and never schedules a second nested retry loop.
 */
export function projectProviderResilience(
  record: ProviderHealthRecord,
  nowMs = Date.now(),
): ProviderResilienceProjection {
  const circuitOpen = circuitIsOpen(record, nowMs);
  const lastKnownGoodObserved = String(record.cacheMode || '').toLowerCase() === 'last-known-good';

  let findingClass: FindingClass | null = null;
  if (record.state === 'healthy') {
    findingClass = null;
  } else if (circuitOpen) {
    findingClass = 'PROVIDER_CIRCUIT_OPEN';
  } else if (record.diagnosticCode === 'auth_error') {
    findingClass = 'SECURITY_OR_POLICY_BLOCKED';
  } else if (record.diagnosticCode === 'schema_error' || record.diagnosticCode === 'not_configured') {
    findingClass = 'DEPENDENCY_PERSISTENT';
  } else if (record.state === 'unavailable' || record.consecutiveFailures >= 3) {
    findingClass = 'DEPENDENCY_PERSISTENT';
  } else {
    findingClass = 'DEPENDENCY_TRANSIENT';
  }

  const contractPreferredActionId = findingClass
    ? getRemediationPolicy(findingClass).preferredActionId
    : null;

  return {
    provider: record.provider,
    capability: record.capability,
    state: record.state,
    findingClass,
    contractPreferredActionId,
    effectiveActionId: findingClass ? 'OBSERVE_ONLY' : null,
    resilienceOwner: 'DEPENDENCY_NATIVE',
    circuitOpen,
    lastKnownGoodObserved,
    payloadUsable: record.payloadUsable ?? null,
    consecutiveFailures: record.consecutiveFailures,
    diagnosticCode: record.diagnosticCode,
    evidenceState:
      record.state === 'healthy'
        ? 'HEALTHY'
        : record.state === 'degraded'
          ? 'DEGRADED'
          : 'UNAVAILABLE',
  };
}

export interface DependencyResilienceSnapshot {
  version: typeof DEPENDENCY_RESILIENCE_CONTRACT_VERSION;
  valid: boolean;
  genericSafeRetryActivation: 'ENABLED' | 'HELD';
  automaticGenericRetryEnabled: boolean;
  maxAttempts: number;
  cooldownMs: number;
  timeoutMs: number;
}

export function getDependencyResilienceSnapshot(): DependencyResilienceSnapshot {
  const action = getRemediationAction('RETRY_SAFE_OPERATION');
  const valid =
    action.tier === 'SH-1'
    && action.idempotencyClass === 'IDEMPOTENT'
    && action.budget.maxAttempts > 0
    && action.budget.cooldownMs >= 0
    && action.budget.timeoutMs > 0
    && action.verificationProbe === 'dependency-operation-readback';

  return {
    version: DEPENDENCY_RESILIENCE_CONTRACT_VERSION,
    valid,
    genericSafeRetryActivation: action.activation,
    automaticGenericRetryEnabled: action.activation === 'ENABLED',
    maxAttempts: action.budget.maxAttempts,
    cooldownMs: action.budget.cooldownMs,
    timeoutMs: action.budget.timeoutMs,
  };
}
