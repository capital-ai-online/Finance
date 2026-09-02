import { describe, expect, it } from 'vitest';
import { evaluateBusinessReadiness, type BusinessReadinessInput } from '../../server/runtime/businessReadiness';
import type { StripeConfigurationStatus } from '../../server/runtime/renderRuntimeSafety';

const completeStripe: StripeConfigurationStatus = {
  secretKeyConfigured: true,
  publishableKeyConfigured: true,
  webhookSecretConfigured: true,
  starterMonthlyConfigured: true,
  starterYearlyConfigured: true,
  proMonthlyConfigured: true,
  proYearlyConfigured: true,
  enterpriseConfigured: true,
  founderConfigured: true,
  pdfExportConfigured: true,
};

function input(overrides: Partial<BusinessReadinessInput> = {}): BusinessReadinessInput {
  return {
    processHealthy: true,
    supabaseConfigured: true,
    iamSchemaHealthy: true,
    stripe: completeStripe,
    optionalProviders: { alpaca: false, anthropic: false, openai: false },
    ...overrides,
  };
}

describe('business readiness', () => {
  it('is ready when every blocking business contract is available', () => {
    const snapshot = evaluateBusinessReadiness(input(), '2026-08-29T00:00:00.000Z');

    expect(snapshot.ready).toBe(true);
    expect(snapshot.status).toBe('ready');
    expect(snapshot.blockingChecks).toEqual({
      processHealthy: true,
      supabaseConfigured: true,
      iamSchemaHealthy: true,
      stripeCoreConfigured: true,
      stripeCatalogConfigured: true,
    });
    expect(snapshot.semantics.externalMarketDataProvidersAreNotProbed).toBe(true);
  });

  it('fails closed when IAM connectivity or a billing contract is incomplete', () => {
    const snapshot = evaluateBusinessReadiness(input({
      iamSchemaHealthy: false,
      stripe: { ...completeStripe, webhookSecretConfigured: false },
    }));

    expect(snapshot.ready).toBe(false);
    expect(snapshot.status).toBe('not-ready');
    expect(snapshot.blockingChecks.iamSchemaHealthy).toBe(false);
    expect(snapshot.blockingChecks.stripeCoreConfigured).toBe(false);
  });

  it('fails readiness immediately after a fatal process state is latched', () => {
    const snapshot = evaluateBusinessReadiness(input({ processHealthy: false }));

    expect(snapshot.ready).toBe(false);
    expect(snapshot.status).toBe('not-ready');
    expect(snapshot.blockingChecks.processHealthy).toBe(false);
  });

  it('does not make optional AI or market-data-provider availability a restart condition', () => {
    const snapshot = evaluateBusinessReadiness(input({
      optionalProviders: { alpaca: false, anthropic: false, openai: false },
    }));

    expect(snapshot.ready).toBe(true);
    expect(snapshot.capabilities.optionalProviders).toEqual({
      alpaca: false,
      anthropic: false,
      openai: false,
    });
  });
});
