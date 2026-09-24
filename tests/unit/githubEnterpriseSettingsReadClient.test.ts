import { describe, expect, it } from 'vitest';
import {
  createGitHubEnterpriseSettingsReadClient,
  GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES,
} from '../../scripts/operations/githubEnterpriseSettingsReadClient.mjs';

const ENTERPRISE = 'capital-ai-online';
const TOKEN = 'ghp_enterprise_settings_read_only_123456';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('GitHub enterprise settings read client', () => {
  it('reads only the bounded enterprise Actions settings allowlist with the configured PAT', async () => {
    const calls: Array<{ method: string; path: string; authorization: string }> = [];
    const client = createGitHubEnterpriseSettingsReadClient({
      enterprise: ENTERPRISE,
      enterpriseReadPat: TOKEN,
      fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
        const parsed = new URL(String(url));
        const method = String(init?.method || 'GET');
        const authorization = String(new Headers(init?.headers).get('Authorization') || '');
        calls.push({ method, path: parsed.pathname, authorization });

        if (parsed.pathname === `/enterprises/${ENTERPRISE}/actions/permissions`) {
          return jsonResponse({
            enabled_organizations: 'all',
            allowed_actions: 'selected',
            sha_pinning_required: true,
          });
        }
        if (parsed.pathname === `/enterprises/${ENTERPRISE}/actions/permissions/selected-actions`) {
          return jsonResponse({
            github_owned_allowed: true,
            verified_allowed: true,
            patterns_allowed: ['aquasecurity/trivy-action@*'],
          });
        }
        if (parsed.pathname === `/enterprises/${ENTERPRISE}/actions/permissions/workflow`) {
          return jsonResponse({
            default_workflow_permissions: 'read',
            can_approve_pull_request_reviews: false,
          });
        }
        if (parsed.pathname === `/enterprises/${ENTERPRISE}/actions/permissions/organizations`) {
          return jsonResponse({ total_count: 1, organizations: [{ login: 'capital-ai-online' }] });
        }
        if (parsed.pathname === `/enterprises/${ENTERPRISE}/code-security/configurations`) {
          return jsonResponse([{ id: 1, target_type: 'global', enforcement: 'enforced' }]);
        }
        if (parsed.pathname === `/enterprises/${ENTERPRISE}/actions/runner-groups`) {
          return jsonResponse({ total_count: 1, groups: [{ id: 1, name: 'default', visibility: 'selected' }] });
        }
        if (parsed.pathname === `/enterprises/${ENTERPRISE}/actions/runners`) {
          return jsonResponse({ total_count: 1, runners: [{ id: 1, name: 'runner', status: 'online', busy: false }] });
        }
        throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
      }) as typeof fetch,
    });

    for (const capability of Object.keys(GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES)) {
      await client.read(capability);
    }

    expect(calls).toHaveLength(Object.keys(GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES).length);
    expect(calls.every((call) => call.method === 'GET')).toBe(true);
    expect(calls.every((call) => call.authorization === `Bearer ${TOKEN}`)).toBe(true);
  });


  it('captures bounded 403 diagnostics without exposing SSO URLs or token-like values', async () => {
    const client = createGitHubEnterpriseSettingsReadClient({
      enterprise: ENTERPRISE,
      enterpriseReadPat: TOKEN,
      fetchImpl: (async () => jsonResponse({
        message: 'Enterprise policy denied request. See https://github.com/orgs/capital-ai-online/sso?authorization_request=secret ghp_should_not_escape_123',
      }, 403, {
        'x-oauth-scopes': 'read:enterprise, admin:enterprise',
        'x-accepted-oauth-scopes': 'admin:enterprise',
        'x-github-sso': 'required; url=https://github.com/orgs/capital-ai-online/sso?authorization_request=secret',
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': '1760000000',
        'x-ratelimit-resource': 'core',
      })) as typeof fetch,
    });

    let caught: any = null;
    try {
      await client.read('enterprise.actions.permissions.get');
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({
      status: 403,
      providerDiagnostics: {
        classification: 'SSO_AUTHORIZATION_REQUIRED',
        oauthScopes: ['admin:enterprise', 'read:enterprise'],
        acceptedOauthScopes: ['admin:enterprise'],
        ssoRequired: true,
        rateLimit: {
          limit: 5000,
          remaining: 4999,
          resetEpochSeconds: 1760000000,
          resource: 'core',
        },
        providerReason: 'Enterprise policy denied request. See [REDACTED_URL] [REDACTED_TOKEN]',
      },
    });
    const serialized = JSON.stringify(caught.providerDiagnostics);
    expect(serialized).not.toContain('authorization_request');
    expect(serialized).not.toContain('ghp_should_not_escape_123');
    expect(serialized).not.toContain(TOKEN);
  });

  it('fails closed on unsupported capabilities and exposes no raw proxy', async () => {
    let calls = 0;
    const client = createGitHubEnterpriseSettingsReadClient({
      enterprise: ENTERPRISE,
      enterpriseReadPat: TOKEN,
      fetchImpl: (async () => {
        calls += 1;
        return jsonResponse({});
      }) as typeof fetch,
    });

    await expect(client.read('enterprise.unsupported')).rejects.toThrow(/unsupported capability/);
    expect(calls).toBe(0);
    expect(client.describeBoundary()).toEqual({
      enterprise: ENTERPRISE,
      publicMethods: ['GET'],
      rawProxy: false,
      capabilities: Object.keys(GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES),
      auth: 'classic_pat_read_only',
      tokenPersistence: false,
    });
  });
});
