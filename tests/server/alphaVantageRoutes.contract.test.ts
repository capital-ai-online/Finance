import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { resolveAlphaVantageCredential } from '../../server/routes/alphaVantageRoutes';

const routeSource = fs.readFileSync(path.join(process.cwd(), 'server/routes/alphaVantageRoutes.ts'), 'utf8');
const credentialSource = fs.readFileSync(path.join(process.cwd(), 'server/marketData/alphaVantageCredential.ts'), 'utf8');

describe('alphaVantageRoutes contract', () => {
  it('preserves the production endpoint and orchestrator ownership', () => {
    expect(routeSource).toContain("alphaVantageRouter.get('/alpha-vantage-quote'");
    expect(routeSource).toContain("orchestrator.handle('Alpha Vantage Quote')");
  });

  it('preserves provider-specific request modes', () => {
    expect(routeSource).toContain('CURRENCY_EXCHANGE_RATE');
    expect(routeSource).toContain('GLOBAL_QUOTE');
    expect(routeSource).toContain("source: 'Alpha Vantage'");
  });

  it('uses one shared canonical Alpha Vantage credential boundary', () => {
    expect(routeSource).toContain("from '../marketData/alphaVantageCredential'");
    expect(credentialSource).toContain("ALPHA_VANTAGE_CREDENTIAL = 'ALPHA_VANTAGE_API_KEY'");
    expect(credentialSource).toContain('environment[ALPHA_VANTAGE_CREDENTIAL]');
    expect(credentialSource).not.toContain('getCleanEnv');
    expect(credentialSource).not.toContain('VITE_');
    expect(credentialSource).not.toContain('process.env.ALPHA_VANTAGE_KEY');
    expect(credentialSource).not.toContain("process.env['ALPHA_VANTAGE_KEY']");
    expect(credentialSource).not.toContain('ALPHA_VANTAGE_API_KEY ??');
    expect(credentialSource).not.toContain('ALPHA_VANTAGE_KEY ??');
  });

  it('never lets the legacy credential satisfy canonical readiness', () => {
    expect(resolveAlphaVantageCredential({ ALPHA_VANTAGE_KEY: 'legacy-only' })).toBeUndefined();
    expect(resolveAlphaVantageCredential({})).toBeUndefined();
    expect(resolveAlphaVantageCredential({ ALPHA_VANTAGE_API_KEY: 'canonical-only' })).toBe('canonical-only');
    expect(resolveAlphaVantageCredential({
      ALPHA_VANTAGE_API_KEY: 'canonical',
      ALPHA_VANTAGE_KEY: 'legacy',
    })).toBe('canonical');
  });

  it('fails closed as unavailable when the canonical credential is missing', () => {
    expect(routeSource).toContain('status(503)');
    expect(routeSource).toContain("status: 'UNAVAILABLE'");
    expect(routeSource).toContain('ALPHA_VANTAGE_CREDENTIAL} is not configured');
  });

  it('redacts credential-bearing request and transport diagnostics', () => {
    expect(routeSource).toContain('redactProviderCredentialText(url)');
    expect(routeSource).toContain('providerErrorMessage(err)');
    expect(routeSource).toContain('encodeURIComponent(key)');
    expect(routeSource).not.toContain('console.log(key)');
    expect(routeSource).not.toContain('err.message ||');
  });

  it('keeps provider rate-limit/error behavior explicit', () => {
    expect(routeSource).toContain("data['Note']");
    expect(routeSource).toContain('status(429)');
    expect(routeSource).toContain("data['Error Message']");
  });

  it('does not own startup, Stripe, runtime-secret, or scoring boundaries', () => {
    expect(routeSource).not.toContain('validateRuntimeSecrets');
    expect(routeSource).not.toContain('stripe-signature');
    expect(routeSource).not.toContain('CryptoScoringService');
    expect(routeSource).not.toContain('process.on(');
  });
});
