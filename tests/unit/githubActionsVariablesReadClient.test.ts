import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createGitHubLicenseUsageReadClient } from '../../scripts/operations/githubLicenseUsageReadClient.mjs';

const ENTERPRISE = 'capital-ai';
const ORGANIZATION = 'capital-ai-online';
const REPOSITORY = 'capital-ai-online/Finance';
const CLIENT_ID = 'Iv23capitalai123456';

function privateKeyPem() {
  return generateKeyPairSync('rsa', { modulusLength: 2048 })
    .privateKey.export({ type: 'pkcs8', format: 'pem' })
    .toString();
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('GitHub Actions variables read surface', () => {
  it('reads repository and organization variables with the Organization installation token only', async () => {
    const nowMs = Date.UTC(2026, 8, 20, 1, 0, 0);
    const calls: Array<{ method: string; path: string; authorization: string }> = [];

    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url));
      const method = String(init?.method || 'GET');
      const authorization = String((init?.headers as Record<string, string>)?.Authorization || '');
      calls.push({ method, path: `${parsed.pathname}${parsed.search}`, authorization });

      if (method === 'GET' && parsed.pathname === '/app/installations') {
        return jsonResponse([
          { id: 101, target_type: 'Enterprise', account: { slug: ENTERPRISE } },
          { id: 202, target_type: 'Organization', account: { login: ORGANIZATION } },
        ]);
      }

      if (method === 'POST' && parsed.pathname === '/app/installations/101/access_tokens') {
        return jsonResponse({
          token: 'ghs_enterprise_installation_token',
          expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        });
      }

      if (method === 'POST' && parsed.pathname === '/app/installations/202/access_tokens') {
        return jsonResponse({
          token: 'ghs_organization_installation_token',
          expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        });
      }

      if (method === 'GET' && parsed.pathname === '/repos/capital-ai-online/Finance/actions/variables/GHCR_DIGEST_PUBLISH_ENABLED') {
        return jsonResponse({
          name: 'GHCR_DIGEST_PUBLISH_ENABLED',
          value: 'false',
          created_at: '2026-09-19T00:00:00Z',
          updated_at: '2026-09-20T00:00:00Z',
        });
      }

      if (method === 'GET' && parsed.pathname === '/orgs/capital-ai-online/actions/variables/GHCR_DIGEST_PUBLISH_ENABLED') {
        return jsonResponse({
          name: 'GHCR_DIGEST_PUBLISH_ENABLED',
          value: 'false',
          visibility: 'selected',
          created_at: '2026-09-19T00:00:00Z',
          updated_at: '2026-09-20T00:00:00Z',
        });
      }

      throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
    };

    const client = createGitHubLicenseUsageReadClient({
      clientId: CLIENT_ID,
      privateKeyPem: privateKeyPem(),
      enterprise: ENTERPRISE,
      organization: ORGANIZATION,
      fetchImpl: fetchImpl as typeof fetch,
      now: () => nowMs,
    });

    const repoVariable = await client.getRepositoryVariable({
      repository: REPOSITORY,
      name: 'GHCR_DIGEST_PUBLISH_ENABLED',
    });
    const orgVariable = await client.getOrganizationVariable({
      name: 'GHCR_DIGEST_PUBLISH_ENABLED',
    });

    expect(repoVariable.value).toBe('false');
    expect(orgVariable.value).toBe('false');
    expect(calls.filter((call) => call.path.includes('/actions/variables/'))).toHaveLength(2);
    expect(calls.filter((call) => call.path.includes('/actions/variables/'))
      .every((call) => call.authorization === 'Bearer ghs_organization_installation_token')).toBe(true);
  });

  it('rejects cross-organization repositories and malformed variable names before provider access', async () => {
    let providerCalls = 0;
    const client = createGitHubLicenseUsageReadClient({
      clientId: CLIENT_ID,
      privateKeyPem: privateKeyPem(),
      enterprise: ENTERPRISE,
      organization: ORGANIZATION,
      fetchImpl: (async () => {
        providerCalls += 1;
        return jsonResponse({});
      }) as typeof fetch,
    });

    await expect(client.getRepositoryVariable({
      repository: 'other-org/Finance',
      name: 'GHCR_DIGEST_PUBLISH_ENABLED',
    })).rejects.toThrow(/owner must match/);

    await expect(client.getOrganizationVariable({
      name: '../TOKEN',
    })).rejects.toThrow(/variable name/);

    expect(providerCalls).toBe(0);
  });
});
