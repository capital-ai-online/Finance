import { evaluateMarketConsensus, type MarketConsensusResult, type MarketObservation } from './marketDataConsensus';
import type { CryptoSnapshotField, VerifiedFieldProvenance } from './cryptoSnapshotProvider';

export const CRYPTO_SNAPSHOT_CONSENSUS_VERSION = 'crypto-snapshot-consensus/1.0.0';

export interface CryptoSnapshotFieldConsensus {
  field: CryptoSnapshotField;
  status: MarketConsensusResult['status'];
  canonicalValue: number | null;
  providers: string[];
  evidenceIds: string[];
  maxDeviationBps: number | null;
  reason?: string;
}

export interface CryptoSnapshotConsensusResult {
  contractVersion: typeof CRYPTO_SNAPSHOT_CONSENSUS_VERSION;
  symbol: string;
  fields: CryptoSnapshotFieldConsensus[];
  status: 'CONSENSUS' | 'PARTIAL' | 'SOURCE_CONFLICT' | 'INSUFFICIENT_SOURCES';
  providers: string[];
  evidenceIds: string[];
}

function evidenceId(symbol: string, item: VerifiedFieldProvenance): string {
  return `snapshot:${item.provider.toLowerCase()}:${symbol.toUpperCase()}:${item.field}:${item.observedAt.slice(0, 10)}`;
}

function toObservation(symbol: string, item: VerifiedFieldProvenance): MarketObservation | null {
  if (typeof item.value !== 'number' || !Number.isFinite(item.value) || item.value <= 0) return null;
  return {
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
 * The contract intentionally does not treat one provider as consensus. Until at least two
 * semantically compatible independent observations exist for a field, the result remains
 * INSUFFICIENT_SOURCES. Conflicting values never produce a synthetic canonical value.
 */
export function evaluateCryptoSnapshotConsensus(
  symbol: string,
  provenance: VerifiedFieldProvenance[],
  options: { minimumSources?: number; toleranceBps?: number; maxObservationSkewMs?: number } = {},
): CryptoSnapshotConsensusResult {
  const fields: CryptoSnapshotField[] = [
    'marketCapUsd',
    'volume24hUsd',
    'circulatingSupply',
    'maxSupply',
    'totalSupply',
  ];

  const results = fields.map(field => {
    const observations = provenance
      .filter(item => item.field === field)
      .map(item => toObservation(symbol, item))
      .filter((item): item is MarketObservation => item !== null);

    const consensus = evaluateMarketConsensus(observations, {
      minimumSources: options.minimumSources ?? 2,
      toleranceBps: options.toleranceBps ?? (field === 'volume24hUsd' ? 500 : 100),
      maxObservationSkewMs: options.maxObservationSkewMs ?? 15 * 60 * 1000,
    });

    return {
      field,
      status: consensus.status,
      canonicalValue: consensus.canonicalValue,
      providers: consensus.providers,
      evidenceIds: consensus.evidenceIds,
      maxDeviationBps: consensus.maxDeviationBps,
      reason: consensus.reason,
    } satisfies CryptoSnapshotFieldConsensus;
  });

  const hasConflict = results.some(item => item.status === 'SOURCE_CONFLICT' || item.status === 'INVALID_OBSERVATION');
  const consensusCount = results.filter(item => item.status === 'CONSENSUS').length;
  const status: CryptoSnapshotConsensusResult['status'] = hasConflict
    ? 'SOURCE_CONFLICT'
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
