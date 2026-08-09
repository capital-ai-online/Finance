// ESS-0017 Phase 1 / ADR-0046: read-only agent tool for the Screening/Scoring explainability
// agent. Backend-only - never import this from Vite-/browser-bundled code. Reads exclusively
// through getPrivilegedServerSupabase() (server/db.ts) because score_snapshots is intentionally
// service-role-only (ADR-0043, global per-symbol data, not user-owned) - the RLS-bound client
// would only ever return zero rows here. This module exports no write/upsert/delete function.

import { getPrivilegedServerSupabase, isPrivilegedSupabaseConfigured } from '../../../server/db';
import { buildRowEvidenceBundle, type RagEvidenceBundle, type RagSourcePolicy } from '../rag/evidenceLayer';

const SYMBOL_PATTERN = /^[A-Z0-9.\-]{1,20}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Bounded read: daily snapshots, roughly a year of history is more than enough for explainability. */
const MAX_ROWS = 365;
const STALENESS_MS = 7 * 24 * 60 * 60 * 1000;

export interface ScoreSnapshotRow {
  symbol: string;
  asset_type: string;
  score: number;
  score_basis: string | null;
  price: number;
  snapshot_date: string;
}

export interface ScoreSnapshotEvidenceRequest {
  symbol: string;
  fromDate?: string;
  toDate?: string;
}

export interface ScoreSnapshotEvidenceResult {
  rows: ScoreSnapshotRow[];
  evidence: RagEvidenceBundle;
}

const SOURCE_POLICY: RagSourcePolicy = {
  sourceClass: 'financial-research',
  authoritative: true,
  maxAgeMs: STALENESS_MS,
  citationRequired: true,
};

function assertValidSymbol(symbol: string): string {
  const cleaned = (symbol || '').toUpperCase().trim();
  if (!SYMBOL_PATTERN.test(cleaned)) {
    throw new Error(`[SupabaseScoreEvidenceTool] Ungueltiges Symbol: "${symbol}"`);
  }
  return cleaned;
}

function assertValidDate(value: string | undefined, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`[SupabaseScoreEvidenceTool] Ungueltiges Datum fuer ${label}: "${value}"`);
  }
  return value;
}

function emptyResult(retrievalId: string, query: string): ScoreSnapshotEvidenceResult {
  return {
    rows: [],
    evidence: buildRowEvidenceBundle({ retrievalId, query, records: [] }),
  };
}

/**
 * Read-only evidence tool: returns the persisted score_snapshots history for one symbol plus a
 * fail-closed, cited evidence bundle (ESS-0017 Phase 1). Query is built exclusively through the
 * Supabase JS query builder - never raw SQL, never string-concatenated input.
 */
export async function getScoreSnapshotEvidence(request: ScoreSnapshotEvidenceRequest): Promise<ScoreSnapshotEvidenceResult> {
  const symbol = assertValidSymbol(request.symbol);
  const fromDate = assertValidDate(request.fromDate, 'fromDate');
  const toDate = assertValidDate(request.toDate, 'toDate');
  const retrievalId = `score:${symbol}:${Date.now()}`;

  if (!isPrivilegedSupabaseConfigured()) {
    return emptyResult(retrievalId, symbol);
  }

  const supabase = getPrivilegedServerSupabase();
  let query = supabase
    .from('score_snapshots')
    .select('symbol, asset_type, score, score_basis, price, snapshot_date')
    .eq('symbol', symbol)
    .order('snapshot_date', { ascending: false })
    .limit(MAX_ROWS);

  if (fromDate) query = query.gte('snapshot_date', fromDate);
  if (toDate) query = query.lte('snapshot_date', toDate);

  const { data, error } = await query;
  if (error) {
    throw new Error(`[SupabaseScoreEvidenceTool] Abfrage fehlgeschlagen: ${error.message}`);
  }

  const rows = (data ?? []) as ScoreSnapshotRow[];
  const evidence = buildRowEvidenceBundle({
    retrievalId,
    query: symbol,
    records: rows.map(row => ({
      id: `${row.symbol}:${row.snapshot_date}`,
      sourcePath: 'supabase:score_snapshots',
      heading: `${row.symbol} @ ${row.snapshot_date}`,
      sourcePolicy: SOURCE_POLICY,
      recordedAt: `${row.snapshot_date}T00:00:00.000Z`,
    })),
  });

  return { rows, evidence };
}
