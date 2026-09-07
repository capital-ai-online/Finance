import { describe, expect, it } from 'vitest';
import {
  CAPABILITY_MAX_AGE_MS,
  DATA_FRESHNESS_CONTRACT_VERSION,
  evaluateDataFreshness,
} from '../../src/platform/MarketData/dataFreshness';

describe('DATA-13 capability freshness', () => {
  it('treats a snapshot within max-age as fresh and scoring-admissible', () => {
    const result = evaluateDataFreshness({
      capability: 'snapshot',
      observedAt: '2026-09-07T09:00:00.000Z',
      evaluatedAt: '2026-09-07T09:01:00.000Z',
    });
    expect(result.contractVersion).toBe(DATA_FRESHNESS_CONTRACT_VERSION);
    expect(result.maxAgeMs).toBe(CAPABILITY_MAX_AGE_MS.snapshot);
    expect(result.ageMs).toBe(60_000);
    expect(result.state).toBe('FRESH');
    expect(result.scoringAdmissible).toBe(true);
    expect(result.silentUpgradeRejected).toBe(false);
  });

  it('marks observations beyond the capability max-age as STALE', () => {
    const snapshot = evaluateDataFreshness({
      capability: 'snapshot',
      observedAt: '2026-09-07T09:00:00.000Z',
      evaluatedAt: '2026-09-07T09:02:00.000Z',
    });
    expect(snapshot.state).toBe('STALE');
    expect(snapshot.scoringAdmissible).toBe(false);
    expect(snapshot.ageMs).toBeGreaterThan(CAPABILITY_MAX_AGE_MS.snapshot);

    const news = evaluateDataFreshness({
      capability: 'news',
      observedAt: '2026-09-07T08:00:00.000Z',
      evaluatedAt: '2026-09-07T08:06:00.000Z',
    });
    expect(news.state).toBe('STALE');
    expect(news.maxAgeMs).toBe(CAPABILITY_MAX_AGE_MS.news);
  });

  it('rejects a silent upgrade from STALE or UNKNOWN to fresh/current', () => {
    const staleClaim = evaluateDataFreshness({
      capability: 'snapshot',
      observedAt: '2026-09-07T09:00:00.000Z',
      evaluatedAt: '2026-09-07T09:05:00.000Z',
      claimedState: 'CURRENT',
    });
    expect(staleClaim.state).toBe('STALE');
    expect(staleClaim.scoringAdmissible).toBe(false);
    expect(staleClaim.silentUpgradeRejected).toBe(true);

    const unknownClaim = evaluateDataFreshness({
      capability: 'history',
      observedAt: null,
      evaluatedAt: '2026-09-07T09:00:00.000Z',
      claimedState: 'FRESH',
    });
    expect(unknownClaim.state).toBe('UNKNOWN');
    expect(unknownClaim.scoringAdmissible).toBe(false);
    expect(unknownClaim.silentUpgradeRejected).toBe(true);
  });

  it('uses deterministic clock inputs rather than Date.now', () => {
    const first = evaluateDataFreshness({
      capability: 'history',
      observedAt: '2026-09-06T09:00:00.000Z',
      evaluatedAt: '2026-09-07T09:00:00.000Z',
    });
    const second = evaluateDataFreshness({
      capability: 'history',
      observedAt: '2026-09-06T09:00:00.000Z',
      evaluatedAt: '2026-09-07T09:00:00.000Z',
    });
    expect(first).toEqual(second);
    expect(first.state).toBe('FRESH');
    expect(first.ageMs).toBe(CAPABILITY_MAX_AGE_MS.history);
  });
});
