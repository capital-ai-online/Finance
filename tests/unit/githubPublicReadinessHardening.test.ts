import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createGitHubPublicReadinessEnterpriseWriter } from '../../scripts/operations/githubPublicReadinessEnterpriseWriter.mjs';

const root = path.resolve(__dirname, '../..');
const APP_TOKEN = 'enterprise_installation_token_for_unit_test_1234567890';

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
      fetchImpl: fetchImpl as typeof fetch,
    }).ensure();

    expect(result.status).toBe('NOOP_ALREADY_HARDENED');
    expect(result.authSource).toBe('ENTERPRISE_APP_INSTALLATION');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('fails closed on Enterprise App 403 without any Classic-PAT fallback', async () => {
    const fetchImpl = vi.fn(async () =>
      response({ message: 'Resource not accessible by integration' }, 403),
    );

    await expect(
      createGitHubPublicReadinessEnterpriseWriter({
        enterpriseInstallationToken: APP_TOKEN,
        fetchImpl: fetchImpl as typeof fetch,
      }).ensure(),
    ).rejects.toThrow(/HTTP 403 via ENTERPRISE_APP_INSTALLATION/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
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
  it('uses App-only repository/Enterprise writers and never changes visibility', () => {
    const yaml = fs.readFileSync(
      path.join(root, '.github/workflows/github-public-readiness-hardening.yml'),
      'utf8',
    );
    expect(yaml).toContain('actions/create-github-app-token@bcd2ba49218906704ab6c1aa796996da409d3eb1');
    expect(yaml).toContain('enterprise: ${{ vars.CAPITAL_AI_GITHUB_ENTERPRISE_SLUG }}');
    expect(yaml).toContain('permission-administration: write');
    expect(yaml).toContain('CAPITAL_AI_GITHUB_REPOSITORY_ADMIN_TOKEN: ${{ steps.repository_app_token.outputs.token }}');
    expect(yaml).not.toContain('CAPITAL_AI_GITHUB_ENTERPRISE_ADMIN_PAT');
    expect(yaml).not.toContain('CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT');
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
