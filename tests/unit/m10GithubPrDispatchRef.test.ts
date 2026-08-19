import { describe, expect, it, vi } from 'vitest';
import { resolveTrustedM10DispatchRef } from '../../server/m10/githubPrDispatchRef';
import type { GithubApiFetch } from '../../server/m10/githubPrStateResolver';

function githubPull(overrides: Partial<{ state: string; sha: string; ref: string; repo: string }> = {}): GithubApiFetch {
  return vi.fn(async () => ({
    status: 200,
    json: {
      state: overrides.state ?? 'open',
      head: {
        sha: overrides.sha ?? 'head-sha-1',
        ref: overrides.ref ?? 'agent/m10-pr',
        repo: { full_name: overrides.repo ?? 'SvenKulessa/Finance' },
      },
    },
  })) as unknown as GithubApiFetch;
}

describe('resolveTrustedM10DispatchRef', () => {
  it('returns the same-repository branch only when it still points at the approved head', async () => {
    const result = await resolveTrustedM10DispatchRef({
      repository: 'SvenKulessa/Finance', prNumber: 7, expectedHeadSha: 'head-sha-1',
    }, githubPull());
    expect(result).toEqual({ verdict: 'RESOLVED', headRef: 'agent/m10-pr' });
  });

  it('denies head drift before the Phase-5 durable claim', async () => {
    const result = await resolveTrustedM10DispatchRef({
      repository: 'SvenKulessa/Finance', prNumber: 7, expectedHeadSha: 'head-sha-1',
    }, githubPull({ sha: 'head-sha-2' }));
    expect(result.verdict).toBe('DENY');
  });

  it('denies fork/cross-repository PR heads', async () => {
    const result = await resolveTrustedM10DispatchRef({
      repository: 'SvenKulessa/Finance', prNumber: 7, expectedHeadSha: 'head-sha-1',
    }, githubPull({ repo: 'other/Finance' }));
    expect(result.verdict).toBe('DENY');
  });

  it('denies closed PRs and malformed branch refs', async () => {
    const closed = await resolveTrustedM10DispatchRef({
      repository: 'SvenKulessa/Finance', prNumber: 7, expectedHeadSha: 'head-sha-1',
    }, githubPull({ state: 'closed' }));
    expect(closed.verdict).toBe('DENY');

    const invalid = await resolveTrustedM10DispatchRef({
      repository: 'SvenKulessa/Finance', prNumber: 7, expectedHeadSha: 'head-sha-1',
    }, githubPull({ ref: '../main' }));
    expect(invalid.verdict).toBe('DENY');
  });
});
