export interface MarketObservation {
  provider: string;
  value: number;
  observedAt: string;
  retrievedAt: string;
  unit: string;
  evidenceId: string;
  /** Current gateway quality when the observation originates from a live snapshot. */
  qualityState?: 'LIVE' | 'DELAYED';
}

export type MarketConsensusStatus = 'CONSENSUS' | 'INSUFFICIENT_SOURCES' | 'SOURCE_CONFLICT' | 'INVALID_OBSERVATION';

export interface MarketConsensusResult {
  status: MarketConsensusStatus;
  canonicalValue: number | null;
  observations: MarketObservation[];
  providers: string[];
  evidenceIds: string[];
  maxDeviationBps: number | null;
  reason?: string;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Evidence-preserving quorum check. A median is returned only when all accepted observations are
 * within the configured tolerance. Conflicting sources never produce a synthetic canonical price.
 */
export function evaluateMarketConsensus(
  observations: MarketObservation[],
  options: { minimumSources?: number; toleranceBps?: number; maxObservationSkewMs?: number } = {},
): MarketConsensusResult {
  const minimumSources = Math.max(1, options.minimumSources ?? 2);
  const toleranceBps = Math.max(0, options.toleranceBps ?? 50);
  const maxObservationSkewMs = Math.max(0, options.maxObservationSkewMs ?? 60_000);

  const valid = observations.filter(item =>
    item.provider.trim().length > 0
    && Number.isFinite(item.value)
    && item.value > 0
    && Number.isFinite(Date.parse(item.observedAt))
    && Number.isFinite(Date.parse(item.retrievedAt))
    && item.unit.trim().length > 0
    && item.evidenceId.trim().length > 0
  );

  if (valid.length !== observations.length) {
    return {
      status: 'INVALID_OBSERVATION', canonicalValue: null, observations: valid,
      providers: [...new Set(valid.map(item => item.provider))],
      evidenceIds: valid.map(item => item.evidenceId), maxDeviationBps: null,
      reason: 'Mindestens eine Beobachtung verletzt den Market-Data-Evidence-Contract.',
    };
  }

  const distinctProviders = [...new Set(valid.map(item => item.provider))];
  if (distinctProviders.length < minimumSources) {
    return {
      status: 'INSUFFICIENT_SOURCES', canonicalValue: null, observations: valid,
      providers: distinctProviders, evidenceIds: valid.map(item => item.evidenceId), maxDeviationBps: null,
      reason: `Mindestens ${minimumSources} unabhängige Provider erforderlich.`,
    };
  }

  const units = [...new Set(valid.map(item => item.unit))];
  if (units.length !== 1) {
    return {
      status: 'SOURCE_CONFLICT', canonicalValue: null, observations: valid,
      providers: distinctProviders, evidenceIds: valid.map(item => item.evidenceId), maxDeviationBps: null,
      reason: 'Provider-Beobachtungen verwenden unterschiedliche Einheiten/Währungen.',
    };
  }

  const observedTimes = valid.map(item => Date.parse(item.observedAt));
  if (Math.max(...observedTimes) - Math.min(...observedTimes) > maxObservationSkewMs) {
    return {
      status: 'SOURCE_CONFLICT', canonicalValue: null, observations: valid,
      providers: distinctProviders, evidenceIds: valid.map(item => item.evidenceId), maxDeviationBps: null,
      reason: 'Provider-Beobachtungen liegen außerhalb des zulässigen Zeitfensters.',
    };
  }

  const center = median(valid.map(item => item.value));
  const deviations = valid.map(item => Math.abs(item.value - center) / center * 10_000);
  const maxDeviationBps = Math.max(...deviations);
  if (maxDeviationBps > toleranceBps) {
    return {
      status: 'SOURCE_CONFLICT', canonicalValue: null, observations: valid,
      providers: distinctProviders, evidenceIds: valid.map(item => item.evidenceId),
      maxDeviationBps: Number(maxDeviationBps.toFixed(2)),
      reason: `Maximale Provider-Abweichung ${maxDeviationBps.toFixed(2)} bps überschreitet ${toleranceBps} bps.`,
    };
  }

  return {
    status: 'CONSENSUS', canonicalValue: Number(center.toPrecision(15)), observations: valid,
    providers: distinctProviders, evidenceIds: valid.map(item => item.evidenceId),
    maxDeviationBps: Number(maxDeviationBps.toFixed(2)),
  };
}
