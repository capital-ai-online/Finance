// M10 Phase 5 — Atomic CI Consumption positive/negative tests.
import { describe, expect, it, vi } from 'vitest';
import type { M10ApprovalEvidence } from '../../server/m10/assertionVerification';
import {
  consumeM10ApprovalForCi,
  type M10CiDispatcher,
  type M10ConsumableApprovalStore,
} from '../../server/m10/atomicCiConsumption';
import { resolveTrustedPrState, type GithubApiFetch } from '../../server/m10/githubPrStateResolver';
import { SYSTEMADMIN_OWNER_ACTOR_ID, SYSTEMADMIN_REPOSITORY } from '../../src/platform/Security/roadmapExecutionMandate';

function githubState(headSha = 'head-sha-1', patch = '@@ -1 +1 @@\n-old\n+new'): GithubApiFetch {
  return vi.fn(async (path: string) => {
    if (path === '/repos/SvenKulessa/Finance/pulls/7') {
      return {
        status: 200,
        json: { state: 'open', base: { ref: 'main', sha: 'base-sha-1' }, head: { sha: headSha } },
      };
    }
    if (path === '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1') {
      return { status: 200, json: [{ filename: 'src/a.ts', status: 'modified', patch }] };
    }
    throw new Error(`Unexpected path: ${path}`);
  }) as unknown as GithubApiFetch;
}

async function approval(fetch: GithubApiFetch = githubState()): Promise<M10ApprovalEvidence> {
  const resolved = await resolveTrustedPrState(
    { repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 },
    { githubApiFetch: fetch },
  );
  if (resolved.verdict !== 'RESOLVED') throw new Error(resolved.reason);
  return {
    approvalId: 'approval-1',
    ownerId: SYSTEMADMIN_OWNER_ACTOR_ID,
    credentialId: 'credential-1',
    challengeId: 'challenge-1',
    authorizationDigest: 'a'.repeat(64),
    context: {
      ownerId: resolved.state.ownerId,
      repository: resolved.state.repository,
      prNumber: resolved.state.prNumber,
      baseBranch: resolved.state.baseBranch,
      baseSha: resolved.state.baseSha,
      headSha: resolved.state.headSha,
      canonicalChangedFileSetHash: resolved.state.canonicalChangedFileSetHash,
      canonicalDiffReviewDigest: resolved.state.canonicalDiffReviewDigest,
      action: resolved.state.action,
    },
    approvedAt: '2026-08-19T01:00:00.000Z',
    consumedAt: null,
  };
}

function storeFor(
  record: M10ApprovalEvidence,
  overrides: Partial<M10ConsumableApprovalStore> = {},
): M10ConsumableApprovalStore {
  return {
    get: vi.fn(async () => record),
    claim: vi.fn(async input => ({
      status: 'CLAIMED' as const,
      consumptionId: input.consumptionId,
      consumedAt: '2026-08-19T01:01:00.000Z',
    })),
    finalizeDispatch: vi.fn(async () => true),
    ...overrides,
  };
}

function dispatcher(accepted = true): M10CiDispatcher {
  return { dispatch: vi.fn(async () => ({ accepted, reference: accepted ? 'github-request-1' : undefined })) };
}

describe('consumeM10ApprovalForCi', () => {
  it('re-resolves exact PR state, atomically claims once, and dispatches exactly one approved head', async () => {
    const current = githubState();
    const record = await approval(current);
    const approvalStore = storeFor(record);
    const ciDispatcher = dispatcher();

    const result = await consumeM10ApprovalForCi('approval-1', {
      githubApiFetch: current,
      approvalStore,
      dispatcher: ciDispatcher,
    });

    expect(result.verdict).toBe('DISPATCHED');
    expect(approvalStore.claim).toHaveBeenCalledTimes(1);
    expect(ciDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(ciDispatcher.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      approvalId: 'approval-1',
      repository: SYSTEMADMIN_REPOSITORY,
      prNumber: 7,
      headSha: 'head-sha-1',
      authorizationDigest: 'a'.repeat(64),
      action: 'AUTHORIZE_PR_CI',
    }));
    expect(approvalStore.finalizeDispatch).toHaveBeenCalledWith(expect.any(String), 'DISPATCHED');
  });

  it('denies PR drift before claiming or dispatching', async () => {
    const original = githubState();
    const record = await approval(original);
    const approvalStore = storeFor(record);
    const ciDispatcher = dispatcher();

    const result = await consumeM10ApprovalForCi('approval-1', {
      githubApiFetch: githubState('head-sha-2', '@@ changed @@'),
      approvalStore,
      dispatcher: ciDispatcher,
    });

    expect(result.verdict).toBe('DENY');
    expect(approvalStore.claim).not.toHaveBeenCalled();
    expect(ciDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('deduplicates a previously consumed approval without external dispatch', async () => {
    const record = { ...(await approval()), consumedAt: '2026-08-19T01:02:00.000Z' };
    const approvalStore = storeFor(record);
    const ciDispatcher = dispatcher();

    const result = await consumeM10ApprovalForCi('approval-1', {
      githubApiFetch: githubState(), approvalStore, dispatcher: ciDispatcher,
    });

    expect(result.verdict).toBe('DEDUPE');
    expect(approvalStore.claim).not.toHaveBeenCalled();
    expect(ciDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('deduplicates a second approval for a head already claimed in durable storage', async () => {
    const record = await approval();
    const approvalStore = storeFor(record, {
      claim: vi.fn(async () => ({ status: 'DEDUPE_HEAD' as const })),
    });
    const ciDispatcher = dispatcher();

    const result = await consumeM10ApprovalForCi('approval-1', {
      githubApiFetch: githubState(), approvalStore, dispatcher: ciDispatcher,
    });

    expect(result.verdict).toBe('DEDUPE');
    expect(ciDispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('marks a rejected/ambiguous dispatch terminal and never retries', async () => {
    const record = await approval();
    const approvalStore = storeFor(record);
    const ciDispatcher = dispatcher(false);

    const result = await consumeM10ApprovalForCi('approval-1', {
      githubApiFetch: githubState(), approvalStore, dispatcher: ciDispatcher,
    });

    expect(result.verdict).toBe('DISPATCH_UNCERTAIN');
    expect(ciDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(approvalStore.finalizeDispatch).toHaveBeenCalledWith(
      expect.any(String),
      'FAILED_UNCERTAIN',
      expect.stringContaining('nicht eindeutig akzeptiert'),
    );
  });

  it('treats a network exception after claim as terminal uncertainty with no second dispatch', async () => {
    const record = await approval();
    const approvalStore = storeFor(record);
    const dispatch = vi.fn(async () => { throw new Error('socket closed after write'); });

    const result = await consumeM10ApprovalForCi('approval-1', {
      githubApiFetch: githubState(),
      approvalStore,
      dispatcher: { dispatch },
    });

    expect(result.verdict).toBe('DISPATCH_UNCERTAIN');
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(approvalStore.finalizeDispatch).toHaveBeenCalledWith(
      expect.any(String),
      'FAILED_UNCERTAIN',
      expect.stringContaining('socket closed after write'),
    );
  });

  it('does not report success when GitHub accepted dispatch but terminal evidence cannot be persisted', async () => {
    const record = await approval();
    const approvalStore = storeFor(record, { finalizeDispatch: vi.fn(async () => false) });

    const result = await consumeM10ApprovalForCi('approval-1', {
      githubApiFetch: githubState(), approvalStore, dispatcher: dispatcher(true),
    });

    expect(result.verdict).toBe('DISPATCH_UNCERTAIN');
  });
});
