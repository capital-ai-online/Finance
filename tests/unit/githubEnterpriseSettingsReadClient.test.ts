import { describe, expect, it } from 'vitest';
import {
  createGitHubEnterpriseSettingsReadClient,
  GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES,
} from '../../scripts/operations/githubEnterpriseSettingsReadClient.mjs';

const ENTERPRISE = 'capital-ai-online';
const TOKEN = 'ghp_enterprise_settings_read_only_123456';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
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
        throw new Error(`unexpected request: ${method} ${parsed.pathname}`);
      }) as typeof fetch,
    });

    for (const capability of Object.keys(GITHUB_ENTERPRISE_SETTINGS_READ_CAPABILITIES)) {
      await client.read(capability);
    }

    expect(calls).toHaveLength(3);
    expect(calls.every((call) => call.method === 'GET')).toBe(true);
    expect(calls.every((call) => call.authorization === `Bearer ${TOKEN}`)).toBe(true);
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
