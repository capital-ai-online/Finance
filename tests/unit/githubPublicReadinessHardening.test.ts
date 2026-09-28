import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createGitHubPublicReadinessEnterpriseWriter } from '../../scripts/operations/githubPublicReadinessEnterpriseWriter.mjs';

const root = path.resolve(__dirname, '../..');
const APP_TOKEN = 'enterprise_installation_token_for_unit_test_1234567890';
const ADMIN_PAT = 'ghp_admin_enterprise_pat_for_unit_test_1234567890';

const response = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) => new Response(
  body === null ? null : JSON.stringify(body),
  { status, headers: { 'content-type': 'application/json', ...headers } },
);

function ruleset({
  approvals = 1,
  codeOwner = true,
  bypass = [] as unknown[],
} = {}) {
  return {
    id: 24109163,
    name: 'capital-ai-finance-main-governance',
    target: 'branch',
    source_type: 'Enterprise',
    source: 'capital-ai-online',
    enforcement: 'active',
    conditions: {
      organization_name: { include: ['capital-ai-online'], exclude: [] },
      repository_name: { include: ['Finance'], exclude: [] },
      ref_name: { include: ['~DEFAULT_BRANCH'], exclude: [] },
    },
    bypass_actors: bypass,
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: approvals,
          dismiss_stale_reviews_on_push: true,
          require_code_owner_review: codeOwner,
          require_last_push_approval: false,
          required_review_thread_resolution: true,
          require_extra_approval_for_unattributed_changes: false,
          allowed_merge_methods: ['merge'],
        },
      },
      { type: 'license_compliance_scanning' },
    ],
  };
}

describe('GitHub public-readiness Enterprise writer', () => {
  it('uses the Enterprise App without PAT fallback when provider access succeeds', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${APP_TOKEN}`);
      if (String(init?.method || 'GET') !== 'GET') throw new Error('unexpected write');
      if (url.endsWith('/rulesets')) {
        return response([{ id: 24109163, name: 'capital-ai-finance-main-governance', target: 'branch' }]);
      }
      return response(ruleset());
    });

    const result = await createGitHubPublicReadinessEnterpriseWriter({
      enterpriseInstallationToken: APP_TOKEN,
      enterpriseAdminPat: ADMIN_PAT,
      fetchImpl: fetchImpl as typeof fetch,
    }).ensure();

    expect(result.status).toBe('NOOP_ALREADY_HARDENED');
    expect(result.authSource).toBe('ENTERPRISE_APP_INSTALLATION');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('falls back to verified admin:enterprise PAT only after App GET returns 403', async () => {
    const calls: Array<{ method: string; url: string; auth: string; body?: string }> = [];
    let patDetailReads = 0;

    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const method = String(init?.method || 'GET');
      const url = String(input);
      const auth = String(new Headers(init?.headers).get('Authorization') || '');
      calls.push({
        method,
        url,
        auth,
        body: typeof init?.body === 'string' ? init.body : undefined,
      });

      if (auth === `Bearer ${APP_TOKEN}`) {
        expect(method).toBe('GET');
        return response({ message: 'Resource not accessible by integration' }, 403);
      }

      expect(auth).toBe(`Bearer ${ADMIN_PAT}`);
      const scopeHeaders = { 'x-oauth-scopes': 'admin:enterprise' };

      if (method === 'GET' && url.endsWith('/rulesets')) {
        return response(
          [{ id: 24109163, name: 'capital-ai-finance-main-governance', target: 'branch' }],
          200,
          scopeHeaders,
        );
      }

      if (method === 'GET') {
        patDetailReads += 1;
        return response(
          ruleset({
            approvals: patDetailReads === 1 ? 0 : 1,
            codeOwner: patDetailReads !== 1,
          }),
          200,
          scopeHeaders,
        );
      }

      if (method === 'PUT') {
        return response(ruleset(), 200, scopeHeaders);
      }

      throw new Error('unexpected provider call');
    });

    const result = await createGitHubPublicReadinessEnterpriseWriter({
      enterpriseInstallationToken: APP_TOKEN,
      enterpriseAdminPat: ADMIN_PAT,
      fetchImpl: fetchImpl as typeof fetch,
    }).ensure();

    expect(result.status).toBe('UPDATED_AND_VERIFIED');
    expect(result.authSource).toBe('ENTERPRISE_ADMIN_PAT_403_FALLBACK');
    expect(calls.filter((call) => call.auth === `Bearer ${APP_TOKEN}`)).toHaveLength(1);

    const put = calls.find((call) => call.method === 'PUT');
    expect(put?.url.endsWith('/enterprises/capital-ai-online/rulesets/24109163')).toBe(true);
    const body = JSON.parse(put?.body || '{}');
    expect(body.bypass_actors).toEqual([]);
    const pr = body.rules.find((rule: { type: string }) => rule.type === 'pull_request');
    expect(pr.parameters).toMatchObject({
      required_approving_review_count: 1,
      require_code_owner_review: true,
      require_last_push_approval: false,
      require_extra_approval_for_unattributed_changes: false,
      required_review_thread_resolution: true,
    });
  });

  it('rejects PAT fallback when admin:enterprise scope is not proven', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const auth = String(new Headers(init?.headers).get('Authorization') || '');
      if (auth === `Bearer ${APP_TOKEN}`) {
        return response({ message: 'Resource not accessible by integration' }, 403);
      }
      return response(
        [{ id: 24109163, name: 'capital-ai-finance-main-governance', target: 'branch' }],
        200,
        { 'x-oauth-scopes': 'read:enterprise' },
      );
    });

    await expect(
      createGitHubPublicReadinessEnterpriseWriter({
        enterpriseInstallationToken: APP_TOKEN,
        enterpriseAdminPat: ADMIN_PAT,
        fetchImpl: fetchImpl as typeof fetch,
      }).ensure(),
    ).rejects.toThrow(/missing verified admin:enterprise/);
  });

  it('fails closed on existing bypass actors', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) =>
      String(input).endsWith('/rulesets')
        ? response([{ id: 24109163, name: 'capital-ai-finance-main-governance', target: 'branch' }])
        : response(ruleset({ bypass: [{ actor_type: 'EnterpriseOwner', bypass_mode: 'always' }] })),
    );

    await expect(
      createGitHubPublicReadinessEnterpriseWriter({
        enterpriseInstallationToken: APP_TOKEN,
        fetchImpl: fetchImpl as typeof fetch,
      }).ensure(),
    ).rejects.toThrow(/bypass actors/);
  });
});

describe('public repository readiness workflow', () => {
  it('uses Enterprise App first, bounded admin PAT fallback, and never changes visibility', () => {
    const yaml = fs.readFileSync(
      path.join(root, '.github/workflows/github-public-readiness-hardening.yml'),
      'utf8',
    );
    expect(yaml).toContain('actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1');
    expect(yaml).toContain('enterprise: ${{ vars.CAPITAL_AI_GITHUB_ENTERPRISE_SLUG }}');
    expect(yaml).toContain(
      'CAPITAL_AI_GITHUB_ENTERPRISE_ADMIN_PAT: ${{ secrets.CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT }}',
    );
    expect(yaml).toContain('Repository visibility mutation: `NOT_PERFORMED`');
    expect(yaml).not.toMatch(/visibility:\s*public|gh\s+repo\s+edit.*visibility/i);
  });

  it('holds cutover for historical disclosure review', () => {
    const source = fs.readFileSync(
      path.join(root, 'scripts/security/verifyPublicRepositoryReadiness.mjs'),
      'utf8',
    );
    expect(source).toContain('PUBLIC_VISIBILITY_HELD_FOR_HISTORY_AND_ACTIONS_DISCLOSURE_REVIEW');
    expect(source).toContain('Review historical GitHub Actions logs because they become public');
  });
});
