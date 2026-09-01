import { describe, expect, it } from 'vitest';
import {
  aggregateResult,
  runStripeSandboxScenarios,
  runSupabaseLocalScenarios,
  type LifecycleResult,
  type ScenarioEvidence,
} from '../../scripts/operations/userLifecycleHarness';

function assertProviderOutcome(
  provider: 'supabase' | 'stripe',
  scenarios: ScenarioEvidence[],
  strictEnv: string,
): void {
  const result: LifecycleResult = aggregateResult(scenarios);
  const strict = process.env[strictEnv] === '1';

  // A normal repository CI run may legitimately lack local Docker/Supabase or Stripe sandbox
  // credentials. That state is NOT_AVAILABLE and is deliberately not promoted to provider PASS.
  expect(['PASS', 'FAIL', 'NOT_AVAILABLE']).toContain(result);
  expect(scenarios.length).toBeGreaterThan(0);

  if (strict) {
    const notPass = scenarios.filter((scenario) => scenario.result !== 'PASS');
    expect(
      notPass,
      `${provider} provider verification was required but did not fully PASS: ${notPass
        .map((scenario) => `${scenario.scenario}=${scenario.result}`)
        .join(', ')}`,
    ).toEqual([]);
  }
}

describe('User-Lifecycle provider contracts', () => {
  it('runs Supabase Local + Mailpit only when the actual provider inputs are available', async () => {
    const scenarios = await runSupabaseLocalScenarios();
    assertProviderOutcome('supabase', scenarios, 'OPS_REQUIRE_SUPABASE_LOCAL_PROVIDER');

    if (!process.env.SUPABASE_LOCAL_ANON_KEY || !process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY) {
      expect(scenarios.every((scenario) => scenario.result === 'NOT_AVAILABLE')).toBe(true);
    }
  });

  it('rejects live Stripe keys and uses Test Clocks only under explicit sandbox mutation opt-in', async () => {
    const scenarios = await runStripeSandboxScenarios();
    assertProviderOutcome('stripe', scenarios, 'OPS_REQUIRE_STRIPE_SANDBOX_PROVIDER');

    const key = process.env.STRIPE_SECRET_KEY || '';
    if (!key.startsWith('sk_test_')) {
      expect(scenarios.every((scenario) => scenario.result === 'NOT_AVAILABLE')).toBe(true);
    }
  });
});
