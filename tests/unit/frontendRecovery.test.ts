import { describe, expect, it } from 'vitest';
import {
  buildFrontendRecoveryFingerprint,
  consumeAutomaticFrontendRecovery,
  isRecoverableFrontendAssetError,
  type RecoveryStorage,
} from '../../src/app/reliability/frontendRecovery';

class MemoryRecoveryStorage implements RecoveryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('frontend recovery policy', () => {
  it('classifies stale dynamic-deployment asset failures as recoverable', () => {
    expect(isRecoverableFrontendAssetError(
      new Error('Failed to fetch dynamically imported module: https://capital-ai.online/assets/a.js'),
    )).toBe(true);
    expect(isRecoverableFrontendAssetError(
      new Error('ChunkLoadError: Loading chunk 17 failed'),
    )).toBe(true);
  });

  it('does not auto-reload arbitrary persistent render defects', () => {
    expect(isRecoverableFrontendAssetError(
      new Error('Cannot read properties of undefined'),
    )).toBe(false);
  });

  it('consumes exactly one automatic reload per failure fingerprint and session', () => {
    const storage = new MemoryRecoveryStorage();
    const error = new Error('ChunkLoadError: Loading chunk 17 failed');

    const first = consumeAutomaticFrontendRecovery(storage, error, '/dashboard');
    const second = consumeAutomaticFrontendRecovery(storage, error, '/dashboard');

    expect(first.shouldReload).toBe(true);
    expect(first.reason).toBe('BUDGET_AVAILABLE');
    expect(second.shouldReload).toBe(false);
    expect(second.reason).toBe('BUDGET_EXHAUSTED');
    expect(second.fingerprint).toBe(first.fingerprint);
  });

  it('keeps the recovery key non-sensitive and path-scoped', () => {
    const error = new Error(
      'Failed to fetch dynamically imported module: https://capital-ai.online/assets/private-build-12345678.js',
    );

    const dashboard = buildFrontendRecoveryFingerprint(error, '/dashboard');
    const registry = buildFrontendRecoveryFingerprint(error, '/registry');

    expect(dashboard).toMatch(/^capital-ai:frontend-recovery:v1:[a-f0-9]{8}$/);
    expect(dashboard).not.toContain('private-build');
    expect(registry).not.toBe(dashboard);
  });

  it('fails safe to the visible boundary when session storage is unavailable', () => {
    const unavailable: RecoveryStorage = {
      getItem() {
        throw new Error('storage disabled');
      },
      setItem() {
        throw new Error('storage disabled');
      },
    };

    const decision = consumeAutomaticFrontendRecovery(
      unavailable,
      new Error('ChunkLoadError: Loading chunk 17 failed'),
      '/dashboard',
    );

    expect(decision.shouldReload).toBe(false);
    expect(decision.reason).toBe('STORAGE_UNAVAILABLE');
  });
});
