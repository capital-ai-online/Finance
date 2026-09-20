import { describe, expect, it } from 'vitest';
import { createGitHubUserBillingReadClient } from '../../scripts/operations/githubUserBillingReadClient.mjs';

describe('GitHub user billing read client', () => {
  it('reads only the authenticated user billing summary with Plan read semantics', async () => {
    const calls: Array<{ method: string; path: string; authorization: string | null }> = [];
    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url));
      calls.push({
        method: String(init?.method || 'GET'),
        path: `${parsed.pathname}${parsed.search}`,
        authorization: new Headers(init?.headers).get('Authorization'),
      });
      return new Response(JSON.stringify({
        timePeriod: { year: 2026, month: 10, day: null },
        user: 'SvenKulessa',
        usageItems: [{
          product: 'Actions',
          sku: 'actions_linux',
          unitType: 'minutes',
          pricePerUnit: 0.006,
          grossQuantity: 10,
          grossAmount: 0.06,
          discountQuantity: 10,
          discountAmount: 0.06,
          netQuantity: 0,
          netAmount: 0,
        }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const client = createGitHubUserBillingReadClient({
      username: 'SvenKulessa',
      userAccessToken: 'github_pat_test_user_billing_read_only',
      fetchImpl: fetchImpl as typeof fetch,
    });

    const result = await client.getUsageSummary({ year: 2026, month: 10 });
    expect(result.user).toBe('SvenKulessa');
    expect(result.usageItems).toHaveLength(1);
    expect(calls).toEqual([{
      method: 'GET',
      path: '/users/SvenKulessa/settings/billing/usage/summary?year=2026&month=10',
      authorization: 'Bearer github_pat_test_user_billing_read_only',
    }]);
    expect(client.describeBoundary()).toEqual({
      username: 'SvenKulessa',
      requiredPermission: 'user.plan:read',
      acceptedCredential: 'github_app_user_access_token_or_fine_grained_pat',
      publicMethods: ['GET'],
      publicPath: '/users/SvenKulessa/settings/billing/usage/summary',
      tokenPersistence: false,
    });
  });

  it('fails closed on an invalid credential', () => {
    expect(() => createGitHubUserBillingReadClient({
      username: 'SvenKulessa',
      userAccessToken: 'short',
    })).toThrow(/userAccessToken is required/);
  });
});
