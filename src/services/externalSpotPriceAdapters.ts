import type { CanonicalMarketDataSnapshot } from '../platform/MarketData/contracts';
import type { MarketObservation } from './marketDataConsensus';

export type SpotPriceProviderId = 'coinapi' | 'twelvedata' | 'eodhd';

/**
 * Converts an already gateway-governed canonical snapshot into consensus evidence.
 *
 * This module intentionally performs no provider HTTP I/O and reads no credentials. Historical,
 * stale, unavailable or otherwise non-current snapshots cannot enter the current spot quorum.
 */
export function marketObservationFromCanonicalSnapshot(
  snapshot: CanonicalMarketDataSnapshot,
): MarketObservation | null {
  if (snapshot.qualityState !== 'LIVE' && snapshot.qualityState !== 'DELAYED') return null;
  if (snapshot.price === null || !Number.isFinite(snapshot.price) || snapshot.price <= 0) return null;
  if (!snapshot.sourceTimestamp || !snapshot.evidenceId || !snapshot.currency) return null;

  return {
    provider: snapshot.provider,
    value: snapshot.price,
    observedAt: snapshot.sourceTimestamp,
    retrievedAt: snapshot.receivedAt,
    unit: snapshot.currency,
    evidenceId: snapshot.evidenceId,
    qualityState: snapshot.qualityState,
  };
}
