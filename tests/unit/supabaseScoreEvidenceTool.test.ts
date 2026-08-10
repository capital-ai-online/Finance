// ESS-0018 Phase 1 / ADR-0050: server/db.ts wird gemockt (gleiches Muster wie
// tests/unit/scoreValidation.test.ts), damit der Test deterministisch bleibt und keine echte
// Datenbankverbindung benoetigt. Prueft, dass ausschliesslich der Supabase-Query-Builder mit
// allowlisted Filtern verwendet wird (kein Raw-SQL) und dass nur getPrivilegedServerSupabase()
// genutzt wird.

import { describe, it, expect, vi, beforeEach } from 'vitest';

interface Call { method: string; args: any[]; }

function createChainableQuery(result: { data: any[] | null; error: any }) {
  const calls: Call[] = [];
  const chain: any = {
    calls,
    eq: (...args: any[]) => { calls.push({ method: 'eq', args }); return chain; },
    gte: (...args: any[]) => { calls.push({ method: 'gte', args }); return chain; },
    lte: (...args: any[]) => { calls.push({ method: 'lte', args }); return chain; },
    order: (...args: any[]) => { calls.push({ method: 'order', args }); return chain; },
    limit: (...args: any[]) => { calls.push({ method: 'limit', args }); return chain; },
    // Supabase's PostgrestFilterBuilder is itself a thenable - `await query` resolves it.
    then: (resolve: any) => resolve(result),
  };
  return chain;
}

let lastQuery: any = null;
let queryResult: { data: any[] | null; error: any } = { data: [], error: null };
const mockFrom = vi.fn((table: string) => {
  if (table !== 'score_snapshots') throw new Error(`Unerwartete Tabelle im Test: ${table}`);
  return {
    select: (...selectArgs: any[]) => {
      lastQuery = createChainableQuery(queryResult);
      lastQuery.calls.push({ method: 'select', args: selectArgs });
      return lastQuery;
    },
  };
});

vi.mock('../../server/db', () => ({
  isPrivilegedSupabaseConfigured: vi.fn(() => true),
  getPrivilegedServerSupabase: vi.fn(() => ({ from: mockFrom })),
}));

import { getScoreSnapshotEvidence } from '../../src/services/agentTools/supabaseScoreEvidenceTool';
import { isPrivilegedSupabaseConfigured } from '../../server/db';

describe('supabaseScoreEvidenceTool', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    lastQuery = null;
    queryResult = { data: [], error: null };
    (isPrivilegedSupabaseConfigured as any).mockReturnValue(true);
  });

  it('rejects an invalid symbol before ever touching the database', async () => {
    await expect(getScoreSnapshotEvidence({ symbol: '../etch; DROP TABLE score_snapshots;' })).rejects.toThrow(/Ungueltiges Symbol/);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects an invalid date before ever touching the database', async () => {
    await expect(getScoreSnapshotEvidence({ symbol: 'AAPL', fromDate: 'not-a-date' })).rejects.toThrow(/Ungueltiges Datum/);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('queries exclusively through the allowlisted query-builder shape (no raw SQL)', async () => {
    queryResult = {
      data: [{ symbol: 'AAPL', asset_type: 'stock', score: 7.5, score_basis: 'fundamentals', price: 190, snapshot_date: '2026-08-01' }],
      error: null,
    };
    await getScoreSnapshotEvidence({ symbol: 'aapl', fromDate: '2026-01-01', toDate: '2026-08-01' });

    expect(mockFrom).toHaveBeenCalledWith('score_snapshots');
    const methods = lastQuery.calls.map((c: Call) => c.method);
    expect(methods).toEqual(['select', 'eq', 'order', 'limit', 'gte', 'lte']);
    expect(lastQuery.calls.find((c: Call) => c.method === 'eq').args).toEqual(['symbol', 'AAPL']);
    expect(lastQuery.calls.find((c: Call) => c.method === 'gte').args).toEqual(['snapshot_date', '2026-01-01']);
    expect(lastQuery.calls.find((c: Call) => c.method === 'lte').args).toEqual(['snapshot_date', '2026-08-01']);
  });

  it('returns cited evidence for rows that were actually read', async () => {
    queryResult = {
      data: [{ symbol: 'AAPL', asset_type: 'stock', score: 7.5, score_basis: 'fundamentals', price: 190, snapshot_date: '2026-08-01' }],
      error: null,
    };
    const result = await getScoreSnapshotEvidence({ symbol: 'AAPL' });
    expect(result.rows).toHaveLength(1);
    expect(result.evidence.evidence).toHaveLength(1);
    expect(result.evidence.evidence[0].sourcePath).toBe('supabase:score_snapshots');
    expect(result.evidence.evaluation.quality).not.toBe('NO_EVIDENCE');
  });

  it('fails closed to NO_EVIDENCE (never fabricates rows) when nothing is stored', async () => {
    queryResult = { data: [], error: null };
    const result = await getScoreSnapshotEvidence({ symbol: 'ZZZZ' });
    expect(result.rows).toEqual([]);
    expect(result.evidence.evaluation.quality).toBe('NO_EVIDENCE');
  });

  it('propagates database errors instead of silently returning empty evidence', async () => {
    queryResult = { data: null, error: { message: 'connection reset' } };
    await expect(getScoreSnapshotEvidence({ symbol: 'AAPL' })).rejects.toThrow(/connection reset/);
  });

  it('short-circuits to empty evidence when Supabase is not configured, without a write path anywhere in the module', async () => {
    (isPrivilegedSupabaseConfigured as any).mockReturnValue(false);
    const result = await getScoreSnapshotEvidence({ symbol: 'AAPL' });
    expect(result.rows).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();

    const toolModule = await import('../../src/services/agentTools/supabaseScoreEvidenceTool');
    const writeLikeExports = Object.keys(toolModule).filter(key => /write|upsert|delete|insert|update/i.test(key));
    expect(writeLikeExports).toEqual([]);
  });
});
