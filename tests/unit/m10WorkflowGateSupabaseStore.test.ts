import { beforeEach, describe, expect, it, vi } from 'vitest';

function chain(resolveValue: { data: unknown; error: any }) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => resolveValue),
  };
  return builder;
}

const mocks = vi.hoisted(() => ({
  configured: vi.fn(() => true),
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('../../server/db', () => ({
  isPrivilegedSupabaseConfigured: mocks.configured,
  getPrivilegedServerSupabase: vi.fn(() => ({ from: mocks.from, rpc: mocks.rpc })),
}));

import { claimM10WorkflowGate } from '../../server/m10/workflowGateSupabaseStore';

const input = {
  consumptionId: 'consume-capability-1',
  approvalId: 'approval-1',
  repository: 'SvenKulessa/Finance',
  prNumber: 428,
  baseSha: 'base-sha-1',
  headSha: 'head-sha-1',
  authorizationDigest: 'a'.repeat(64),
  action: 'AUTHORIZE_PR_CI' as const,
};

const consumptionRow = {
  consumption_id: input.consumptionId,
  approval_id: input.approvalId,
  repository: input.repository,
  pr_number: input.prNumber,
  head_sha: input.headSha,
  authorization_digest: input.authorizationDigest,
  dispatch_state: 'PENDING',
};

const approvalRow = {
  approval_id: input.approvalId,
  repository: input.repository,
  pr_number: input.prNumber,
  base_sha: input.baseSha,
  head_sha: input.headSha,
  authorization_digest: input.authorizationDigest,
  action: input.action,
  consumed_at: '2026-08-19T05:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.configured.mockReturnValue(true);
});

describe('claimM10WorkflowGate', () => {
  it('allows exactly matched PENDING consumption after durable audit and atomically finalizes it', async () => {
    const consumption = chain({ data: consumptionRow, error: null });
    const approval = chain({ data: approvalRow, error: null });
    mocks.from.mockImplementation((table: string) => table === 'm10_ci_consumptions' ? consumption : approval);
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const audit = vi.fn(async () => undefined);

    const result = await claimM10WorkflowGate(input, audit);

    expect(result).toEqual({ status: 'CLAIMED' });
    expect(audit).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('finalize_m10_ci_dispatch', {
      p_consumption_id: input.consumptionId,
      p_terminal_state: 'DISPATCHED',
      p_failure_reason: null,
    });
  });

  it('denies a context mismatch without burning the single-use capability', async () => {
    const consumption = chain({ data: { ...consumptionRow, head_sha: 'different-head' }, error: null });
    mocks.from.mockReturnValue(consumption);

    const result = await claimM10WorkflowGate(input, vi.fn());

    expect(result.status).toBe('DENY_CONTEXT_MISMATCH');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('denies replay when the consumption is already terminal', async () => {
    const consumption = chain({ data: { ...consumptionRow, dispatch_state: 'DISPATCHED' }, error: null });
    mocks.from.mockReturnValue(consumption);

    const result = await claimM10WorkflowGate(input, vi.fn());

    expect(result.status).toBe('DENY_ALREADY_FINALIZED');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('fails closed before finalization when durable audit cannot be written', async () => {
    const consumption = chain({ data: consumptionRow, error: null });
    const approval = chain({ data: approvalRow, error: null });
    mocks.from.mockImplementation((table: string) => table === 'm10_ci_consumptions' ? consumption : approval);
    const audit = vi.fn(async () => { throw new Error('audit unavailable'); });

    const result = await claimM10WorkflowGate(input, audit);

    expect(result.status).toBe('DENY_AUDIT_UNAVAILABLE');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('treats loss of the atomic finalize race as a replay/duplicate denial', async () => {
    const consumption = chain({ data: consumptionRow, error: null });
    const approval = chain({ data: approvalRow, error: null });
    mocks.from.mockImplementation((table: string) => table === 'm10_ci_consumptions' ? consumption : approval);
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    const result = await claimM10WorkflowGate(input, vi.fn(async () => undefined));

    expect(result.status).toBe('DENY_ALREADY_FINALIZED');
  });
});
