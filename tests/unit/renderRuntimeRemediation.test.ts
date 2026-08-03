import { describe, expect, it } from 'vitest';
import {
  getStripeConfigurationStatus,
  hasFiniteScoreValues,
  resolveHeuristicCryptoScore,
  resolveRuntimePort,
} from '../../server/runtime/renderRuntimeSafety';

describe('ADR-0037 Render runtime remediation', () => {
  it('uses Render PORT when valid and a local fallback only when absent', () => {
    expect(resolveRuntimePort('10000')).toBe(10000);
    expect(resolveRuntimePort(undefined)).toBe(3000);
    expect(() => resolveRuntimePort('0')).toThrow(/PORT/);
    expect(() => resolveRuntimePort('not-a-port')).toThrow(/PORT/);
  });

  it('does not weaken fail-closed score feature detection', () => {
    expect(hasFiniteScoreValues({})).toBe(false);
    expect(hasFiniteScoreValues({ volatility: undefined })).toBe(false);
    expect(hasFiniteScoreValues({ volatility: Number.NaN })).toBe(false);
    expect(hasFiniteScoreValues({ volatility: 42 })).toBe(true);
  });

  it('retains an existing finite base score only as a bounded heuristic value', () => {
    expect(resolveHeuristicCryptoScore(undefined)).toBeNull();
    expect(resolveHeuristicCryptoScore(Number.NaN)).toBeNull();
    expect(resolveHeuristicCryptoScore(7.46)).toBe(7.5);
    expect(resolveHeuristicCryptoScore(11)).toBe(10);
    expect(resolveHeuristicCryptoScore(0)).toBe(1);
  });

  it('reports Stripe configuration as booleans without returning secret or price values', () => {
    const env: Record<string, string> = {
      STRIPE_SECRET_KEY: 'secret-value',
      STRIPE_PUBLISHABLE_KEY: 'publishable-value',
      STRIPE_WEBHOOK_SECRET: 'webhook-value',
      STRIPE_PRICE_ID_STARTER_MONTHLY: 'starter-monthly-value',
      STRIPE_PRICE_ID_STARTER_YEARLY: 'starter-yearly-value',
      STRIPE_PRICE_ID_PRO_MONTHLY: 'pro-monthly-value',
      STRIPE_PRICE_ID_PRO_YEARLY: 'pro-yearly-value',
      STRIPE_PRICE_ID_ENTERPRISE: 'enterprise-value',
      STRIPE_ID_FOUNDER: 'founder-value',
      STRIPE_PRICE_ID_EXPORT_PDF: 'pdf-value',
    };

    const status = getStripeConfigurationStatus((key) => env[key]);
    expect(Object.values(status).every((value) => typeof value === 'boolean')).toBe(true);
    expect(Object.values(status).every(Boolean)).toBe(true);
    expect(JSON.stringify(status)).not.toContain('secret-value');
    expect(JSON.stringify(status)).not.toContain('starter-monthly-value');
  });
});
