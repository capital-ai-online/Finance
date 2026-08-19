// M10 Controlled Cutover — trusted branch ref resolution for GitHub workflow_dispatch.
//
// GitHub's workflow_dispatch API accepts a branch or tag ref, not an arbitrary commit SHA. The
// authoritative M10 state binding remains the exact head SHA/diff resolved by githubPrStateResolver;
// this helper performs a second, immediately-before-claim PR lookup and only returns the current
// same-repository head branch when it still points at the already-approved head SHA.
import { SYSTEMADMIN_REPOSITORY } from '../../src/platform/Security/roadmapExecutionMandate';
import type { GithubApiFetch } from './githubPrStateResolver';

export type M10DispatchRefResult =
  | { verdict: 'RESOLVED'; headRef: string }
  | { verdict: 'DENY'; reason: string };

interface GithubPullForDispatch {
  state?: unknown;
  head?: {
    ref?: unknown;
    sha?: unknown;
    repo?: { full_name?: unknown } | null;
  };
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function resolveTrustedM10DispatchRef(
  input: Readonly<{ repository: string; prNumber: number; expectedHeadSha: string }>,
  githubApiFetch: GithubApiFetch,
): Promise<M10DispatchRefResult> {
  if (input.repository !== SYSTEMADMIN_REPOSITORY) {
    return { verdict: 'DENY', reason: 'M10 CI dispatch repository is outside the canonical scope.' };
  }
  if (!Number.isInteger(input.prNumber) || input.prNumber <= 0 || !nonEmpty(input.expectedHeadSha)) {
    return { verdict: 'DENY', reason: 'M10 CI dispatch context is incomplete.' };
  }

  let response: Awaited<ReturnType<GithubApiFetch>>;
  try {
    response = await githubApiFetch(`/repos/${input.repository}/pulls/${input.prNumber}`);
  } catch (err: any) {
    return { verdict: 'DENY', reason: `GitHub dispatch-ref resolution failed: ${err?.message || String(err)}` };
  }

  if (response.status !== 200) {
    return { verdict: 'DENY', reason: `GitHub dispatch-ref endpoint returned HTTP ${response.status}.` };
  }

  const pull = (response.json ?? {}) as GithubPullForDispatch;
  if (pull.state !== 'open') {
    return { verdict: 'DENY', reason: `PR is not open (status: ${String(pull.state)}).` };
  }

  const headRef = pull.head?.ref;
  const headSha = pull.head?.sha;
  const headRepository = pull.head?.repo?.full_name;
  if (!nonEmpty(headRef) || !nonEmpty(headSha) || !nonEmpty(headRepository)) {
    return { verdict: 'DENY', reason: 'GitHub PR response has no complete same-repository head ref.' };
  }
  if (headRepository !== input.repository) {
    return { verdict: 'DENY', reason: 'Cross-repository/fork PR heads are not eligible for M10 CI dispatch.' };
  }
  if (headSha !== input.expectedHeadSha) {
    return { verdict: 'DENY', reason: 'PR head changed while resolving the CI dispatch ref.' };
  }
  if (!/^[A-Za-z0-9._/-]+$/.test(headRef) || headRef.startsWith('/') || headRef.endsWith('/')) {
    return { verdict: 'DENY', reason: 'GitHub PR head ref has an invalid shape.' };
  }

  return { verdict: 'RESOLVED', headRef };
}
