import { describe, expect, it } from 'vitest';
import {
  formatEuro,
  STRIPE_PRICE_SNAPSHOT_DATE,
  SUBSCRIPTION_PRICES_EUR,
  TERMS_VERSION,
} from '../../src/legal/legalContracts';

describe('consumer legal contract baseline', () => {
  it('keeps the AGB version explicit and current for this remediation', () => {
    expect(TERMS_VERSION).toBe('2026-08-23');
  });

  it('matches the read-only verified active Stripe live catalog snapshot', () => {
    expect(STRIPE_PRICE_SNAPSHOT_DATE).toBe('2026-08-23');
    expect(SUBSCRIPTION_PRICES_EUR).toEqual({
      Starter: { monthly: 7, yearly: 75.6 },
      Pro: { monthly: 29, yearly: 248 },
      Enterprise: { monthly: 109, yearly: 1280 },
    });
  });

  it('formats public price disclosures in German EUR notation', () => {
    expect(formatEuro(SUBSCRIPTION_PRICES_EUR.Starter.yearly)).toBe('75,60 €');
    expect(formatEuro(SUBSCRIPTION_PRICES_EUR.Pro.yearly)).toBe('248,00 €');
    expect(formatEuro(SUBSCRIPTION_PRICES_EUR.Enterprise.yearly)).toBe('1.280,00 €');
  });
});
