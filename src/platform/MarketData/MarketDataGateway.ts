import { assessMarketDataSnapshot, withAssessedQuality } from './DataQualityService';
import { ProviderRegistry } from './ProviderRegistry';
import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
  type SnapshotRequest,
} from './contracts';

export interface MarketDataGatewayResult {
  snapshot: CanonicalMarketDataSnapshot;
  attemptedProviders: string[];
}

function unavailable(request: SnapshotRequest, attemptedProviders: string[], reason: string): MarketDataGatewayResult {
  const now = new Date().toISOString();
  return {
    attemptedProviders,
    snapshot: {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: attemptedProviders.at(-1) ?? 'none',
      providerFeed: null,
      symbol: request.symbol.toUpperCase().trim(),
      assetClass: request.assetClass,
      currency: null,
      sourceTimestamp: null,
      ingestedAt: now,
      receivedAt: now,
      freshnessMs: null,
      qualityState: 'UNAVAILABLE',
      isRealtime: false,
      isDelayed: false,
      correlationId: request.correlationId,
      price: null,
      evidenceId: null,
      reason,
    },
  };
}

export class MarketDataGateway {
  constructor(private readonly registry: ProviderRegistry) {}

  async getSnapshot(request: SnapshotRequest): Promise<MarketDataGatewayResult> {
    if (!request.symbol.trim() || !request.correlationId.trim()) {
      return unavailable(request, [], 'symbol and correlationId are required');
    }

    const candidates = this.registry.candidates(request);
    if (candidates.length === 0) {
      return unavailable(request, [], 'No approved provider supports this request.');
    }

    const attemptedProviders: string[] = [];
    for (const provider of candidates) {
      attemptedProviders.push(provider.descriptor.id);
      try {
        const raw = await provider.getSnapshot(request);
        const snapshot = withAssessedQuality(raw, {
          maxAgeMs: request.maxAgeMs,
          allowStale: request.allowStale,
        });
        const assessment = assessMarketDataSnapshot(snapshot, {
          maxAgeMs: request.maxAgeMs,
          allowStale: request.allowStale,
        });
        if (assessment.accepted) return { snapshot, attemptedProviders };
      } catch {
        // Provider details are deliberately not copied into the domain response. The gateway
        // proceeds only to another explicitly registered and approved candidate.
      }
    }

    return unavailable(request, attemptedProviders, 'All approved providers were unavailable or failed data-quality validation.');
  }
}
