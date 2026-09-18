import { describe, expect, it } from 'vitest';
import {
  GITHUB_BILLING_CAPABILITIES,
  GITHUB_BILLING_REQUIRED_PERMISSION,
  createGitHubBillingGatewayAdapter,
} from '../../scripts/operations/githubBillingGatewayAdapter.mjs';

const ENTERPRISE = 'capital-ai';

function budget(id: string, amount = 100) {
  return {
    id,
    budget_type: 'ProductPricing',
    budget_product_skus: ['actions'],
    budget_scope: 'enterprise',
    budget_entity_name: 'capital-ai',
    budget_amount: amount,
    prevent_further_usage: false,
    budget_alerting: {
      will_alert: true,
      alert_recipients: ['billing-manager'],
    },
    token: 'must-not-project',
  };
}

describe('GitHub Billing Gateway Adapter', () => {
  it('requires a pinned enterprise slug and REST transport', () => {
    expect(() => createGitHubBillingGatewayAdapter({
      enterprise: '../other',
      githubRest: async () => ({}),
    })).toThrow(/valid GitHub enterprise slug/);

    expect(() => createGitHubBillingGatewayAdapter({
      enterprise: ENTERPRISE,
    })).toThrow(/githubRest transport is required/);
  });

  it('exposes only read-only enterprise billing capabilities', () => {
    const adapter = createGitHubBillingGatewayAdapter({
      enterprise: ENTERPRISE,
      githubRest: async () => ({}),
    });

    const surface = adapter.describeSurface();
    expect(surface.requiredPermission).toBe(GITHUB_BILLING_REQUIRED_PERMISSION);
    expect(surface.allowedHttpMethods).toEqual(['GET']);
    expect(surface.capabilities).toEqual(GITHUB_BILLING_CAPABILITIES);
    expect(surface.excludes).toContain('usage_report_exports');
    expect(surface.excludes).toContain('raw_github_proxy');
  });

  it('rejects capabilities outside the explicit allowlist', async () => {
    const adapter = createGitHubBillingGatewayAdapter({
      enterprise: ENTERPRISE,
      githubRest: async () => ({}),
    });

    await expect(adapter.execute('github.billing.budgets.create')).rejects.toThrow(/not allowlisted/);
    await expect(adapter.execute('github.raw.request')).rejects.toThrow(/not allowlisted/);
  });

  it('lists all budget pages using GET only and strips unapproved provider fields', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const githubRest = async (request: { method: string; path: string }) => {
      calls.push(request);
      const url = new URL(request.path, 'https://api.github.test');
      const page = url.searchParams.get('page');
      if (page === '1') {
        return {
          budgets: [budget('2066deda-923f-43f9-88d2-62395a28c0cd')],
          has_next_page: true,
          total_count: 2,
        };
      }
      if (page === '2') {
        return {
          budgets: [budget('f47ac10b-58cc-4372-a567-0e02b2c3d479', 250)],
          has_next_page: false,
          total_count: 2,
        };
      }
      throw new Error(`unexpected path ${request.path}`);
    };

    const adapter = createGitHubBillingGatewayAdapter({ enterprise: ENTERPRISE, githubRest });
    const result = await adapter.execute('github.billing.budgets.list');

    expect(result.totalCount).toBe(2);
    expect(result.budgets).toHaveLength(2);
    expect(result.budgets[0]).toMatchObject({
      amount: 100,
      scope: 'enterprise',
      productSkus: ['actions'],
    });
    expect(result.budgets[0]).not.toHaveProperty('token');
    expect(calls).toHaveLength(2);
    expect(calls.every((call) => call.method === 'GET')).toBe(true);
    expect(calls[0].path).toContain('/settings/billing/budgets?');
    expect(calls[0].path).toContain('per_page=100');
  });

  it('gets a single budget and validates the opaque ID before provider access', async () => {
    let calls = 0;
    const githubRest = async (request: { method: string; path: string }) => {
      calls += 1;
      expect(request.method).toBe('GET');
      expect(request.path).toContain('/settings/billing/budgets/2066deda-923f-43f9-88d2-62395a28c0cd');
      return budget('2066deda-923f-43f9-88d2-62395a28c0cd');
    };

    const adapter = createGitHubBillingGatewayAdapter({ enterprise: ENTERPRISE, githubRest });

    await expect(adapter.execute('github.billing.budgets.get', {
      budgetId: '../../admin',
    })).rejects.toThrow(/safe opaque identifier/);
    expect(calls).toBe(0);

    const result = await adapter.execute('github.billing.budgets.get', {
      budgetId: '2066deda-923f-43f9-88d2-62395a28c0cd',
    });
    expect(result.amount).toBe(100);
    expect(calls).toBe(1);
  });

  it('reads a monthly usage summary with bounded filters and normalized monetary fields', async () => {
    const calls: Array<{ method: string; path: string }> = [];
    const githubRest = async (request: { method: string; path: string }) => {
      calls.push(request);
      return {
        timePeriod: { year: 2026, month: 9 },
        enterprise: 'CAPITAL-AI',
        usageItems: [
          {
            product: 'Actions',
            sku: 'actions_linux',
            unitType: 'minutes',
            pricePerUnit: 0.008,
            grossQuantity: 1000,
            grossAmount: 8,
            discountQuantity: 1000,
            discountAmount: 8,
            netQuantity: 0,
            netAmount: 0,
            authorization: 'must-not-project',
          },
        ],
      };
    };

    const adapter = createGitHubBillingGatewayAdapter({ enterprise: ENTERPRISE, githubRest });
    const result = await adapter.execute('github.billing.usage.summary', {
      year: 2026,
      month: 9,
      product: 'Actions',
      sku: 'actions_linux',
    });

    expect(result.timePeriod).toEqual({ year: 2026, month: 9, day: null });
    expect(result.usageItems[0]).toMatchObject({
      product: 'Actions',
      grossAmount: 8,
      discountAmount: 8,
      netAmount: 0,
    });
    expect(result.usageItems[0]).not.toHaveProperty('authorization');
    expect(calls[0].method).toBe('GET');
    expect(calls[0].path).toContain('year=2026');
    expect(calls[0].path).toContain('month=9');
    expect(calls[0].path).toContain('product=Actions');
    expect(calls[0].path).toContain('sku=actions_linux');

    await expect(adapter.execute('github.billing.usage.summary', { month: 13 }))
      .rejects.toThrow(/month must be an integer between 1 and 12/);
  });

  it('lists cost centers without projecting provider account identifiers or resource membership', async () => {
    const githubRest = async (request: { method: string; path: string }) => {
      expect(request.method).toBe('GET');
      expect(request.path).toContain('/settings/billing/cost-centers?state=active');
      return {
        costCenters: [
          {
            id: '2eeb8ffe-6903-11ee-8c99-0242ac120002',
            name: 'Engineering',
            state: 'active',
            azure_subscription: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            resources: [{ type: 'User', name: 'someone' }],
            ai_credit_pool_enabled: true,
            ai_credit_pool_state: {
              target_amount: 21000,
              current_amount: 7250.5,
            },
          },
        ],
      };
    };

    const adapter = createGitHubBillingGatewayAdapter({ enterprise: ENTERPRISE, githubRest });
    const result = await adapter.execute('github.billing.cost_centers.list', { state: 'active' });

    expect(result).toEqual([
      {
        id: '2eeb8ffe-6903-11ee-8c99-0242ac120002',
        name: 'Engineering',
        state: 'active',
        aiCreditPoolEnabled: true,
        aiCreditPoolState: {
          targetAmount: 21000,
          currentAmount: 7250.5,
        },
      },
    ]);
    expect(result[0]).not.toHaveProperty('azure_subscription');
    expect(result[0]).not.toHaveProperty('resources');

    await expect(adapter.execute('github.billing.cost_centers.list', { state: 'archived' }))
      .rejects.toThrow(/not allowlisted/);
  });
});
