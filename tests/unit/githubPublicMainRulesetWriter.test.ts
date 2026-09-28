import { describe, expect, it, vi } from 'vitest';
import {
  createGitHubPublicMainRulesetWriter,
  PUBLIC_MAIN_RULESET,
} from '../../scripts/governance/githubPublicMainRulesetWriter.mjs';

const TOKEN = 'repo_admin_installation_token_for_unit_test_1234567890';

const response = (body: unknown, status = 200) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

function ruleset({ approvals = 0, codeOwner = false, conversations = false } = {}) {
  return {
    id: 20849710,
    name: 'main-production-protection',
    target: 'branch',
    source_type: 'Repository',
    source: 'capital-ai-online/Finance',
    enforcement: 'active',
    conditions: {
      ref_name: { include: ['~DEFAULT_BRANCH', 'refs/heads/main'], exclude: [] },
    },
    bypass_actors: [],
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: approvals,
          dismiss_stale_reviews_on_push: approvals === 1,
          required_reviewers: [],
          require_code_owner_review: codeOwner,
          dismissal_restriction: { enabled: false, allowed_actors: [] },
          require_last_push_approval: false,
          required_review_thread_resolution: conversations,
          require_extra_approval_for_unattributed_changes: approvals === 0,
          allowed_merge_methods: approvals === 1 ? ['merge'] : ['merge', 'squash', 'rebase'],
        },
      },
      { type: 'code_quality', parameters: { severity: 'warnings' } },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          do_not_enforce_on_create: false,
          required_status_checks: [
            { context: 'GitGuardian Security Checks', integration_id: 46505 },
            { context: 'Hardened image / HIGH+CRITICAL CVE gate', integration_id: 15368 },
            { context: 'PR Governance (Kosten / Workflow / Vorlage)', integration_id: 15368 },
            { context: 'build-and-test', integration_id: 15368 },
          ],
        },
      },
      { type: 'license_compliance_scanning' },
    ],
  };
}

describe('public main repository ruleset writer', () => {
  it('preserves strict checks and hardens the sole-Human-Owner review contract', async () => {
    let detailReads = 0;
    const calls: Array<{ method: string; url: string; body?: string }> = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const method = String(init?.method || 'GET');
      const url = String(input);
      calls.push({ method, url, body: typeof init?.body === 'string' ? init.body : undefined });

      if (method === 'GET' && url.includes('/rulesets?includes_parents=false')) {
        return response([{ id: 20849710, name: PUBLIC_MAIN_RULESET.name, target: 'branch' }]);
      }
      if (method === 'GET') {
        detailReads += 1;
        return response(
          detailReads === 1
            ? ruleset()
            : ruleset({ approvals: 1, codeOwner: true, conversations: true }),
        );
      }
      if (method === 'PUT') {
        return response(ruleset({ approvals: 1, codeOwner: true, conversations: true }));
      }
      throw new Error('unexpected provider call');
    });

    const result = await createGitHubPublicMainRulesetWriter({
      repositoryAdminToken: TOKEN,
      fetchImpl: fetchImpl as typeof fetch,
    }).ensure();

    expect(result.status).toBe('UPDATED_AND_VERIFIED');
    const put = calls.find((call) => call.method === 'PUT');
    const body = JSON.parse(put?.body || '{}');
    expect(body.bypass_actors).toEqual([]);
    const pr = body.rules.find((rule: { type: string }) => rule.type === 'pull_request');
    expect(pr.parameters).toMatchObject({
      required_approving_review_count: 1,
      dismiss_stale_reviews_on_push: true,
      require_code_owner_review: true,
      require_last_push_approval: false,
      required_review_thread_resolution: true,
      allowed_merge_methods: ['merge'],
    });
    const status = body.rules.find(
      (rule: { type: string }) => rule.type === 'required_status_checks',
    );
    expect(status.parameters.strict_required_status_checks_policy).toBe(true);
    expect(status.parameters.required_status_checks.map((entry: { context: string }) => entry.context).sort())
      .toEqual([...PUBLIC_MAIN_RULESET.requiredChecks].sort());
  });

  it('fails closed if the existing ruleset has a bypass actor', async () => {
    const unsafe = { ...ruleset(), bypass_actors: [{ actor_type: 'EnterpriseOwner', bypass_mode: 'always' }] };
    const fetchImpl = vi.fn(async (input: string | URL | Request) =>
      String(input).includes('?includes_parents=false')
        ? response([{ id: 20849710, name: PUBLIC_MAIN_RULESET.name, target: 'branch' }])
        : response(unsafe),
    );
    await expect(
      createGitHubPublicMainRulesetWriter({
        repositoryAdminToken: TOKEN,
        fetchImpl: fetchImpl as typeof fetch,
      }).ensure(),
    ).rejects.toThrow(/bypass actors/);
  });

  it('fails closed if required checks drift', async () => {
    const drifted = ruleset();
    const statusRule = drifted.rules.find((rule) => rule.type === 'required_status_checks') as {
      type: string;
      parameters: { required_status_checks: Array<{ context: string; integration_id?: number }> };
    } | undefined;
    if (!statusRule) throw new Error('required_status_checks fixture missing');
    statusRule.parameters.required_status_checks.pop();
    const fetchImpl = vi.fn(async (input: string | URL | Request) =>
      String(input).includes('?includes_parents=false')
        ? response([{ id: 20849710, name: PUBLIC_MAIN_RULESET.name, target: 'branch' }])
        : response(drifted),
    );
    await expect(
      createGitHubPublicMainRulesetWriter({
        repositoryAdminToken: TOKEN,
        fetchImpl: fetchImpl as typeof fetch,
      }).ensure(),
    ).rejects.toThrow(/required status checks differ/);
  });
});
