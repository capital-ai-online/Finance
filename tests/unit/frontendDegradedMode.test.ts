import { describe, expect, it, vi } from 'vitest';
import {
  computeFrontendRetryDelay,
  fetchWithBoundedFrontendRetry,
  isSafeFrontendRetryRequest,
  readFrontendDeploymentIdentity,
  readLastKnownGood,
  reconcileFrontendDeployment,
  writeLastKnownGood,
} from '../../src/app/reliability/frontendDegradedMode';
import type { RecoveryStorage } from '../../src/app/reliability/frontendRecovery';

class MemoryStorage implements RecoveryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('frontend degraded-mode contract', () => {
  it('admits automatic retries only for GET and HEAD', () => {
    expect(isSafeFrontendRetryRequest()).toBe(true);
    expect(isSafeFrontendRetryRequest({ method: 'GET' })).toBe(true);
    expect(isSafeFrontendRetryRequest({ method: 'head' })).toBe(true);
    expect(isSafeFrontendRetryRequest({ method: 'POST' })).toBe(false);
    expect(isSafeFrontendRetryRequest({ method: 'PATCH' })).toBe(false);
    expect(isSafeFrontendRetryRequest({ method: 'DELETE' })).toBe(false);
  });

  it('uses bounded exponential backoff with bounded jitter', () => {
    const policy = { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 250, jitterRatio: 0.2 };
    expect(computeFrontendRetryDelay(1, policy, 0)).toBe(80);
    expect(computeFrontendRetryDelay(1, policy, 1)).toBe(120);
    expect(computeFrontendRetryDelay(2, policy, 0.5)).toBe(200);
    expect(computeFrontendRetryDelay(3, policy, 0.5)).toBe(250);
  });

  it('retries transient GET failures but never retries mutation requests', async () => {
    const getFetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const getResponse = await fetchWithBoundedFrontendRetry('/healthz', { method: 'GET' }, {
      maxAttempts: 3,
      baseDelayMs: 1,
      maxDelayMs: 2,
      jitterRatio: 0,
    }, {
      fetchImpl: getFetch as unknown as typeof fetch,
      sleep,
      random: () => 0.5,
    });

    expect(getResponse.status).toBe(200);
    expect(getFetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);

    const postFetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    const postResponse = await fetchWithBoundedFrontendRetry('/api/mutate', { method: 'POST' }, undefined, {
      fetchImpl: postFetch as unknown as typeof fetch,
      sleep,
    });

    expect(postResponse.status).toBe(503);
    expect(postFetch).toHaveBeenCalledTimes(1);
  });

  it('does not reinterpret authentication failures as transient connectivity', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    const response = await fetchWithBoundedFrontendRetry('/api/private', { method: 'GET' }, undefined, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      sleep: async () => undefined,
    });

    expect(response.status).toBe(401);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('denies last-known-good values unless the source explicitly permits bounded staleness', () => {
    const storage = new MemoryStorage();
    const deniedPolicy = { key: 'score', allowStale: false, maxAgeMs: 60_000 };

    expect(writeLastKnownGood(storage, deniedPolicy, { score: 99 }, 1_000)).toBe(false);
    expect(readLastKnownGood(storage, deniedPolicy, 2_000)).toEqual({ state: 'DENIED' });

    const allowedPolicy = { key: 'non-authoritative-shell', allowStale: true, maxAgeMs: 5_000 };
    expect(writeLastKnownGood(storage, allowedPolicy, { label: 'cached' }, 1_000)).toBe(true);
    expect(readLastKnownGood<{ label: string }>(storage, allowedPolicy, 4_000)).toEqual({
      state: 'AVAILABLE',
      value: { label: 'cached' },
      ageMs: 3_000,
    });
    expect(readLastKnownGood(storage, allowedPolicy, 7_000)).toEqual({ state: 'STALE' });
  });

  it('detects one deployment transition and consumes at most one reload budget', () => {
    const storage = new MemoryStorage();
    const firstHeaders = new Headers({
      'x-capital-ai-commit': 'a'.repeat(40),
      'x-capital-ai-branch': 'main',
      'x-capital-ai-repo': 'capital-ai-online/Finance',
      'x-capital-ai-provider': 'render',
    });
    const secondHeaders = new Headers({
      'x-capital-ai-commit': 'b'.repeat(40),
      'x-capital-ai-branch': 'main',
      'x-capital-ai-repo': 'capital-ai-online/Finance',
      'x-capital-ai-provider': 'render',
    });

    const first = readFrontendDeploymentIdentity(firstHeaders);
    const second = readFrontendDeploymentIdentity(secondHeaders);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();

    expect(reconcileFrontendDeployment(storage, first!)).toMatchObject({
      state: 'BASELINED',
      shouldReload: false,
    });

    expect(reconcileFrontendDeployment(storage, second!)).toMatchObject({
      state: 'VERSION_SKEW',
      shouldReload: true,
      reason: 'BUDGET_AVAILABLE',
    });

    expect(reconcileFrontendDeployment(storage, second!)).toMatchObject({
      state: 'MATCH',
      shouldReload: false,
    });
  });

  it('fails deployment identity readback closed when immutable commit evidence is missing', () => {
    expect(readFrontendDeploymentIdentity(new Headers({
      'x-capital-ai-branch': 'main',
    }))).toBeNull();
  });
});
