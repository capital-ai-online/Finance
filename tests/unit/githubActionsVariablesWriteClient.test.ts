import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_REPOSITORY_VARIABLE,
  createGitHubActionsVariablesWriteClient,
} from '../../scripts/operations/githubActionsVariablesWriteClient.mjs';

const ORGANIZATION = 'capital-ai-online';
const REPOSITORY = 'capital-ai-online/Finance';
const CLIENT_ID = 'Iv23capitalai123456';

function privateKeyPem() {
  return generateKeyPairSync('rsa', { modulusLength: 2048 })
    .privateKey.export({ type: 'pkcs8', format: 'pem' })
    .toString();
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function clientFor(fetchImpl: typeof fetch, nowMs = Date.UTC(2026, 8, 20, 2, 0, 0)) {
  return createGitHubActionsVariablesWriteClient({
    clientId: CLIENT_ID,
    privateKeyPem: privateKeyPem(),
    organization: ORGANIZATION,
    fetchImpl,
    now: () => nowMs,
  });
}

describe('GitHub Actions variables write client', () => {
  it('creates the allowlisted repository variable on 404 and verifies exact readback', async () => {
    const nowMs = Date.UTC(2026, 8, 20, 2, 0, 0);
    const calls: Array<{ method: string; path: string; authorization: string; body: string }> = [];
    let created = false;

    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url));
      const method = String(init?.method || 'GET');
      const authorization = String(new Headers(init?.headers).get('Authorization') || '');
      const body = String(init?.body || '');
      calls.push({ method, path: parsed.pathname + parsed.search, authorization, body });

      if (method === 'GET' && parsed.pathname === '/app/installations') {
        return jsonResponse([{ id: 202, target_type: 'Organization', account: { login: ORGANIZATION } }]);
      }
      if (method === 'POST' && parsed.pathname === '/app/installations/202/access_tokens') {
        return jsonResponse({
          token: 'ghs_variables_write_token',
          expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        });
      }
      if (
        method === 'GET'
        && parsed.pathname === `/repos/${REPOSITORY}/actions/variables/${ALLOWED_REPOSITORY_VARIABLE}`
      ) {
        if (!created) return jsonResponse({ message: 'Not Found' }, 404);
        return jsonResponse({
          name: ALLOWED_REPOSITORY_VARIABLE,
          value: 'true',
          created_at: '2026-09-20T02:00:00Z',
          updated_at: '2026-09-20T02:00:00Z',
        });
      }
      if (method === 'POST' && parsed.pathname === `/repos/${REPOSITORY}/actions/variables`) {
        created = true;
        return jsonResponse(null, 201);
      }
      throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
    };

    const result = await clientFor(fetchImpl as typeof fetch, nowMs).setRepositoryVariable({
      repository: REPOSITORY,
      name: ALLOWED_REPOSITORY_VARIABLE,
      value: 'true',
    });

    expect(result.status).toBe('PASS');
    expect(result.action).toBe('created');
    expect(result.variable.value).toBe('true');
    expect(calls.some((call) => call.method === 'POST' && call.path === `/repos/${REPOSITORY}/actions/variables`)).toBe(true);
    expect(calls.filter((call) => call.path.includes('/actions/variables'))
      .every((call) => call.authorization === 'Bearer ghs_variables_write_token')).toBe(true);
  });

  it('updates an existing allowlisted repository variable and verifies exact readback', async () => {
    const nowMs = Date.UTC(2026, 8, 20, 2, 0, 0);
    let value = 'false';
    const methods: string[] = [];

    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url));
      const method = String(init?.method || 'GET');
      methods.push(method);

      if (method === 'GET' && parsed.pathname === '/app/installations') {
        return jsonResponse([{ id: 202, target_type: 'Organization', account: { login: ORGANIZATION } }]);
      }
      if (method === 'POST' && parsed.pathname === '/app/installations/202/access_tokens') {
        return jsonResponse({
          token: 'ghs_variables_write_token',
          expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        });
      }
      if (
        method === 'GET'
        && parsed.pathname === `/repos/${REPOSITORY}/actions/variables/${ALLOWED_REPOSITORY_VARIABLE}`
      ) {
        return jsonResponse({ name: ALLOWED_REPOSITORY_VARIABLE, value });
      }
      if (
        method === 'PATCH'
        && parsed.pathname === `/repos/${REPOSITORY}/actions/variables/${ALLOWED_REPOSITORY_VARIABLE}`
      ) {
        value = String(JSON.parse(String(init?.body)).value);
        return jsonResponse(null, 204);
      }
      throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
    };

    const result = await clientFor(fetchImpl as typeof fetch, nowMs).setRepositoryVariable({
      repository: REPOSITORY,
      name: ALLOWED_REPOSITORY_VARIABLE,
      value: 'true',
    });

    expect(result.action).toBe('updated');
    expect(result.variable.value).toBe('true');
    expect(methods).toContain('PATCH');
  });

  it('rejects non-allowlisted names, values and cross-organization repositories before provider access', async () => {
    let providerCalls = 0;
    const client = clientFor((async () => {
      providerCalls += 1;
      return jsonResponse({});
    }) as typeof fetch);

    await expect(client.setRepositoryVariable({
      repository: REPOSITORY,
      name: 'OTHER_VARIABLE',
      value: 'true',
    })).rejects.toThrow(/must be exactly GHCR_DIGEST_PUBLISH_ENABLED/);

    await expect(client.setRepositoryVariable({
      repository: REPOSITORY,
      name: ALLOWED_REPOSITORY_VARIABLE,
      value: 'yes',
    })).rejects.toThrow(/exactly true or false/);

    await expect(client.setRepositoryVariable({
      repository: 'other-org/Finance',
      name: ALLOWED_REPOSITORY_VARIABLE,
      value: 'true',
    })).rejects.toThrow(/owner must match/);

    expect(providerCalls).toBe(0);
  });
});
