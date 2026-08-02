import { evaluateMarketConsensus, type MarketObservation, type MarketConsensusResult } from './marketDataConsensus';

export type SnapshotField =
  | 'priceUsd'
  | 'marketCapUsd'
  | 'volume24hUsd'
  | 'circulatingSupply'
  | 'totalSupply'
  | 'maxSupply';

export interface SnapshotFieldObservation extends MarketObservation {
  field: SnapshotField;
  semanticScope: string;
  assetId: string;
}

export type SnapshotConsensusStatus = MarketConsensusResult['status'] | 'NON_COMPARABLE_EVIDENCE';

export interface SnapshotConsensusResult extends Omit<MarketConsensusResult, 'status'> {
  field: SnapshotField;
  assetId: string;
  status: SnapshotConsensusStatus;
  semanticScope?: string;
}

const FIELD_POLICY: Record<SnapshotField, {
  minimumSources: number;
  toleranceBps: number;
  maxObservationSkewMs: number;
}> = {
  priceUsd: { minimumSources: 2, toleranceBps: 50, maxObservationSkewMs: 60_000 },
  marketCapUsd: { minimumSources: 2, toleranceBps: 300, maxObservationSkewMs: 15 * 60_000 },
  volume24hUsd: { minimumSources: 2, toleranceBps: 1_000, maxObservationSkewMs: 15 * 60_000 },
  circulatingSupply: { minimumSources: 2, toleranceBps: 25, maxObservationSkewMs: 60 * 60_000 },
  totalSupply: { minimumSources: 2, toleranceBps: 25, maxObservationSkewMs: 60 * 60_000 },
  maxSupply: { minimumSources: 2, toleranceBps: 1, maxObservationSkewMs: 24 * 60 * 60_000 },
};

/**
 * Financial snapshot fields are only quorum-comparable when provider semantics match exactly.
 * Example: exchange-local 24h volume and globally aggregated 24h volume must never be averaged.
 */
export function evaluateSnapshotFieldConsensus(observations: SnapshotFieldObservation[]): SnapshotConsensusResult {
  const first = observations[0];
  if (!first) {
    return {
      field: 'priceUsd',
      assetId: '',
      status: 'INSUFFICIENT_SOURCES',
      canonicalValue: null,
      observations: [],
      providers: [],
      evidenceIds: [],
      maxDeviationBps: null,
      reason: 'Keine Snapshot-Evidence vorhanden.',
    };
  }

  const sameField = observations.every(item => item.field === first.field);
  const sameAsset = observations.every(item => item.assetId.toUpperCase() === first.assetId.toUpperCase());
  const scopes = [...new Set(observations.map(item => item.semanticScope.trim()).filter(Boolean))];
  if (!sameField || !sameAsset || scopes.length !== 1) {
    return {
      field: first.field,
      assetId: first.assetId.toUpperCase(),
      status: 'NON_COMPARABLE_EVIDENCE',
      canonicalValue: null,
      observations,
      providers: [...new Set(observations.map(item => item.provider))],
      evidenceIds: observations.map(item => item.evidenceId),
      maxDeviationBps: null,
      reason: !sameField
        ? 'Snapshot-Evidence bezieht sich auf unterschiedliche Felder.'
        : !sameAsset
          ? 'Snapshot-Evidence bezieht sich auf unterschiedliche Assets.'
          : 'Provider verwenden unterschiedliche semantische Scopes; ein Quorum wäre fachlich irreführend.',
    };
  }

  const policy = FIELD_POLICY[first.field];
  const result = evaluateMarketConsensus(observations, policy);
  return {
    ...result,
    field: first.field,
    assetId: first.assetId.toUpperCase(),
    semanticScope: scopes[0],
  };
}

export function snapshotConsensusPolicy(field: SnapshotField) {
  return { ...FIELD_POLICY[field] };
}
