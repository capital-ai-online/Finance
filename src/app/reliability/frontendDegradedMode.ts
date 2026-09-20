import type { RecoveryStorage } from './frontendRecovery';

export const FRONTEND_DEGRADED_MODE_VERSION = 'frontend-degraded-mode/1.0.0' as const;

export type FrontendConnectivityState =
  | 'ONLINE'
  | 'OFFLINE'
  | 'DEGRADED'
  | 'VERSION_SKEW';

export interface FrontendRetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
}

export const DEFAULT_FRONTEND_RETRY_POLICY: FrontendRetryPolicy = Object.freeze({
  maxAttempts: 3,
  baseDelayMs: 250,
  maxDelayMs: 2_000,
  jitterRatio: 0.2,
});

const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function normalizeMethod(init?: RequestInit): string {
  return String(init?.method ?? 'GET').trim().toUpperCase() || 'GET';
}

/**
 * Browser self-healing never retries mutation methods automatically.
 * GET/HEAD are the only methods admitted by this generic frontend retry helper.
 */
export function isSafeFrontendRetryRequest(init?: RequestInit): boolean {
  const method = normalizeMethod(init);
  return method === 'GET' || method === 'HEAD';
}

export function isRetryableFrontendStatus(status: number): boolean {
  return RETRYABLE_HTTP_STATUSES.has(status);
}

export function computeFrontendRetryDelay(
  attemptNumber: number,
  policy: FrontendRetryPolicy = DEFAULT_FRONTEND_RETRY_POLICY,
  jitterUnit = 0.5,
): number {
  const attemptIndex = Math.max(0, Math.trunc(attemptNumber) - 1);
  const exponential = Math.min(policy.maxDelayMs, policy.baseDelayMs * (2 ** attemptIndex));
  const normalizedJitter = Math.min(1, Math.max(0, jitterUnit));
  const spread = exponential * policy.jitterRatio;
  const jitter = (normalizedJitter * 2 - 1) * spread;
  return Math.max(0, Math.round(exponential + jitter));
}

interface FrontendRetryRuntime {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, ms);
});

/**
 * Bounded retry for safe browser reads only.
 *
 * Unsafe methods fail closed to exactly one request. 401/403 and other semantic
 * responses are returned immediately because auth/domain policy must not be
 * reinterpreted as a transient transport failure.
 */
export async function fetchWithBoundedFrontendRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  policy: FrontendRetryPolicy = DEFAULT_FRONTEND_RETRY_POLICY,
  runtime: FrontendRetryRuntime = {},
): Promise<Response> {
  const fetchImpl = runtime.fetchImpl ?? fetch;
  const sleep = runtime.sleep ?? defaultSleep;
  const random = runtime.random ?? Math.random;
  const safe = isSafeFrontendRetryRequest(init);
  const attempts = safe ? Math.max(1, Math.trunc(policy.maxAttempts)) : 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (init.signal?.aborted) {
      throw init.signal.reason instanceof Error
        ? init.signal.reason
        : new DOMException('The operation was aborted.', 'AbortError');
    }

    try {
      const response = await fetchImpl(input, init);
      if (!safe || !isRetryableFrontendStatus(response.status) || attempt >= attempts) {
        return response;
      }
      try {
        await response.body?.cancel();
      } catch {
        // Body cancellation is cleanup only; retry eligibility is unchanged.
      }
    } catch (error) {
      lastError = error;
      if (!safe || attempt >= attempts) throw error;
    }

    await sleep(computeFrontendRetryDelay(attempt, policy, random()));
  }

  throw lastError instanceof Error ? lastError : new Error('FRONTEND_RETRY_EXHAUSTED');
}

export interface LastKnownGoodPolicy {
  key: string;
  allowStale: boolean;
  maxAgeMs: number;
}

interface LastKnownGoodEnvelope<T> {
  schemaVersion: 'frontend-lkg/1.0.0';
  key: string;
  observedAtMs: number;
  value: T;
}

export type LastKnownGoodRead<T> =
  | { state: 'AVAILABLE'; value: T; ageMs: number }
  | { state: 'DENIED' | 'MISSING' | 'STALE' | 'INVALID' | 'STORAGE_UNAVAILABLE' };

/**
 * LKG storage is opt-in only. Financial/domain callers must supply an explicit
 * source policy that permits bounded staleness; otherwise no stale value is read.
 */
export function writeLastKnownGood<T>(
  storage: RecoveryStorage,
  policy: LastKnownGoodPolicy,
  value: T,
  observedAtMs: number,
): boolean {
  if (!policy.allowStale || !policy.key.trim() || policy.maxAgeMs <= 0) return false;

  const envelope: LastKnownGoodEnvelope<T> = {
    schemaVersion: 'frontend-lkg/1.0.0',
    key: policy.key,
    observedAtMs,
    value,
  };

  try {
    storage.setItem(`capital-ai:frontend-lkg:v1:${policy.key}`, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function readLastKnownGood<T>(
  storage: RecoveryStorage,
  policy: LastKnownGoodPolicy,
  nowMs: number,
): LastKnownGoodRead<T> {
  if (!policy.allowStale) return { state: 'DENIED' };
  if (!policy.key.trim() || policy.maxAgeMs <= 0) return { state: 'INVALID' };

  try {
    const raw = storage.getItem(`capital-ai:frontend-lkg:v1:${policy.key}`);
    if (!raw) return { state: 'MISSING' };

    const parsed = JSON.parse(raw) as Partial<LastKnownGoodEnvelope<T>>;
    if (
      parsed.schemaVersion !== 'frontend-lkg/1.0.0'
      || parsed.key !== policy.key
      || typeof parsed.observedAtMs !== 'number'
      || !Number.isFinite(parsed.observedAtMs)
      || parsed.observedAtMs > nowMs
      || !('value' in parsed)
    ) {
      return { state: 'INVALID' };
    }

    const ageMs = nowMs - parsed.observedAtMs;
    if (ageMs > policy.maxAgeMs) return { state: 'STALE' };
    return { state: 'AVAILABLE', value: parsed.value as T, ageMs };
  } catch {
    return { state: 'STORAGE_UNAVAILABLE' };
  }
}

export interface FrontendDeploymentIdentity {
  commitSha: string;
  branch: string | null;
  repoSlug: string | null;
  provider: string | null;
}

const DEPLOYMENT_BASELINE_KEY = 'capital-ai:frontend-deployment:v1';

function normalizedSha(value: string | null): string | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

export function readFrontendDeploymentIdentity(headers: Headers): FrontendDeploymentIdentity | null {
  const commitSha = normalizedSha(headers.get('x-capital-ai-commit'));
  if (!commitSha) return null;

  return {
    commitSha,
    branch: headers.get('x-capital-ai-branch'),
    repoSlug: headers.get('x-capital-ai-repo'),
    provider: headers.get('x-capital-ai-provider'),
  };
}

function sameDeployment(
  left: FrontendDeploymentIdentity,
  right: FrontendDeploymentIdentity,
): boolean {
  return left.commitSha === right.commitSha
    && left.branch === right.branch
    && left.repoSlug === right.repoSlug
    && left.provider === right.provider;
}

export type DeploymentReconciliation =
  | { state: 'BASELINED' | 'MATCH'; shouldReload: false; observed: FrontendDeploymentIdentity }
  | {
      state: 'VERSION_SKEW';
      shouldReload: boolean;
      observed: FrontendDeploymentIdentity;
      previous: FrontendDeploymentIdentity;
      reason: 'BUDGET_AVAILABLE' | 'BUDGET_EXHAUSTED' | 'STORAGE_UNAVAILABLE';
    };

/**
 * Session-local deployment skew detector.
 *
 * On a new deployment transition the observed identity is persisted before a
 * one-shot reload. That prevents reload loops while preserving auth/localStorage.
 */
export function reconcileFrontendDeployment(
  storage: RecoveryStorage,
  observed: FrontendDeploymentIdentity,
): DeploymentReconciliation {
  try {
    const raw = storage.getItem(DEPLOYMENT_BASELINE_KEY);
    if (!raw) {
      storage.setItem(DEPLOYMENT_BASELINE_KEY, JSON.stringify(observed));
      return { state: 'BASELINED', shouldReload: false, observed };
    }

    const previous = JSON.parse(raw) as FrontendDeploymentIdentity;
    if (!normalizedSha(previous?.commitSha)) {
      storage.setItem(DEPLOYMENT_BASELINE_KEY, JSON.stringify(observed));
      return { state: 'BASELINED', shouldReload: false, observed };
    }

    if (sameDeployment(previous, observed)) {
      return { state: 'MATCH', shouldReload: false, observed };
    }

    const transitionKey =
      `capital-ai:frontend-version-skew:v1:${previous.commitSha}:${observed.commitSha}`;

    storage.setItem(DEPLOYMENT_BASELINE_KEY, JSON.stringify(observed));
    if (storage.getItem(transitionKey) === 'consumed') {
      return {
        state: 'VERSION_SKEW',
        shouldReload: false,
        observed,
        previous,
        reason: 'BUDGET_EXHAUSTED',
      };
    }

    storage.setItem(transitionKey, 'consumed');
    return {
      state: 'VERSION_SKEW',
      shouldReload: true,
      observed,
      previous,
      reason: 'BUDGET_AVAILABLE',
    };
  } catch {
    return {
      state: 'VERSION_SKEW',
      shouldReload: false,
      observed,
      previous: observed,
      reason: 'STORAGE_UNAVAILABLE',
    };
  }
}
