import { describe, expect, it } from 'vitest';
import {
  REQUIRED_LIFECYCLE_SCENARIOS,
  aggregateResult,
  redactEvidence,
  runRepositoryContractChecks,
  type ScenarioEvidence,
} from '../../scripts/operations/userLifecycleHarness';
import { SUBSCRIPTION_PRICES_EUR } from '../../src/features/billing/billingContract';
import { getAnnualPricePreviewEur } from '../../src/config/subscriptionEntitlements';

/** Assemble provider-shaped fixtures at runtime so the source tree has no contiguous secret pattern. */
const stripeTestFixture = ['sk', 'test', 'exampleReusableSecret123'].join('_');
const webhookFixture = ['whsec', 'exampleWebhookSecret123'].join('_');
const supabaseSecretFixture = ['sb', 'secret', 'exampleSupabaseSecret123'].join('_');

describe('CAPITAL-AI-OPS User-Lifecycle harness', () => {
  it('keeps the complete handoff lifecycle scenario inventory explicit', () => {
    expect(REQUIRED_LIFECYCLE_SCENARIOS).toEqual([
      'registration',
      'email_or_auth_verification',
      'login',
      'session_creation',
      'multiple_sessions_or_devices',
      'local_logout',
      'global_logout',
      'subscription_creation',
      'checkout_to_webhook_transition',
      'subscription_projection',
      'server_side_entitlement_readback',
      'renewal',
      'payment_failure',
      'cancel_at_period_end',
      'subscription_expiry',
      'reactivation_if_supported_by_existing_contract',
      'mail_outbox_processing',
      'provider_retry',
      'duplicate_provider_event',
    ]);
  });

  it('redacts reusable provider secrets and bearer/JWT material from evidence text', () => {
    const input = [
      stripeTestFixture,
      webhookFixture,
      supabaseSecretFixture,
      'Bearer abc.def.ghi',
      'eyJabc.def.ghi',
    ].join(' ');
    const redacted = redactEvidence(input);

    expect(redacted).not.toContain('exampleReusableSecret123');
    expect(redacted).not.toContain('exampleWebhookSecret123');
    expect(redacted).not.toContain('exampleSupabaseSecret123');
    expect(redacted).not.toContain('abc.def.ghi');
    expect(redacted).toContain('[REDACTED_STRIPE_KEY]');
    expect(redacted).toContain('[REDACTED_WEBHOOK_SECRET]');
    expect(redacted).toContain('[REDACTED_SUPABASE_KEY]');
  });

  it('aggregates fail closed: FAIL outranks NOT_AVAILABLE, which outranks PASS', () => {
    const make = (result: ScenarioEvidence['result']): ScenarioEvidence => ({
      scenario: 'registration',
      provider: 'repository_contract',
      result,
      detail: result,
      knownLimitations: [],
    });

    expect(aggregateResult([make('PASS')])).toBe('PASS');
    expect(aggregateResult([make('PASS'), make('NOT_AVAILABLE')])).toBe('NOT_AVAILABLE');
    expect(aggregateResult([make('NOT_AVAILABLE'), make('FAIL')])).toBe('FAIL');
  });

  it('derives the annual Pro expectation from the canonical billing contract and exposes projection drift instead of inventing a second price authority', () => {
    const checks = runRepositoryContractChecks();
    const priceCheck = checks.find((item) => item.scenario === 'subscription_creation');
    const projectionCheck = checks.find((item) => item.scenario === 'subscription_projection');
    const canonical = SUBSCRIPTION_PRICES_EUR.Pro.yearly;
    const preview = getAnnualPricePreviewEur('Pro');

    expect(canonical).toBe(248);
    expect(priceCheck?.result).toBe('PASS');
    expect(projectionCheck?.result).toBe(preview === canonical ? 'PASS' : 'FAIL');
  });

  it('keeps existing raw-webhook, inbox, outbox and authenticated readback boundaries in the contract', () => {
    const checks = runRepositoryContractChecks();
    const byScenario = new Map(checks.map((item) => [item.scenario, item]));

    expect(byScenario.get('checkout_to_webhook_transition')?.result).toBe('PASS');
    expect(byScenario.get('duplicate_provider_event')?.result).toBe('PASS');
    expect(byScenario.get('mail_outbox_processing')?.result).toBe('PASS');
    expect(byScenario.get('server_side_entitlement_readback')?.result).toBe('PASS');
  });

  it('reports repository/provider drift as evidence instead of silently upgrading it to PASS', () => {
    const checks = runRepositoryContractChecks();
    const projectionSource = checks.find((item) => item.scenario === 'subscription_projection_source_control');

    expect(projectionSource).toBeDefined();
    expect(['PASS', 'FAIL']).toContain(projectionSource?.result);
    if (projectionSource?.result === 'FAIL') {
      expect(projectionSource.detail).toContain('Open finding');
      expect(projectionSource.knownLimitations.length).toBeGreaterThan(0);
    }
  });
});
