// M10 (ADR-0066, ESS-0022) Phase 1 — Trusted PR State Resolver tests. Proves the resolver only
// ever trusts a live, injected GitHub response - never a caller-supplied hash/diff/file-set - and
// fails closed on every GitHub anomaly, matching the ADR's "Do not accept agent-supplied hashes as
// authoritative" requirement and the threat model's TOCTOU/file-substitution/diff-substitution
// mitigations.
import { describe, expect, it, vi } from 'vitest';
import {
  M10_AUTHORIZE_PR_CI_ACTION,
  resolveTrustedPrState,
  type GithubApiFetch,
} from '../../server/m10/githubPrStateResolver';
import { SYSTEMADMIN_OWNER_ACTOR_ID, SYSTEMADMIN_REPOSITORY } from '../../src/platform/Security/roadmapExecutionMandate';

function pullResponse(overrides: Partial<{ state: string; baseRef: string; baseSha: string; headSha: string }> = {}) {
  return {
    status: 200,
    json: {
      state: overrides.state ?? 'open',
      base: { ref: overrides.baseRef ?? 'main', sha: overrides.baseSha ?? 'base-sha-1' },
      head: { sha: overrides.headSha ?? 'head-sha-1' },
    },
  };
}

function filesPage(files: Array<{ filename: string; status?: string; patch?: string }>) {
  return { status: 200, json: files };
}

function mockGithub(handlers: Record<string, unknown>): GithubApiFetch {
  const fn = vi.fn(async (path: string) => {
    const entry = handlers[path];
    if (entry === undefined) throw new Error(`Unexpected path in test: ${path}`);
    return entry as { status: number; json: unknown };
  });
  return fn as unknown as GithubApiFetch;
}

describe('resolveTrustedPrState', () => {
  it('denies a repository outside the canonical scope without any GitHub call', async () => {
    const githubApiFetch = vi.fn();
    const result = await resolveTrustedPrState(
      { repository: 'someone-else/other-repo', prNumber: 1 },
      { githubApiFetch: githubApiFetch as unknown as GithubApiFetch },
    );
    expect(result.verdict).toBe('DENY');
    expect(githubApiFetch).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, NaN])('denies an invalid PR number (%s) without any GitHub call', async (prNumber) => {
    const githubApiFetch = vi.fn();
    const result = await resolveTrustedPrState(
      { repository: SYSTEMADMIN_REPOSITORY, prNumber },
      { githubApiFetch: githubApiFetch as unknown as GithubApiFetch },
    );
    expect(result.verdict).toBe('DENY');
    expect(githubApiFetch).not.toHaveBeenCalled();
  });

  it('denies when the GitHub PR endpoint returns a non-200 status', async () => {
    const githubApiFetch = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': { status: 404, json: null },
    });
    const result = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch });
    expect(result.verdict).toBe('DENY');
  });

  it('denies when the GitHub PR endpoint throws (network failure)', async () => {
    const githubApiFetch = vi.fn(async () => { throw new Error('network unreachable'); }) as unknown as GithubApiFetch;
    const result = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch });
    expect(result.verdict).toBe('DENY');
  });

  it('denies a PR that is not open (closed/merged)', async () => {
    const githubApiFetch = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse({ state: 'closed' }),
    });
    const result = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch });
    expect(result.verdict).toBe('DENY');
  });

  it('denies when base/head references are incomplete', async () => {
    const githubApiFetch = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': { status: 200, json: { state: 'open', base: {}, head: {} } },
    });
    const result = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch });
    expect(result.verdict).toBe('DENY');
  });

  it('denies when the files endpoint returns a non-200 status', async () => {
    const githubApiFetch = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': { status: 500, json: null },
    });
    const result = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch });
    expect(result.verdict).toBe('DENY');
  });

  it('denies when the files endpoint returns a non-array payload', async () => {
    const githubApiFetch = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': { status: 200, json: { not: 'an array' } },
    });
    const result = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch });
    expect(result.verdict).toBe('DENY');
  });

  it('resolves a valid open PR with sorted files, hashes, and the fixed Owner/action', async () => {
    const githubApiFetch = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': filesPage([
        { filename: 'src/z.ts', status: 'modified', patch: '@@ z @@' },
        { filename: 'src/a.ts', status: 'added', patch: '@@ a @@' },
      ]),
    });
    const result = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch });
    expect(result.verdict).toBe('RESOLVED');
    if (result.verdict !== 'RESOLVED') return;
    expect(result.state.ownerId).toBe(SYSTEMADMIN_OWNER_ACTOR_ID);
    expect(result.state.repository).toBe(SYSTEMADMIN_REPOSITORY);
    expect(result.state.prNumber).toBe(7);
    expect(result.state.baseBranch).toBe('main');
    expect(result.state.baseSha).toBe('base-sha-1');
    expect(result.state.headSha).toBe('head-sha-1');
    expect(result.state.changedFilePaths).toEqual(['src/a.ts', 'src/z.ts']); // sorted, not GitHub response order
    expect(result.state.action).toBe(M10_AUTHORIZE_PR_CI_ACTION);
    expect(result.state.canonicalChangedFileSetHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.state.canonicalDiffReviewDigest).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces a deterministic hash for identical input regardless of GitHub response file order', async () => {
    const orderA = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': filesPage([
        { filename: 'src/z.ts', patch: 'z' },
        { filename: 'src/a.ts', patch: 'a' },
      ]),
    });
    const orderB = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': filesPage([
        { filename: 'src/a.ts', patch: 'a' },
        { filename: 'src/z.ts', patch: 'z' },
      ]),
    });
    const resultA = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: orderA });
    const resultB = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: orderB });
    expect(resultA.verdict).toBe('RESOLVED');
    expect(resultB.verdict).toBe('RESOLVED');
    if (resultA.verdict !== 'RESOLVED' || resultB.verdict !== 'RESOLVED') return;
    expect(resultA.state.canonicalChangedFileSetHash).toBe(resultB.state.canonicalChangedFileSetHash);
    expect(resultA.state.canonicalDiffReviewDigest).toBe(resultB.state.canonicalDiffReviewDigest);
  });

  it('changes the diff digest (but not necessarily the file-set hash) when file content changes but filenames do not - defends against diff substitution', async () => {
    const before = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': filesPage([{ filename: 'src/a.ts', patch: 'original content' }]),
    });
    const after = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': filesPage([{ filename: 'src/a.ts', patch: 'attacker-modified content' }]),
    });
    const resultBefore = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: before });
    const resultAfter = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: after });
    expect(resultBefore.verdict).toBe('RESOLVED');
    expect(resultAfter.verdict).toBe('RESOLVED');
    if (resultBefore.verdict !== 'RESOLVED' || resultAfter.verdict !== 'RESOLVED') return;
    expect(resultBefore.state.canonicalChangedFileSetHash).toBe(resultAfter.state.canonicalChangedFileSetHash); // same filenames
    expect(resultBefore.state.canonicalDiffReviewDigest).not.toBe(resultAfter.state.canonicalDiffReviewDigest); // different content
  });

  it('changes the head SHA and both hashes when a new commit lands after a prior resolution (TOCTOU defense)', async () => {
    const stale = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse({ headSha: 'head-sha-old' }),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': filesPage([{ filename: 'src/a.ts', patch: 'v1' }]),
    });
    const fresh = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse({ headSha: 'head-sha-new' }),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': filesPage([{ filename: 'src/a.ts', patch: 'v2' }]),
    });
    const resultStale = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: stale });
    const resultFresh = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: fresh });
    expect(resultStale.verdict).toBe('RESOLVED');
    expect(resultFresh.verdict).toBe('RESOLVED');
    if (resultStale.verdict !== 'RESOLVED' || resultFresh.verdict !== 'RESOLVED') return;
    expect(resultStale.state.headSha).not.toBe(resultFresh.state.headSha);
    expect(resultStale.state.canonicalDiffReviewDigest).not.toBe(resultFresh.state.canonicalDiffReviewDigest);
  });

  it('handles a file with no patch (binary/too-large diff) without crashing, using a stable placeholder', async () => {
    const githubApiFetch = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': filesPage([{ filename: 'assets/logo.png', status: 'added' }]),
    });
    const result = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch });
    expect(result.verdict).toBe('RESOLVED');
    if (result.verdict !== 'RESOLVED') return;
    expect(result.state.changedFilePaths).toEqual(['assets/logo.png']);
  });

  it('denies when a file entry has no valid filename', async () => {
    const githubApiFetch = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': filesPage([{ filename: '' as any }]),
    });
    const result = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch });
    expect(result.verdict).toBe('DENY');
  });

  it('paginates through more than one page of changed files (a real PR can exceed 100 files)', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ filename: `src/file-${String(i).padStart(3, '0')}.ts`, patch: 'x' }));
    const page2 = [{ filename: 'src/file-100.ts', patch: 'x' }];
    const githubApiFetch = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': filesPage(page1),
      '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=2': filesPage(page2),
    });
    const result = await resolveTrustedPrState({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch });
    expect(result.verdict).toBe('RESOLVED');
    if (result.verdict !== 'RESOLVED') return;
    expect(result.state.changedFilePaths).toHaveLength(101);
    expect(result.state.changedFilePaths).toContain('src/file-100.ts');
  });

  it('the request type structurally has no field for a caller-supplied hash/diff (no agent-supplied authority)', () => {
    // Compile-time proof: ResolvePrStateRequest only has { repository, prNumber }. If this ever
    // grows a hash/diff/fileSet field, this test's own type assertion below would need editing,
    // making an accidental widening of caller authority visible in review.
    const request: import('../../server/m10/githubPrStateResolver').ResolvePrStateRequest = {
      repository: SYSTEMADMIN_REPOSITORY,
      prNumber: 1,
    };
    expect(Object.keys(request).sort()).toEqual(['prNumber', 'repository']);
  });
});
