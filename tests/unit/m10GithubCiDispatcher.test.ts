import { describe, expect, it, vi } from 'vitest';
import { createM10GithubActionsDispatcher } from '../../server/m10/githubCiDispatcher';

const request = {
  consumptionId: 'consume-1',
  approvalId: 'approval-1',
  repository: 'SvenKulessa/Finance',
  prNumber: 417,
  baseSha: 'base-sha',
  headSha: 'head-sha',
  authorizationDigest: 'a'.repeat(64),
  action: 'AUTHORIZE_PR_CI' as const,
};

describe('createM10GithubActionsDispatcher', () => {
  it('performs exactly one workflow_dispatch request with M10-bound inputs', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(null, {
      status: 204,
      headers: { 'x-github-request-id': 'req-1' },
    }));
    const dispatcher = createM10GithubActionsDispatcher({
      token: 'secret-token',
      workflowFile: 'm10-authorized-ci.yml',
      fetchImpl: fetchImpl as typeof fetch,
    });

    const result = await dispatcher.dispatch(request);

    expect(result).toEqual({ accepted: true, reference: 'req-1' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain('/actions/workflows/m10-authorized-ci.yml/dispatches');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer secret-token' });
    expect(JSON.parse(String(init?.body))).toEqual({
      ref: 'main',
      inputs: {
        m10_consumption_id: 'consume-1',
        m10_approval_id: 'approval-1',
        m10_pr_number: '417',
        m10_base_sha: 'base-sha',
        m10_head_sha: 'head-sha',
        m10_authorization_digest: 'a'.repeat(64),
        m10_action: 'AUTHORIZE_PR_CI',
      },
    });
  });

  it('returns accepted=false for a non-204 response and does not retry', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response('forbidden', { status: 403 }));
    const dispatcher = createM10GithubActionsDispatcher({
      token: 'secret-token', workflowFile: 'm10-authorized-ci.yml', fetchImpl: fetchImpl as typeof fetch,
    });

    const result = await dispatcher.dispatch(request);
    expect(result.accepted).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fails before any network call when token or workflow target is invalid', async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => new Response(null, { status: 204 }));
    expect(() => createM10GithubActionsDispatcher({
      token: '   ', workflowFile: 'm10-authorized-ci.yml', fetchImpl: fetchImpl as typeof fetch,
    })).toThrow(/token/i);
    expect(() => createM10GithubActionsDispatcher({
      token: 'secret', workflowFile: '../ci.yml', fetchImpl: fetchImpl as typeof fetch,
    })).toThrow(/Workflow/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
