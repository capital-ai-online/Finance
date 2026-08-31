import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.join(process.cwd(), 'server/routes/alphaVantageRoutes.ts'), 'utf8');

describe('alphaVantageRoutes contract', () => {
  it('preserves the production endpoint and orchestrator ownership', () => {
    expect(source).toContain("alphaVantageRouter.get('/alpha-vantage-quote'");
    expect(source).toContain("orchestrator.handle('Alpha Vantage Quote')");
  });

  it('preserves provider-specific request modes', () => {
    expect(source).toContain('CURRENCY_EXCHANGE_RATE');
    expect(source).toContain('GLOBAL_QUOTE');
    expect(source).toContain("source: 'Alpha Vantage'");
  });

  it('uses only the canonical Alpha Vantage credential identity', () => {
    expect(source).toContain("const ALPHA_VANTAGE_CREDENTIAL = 'ALPHA_VANTAGE_API_KEY'");
    expect(source).toContain('process.env[ALPHA_VANTAGE_CREDENTIAL]');
    expect(source).not.toContain('process.env.ALPHA_VANTAGE_KEY');
    expect(source).not.toContain("process.env['ALPHA_VANTAGE_KEY']");
    expect(source).not.toContain('ALPHA_VANTAGE_API_KEY ??');
    expect(source).not.toContain('ALPHA_VANTAGE_KEY ??');
  });

  it('fails closed as unavailable when the canonical credential is missing', () => {
    expect(source).toContain('status(503)');
    expect(source).toContain("status: 'UNAVAILABLE'");
    expect(source).toContain('ALPHA_VANTAGE_CREDENTIAL} is not configured');
  });

  it('does not leak API keys into logs', () => {
    expect(source).toContain("url.replace(key, 'REDACTED')");
    expect(source).not.toContain('console.log(key)');
  });

  it('keeps provider rate-limit/error behavior explicit', () => {
    expect(source).toContain("data['Note']");
    expect(source).toContain('status(429)');
    expect(source).toContain("data['Error Message']");
  });

  it('does not own startup, Stripe, runtime-secret, or scoring boundaries', () => {
    expect(source).not.toContain('validateRuntimeSecrets');
    expect(source).not.toContain('stripe-signature');
    expect(source).not.toContain('CryptoScoringService');
    expect(source).not.toContain('process.on(');
  });
});
