import type { CanonicalMarketDataSnapshot, MarketDataQualityState } from './contracts';

const ACCEPTABLE_STATES = new Set<MarketDataQualityState>(['LIVE', 'DELAYED', 'HISTORICAL']);

export interface DataQualityAssessment {
  accepted: boolean;
  state: MarketDataQualityState;
  violations: string[];
}

export function assessMarketDataSnapshot(
  snapshot: CanonicalMarketDataSnapshot,
  options: { nowMs?: number; maxAgeMs?: number; allowStale?: boolean } = {},
): DataQualityAssessment {
  const violations: string[] = [];
  const nowMs = options.nowMs ?? Date.now();
  const maxAgeMs = options.maxAgeMs ?? 90_000;
  const sourceMs = snapshot.sourceTimestamp ? Date.parse(snapshot.sourceTimestamp) : Number.NaN;
  const ingestedMs = Date.parse(snapshot.ingestedAt);

  if (!snapshot.provider.trim()) violations.push('provider is required');
  if (!snapshot.symbol.trim()) violations.push('symbol is required');
  if (!snapshot.correlationId.trim()) violations.push('correlationId is required');
  if (!Number.isFinite(ingestedMs)) violations.push('ingestedAt must be an ISO timestamp');
  if (snapshot.price !== null && (!Number.isFinite(snapshot.price) || snapshot.price <= 0)) {
    violations.push('price must be null or a positive finite number');
  }
  if (snapshot.price !== null && !Number.isFinite(sourceMs)) {
    violations.push('sourceTimestamp is required when price is present');
  }

  if (violations.length > 0) return { accepted: false, state: 'INVALID', violations };
  if (snapshot.qualityState === 'UNAVAILABLE' || snapshot.qualityState === 'INVALID') {
    return { accepted: false, state: snapshot.qualityState, violations };
  }

  const freshnessMs = Number.isFinite(sourceMs) ? Math.max(0, nowMs - sourceMs) : null;
  const stale = freshnessMs !== null && freshnessMs > maxAgeMs;
  const state: MarketDataQualityState = stale ? 'STALE' : snapshot.qualityState;
  const accepted = ACCEPTABLE_STATES.has(state) || (state === 'STALE' && options.allowStale === true);
  if (!accepted && state === 'STALE') violations.push(`freshness exceeds ${maxAgeMs} ms`);
  if (!accepted && state === 'DEGRADED') violations.push('provider marked observation as degraded');

  return { accepted, state, violations };
}

export function withAssessedQuality(
  snapshot: CanonicalMarketDataSnapshot,
  options: { nowMs?: number; maxAgeMs?: number; allowStale?: boolean } = {},
): CanonicalMarketDataSnapshot {
  const assessment = assessMarketDataSnapshot(snapshot, options);
  const sourceMs = snapshot.sourceTimestamp ? Date.parse(snapshot.sourceTimestamp) : Number.NaN;
  const nowMs = options.nowMs ?? Date.now();
  return {
    ...snapshot,
    qualityState: assessment.state,
    freshnessMs: Number.isFinite(sourceMs) ? Math.max(0, nowMs - sourceMs) : null,
    reason: assessment.violations.length > 0 ? assessment.violations.join('; ') : snapshot.reason,
  };
}
