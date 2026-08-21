import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  assertConfigured: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('../../server/db', () => ({
  assertPrivilegedSupabaseConfigured: mocks.assertConfigured,
  getPrivilegedServerSupabase: vi.fn(() => ({ rpc: mocks.rpc })),
}));

import { SupabaseFinTechCorePersistenceAdapter } from '../../server/fintechCorePersistence';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SupabaseFinTechCorePersistenceAdapter domain-event replay', () => {
  it('reads durable events only through the service-role replay RPC and maps the canonical envelope', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{
        event_id: 'paper-init-1',
        contract_version: 'fintech-core/contracts/0.1.0',
        event_type: 'PAPER_ACCOUNT_INITIALIZED',
        event_version: 'fintech-core/paper-trading-event/0.1.0',
        run_id: 'run-ft4-1',
        trace_id: 'trace-ft4-1',
        correlation_id: 'corr-ft4-1',
        causation_id: null,
        module_id: 'fintech-core.crypto',
        asset_id: 'crypto:BTC',
        decision_version: 'decision/paper-v1',
        occurred_at: '2026-08-21T08:00:00.000Z',
        evidence_refs: ['evidence://paper/config'],
        payload: { kind: 'PAPER_ACCOUNT_INITIALIZED', paperSequence: 0 },
        recorded_at: '2026-08-21T08:00:01.000Z',
      }],
      error: null,
    });

    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    const events = await adapter.listDomainEvents('run-ft4-1');

    expect(mocks.assertConfigured).toHaveBeenCalledWith('FinTech Core domain-event replay');
    expect(mocks.rpc).toHaveBeenCalledWith('fintech_core_list_domain_events_v1', { p_run_id: 'run-ft4-1' });
    expect(events).toEqual([expect.objectContaining({
      eventId: 'paper-init-1',
      eventType: 'PAPER_ACCOUNT_INITIALIZED',
      runId: 'run-ft4-1',
      causationId: undefined,
      evidenceRefs: ['evidence://paper/config'],
      payload: { kind: 'PAPER_ACCOUNT_INITIALIZED', paperSequence: 0 },
    })]);
  });

  it('fails closed on malformed replay rows', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ event_id: 'broken' }], error: null });
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    await expect(adapter.listDomainEvents('run-ft4-1')).rejects.toThrow('contract_version');
  });

  it('rejects an empty runId before touching Supabase', async () => {
    const adapter = new SupabaseFinTechCorePersistenceAdapter();
    await expect(adapter.listDomainEvents('')).rejects.toThrow('runId is required');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
