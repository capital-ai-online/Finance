import { describe, expect, it } from 'vitest';
import {
  SUBSCRIPTION_ENTITLEMENTS,
  canUseFeature,
  getAnnualPricePreviewEur,
  getWindowedFeatureLimit,
  normalizeSubscriptionTier,
} from '../../src/config/subscriptionEntitlements';

describe('subscription-entitlements/1.0.0', () => {
  it('normalizes persisted tier variants safely', () => {
    expect(normalizeSubscriptionTier('enterprise os')).toBe('Enterprise');
    expect(normalizeSubscriptionTier('PRO')).toBe('Pro');
    expect(normalizeSubscriptionTier('unknown')).toBe('Free');
  });

  it('defines the canonical screening limits', () => {
    expect(getWindowedFeatureLimit('Free', 'verified_screening')).toEqual({ limit: 3, windowDays: 5 });
    expect(getWindowedFeatureLimit('Starter', 'verified_screening')).toEqual({ limit: 5, windowDays: 1 });
    expect(getWindowedFeatureLimit('Pro', 'verified_screening')).toEqual({ limit: 20, windowDays: 1 });
    expect(getWindowedFeatureLimit('Enterprise', 'verified_screening')).toBe('unlimited');
  });

  it('enforces Warren Buffett access semantics', () => {
    expect(canUseFeature('guest', 'Free', 'buffett_value_check')).toBe(false);
    expect(getWindowedFeatureLimit('Free', 'buffett_value_check')).toEqual({ limit: 1, windowDays: 3 });
    expect(getWindowedFeatureLimit('Starter', 'buffett_value_check')).toEqual({ limit: 1, windowDays: 3 });
    expect(getWindowedFeatureLimit('Pro', 'buffett_value_check')).toBe('unlimited');
    expect(getWindowedFeatureLimit('Enterprise', 'buffett_value_check')).toBe('unlimited');
  });

  it('keeps backtest and Monte Carlo behind the canonical paid tiers', () => {
    expect(SUBSCRIPTION_ENTITLEMENTS.Free.backtest).toBe(false);
    expect(SUBSCRIPTION_ENTITLEMENTS.Starter.backtest).toBe(false);
    expect(SUBSCRIPTION_ENTITLEMENTS.Pro.backtest).toBe(true);
    expect(SUBSCRIPTION_ENTITLEMENTS.Enterprise.backtest).toBe(true);
    expect(SUBSCRIPTION_ENTITLEMENTS.Free.monteCarlo).toBe('none');
    expect(SUBSCRIPTION_ENTITLEMENTS.Starter.monteCarlo).toBe('none');
    expect(SUBSCRIPTION_ENTITLEMENTS.Pro.monteCarlo).toEqual({ limit: 1, windowDays: 1 });
    expect(SUBSCRIPTION_ENTITLEMENTS.Enterprise.monteCarlo).toBe('unlimited');
  });

  it('keeps full_ai_analysis preview-only or quota-bound until Pro', () => {
    expect(getWindowedFeatureLimit('Free', 'full_ai_analysis')).toBe('preview_only');
    expect(getWindowedFeatureLimit('Starter', 'full_ai_analysis')).toEqual({ limit: 1, windowDays: 1 });
    expect(getWindowedFeatureLimit('Pro', 'full_ai_analysis')).toBe('unlimited');
    expect(getWindowedFeatureLimit('Enterprise', 'full_ai_analysis')).toBe('unlimited');
    expect(canUseFeature('registered', 'Free', 'full_ai_analysis')).toBe(false);
    expect(canUseFeature('registered', 'Starter', 'full_ai_analysis')).toBe(true);
  });

  it('calculates the documented 10% annual preview only where annual self-service is supported', () => {
    expect(getAnnualPricePreviewEur('Starter')).toBe(75.6);
    expect(getAnnualPricePreviewEur('Pro')).toBe(313.2);
    expect(getAnnualPricePreviewEur('Enterprise')).toBeNull();
  });
});
