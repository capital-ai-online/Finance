import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createGitHubAppInstallationAuthTransport,
  createGitHubAppJwt,
} from '../../scripts/operations/githubAppInstallationAuthTransport.mjs';

const ENTERPRISE = 'capital-ai';
const CLIENT_ID = 'Iv23capitalai123456';

function keys() {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  return {
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicKey,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('GitHub App installation auth transport', () => {
  it('creates an RS256 JWT with bounded GitHub claims and a valid signature', () => {
    const { privateKeyPem, publicKey } = keys();
    const nowMs = Date.UTC(2026, 8, 18, 10, 0, 0);

    const jwt = createGitHubAppJwt({
      clientId: CLIENT_ID,
      privateKeyPem,
      nowMs,
    });

    const [headerPart, payloadPart, signaturePart] = jwt.split('.');
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));

    expect(header).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(payload.iss).toBe(CLIENT_ID);
    expect(payload.iat).toBe(Math.floor(nowMs / 1000) - 60);
    expect(payload.exp).toBe(Math.floor(nowMs / 1000) + (9 * 60));
    expect(payload.exp - Math.floor(nowMs / 1000)).toBeLessThanOrEqual(600);

    expect(verify(
      'RSA-SHA256',
      Buffer.from(`${headerPart}.${payloadPart}`, 'utf8'),
      publicKey,
      Buffer.from(signaturePart, 'base64url'),
    )).toBe(true);
  });

  it('discovers the exact Enterprise installation, mints one token, and reuses it while fresh', async () => {
    const { privateKeyPem } = keys();
    const nowMs = Date.UTC(2026, 8, 18, 10, 0, 0);
    const calls: Array<{ method: string; path: string; authorization: string }> = [];

    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url));
      const method = String(init?.method || 'GET');
      const authorization = String((init?.headers as Record<string, string>)?.Authorization || '');
      calls.push({ method, path: `${parsed.pathname}${parsed.search}`, authorization });

      if (method === 'GET' && parsed.pathname === '/app/installations') {
        return jsonResponse([
          {
            id: 101,
            target_type: 'Organization',
            account: { login: 'capital-ai-online' },
          },
          {
            id: 202,
            target_type: 'Enterprise',
            account: { slug: ENTERPRISE },
          },
        ]);
      }

      if (method === 'POST' && parsed.pathname === '/app/installations/202/access_tokens') {
        return jsonResponse({
          token: 'ghs_private_installation_token',
          expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        });
      }

      if (method === 'GET' && parsed.pathname === `/enterprises/${ENTERPRISE}/settings/billing/budgets`) {
        return jsonResponse({ budgets: [], has_next_page: false, total_count: 0 });
      }

      throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
    };

    const auth = createGitHubAppInstallationAuthTransport({
      clientId: CLIENT_ID,
      privateKeyPem,
      enterprise: ENTERPRISE,
      fetchImpl: fetchImpl as typeof fetch,
      now: () => nowMs,
    });

    const preflight = await auth.preflight();
    expect(preflight.installationId).toBe(202);

    await auth.githubRest({
      method: 'GET',
      path: `/enterprises/${ENTERPRISE}/settings/billing/budgets`,
    });
    await auth.githubRest({
      method: 'GET',
      path: `/enterprises/${ENTERPRISE}/settings/billing/budgets`,
    });

    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(calls.filter((call) => call.path.startsWith('/app/installations?'))).toHaveLength(1);
    expect(calls.filter((call) => call.path.includes('/settings/billing/budgets'))).toHaveLength(2);
    expect(calls.every((call) => call.authorization.startsWith('Bearer '))).toBe(true);
  });

  it('refreshes the installation token before expiry', async () => {
    const { privateKeyPem } = keys();
    let nowMs = Date.UTC(2026, 8, 18, 10, 0, 0);
    let tokenCalls = 0;

    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url));
      const method = String(init?.method || 'GET');

      if (method === 'GET' && parsed.pathname === '/app/installations') {
        return jsonResponse([
          { id: 303, target_type: 'Enterprise', account: { login: ENTERPRISE } },
        ]);
      }

      if (method === 'POST' && parsed.pathname === '/app/installations/303/access_tokens') {
        tokenCalls += 1;
        return jsonResponse({
          token: `ghs_token_${tokenCalls}`,
          expires_at: new Date(nowMs + 10 * 60 * 1000).toISOString(),
        });
      }

      if (method === 'GET' && parsed.pathname.includes('/settings/billing/usage/summary')) {
        return jsonResponse({ timePeriod: {}, enterprise: ENTERPRISE, usageItems: [] });
      }

      throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
    };

    const auth = createGitHubAppInstallationAuthTransport({
      clientId: CLIENT_ID,
      privateKeyPem,
      enterprise: ENTERPRISE,
      fetchImpl: fetchImpl as typeof fetch,
      now: () => nowMs,
    });

    await auth.githubRest({
      method: 'GET',
      path: `/enterprises/${ENTERPRISE}/settings/billing/usage/summary`,
    });
    expect(tokenCalls).toBe(1);

    nowMs += 6 * 60 * 1000;

    await auth.githubRest({
      method: 'GET',
      path: `/enterprises/${ENTERPRISE}/settings/billing/usage/summary`,
    });
    expect(tokenCalls).toBe(2);
  });

  it('clears a rejected token and retries one time on HTTP 401', async () => {
    const { privateKeyPem } = keys();
    const nowMs = Date.UTC(2026, 8, 18, 10, 0, 0);
    let tokenCalls = 0;
    let billingCalls = 0;

    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url));
      const method = String(init?.method || 'GET');

      if (method === 'GET' && parsed.pathname === '/app/installations') {
        return jsonResponse([
          { id: 404, target_type: 'Enterprise', account: { slug: ENTERPRISE } },
        ]);
      }

      if (method === 'POST' && parsed.pathname === '/app/installations/404/access_tokens') {
        tokenCalls += 1;
        return jsonResponse({
          token: `ghs_token_${tokenCalls}`,
          expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        });
      }

      if (method === 'GET' && parsed.pathname.includes('/settings/billing/cost-centers')) {
        billingCalls += 1;
        if (billingCalls === 1) return jsonResponse({ message: 'expired' }, 401);
        return jsonResponse({ costCenters: [] });
      }

      throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
    };

    const auth = createGitHubAppInstallationAuthTransport({
      clientId: CLIENT_ID,
      privateKeyPem,
      enterprise: ENTERPRISE,
      fetchImpl: fetchImpl as typeof fetch,
      now: () => nowMs,
    });

    const result = await auth.githubRest({
      method: 'GET',
      path: `/enterprises/${ENTERPRISE}/settings/billing/cost-centers`,
    });

    expect(result).toEqual({ costCenters: [] });
    expect(tokenCalls).toBe(2);
    expect(billingCalls).toBe(2);
  });

  it('rejects any public request outside the pinned read-only billing surface', async () => {
    const { privateKeyPem } = keys();
    let providerCalls = 0;

    const auth = createGitHubAppInstallationAuthTransport({
      clientId: CLIENT_ID,
      privateKeyPem,
      enterprise: ENTERPRISE,
      fetchImpl: (async () => {
        providerCalls += 1;
        return jsonResponse({});
      }) as typeof fetch,
    });

    await expect(auth.githubRest({
      method: 'POST',
      path: `/enterprises/${ENTERPRISE}/settings/billing/budgets`,
    })).rejects.toThrow(/only allows GET/);

    await expect(auth.githubRest({
      method: 'GET',
      path: '/app/installations',
    })).rejects.toThrow(/must stay inside/);

    await expect(auth.githubRest({
      method: 'GET',
      path: '/enterprises/other/settings/billing/budgets',
    })).rejects.toThrow(/must stay inside/);

    expect(providerCalls).toBe(0);
  });

  it('allows only the bounded Enterprise cost-center create mutation', async () => {
    const { privateKeyPem } = keys();
    const nowMs = Date.UTC(2026, 8, 18, 10, 0, 0);
    const calls: Array<{ method: string; path: string; body: unknown }> = [];

    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url));
      const method = String(init?.method || 'GET');

      if (method === 'GET' && parsed.pathname === '/app/installations') {
        return jsonResponse([
          { id: 707, target_type: 'Enterprise', account: { slug: ENTERPRISE } },
        ]);
      }

      if (method === 'POST' && parsed.pathname === '/app/installations/707/access_tokens') {
        return jsonResponse({
          token: 'ghs_cost_center_write_token',
          expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        });
      }

      if (method === 'POST' && parsed.pathname === `/enterprises/${ENTERPRISE}/settings/billing/cost-centers`) {
        const body = JSON.parse(String(init?.body || '{}'));
        calls.push({ method, path: parsed.pathname, body });
        return jsonResponse({
          id: 'cc-enterprise',
          name: body.name,
          state: 'active',
          ai_credit_pool_enabled: body.ai_credit_pool_enabled,
        }, 201);
      }

      throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
    };

    const auth = createGitHubAppInstallationAuthTransport({
      clientId: CLIENT_ID,
      privateKeyPem,
      enterprise: ENTERPRISE,
      fetchImpl: fetchImpl as typeof fetch,
      now: () => nowMs,
    });

    const result = await auth.createCostCenter({
      name: 'Enterprise',
      aiCreditPoolEnabled: false,
    });

    expect(result).toMatchObject({
      id: 'cc-enterprise',
      name: 'Enterprise',
      state: 'active',
      ai_credit_pool_enabled: false,
    });
    expect(calls).toEqual([{
      method: 'POST',
      path: `/enterprises/${ENTERPRISE}/settings/billing/cost-centers`,
      body: {
        name: 'Enterprise',
        ai_credit_pool_enabled: false,
      },
    }]);

    await expect(auth.createCostCenter({
      name: '../unsafe',
      aiCreditPoolEnabled: false,
    })).rejects.toThrow(/unsupported characters/);
  });

  it('fails closed when no exact Enterprise installation matches the configured slug', async () => {
    const { privateKeyPem } = keys();

    const auth = createGitHubAppInstallationAuthTransport({
      clientId: CLIENT_ID,
      privateKeyPem,
      enterprise: ENTERPRISE,
      fetchImpl: (async (url: string | URL | Request) => {
        const parsed = new URL(String(url));
        if (parsed.pathname === '/app/installations') {
          return jsonResponse([
            { id: 505, target_type: 'Organization', account: { login: 'capital-ai-online' } },
            { id: 606, target_type: 'Enterprise', account: { slug: 'other-enterprise' } },
          ]);
        }
        throw new Error('unexpected provider call');
      }) as typeof fetch,
    });

    await expect(auth.preflight()).rejects.toThrow(
      /expected exactly one Enterprise installation for capital-ai; found 0/,
    );
  });

  it('does not expose client-secret or token material through its described boundary', () => {
    const { privateKeyPem } = keys();

    const auth = createGitHubAppInstallationAuthTransport({
      clientId: CLIENT_ID,
      privateKeyPem,
      enterprise: ENTERPRISE,
      fetchImpl: (async () => jsonResponse({})) as typeof fetch,
    });

    expect(auth.describeAuthBoundary()).toEqual({
      enterprise: ENTERPRISE,
      apiBaseUrl: 'https://api.github.com',
      jwtAlgorithm: 'RS256',
      jwtMaxLifetimeSeconds: 540,
      installationTokenRefreshSkewSeconds: 300,
      publicMethods: ['GET', 'POST(cost-centers:create)'],
      publicPathPrefix: `/enterprises/${ENTERPRISE}/settings/billing/`,
      mutationCapabilities: ['github.billing.cost_centers.create'],
      rawMutationProxy: false,
      clientSecretUsed: false,
      tokenPersistence: false,
    });
  });
});
