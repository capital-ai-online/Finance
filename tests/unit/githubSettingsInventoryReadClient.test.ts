import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createGitHubSettingsInventoryReadClient,
  GITHUB_SETTINGS_READ_CAPABILITIES,
} from '../../scripts/operations/githubSettingsInventoryReadClient.mjs';

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

describe('GitHub settings inventory read client', () => {
  it('uses one Organization installation token for the bounded settings allowlist', async () => {
    const nowMs = Date.UTC(2026, 8, 20, 19, 15, 0);
    const calls: Array<{ method: string; path: string; authorization: string }> = [];

    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const parsed = new URL(String(url));
      const method = String(init?.method || 'GET');
      const authorization = String(new Headers(init?.headers).get('Authorization') || '');
      const path = `${parsed.pathname}${parsed.search}`;
      calls.push({ method, path, authorization });

      if (method === 'GET' && parsed.pathname === '/app/installations') {
        return jsonResponse([
          { id: 202, target_type: 'Organization', account: { login: ORGANIZATION } },
        ]);
      }

      if (method === 'POST' && parsed.pathname === '/app/installations/202/access_tokens') {
        return jsonResponse({
          token: 'ghs_settings_inventory_token',
          expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
        });
      }

      if (method === 'GET' && parsed.pathname === `/orgs/${ORGANIZATION}/actions/permissions`) {
        return jsonResponse({
          enabled_repositories: 'all',
          allowed_actions: 'selected',
          sha_pinning_required: true,
        });
      }

      if (method === 'GET' && parsed.pathname === `/orgs/${ORGANIZATION}/actions/permissions/workflow`) {
        return jsonResponse({
          default_workflow_permissions: 'read',
          can_approve_pull_request_reviews: false,
        });
      }

      if (
        method === 'GET'
        && parsed.pathname === `/orgs/${ORGANIZATION}/actions/permissions/artifact-and-log-retention`
      ) {
        return jsonResponse({ days: 90, maximum_allowed_days: 365 });
      }

      if (
        method === 'GET'
        && parsed.pathname === `/orgs/${ORGANIZATION}/actions/permissions/fork-pr-workflows-private-repos`
      ) {
        return jsonResponse({
          run_workflows_from_fork_pull_requests: false,
          send_write_tokens_to_workflows: false,
          send_secrets_and_variables: false,
          require_approval_for_fork_pr_workflows: true,
        });
      }

      if (
        method === 'GET'
        && parsed.pathname === `/orgs/${ORGANIZATION}/actions/permissions/self-hosted-runners`
      ) {
        return jsonResponse({ enabled_repositories: 'none' });
      }

      if (method === 'GET' && parsed.pathname === `/repos/${REPOSITORY}`) {
        return jsonResponse({
          visibility: 'private',
          default_branch: 'main',
          allow_auto_merge: true,
          delete_branch_on_merge: true,
        });
      }

      if (method === 'GET' && parsed.pathname === `/repos/${REPOSITORY}/actions/permissions`) {
        return jsonResponse({ enabled: true, allowed_actions: 'selected', sha_pinning_required: true });
      }

      if (method === 'GET' && parsed.pathname === `/repos/${REPOSITORY}/actions/permissions/workflow`) {
        return jsonResponse({
          default_workflow_permissions: 'read',
          can_approve_pull_request_reviews: false,
        });
      }

      if (
        method === 'GET'
        && parsed.pathname === `/repos/${REPOSITORY}/actions/permissions/artifact-and-log-retention`
      ) {
        return jsonResponse({ days: 90, maximum_allowed_days: 365 });
      }

      if (
        method === 'GET'
        && parsed.pathname === `/repos/${REPOSITORY}/actions/permissions/fork-pr-workflows-private-repos`
      ) {
        return jsonResponse({
          run_workflows_from_fork_pull_requests: false,
          send_write_tokens_to_workflows: false,
          send_secrets_and_variables: false,
          require_approval_for_fork_pr_workflows: true,
        });
      }

      if (method === 'GET' && parsed.pathname === `/repos/${REPOSITORY}/properties/values`) {
        return jsonResponse([{ property_name: 'environment', value: 'production' }]);
      }

      if (method === 'GET' && parsed.pathname === `/repos/${REPOSITORY}/rulesets`) {
        return jsonResponse([{ id: 1, target: 'branch', enforcement: 'active' }]);
      }

      throw new Error(`unexpected request: ${method} ${path}`);
    };

    const client = createGitHubSettingsInventoryReadClient({
      clientId: CLIENT_ID,
      privateKeyPem: privateKeyPem(),
      organization: ORGANIZATION,
      fetchImpl: fetchImpl as typeof fetch,
      now: () => nowMs,
    });

    expect(await client.preflight()).toEqual({
      organizationInstallationId: 202,
      installationTokenExpiresAt: new Date(nowMs + 60 * 60 * 1000).toISOString(),
    });

    for (const capability of Object.keys(GITHUB_SETTINGS_READ_CAPABILITIES)) {
      const descriptor = GITHUB_SETTINGS_READ_CAPABILITIES[
        capability as keyof typeof GITHUB_SETTINGS_READ_CAPABILITIES
      ];
      const input = descriptor.scope === 'repository' ? { repository: REPOSITORY } : {};
      await client.read(capability, input);
    }

    expect(await client.listRepositoryRulesets({ repository: REPOSITORY })).toHaveLength(1);
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(
      calls
        .filter((call) => call.path !== '/app/installations?per_page=100&page=1')
        .filter((call) => call.method === 'GET')
        .every((call) => call.authorization === 'Bearer ghs_settings_inventory_token'),
    ).toBe(true);
  });

  it('rejects unsupported capabilities and cross-organization repositories before provider access', async () => {
    let providerCalls = 0;
    const client = createGitHubSettingsInventoryReadClient({
      clientId: CLIENT_ID,
      privateKeyPem: privateKeyPem(),
      organization: ORGANIZATION,
      fetchImpl: (async () => {
        providerCalls += 1;
        return jsonResponse([]);
      }) as typeof fetch,
    });

    await expect(client.read('repository.unsupported', { repository: REPOSITORY }))
      .rejects.toThrow(/unsupported capability/);
    await expect(client.read('repository.settings.get', { repository: 'other-org/Finance' }))
      .rejects.toThrow(/owner must match/);
    await expect(client.listRepositoryRulesets({ repository: 'other-org/Finance' }))
      .rejects.toThrow(/owner must match/);

    expect(providerCalls).toBe(0);
  });

  it('declares a read-only boundary with no raw proxy or token persistence', () => {
    const client = createGitHubSettingsInventoryReadClient({
      clientId: CLIENT_ID,
      privateKeyPem: privateKeyPem(),
      organization: ORGANIZATION,
      fetchImpl: (async () => jsonResponse([])) as typeof fetch,
    });

    expect(client.describeBoundary()).toEqual({
      organization: ORGANIZATION,
      publicMethods: ['GET'],
      rawProxy: false,
      capabilities: Object.keys(GITHUB_SETTINGS_READ_CAPABILITIES),
      repositoryRulesetsPermission: 'Metadata: read',
      tokenPersistence: false,
      clientSecretUsed: false,
    });
  });
});
