import type { CryptoSnapshotField } from './cryptoSnapshotProvider';
import {
  evaluateSnapshotFieldConsensus,
  type SnapshotConsensusStatus,
  type SnapshotFieldObservation,
} from './marketSnapshotConsensus';

export const CRYPTO_SNAPSHOT_CONSENSUS_VERSION = 'crypto-snapshot-consensus/1.1.0';

export interface SnapshotFieldProvenance {
  field: CryptoSnapshotField;
  provider: string;
  sourcePath: string;
  observedAt: string;
  retrievedAt: string;
  value: number | null;
  unit: 'USD' | 'token';
  /**
   * Required before two providers may be compared. Examples:
   * - marketCapUsd: global-circulating-supply
   * - volume24hUsd: global-aggregate-24h or single-exchange-24h
   * - circulatingSupply: circulating-token-supply
   */
  semanticScope?: string;
}

export interface CryptoSnapshotFieldConsensus {
  field: CryptoSnapshotField;
  status: SnapshotConsensusStatus;
  canonicalValue: number | null;
  providers: string[];
  evidenceIds: string[];
  maxDeviationBps: number | null;
  semanticScope?: string;
  reason?: string;
}

export interface CryptoSnapshotConsensusResult {
  contractVersion: typeof CRYPTO_SNAPSHOT_CONSENSUS_VERSION;
  symbol: string;
  fields: CryptoSnapshotFieldConsensus[];
  status: 'CONSENSUS' | 'PARTIAL' | 'SOURCE_CONFLICT' | 'INSUFFICIENT_SOURCES' | 'NON_COMPARABLE_EVIDENCE';
  providers: string[];
  evidenceIds: string[];
}

function evidenceId(symbol: string, item: SnapshotFieldProvenance): string {
  return `snapshot:${item.provider.toLowerCase()}:${symbol.toUpperCase()}:${item.field}:${item.observedAt.slice(0, 10)}`;
}

function toObservation(symbol: string, item: SnapshotFieldProvenance): SnapshotFieldObservation | null {
  if (typeof item.value !== 'number' || !Number.isFinite(item.value) || item.value <= 0) return null;
  if (!item.semanticScope?.trim()) return null;
  return {
    assetId: symbol.toUpperCase(),
    field: item.field,
    semanticScope: item.semanticScope,
    provider: item.provider,
    value: item.value,
    observedAt: item.observedAt,
    retrievedAt: item.retrievedAt,
    unit: item.unit,
    evidenceId: evidenceId(symbol, item),
  };
}

/**
 * Per-field quorum for critical crypto snapshot data.
 *
 * A field requires at least two independent AND semantically compatible observations.
 * Missing semantic scope is intentionally excluded from quorum. Exchange-local values are never
 * combined with global aggregates, and conflicts never produce a synthetic canonical value.
 */
export function evaluateCryptoSnapshotConsensus(
  symbol: string,
  provenance: SnapshotFieldProvenance[],
): CryptoSnapshotConsensusResult {
  const fields: CryptoSnapshotField[] = [
    'marketCapUsd',
    'volume24hUsd',
    'circulatingSupply',
    'maxSupply',
    'totalSupply',
  ];

  const results = fields.map(field => {
    const fieldRows = provenance.filter(item => item.field === field);
    const scopedRows = fieldRows.filter(item => item.semanticScope?.trim());

    if (fieldRows.length >= 2 && scopedRows.length !== fieldRows.length) {
      return {
        field,
        status: 'NON_COMPARABLE_EVIDENCE' as const,
        canonicalValue: null,
        providers: [...new Set(fieldRows.map(item => item.provider))],
        evidenceIds: fieldRows.map(item => evidenceId(symbol, item)),
        maxDeviationBps: null,
        reason: 'Mindestens eine Provider-Beobachtung besitzt keinen expliziten semantischen Scope.',
      } satisfies CryptoSnapshotFieldConsensus;
    }

    const observations = scopedRows
      .map(item => toObservation(symbol, item))
      .filter((item): item is SnapshotFieldObservation => item !== null);

    if (observations.length === 0) {
      return {
        field,
        status: 'INSUFFICIENT_SOURCES' as const,
        canonicalValue: null,
        providers: [],
        evidenceIds: [],
        maxDeviationBps: null,
        reason: 'Keine quorumfähige semantisch annotierte Evidence vorhanden.',
      } satisfies CryptoSnapshotFieldConsensus;
    }

    const consensus = evaluateSnapshotFieldConsensus(observations);
    return {
      field,
      status: consensus.status,
      canonicalValue: consensus.canonicalValue,
      providers: consensus.providers,
      evidenceIds: consensus.evidenceIds,
      maxDeviationBps: consensus.maxDeviationBps,
      semanticScope: consensus.semanticScope,
      reason: consensus.reason,
    } satisfies CryptoSnapshotFieldConsensus;
  });

  const hasNonComparable = results.some(item => item.status === 'NON_COMPARABLE_EVIDENCE');
  const hasConflict = results.some(item => item.status === 'SOURCE_CONFLICT' || item.status === 'INVALID_OBSERVATION');
  const consensusCount = results.filter(item => item.status === 'CONSENSUS').length;
  const status: CryptoSnapshotConsensusResult['status'] = hasConflict
    ? 'SOURCE_CONFLICT'
    : hasNonComparable
      ? 'NON_COMPARABLE_EVIDENCE'
      : consensusCount === results.length
        ? 'CONSENSUS'
        : consensusCount > 0
          ? 'PARTIAL'
          : 'INSUFFICIENT_SOURCES';

  return {
    contractVersion: CRYPTO_SNAPSHOT_CONSENSUS_VERSION,
    symbol: symbol.toUpperCase(),
    fields: results,
    status,
    providers: [...new Set(results.flatMap(item => item.providers))].sort(),
    evidenceIds: [...new Set(results.flatMap(item => item.evidenceIds))].sort(),
  };
}
