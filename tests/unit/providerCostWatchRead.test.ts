import { describe, expect, it } from 'vitest';
import {
  readRenderCostSnapshot,
  normalizeStripeActiveSubscriptions,
} from '../../scripts/operations/providerCostWatchRead.mjs';

describe('provider cost watch read model', () => {
  it('projects Render Starter service cost, pipeline allowance and Flex workflow pricing without inventing usage', async () => {
    const fetchImpl = async (url: string) => {
      if (url.includes('/v1/services?')) {
        return new Response(JSON.stringify([{
          cursor: 'next',
          service: {
            id: 'srv-finance',
            name: 'Finance',
            type: 'web_service',
            suspended: 'not_suspended',
            serviceDetails: {
              plan: 'starter',
              buildPlan: 'starter',
              numInstances: 1,
            },
          },
        }]), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.includes('/v1/workflows?')) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw new Error('unexpected URL');
    };

    const snapshot = await readRenderCostSnapshot({
      apiKey: 'rnd_test_read_only',
      workspaceId: 'tea-test',
      workspacePlan: 'pro',
      fetchImpl,
    });

    expect(snapshot.coverage.status).toBe('PASS');
    expect(snapshot.activeServices).toHaveLength(1);
    expect(snapshot.monthlyListPriceBaselineUsd).toBe(7);
    expect(snapshot.pipeline).toMatchObject({
      observedTier: 'starter',
      workspacePlan: 'pro',
      includedMinutes: 1_000,
      currentUsageMinutes: null,
      remainingIncludedMinutes: null,
      usageStatus: 'NOT_OBSERVABLE_VIA_RENDER_PUBLIC_API',
    });
    expect(snapshot.workflows.count).toBe(0);
    expect(snapshot.workflows.pricing).toMatchObject({
      plan: 'flex',
      cpuUsdPerActiveHour: 0.2,
      ramUsdPerActiveGbHour: 0.05,
      maxUsdPerHourAtFullUsage: 0.4,
    });
  });

  it('normalizes active Stripe recurring charges without retaining customer PII', () => {
    const snapshot = normalizeStripeActiveSubscriptions({
      data: [
        {
          id: 'sub_starter',
          status: 'active',
          metadata: { plan: 'Starter', email: 'do-not-project@example.test' },
          items: { data: [{ quantity: 1, price: { id: 'price_a', unit_amount: 7560, currency: 'eur', recurring: { interval: 'year', interval_count: 1 } } }] },
        },
        {
          id: 'sub_pro',
          status: 'active',
          metadata: { plan: 'Pro' },
          items: { data: [{ quantity: 1, price: { id: 'price_b', unit_amount: 24800, currency: 'eur', recurring: { interval: 'year', interval_count: 1 } } }] },
        },
        {
          id: 'sub_enterprise',
          status: 'active',
          metadata: { plan: 'Enterprise' },
          items: { data: [{ quantity: 1, price: { id: 'price_c', unit_amount: 10900, currency: 'eur', recurring: { interval: 'month', interval_count: 1 } } }] },
        },
      ],
    });

    expect(snapshot.activeSubscriptionCount).toBe(3);
    expect(snapshot.monthlyEquivalentByCurrency.eur).toBeCloseTo(13596.666667, 5);
    expect(JSON.stringify(snapshot)).not.toContain('do-not-project@example.test');
    expect(snapshot.semantics).toBe('CUSTOMER_RECURRING_CHARGES_NOT_MERCHANT_OPERATING_COST');
  });
});
