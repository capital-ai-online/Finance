import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildGitHubEnterpriseActionsPolicySnapshot,
  loadGitHubEnterpriseActionsPolicySnapshot,
  resetGitHubEnterpriseActionsPolicyCacheForTests,
} from '../../server/githubEnterpriseActionsPolicyProjection';

const ENTERPRISE = 'capital-ai-online';
const TOKEN = 'ghp_render_enterprise_reader_123456789012345';

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function provider(calls: string[]) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push(`${String(init?.method || 'GET')} ${url.pathname}`);

    if (url.pathname === `/enterprises/${ENTERPRISE}/actions/permissions`) {
      return jsonResponse({
        enabled_organizations: 'selected',
        allowed_actions: 'selected',
        sha_pinning_required: true,
      });
    }
    if (url.pathname === `/enterprises/${ENTERPRISE}/actions/permissions/selected-actions`) {
      return jsonResponse({
        github_owned_allowed: true,
        verified_allowed: false,
        patterns_allowed: [
          'zizmorcore/zizmor-action@*',
          'aquasecurity/trivy-action@*',
        ],
      });
    }
    if (url.pathname === `/enterprises/${ENTERPRISE}/actions/permissions/workflow`) {
      return jsonResponse({
        default_workflow_permissions: 'read',
        can_approve_pull_request_reviews: true,
      });
    }
    return jsonResponse({ message: 'not found' }, 404);
  }) as typeof fetch;
}

describe('GitHub Enterprise Actions Render projection', () => {
  beforeEach(() => resetGitHubEnterpriseActionsPolicyCacheForTests());

  it('reuses the canonical bounded reader and projects only sanitized policy evidence', async () => {
    const calls: string[] = [];
    const snapshot = await buildGitHubEnterpriseActionsPolicySnapshot({
      enterprise: ENTERPRISE,
      enterpriseReadPat: TOKEN,
      fetchImpl: provider(calls),
      now: () => Date.parse('2026-09-24T12:00:00.000Z'),
    });

    expect(snapshot.status).toBe('PASS');
    expect(snapshot.entries.permissions).toMatchObject({
      status: 'PASS',
      data: {
        enabledOrganizations: 'selected',
        allowedActions: 'selected',
        shaPinningRequired: true,
      },
    });
    expect(snapshot.entries.selectedActions).toMatchObject({
      status: 'PASS',
      data: {
        githubOwnedAllowed: true,
        verifiedAllowed: false,
        patternsAllowed: [
          'aquasecurity/trivy-action@*',
          'zizmorcore/zizmor-action@*',
        ],
      },
    });
    expect(snapshot.entries.workflowPermissions).toMatchObject({
      status: 'PASS',
      data: {
        defaultWorkflowPermissions: 'read',
        canApprovePullRequestReviews: true,
      },
    });
    expect(snapshot.boundary).toMatchObject({
      executionHost: 'FINANCE_RENDER_RUNTIME',
      openAiExecutionRequired: false,
      codexExecutionRequired: false,
      chatExecutionRequired: false,
      mutationPerformed: false,
      secretsOrTokensExposed: false,
      provider: {
        publicMethods: ['GET'],
        rawProxy: false,
        auth: 'classic_pat_read_only',
        tokenPersistence: false,
      },
    });
    expect(calls).toHaveLength(3);
    expect(calls.every((call) => call.startsWith('GET '))).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain(TOKEN);
  });

  it('caches the Render-side provider snapshot for five minutes', async () => {
    const calls: string[] = [];
    let nowMs = Date.parse('2026-09-24T12:00:00.000Z');
    const options = {
      enterprise: ENTERPRISE,
      enterpriseReadPat: TOKEN,
      fetchImpl: provider(calls),
      now: () => nowMs,
    };

    const first = await loadGitHubEnterpriseActionsPolicySnapshot(options);
    nowMs += 299_999;
    const second = await loadGitHubEnterpriseActionsPolicySnapshot(options);

    expect(second).toEqual(first);
    expect(calls).toHaveLength(3);

    nowMs += 2;
    await loadGitHubEnterpriseActionsPolicySnapshot(options);
    expect(calls).toHaveLength(6);
  });

  it('returns bounded redacted diagnostics when GitHub rejects a capability', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/selected-actions')) {
        return jsonResponse({
          message: 'Denied https://github.com/enterprises/capital-ai-online/sso?secret=1 ghp_must_not_escape_123',
        }, 403, {
          'x-oauth-scopes': 'admin:enterprise',
          'x-accepted-oauth-scopes': 'admin:enterprise',
          'x-github-sso': 'required; url=https://github.com/secret',
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4999',
          'x-ratelimit-reset': '1760000000',
          'x-ratelimit-resource': 'core',
        });
      }
      return provider([])(input, { method: 'GET' });
    }) as typeof fetch;

    const snapshot = await buildGitHubEnterpriseActionsPolicySnapshot({
      enterprise: ENTERPRISE,
      enterpriseReadPat: TOKEN,
      fetchImpl,
    });

    expect(snapshot.status).toBe('PARTIAL_COVERAGE');
    expect(snapshot.entries.selectedActions).toMatchObject({
      status: 'NOT_OBSERVABLE',
      providerStatus: 403,
      providerDiagnostics: {
        classification: 'SSO_AUTHORIZATION_REQUIRED',
        oauthScopes: ['admin:enterprise'],
        acceptedOauthScopes: ['admin:enterprise'],
        ssoRequired: true,
      },
    });
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain('authorization_request');
    expect(serialized).not.toContain('ghp_must_not_escape_123');
    expect(serialized).not.toContain(TOKEN);
  });

  it('keeps the runtime route owner-only and independent from OpenAI execution surfaces', () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), 'server/routes/githubEnterpriseActionsPolicyRoutes.ts'),
      'utf8',
    );
    const projection = fs.readFileSync(
      path.join(process.cwd(), 'server/githubEnterpriseActionsPolicyProjection.ts'),
      'utf8',
    );
    const render = fs.readFileSync(path.join(process.cwd(), 'render.yaml'), 'utf8');

    expect(route).toContain('OWNER_ONLY_ROLES');
    expect(route).toContain("checkAdminAccess(");
    expect(route).toContain("'github-enterprise-actions-policy:read'");
    expect(projection).toContain("from '../scripts/operations/githubEnterpriseSettingsReadClient.mjs'");
    expect(projection).toContain("from '../scripts/operations/githubSettingsInventoryProjection.mjs'");
    expect(projection).not.toContain('OPENAI_API_KEY');
    expect(projection).not.toContain('CODEX');
    expect(render).toContain('CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT');
    expect(render).not.toContain(TOKEN);
  });
});
