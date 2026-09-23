import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getFaultInjectionSuiteSnapshot,
  REQUIRED_SH_02_10_SCENARIOS,
  SH_02_10_FAULT_MATRIX,
} from '../../src/platform/Supervisor/faultInjectionConvergence';
import {
  evaluateRemediationEligibility,
  getRemediationAction,
  getRemediationPolicy,
  resolveConvergence,
} from '../../src/platform/Supervisor/selfHealingContract';
import { projectProviderResilience } from '../../src/platform/Supervisor/dependencyResilience';
import {
  consumeAutomaticFrontendRecovery,
  type RecoveryStorage,
} from '../../src/app/reliability/frontendRecovery';
import {
  fetchWithBoundedFrontendRetry,
  isRetryableFrontendStatus,
} from '../../src/app/reliability/frontendDegradedMode';
import {
  getProcessHealthSnapshot,
  markProcessFatal,
  resetProcessHealthForTests,
} from '../../server/runtime/processHealth';
import { buildProcessLivenessSnapshot } from '../../server/routes/health';

class MemoryStorage implements RecoveryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('SH-02.10 fault injection and convergence suite', () => {
  afterEach(() => {
    resetProcessHealthForTests();
    vi.restoreAllMocks();
  });

  it('contains every required deterministic scenario and keeps protected actions held', () => {
    const snapshot = getFaultInjectionSuiteSnapshot();

    expect(snapshot).toMatchObject({
      complete: true,
      protectedActionsHeld: true,
      productionFaultsEnabled: false,
      independentAssurance: ['QM', 'SECURITY'],
    });
    expect(snapshot.scenarioCount).toBe(REQUIRED_SH_02_10_SCENARIOS.length);
    expect(SH_02_10_FAULT_MATRIX.map(item => item.id)).toEqual(
      expect.arrayContaining([...REQUIRED_SH_02_10_SCENARIOS]),
    );
    expect(getRemediationAction('RUNTIME_PROCESS_RECYCLE').activation).toBe('HELD');
    expect(getRemediationAction('REDEPLOY_EXACT_SHA').activation).toBe('HELD');
    expect(getRemediationAction('PROTECTED_ROLLBACK_RESTORE').activation).toBe('HELD');
  });

  it('PROCESS_FATAL: latches unhealthy liveness without executing runtime recycle', () => {
    markProcessFatal('uncaughtException', '2026-09-22T11:30:00.000Z');

    expect(getProcessHealthSnapshot()).toMatchObject({
      healthy: false,
      fatalSource: 'uncaughtException',
    });

    const liveness = buildProcessLivenessSnapshot({
      now: new Date('2026-09-22T11:30:01.000Z'),
      uptimeSeconds: 42,
      processHealth: getProcessHealthSnapshot(),
      configured: { supabase: true, anthropic: true, openai: true },
    });

    expect(liveness.status).toBe('unhealthy');
    expect(liveness.healthy).toBe(false);
    expect(getRemediationPolicy('PROCESS_FATAL').preferredActionId).toBe('RUNTIME_PROCESS_RECYCLE');

    const eligibility = evaluateRemediationEligibility({
      findingClass: 'PROCESS_FATAL',
      actionId: 'RUNTIME_PROCESS_RECYCLE',
      attemptsUsed: 0,
      nowMs: 0,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
    });
    expect(eligibility).toMatchObject({ state: 'BLOCKED', reason: 'ACTION_HELD' });
  });

  it('provider transient and persistent faults converge to owner-correct finding classes', () => {
    const transient = projectProviderResilience({
      provider: 'MockProvider',
      capability: 'quotes',
      state: 'degraded',
      diagnosticCode: 'transport_error',
      lastObservedAt: '2026-09-22T11:30:00.000Z',
      consecutiveFailures: 1,
    });

    const persistent = projectProviderResilience({
      provider: 'MockProvider',
      capability: 'quotes',
      state: 'unavailable',
      diagnosticCode: 'schema_error',
      lastObservedAt: '2026-09-22T11:30:00.000Z',
      consecutiveFailures: 3,
    });

    expect(transient).toMatchObject({
      findingClass: 'DEPENDENCY_TRANSIENT',
      contractPreferredActionId: 'RETRY_SAFE_OPERATION',
      effectiveActionId: 'OBSERVE_ONLY',
      resilienceOwner: 'DEPENDENCY_NATIVE',
    });
    expect(persistent).toMatchObject({
      findingClass: 'DEPENDENCY_PERSISTENT',
      contractPreferredActionId: 'OBSERVE_ONLY',
      effectiveActionId: 'OBSERVE_ONLY',
    });
  });

  it('WORKER_STALL: maps to quarantine while generic quarantine action remains held', () => {
    const policy = getRemediationPolicy('WORKER_STALLED');
    expect(policy).toMatchObject({
      preferredActionId: 'QUARANTINE_WORK_ITEM',
      blockedState: 'QUARANTINED',
    });

    const eligibility = evaluateRemediationEligibility({
      findingClass: 'WORKER_STALLED',
      actionId: 'QUARANTINE_WORK_ITEM',
      attemptsUsed: 0,
      nowMs: 0,
      killSwitchActive: false,
      capabilityAuthorized: true,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(eligibility).toMatchObject({ state: 'BLOCKED', reason: 'ACTION_HELD' });
  });

  it('FRONTEND_STALE_CHUNK: allows exactly one automatic recovery per fingerprint', () => {
    const storage = new MemoryStorage();
    const error = new Error('Failed to fetch dynamically imported module: /assets/app.12345678.js');

    const first = consumeAutomaticFrontendRecovery(storage, error, '/dashboard');
    const second = consumeAutomaticFrontendRecovery(storage, error, '/dashboard');

    expect(first).toMatchObject({
      recoverable: true,
      shouldReload: true,
      reason: 'BUDGET_AVAILABLE',
    });
    expect(second).toMatchObject({
      recoverable: true,
      shouldReload: false,
      reason: 'BUDGET_EXHAUSTED',
    });
  });

  it('FRONTEND_RENDER_FAILURE: persistent render defects never enter automatic reload', () => {
    const decision = consumeAutomaticFrontendRecovery(
      new MemoryStorage(),
      new Error('Invariant failed while rendering portfolio widget'),
      '/portfolio',
    );

    expect(decision).toEqual({
      recoverable: false,
      shouldReload: false,
      fingerprint: null,
      reason: 'NOT_RECOVERABLE',
    });
    expect(getRemediationPolicy('FRONTEND_RENDER_FAILURE').preferredActionId).toBe('OBSERVE_ONLY');
  });

  it('PR #1294 optional init rejection is classified fail-closed without automatic remediation', () => {
    const scenario = SH_02_10_FAULT_MATRIX.find(
      item => item.id === 'FRONTEND_OPTIONAL_INIT_REJECTION',
    );

    expect(scenario).toMatchObject({
      surface: 'FRONTEND_MODEL',
      findingClass: 'FRONTEND_OPTIONAL_INIT_FAILURE',
      actionId: 'OBSERVE_ONLY',
      expectedTerminalState: 'ESCALATED',
      protectedMutationAllowed: false,
      productionFaultAllowed: false,
    });
    expect(getRemediationPolicy('FRONTEND_OPTIONAL_INIT_FAILURE')).toMatchObject({
      preferredActionId: 'OBSERVE_ONLY',
      allowedActionIds: ['OBSERVE_ONLY'],
    });
  });

  it('PR #1294 stale runtime expectation reuses the bounded repository expectation repair path', () => {
    const scenario = SH_02_10_FAULT_MATRIX.find(
      item => item.id === 'STALE_TEST_EXPECTATION_AFTER_RUNTIME_CONTRACT_CHANGE',
    );

    expect(scenario).toMatchObject({
      surface: 'REPOSITORY_MODEL',
      findingClass: 'REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT',
      actionId: 'RECONCILE_REPOSITORY_PROJECTION',
      expectedTerminalState: 'CONVERGED',
    });

    const action = getRemediationAction('RECONCILE_REPOSITORY_PROJECTION');
    expect(action).toMatchObject({
      activation: 'ENABLED',
      idempotencyClass: 'IDEMPOTENT',
      requiredCapability: 'repository.pr.autofix',
      verificationProbe: 'exact-pr-head-ci-governance-readback',
      budget: { maxAttempts: 1 },
    });
  });

  it('PR #1297 v1.8 metadata omission uses the bounded single PR-body convergence path', () => {
    const scenario = SH_02_10_FAULT_MATRIX.find(
      item => item.id === 'PR_GOVERNANCE_V18_METADATA_OMISSION',
    );

    expect(scenario).toMatchObject({
      surface: 'REPOSITORY_MODEL',
      findingClass: 'REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT',
      actionId: 'RECONCILE_PR_DECISION_EVIDENCE',
      expectedTerminalState: 'CONVERGED',
      protectedMutationAllowed: false,
      productionFaultAllowed: false,
    });

    const action = getRemediationAction('RECONCILE_PR_DECISION_EVIDENCE');
    expect(action).toMatchObject({
      tier: 'SH-1',
      activation: 'ENABLED',
      idempotencyClass: 'IDEMPOTENT',
      requiredCapability: 'repository.pr.decision-evidence-reconciler',
      verificationProbe: 'exact-pr-body-convergence-readback',
      budget: { maxAttempts: 1 },
    });

    const eligibility = evaluateRemediationEligibility({
      findingClass: 'REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT',
      actionId: 'RECONCILE_PR_DECISION_EVIDENCE',
      attemptsUsed: 0,
      nowMs: 0,
      killSwitchActive: false,
      capabilityAuthorized: true,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(eligibility).toMatchObject({ state: 'ELIGIBLE', remainingAttempts: 1 });
  });


  it('PR #1298 hybrid baseline section converges through the same single PR-body action', () => {
    const scenario = SH_02_10_FAULT_MATRIX.find(
      item => item.id === 'PR_GOVERNANCE_V18_HYBRID_BASELINE_SECTION',
    );

    expect(scenario).toMatchObject({
      surface: 'REPOSITORY_MODEL',
      findingClass: 'REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT',
      actionId: 'RECONCILE_PR_DECISION_EVIDENCE',
      expectedTerminalState: 'CONVERGED',
      protectedMutationAllowed: false,
      productionFaultAllowed: false,
    });

    const policy = getRemediationPolicy('REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT');
    expect(policy.preferredActionId).toBe('RECONCILE_PR_DECISION_EVIDENCE');
    expect(policy.allowedActionIds).not.toContain('RECONCILE_PR_GOVERNANCE_METADATA');
  });

  it('API_503: retries boundedly for a safe GET and then converges on success', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('temporarily unavailable', { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const sleep = vi.fn(async () => {});

    const response = await fetchWithBoundedFrontendRetry(
      'https://example.invalid/api',
      { method: 'GET' },
      { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 4, jitterRatio: 0 },
      { fetchImpl: fetchImpl as typeof fetch, sleep, random: () => 0.5 },
    );

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(isRetryableFrontendStatus(503)).toBe(true);
  });

  it('API_429: remains bounded and never reinterprets a mutation request as retry-safe', async () => {
    const getFetch = vi.fn()
      .mockResolvedValueOnce(new Response('rate limited', { status: 429 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const getResponse = await fetchWithBoundedFrontendRetry(
      'https://example.invalid/api',
      { method: 'GET' },
      { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 4, jitterRatio: 0 },
      { fetchImpl: getFetch as typeof fetch, sleep: async () => {}, random: () => 0.5 },
    );
    expect(getResponse.status).toBe(200);
    expect(getFetch).toHaveBeenCalledTimes(2);

    const postFetch = vi.fn().mockResolvedValue(new Response('rate limited', { status: 429 }));
    const postResponse = await fetchWithBoundedFrontendRetry(
      'https://example.invalid/api',
      { method: 'POST' },
      undefined,
      { fetchImpl: postFetch as typeof fetch, sleep: async () => {}, random: () => 0.5 },
    );
    expect(postResponse.status).toBe(429);
    expect(postFetch).toHaveBeenCalledTimes(1);
  });

  it('deployment identity drift stays held and failed exact-SHA readback escalates', () => {
    expect(getRemediationPolicy('DEPLOYMENT_IDENTITY_DRIFT').preferredActionId)
      .toBe('REDEPLOY_EXACT_SHA');

    const eligibility = evaluateRemediationEligibility({
      findingClass: 'DEPLOYMENT_IDENTITY_DRIFT',
      actionId: 'REDEPLOY_EXACT_SHA',
      attemptsUsed: 0,
      nowMs: 0,
      killSwitchActive: false,
      capabilityAuthorized: true,
      verificationAvailable: true,
    });
    expect(eligibility).toMatchObject({ state: 'BLOCKED', reason: 'ACTION_HELD' });

    const convergence = resolveConvergence(
      'REDEPLOY_EXACT_SHA',
      {
        status: 'READBACK_FAILED',
        probe: 'production-identity-liveness-readiness-readback',
        evidenceRef: 'fault-fixture:exact-sha-readback',
      },
      1,
    );
    expect(convergence).toMatchObject({
      state: 'ESCALATED',
      converged: false,
      reason: 'READBACK_FAILED',
    });
  });

  it('CURRENT_STATE_PROJECTION_BASELINE_STALE: reuses the single bounded baseline autofix path', () => {
    const scenario = SH_02_10_FAULT_MATRIX.find(
      item => item.id === 'CURRENT_STATE_PROJECTION_BASELINE_STALE',
    );
    expect(scenario).toMatchObject({
      surface: 'REPOSITORY_MODEL',
      findingClass: 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
      actionId: 'RECONCILE_REPOSITORY_PROJECTION',
      expectedTerminalState: 'CONVERGED',
      protectedMutationAllowed: false,
      productionFaultAllowed: false,
    });

    const action = getRemediationAction('RECONCILE_REPOSITORY_PROJECTION');
    expect(action).toMatchObject({
      tier: 'SH-1',
      activation: 'ENABLED',
      idempotencyClass: 'IDEMPOTENT',
      requiredCapability: 'repository.pr.autofix',
      verificationProbe: 'exact-pr-head-ci-governance-readback',
      budget: { maxAttempts: 1 },
    });

    const eligibility = evaluateRemediationEligibility({
      findingClass: 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
      actionId: 'RECONCILE_REPOSITORY_PROJECTION',
      attemptsUsed: 0,
      nowMs: 0,
      killSwitchActive: false,
      capabilityAuthorized: true,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });
    expect(eligibility).toMatchObject({
      state: 'ELIGIBLE',
      remainingAttempts: 1,
    });
  });

  it('policy/capability denial fails closed for an otherwise enabled action', () => {
    const eligibility = evaluateRemediationEligibility({
      findingClass: 'REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT',
      actionId: 'RECONCILE_REPOSITORY_PROJECTION',
      attemptsUsed: 0,
      nowMs: 0,
      killSwitchActive: false,
      capabilityAuthorized: false,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });

    expect(eligibility).toMatchObject({
      state: 'BLOCKED',
      reason: 'CAPABILITY_NOT_AUTHORIZED',
    });
  });

  it('recovery budget exhaustion admits no additional attempt', () => {
    const action = getRemediationAction('FRONTEND_RELOAD_ONCE');
    const eligibility = evaluateRemediationEligibility({
      findingClass: 'FRONTEND_STALE_ASSET',
      actionId: 'FRONTEND_RELOAD_ONCE',
      attemptsUsed: action.budget.maxAttempts,
      nowMs: 1_000,
      killSwitchActive: false,
      capabilityAuthorized: true,
      verificationAvailable: true,
      operationIdempotency: 'IDEMPOTENT',
    });

    expect(eligibility).toMatchObject({
      state: 'BLOCKED',
      reason: 'BUDGET_EXHAUSTED',
    });
  });
});
