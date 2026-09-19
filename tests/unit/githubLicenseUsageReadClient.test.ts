import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createGitHubLicenseUsageReadClient } from '../../scripts/operations/githubLicenseUsageReadClient.mjs';

const ENTERPRISE = 'capital-ai-online';
const ORGANIZATION = 'capital-ai-online';
const CLIENT_ID = 'Iv23capitalai123456';

function privateKeyPem() {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('GitHub license usage read client', () => {
  it('uses separate enterprise and organization installations for scoped read endpoints', async () => {
    const key = privateKeyPem();
    const nowMs = Date.UTC(2026, 8, 19, 16, 0, 0);
    const calls: Array<{ method: string; path: string }> = [];

    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url));
      const method = String(init?.method || 'GET');
      calls.push({ method, path: `${parsed.pathname}${parsed.search}` });

      if (method === 'GET' && parsed.pathname === '/app/installations') {
        return jsonResponse([
          { id: 100, target_type: 'Enterprise', account: { slug: ENTERPRISE } },
          { id: 200, target_type: 'Organization', account: { login: ORGANIZATION } },
        ]);
      }

      if (method === 'POST' && parsed.pathname === '/app/installations/100/access_tokens') {
        return jsonResponse({
          token: 'ghs_enterprise_license_read',
          expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        });
      }

      if (method === 'POST' && parsed.pathname === '/app/installations/200/access_tokens') {
        return jsonResponse({
          token: 'ghs_organization_security_read',
          expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        });
      }

      if (method === 'GET' && parsed.pathname === `/enterprises/${ENTERPRISE}/consumed-licenses`) {
        return jsonResponse({
          total_seats_consumed: 1,
          total_seats_purchased: 1,
          users: [{ github_com_login: 'owner', license_type: 'enterprise' }],
        });
      }

      if (method === 'GET' && parsed.pathname === `/organizations/${ORGANIZATION}/settings/billing/usage/summary`) {
        return jsonResponse({
          timePeriod: { year: 2026, month: 9, day: null },
          organization: ORGANIZATION,
          usageItems: [{
            product: 'Actions',
            sku: 'actions_linux',
            unitType: 'minutes',
            pricePerUnit: 0.006,
            grossQuantity: 100,
            grossAmount: 0.6,
            discountQuantity: 100,
            discountAmount: 0.6,
            netQuantity: 0,
            netAmount: 0,
          }],
        });
      }

      if (method === 'GET' && parsed.pathname === `/orgs/${ORGANIZATION}/settings/billing/advanced-security`) {
        return jsonResponse({
          total_advanced_security_committers: 1,
          total_count: 1,
          repositories: [{
            name: `${ORGANIZATION}/Finance`,
            advanced_security_committers: 1,
            advanced_security_committers_breakdown: [{ user_login: 'owner' }],
          }],
        });
      }

      throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
    };

    const client = createGitHubLicenseUsageReadClient({
      clientId: CLIENT_ID,
      privateKeyPem: key,
      enterprise: ENTERPRISE,
      organization: ORGANIZATION,
      fetchImpl: fetchImpl as typeof fetch,
      now: () => nowMs,
    });

    expect(await client.preflight()).toEqual({
      enterpriseInstallationId: 100,
      organizationInstallationId: 200,
    });

    const licenses = await client.getEnterpriseConsumedLicenses();
    expect(licenses.total_seats_consumed).toBe(1);

    const organizationUsage = await client.getOrganizationUsageSummary({
      year: 2026,
      month: 9,
      repository: `${ORGANIZATION}/Finance`,
    });
    expect(organizationUsage.organization).toBe(ORGANIZATION);
    expect(organizationUsage.usageItems).toHaveLength(1);

    const codeSecurity = await client.getAdvancedSecurityActiveCommitters({ product: 'code_security' });
    expect(codeSecurity.total_advanced_security_committers).toBe(1);

    const secretProtection = await client.getAdvancedSecurityActiveCommitters({ product: 'secret_protection' });
    expect(secretProtection.total_count).toBe(1);

    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(2);
    expect(calls.filter((call) => call.path.startsWith('/app/installations?'))).toHaveLength(1);
    expect(calls.some((call) => call.path.includes('/consumed-licenses?per_page=100&page=1'))).toBe(true);
    expect(calls.some((call) => call.path.includes(`/organizations/${ORGANIZATION}/settings/billing/usage/summary?`))).toBe(true);
    expect(calls.some((call) => call.path.includes('repository=capital-ai-online%2FFinance'))).toBe(true);
    expect(calls.some((call) => call.path.includes('advanced_security_product=code_security'))).toBe(true);
    expect(calls.some((call) => call.path.includes('advanced_security_product=secret_protection'))).toBe(true);
  });

  it('exposes only bounded read capabilities and rejects unsupported products', async () => {
    const client = createGitHubLicenseUsageReadClient({
      clientId: CLIENT_ID,
      privateKeyPem: privateKeyPem(),
      enterprise: ENTERPRISE,
      organization: ORGANIZATION,
      fetchImpl: (async () => jsonResponse([])) as typeof fetch,
    });

    expect(client.describeBoundary()).toEqual({
      enterprise: ENTERPRISE,
      organization: ORGANIZATION,
      publicMethods: ['GET'],
      capabilities: [
        'enterprise.consumed_licenses.list',
        'organization.advanced_security.active_committers.code_security',
        'organization.advanced_security.active_committers.secret_protection',
        'organization.billing.usage.summary',
      ],
      tokenPersistence: false,
      clientSecretUsed: false,
    });

    await expect(
      client.getAdvancedSecurityActiveCommitters({ product: 'unsupported' }),
    ).rejects.toThrow(/product must be code_security or secret_protection/);

    await expect(
      client.getOrganizationUsageSummary({ repository: 'invalid repository' }),
    ).rejects.toThrow(/repository must use owner\/repository form/);
  });
});
