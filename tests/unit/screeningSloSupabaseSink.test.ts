import { describe, expect, it, vi } from 'vitest';
import { SupabaseScreeningSloSink } from '../../server/screeningSloSupabaseSink';

const record = {
  contractVersion: 'screening-slo-evidence/1.0.0' as const,
  correlationId: 'corr-prod-1',
  observedAt: '2026-08-02T15:55:00.000Z',
  symbol: 'AAPL',
  assetClass: 'stock',
  state: 'HEALTHY' as const,
  eligible: true,
  eligibilityStatus: 'ELIGIBLE',
  quoteStatus: 'READY',
  quoteAgeMs: 1500,
  quoteFresh: true,
  slaState: 'HEALTHY',
  reasons: [],
  scoreImpactEnabled: false as const,
  hardScreeningBlockEnabled: false as const,
  persistencePolicy: {
    appendOnlyRecommended: true as const,
    syntheticEvidenceAllowed: false as const,
    secretsAllowed: false as const,
  },
};

describe('SupabaseScreeningSloSink', () => {
  it('persists a valid record with a privileged configured backend', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const sink = new SupabaseScreeningSloSink({
      isConfigured: () => true,
      hasPrivilegedKey: () => true,
      insert,
    });

    const result = await sink.write(record);
    expect(result.accepted).toBe(true);
    expect(result.persisted).toBe(true);
    expect(result.sink).toBe('supabase-screening-slo-append-only');
    expect(insert).toHaveBeenCalledOnce();
    expect(insert.mock.calls[0][0]).toMatchObject({
      correlation_id: 'corr-prod-1',
      symbol: 'AAPL',
      state: 'HEALTHY',
      score_impact_enabled: false,
      hard_screening_block_enabled: false,
    });
  });

  it('fails closed without a privileged server key', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    const sink = new SupabaseScreeningSloSink({
      isConfigured: () => true,
      hasPrivilegedKey: () => false,
      insert,
    });

    const result = await sink.write(record);
    expect(result.accepted).toBe(false);
    expect(result.persisted).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it('never claims persistence when the database insert fails', async () => {
    const sink = new SupabaseScreeningSloSink({
      isConfigured: () => true,
      hasPrivilegedKey: () => true,
      insert: async () => ({ error: { message: 'relation missing' } }),
    });

    const result = await sink.write(record);
    expect(result.accepted).toBe(true);
    expect(result.persisted).toBe(false);
    expect(result.reason).toContain('relation missing');
  });
});
