import { describe, it, expect } from 'vitest';
import {
  FREE_SCREENING_LIMIT,
  FREE_SCREENING_WINDOW_DAYS,
  evaluateStoredQuotaWindow,
  hasWindowElapsed,
  isNewUtcDay,
  isUnlimitedTier,
  enforceScreeningQuota,
} from '../../server/quota';

describe('quota / subscription entitlements', () => {
  describe('isUnlimitedTier', () => {
    it('treats Enterprise screening as unlimited', () => {
      expect(isUnlimitedTier('Enterprise')).toBe(true);
      expect(isUnlimitedTier('Enterprise OS')).toBe(true);
    });

    it('keeps Free, Starter and Pro on their configured rolling limits', () => {
      expect(isUnlimitedTier('Free')).toBe(false);
      expect(isUnlimitedTier('Starter')).toBe(false);
      expect(isUnlimitedTier('Pro')).toBe(false);
    });
  });

  describe('rolling windows', () => {
    it('detects elapsed multi-day windows', () => {
      const now = Date.UTC(2026, 7, 2, 12, 0, 0);
      const recent = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
      const old = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString();
      expect(hasWindowElapsed(recent, 3, now)).toBe(false);
      expect(hasWindowElapsed(old, 3, now)).toBe(true);
    });

    it('blocks a consumed 1-per-3-days quota until nextEligibleAt', () => {
      const now = Date.UTC(2026, 7, 2, 12, 0, 0);
      const start = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const result = evaluateStoredQuotaWindow({
        count: 1,
        windowStart: start,
        limit: { limit: 1, windowDays: 3 },
        nowMs: now,
      });
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.nextEligibleAt).toBe(new Date(Date.parse(start) + 3 * 24 * 60 * 60 * 1000).toISOString());
    });

    it('retains the legacy UTC-day helper for compatibility', () => {
      expect(isNewUtcDay(new Date().toISOString())).toBe(false);
    });
  });

  describe('guest verified-screening fallback', () => {
    function fakeRequest(ip: string) {
      return {
        headers: { 'x-forwarded-for': ip },
        socket: { remoteAddress: ip },
      } as any;
    }

    it(`allows ${FREE_SCREENING_LIMIT} requests per rolling ${FREE_SCREENING_WINDOW_DAYS}-day window and blocks the next`, async () => {
      const ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
      for (let i = 0; i < FREE_SCREENING_LIMIT; i++) {
        const result = await enforceScreeningQuota(fakeRequest(ip));
        expect(result.allowed).toBe(true);
        expect(result.tier).toBe('Free');
      }
      const blocked = await enforceScreeningQuota(fakeRequest(ip));
      expect(blocked.allowed).toBe(false);
      expect(blocked.reason).toBe('quota-limit-reached');
    });
  });
});
