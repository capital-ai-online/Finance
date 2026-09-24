import { describe, expect, it } from 'vitest';
import {
  createGitHubUserSettingsReadClient,
  GITHUB_USER_SETTINGS_READ_CAPABILITIES,
} from '../../scripts/operations/githubUserSettingsReadClient.mjs';

const TOKEN = 'ghp_user_settings_read_token_1234567890';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('GitHub user settings read client', () => {
  it('reads only the bounded authenticated-user settings capabilities', async () => {
    const calls: Array<{ method: string; path: string; authorization: string }> = [];
    const client = createGitHubUserSettingsReadClient({
      userReadToken: TOKEN,
      fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
        const parsed = new URL(String(url));
        const method = String(init?.method || 'GET');
        calls.push({
          method,
          path: parsed.pathname,
          authorization: String(new Headers(init?.headers).get('Authorization') || ''),
        });
        if (parsed.pathname === '/user') {
          return jsonResponse({ login: 'owner', type: 'User', two_factor_authentication: true });
        }
        if (parsed.pathname === '/user/emails') {
          return jsonResponse([{ email: 'private@example.test', primary: true, verified: true, visibility: null }]);
        }
        if (parsed.pathname === '/user/keys') {
          return jsonResponse([{ id: 1, title: 'laptop', key: 'ssh-ed25519 SECRET' }]);
        }
        if (parsed.pathname === '/user/gpg_keys') {
          return jsonResponse([{ id: 2, raw_key: 'SECRET', can_sign: true, emails: [{ email: 'private@example.test' }] }]);
        }
        if (parsed.pathname === '/user/ssh_signing_keys') {
          return jsonResponse([{ id: 3, title: 'signing', key: 'ssh-ed25519 SECRET' }]);
        }
        throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
      }) as typeof fetch,
    });

    for (const capability of Object.keys(GITHUB_USER_SETTINGS_READ_CAPABILITIES)) {
      await client.read(capability);
    }

    expect(calls).toHaveLength(Object.keys(GITHUB_USER_SETTINGS_READ_CAPABILITIES).length);
    expect(calls.every((call) => call.method === 'GET')).toBe(true);
    expect(calls.every((call) => call.authorization === `Bearer ${TOKEN}`)).toBe(true);
  });

  it('redacts provider diagnostics and never exposes SSO authorization URL values', async () => {
    const client = createGitHubUserSettingsReadClient({
      userReadToken: TOKEN,
      fetchImpl: (async () => jsonResponse({
        message: 'Authorize at https://github.com/orgs/example/sso?authorization_request=secret ghp_should_not_escape_123',
      }, 403, {
        'x-oauth-scopes': 'read:user, user:email',
        'x-accepted-oauth-scopes': 'user:email',
        'x-github-sso': 'required; url=https://github.com/orgs/example/sso?authorization_request=secret',
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': '1760000000',
        'x-ratelimit-resource': 'core',
      })) as typeof fetch,
    });

    let caught: any = null;
    try {
      await client.read('user.emails.list');
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({
      status: 403,
      providerDiagnostics: {
        classification: 'FORBIDDEN',
        oauthScopes: ['read:user', 'user:email'],
        acceptedOauthScopes: ['user:email'],
        ssoRequired: true,
        providerReason: 'Authorize at [REDACTED_URL] [REDACTED_TOKEN]',
      },
    });
    const serialized = JSON.stringify(caught.providerDiagnostics);
    expect(serialized).not.toContain('authorization_request');
    expect(serialized).not.toContain('ghp_should_not_escape_123');
    expect(serialized).not.toContain(TOKEN);
  });

  it('fails before provider access for unsupported user capabilities', async () => {
    let calls = 0;
    const client = createGitHubUserSettingsReadClient({
      userReadToken: TOKEN,
      fetchImpl: (async () => {
        calls += 1;
        return jsonResponse({});
      }) as typeof fetch,
    });

    await expect(client.read('user.unsupported')).rejects.toThrow(/unsupported capability/);
    expect(calls).toBe(0);
    expect(client.describeBoundary()).toMatchObject({
      publicMethods: ['GET'],
      rawProxy: false,
      auth: 'authenticated_user_read_token',
      tokenPersistence: false,
    });
  });
});
