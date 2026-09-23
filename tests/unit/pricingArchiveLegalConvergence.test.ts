import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TERMS_EFFECTIVE_DATE, TERMS_VERSION } from '../../src/features/billing/billingContract';

const legal = readFileSync('src/features/public/ui/LegalAndFaqPages.tsx', 'utf8');
const faq = readFileSync('src/features/public/content/publicLegalContent.ts', 'utf8');

describe('archived pricing legal convergence', () => {
  it('publishes a new explicit legal document generation', () => {
    expect(TERMS_VERSION).toBe('2026-09-23');
    expect(TERMS_EFFECTIVE_DATE).toBe('23.09.2026');
  });

  it('stops presenting the historical catalogue as a currently orderable offer', () => {
    expect(legal).toContain('§ 3 Archivierter Tarifkatalog und bestehende Vertragsverhältnisse');
    expect(legal).toContain('Starter-/Pro-/Enterprise-Katalog ist derzeit archiviert');
    expect(legal).toContain('keine neuen zahlungspflichtigen Bestellungen');
    expect(legal).not.toContain('SUBSCRIPTION_PRICES_EUR');
    expect(legal).not.toContain('STRIPE_PRICE_SNAPSHOT_DATE');
    expect(legal).not.toContain('formatEuro');
  });

  it('preserves existing-contract and consumer-rights language', () => {
    expect(legal).toContain('Für bereits bestehende entgeltliche Vertragsverhältnisse');
    expect(legal).toContain('Stripe-Kundenportal');
    expect(legal).toContain('Kündigungs-, Widerrufs- und sonstige');
    expect(legal).toContain('Verbraucherrechte bleiben unberührt');
  });

  it('converges the public FAQ without defining a future pricing model', () => {
    expect(faq).toContain('Tarifkatalog ist derzeit archiviert und nicht neu bestellbar');
    expect(faq).toContain('Ein zukünftiges Pricing-Modell ist noch nicht festgelegt');
    expect(faq).toContain('Stripe-Kundenportal');
  });
});
