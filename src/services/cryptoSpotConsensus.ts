import { MarketDataGateway } from '../platform/MarketData/MarketDataGateway';
import { getProviderMatrixEntry } from '../platform/MarketData/ProviderMatrix';
import { ProviderRegistry } from '../platform/MarketData/ProviderRegistry';
import type { MarketDataProvider } from '../platform/MarketData/contracts';
import { CoinAPIMarketDataProvider } from '../platform/MarketData/providers/CoinAPIMarketDataProvider';
import { EODHDMarketDataProvider } from '../platform/MarketData/providers/EODHDMarketDataProvider';
import { TwelveDataMarketDataProvider } from '../platform/MarketData/providers/TwelveDataMarketDataProvider';
import { evaluateMarketConsensus, type MarketConsensusResult, type MarketObservation } from './marketDataConsensus';
import { marketObservationFromCanonicalSnapshot, type SpotPriceProviderId } from './externalSpotPriceAdapters';
import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';

export const CRYPTO_SPOT_CONSENSUS_PROVIDER_IDS: readonly SpotPriceProviderId[] = [
  'coinapi',
  'twelvedata',
  'eodhd',
] as const;

export interface CryptoSpotConsensusOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  apiKeys?: Partial<Record<SpotPriceProviderId, string>>;
  /** Optional upstream correlation identity; never used as provider or score authority. */
  correlationId?: string;
}

export interface CryptoSpotConsensusResult extends MarketConsensusResult {
  correlationId: string;
  qualityState: 'LIVE' | 'DELAYED' | null;
  unit: string | null;
}

export function isCryptoSpotConsensusProviderAuthorized(providerId: string): providerId is SpotPriceProviderId {
  if (!CRYPTO_SPOT_CONSENSUS_PROVIDER_IDS.includes(providerId as SpotPriceProviderId)) return false;
  const matrix = getProviderMatrixEntry(providerId);
  return Boolean(
    matrix
    && matrix.enabled
    && matrix.gatewayStatus === 'behind_gateway'
    && matrix.role !== 'shadow'
    && matrix.assetClasses.includes('crypto')
    && matrix.capabilities.includes('snapshot'),
  );
}

function assertProviderMatchesMatrix(provider: MarketDataProvider): void {
  const matrix = getProviderMatrixEntry(provider.descriptor.id);
  if (!matrix || !isCryptoSpotConsensusProviderAuthorized(provider.descriptor.id)) {
    throw new Error(`CRYPTO_SPOT_PROVIDER_NOT_AUTHORIZED:${provider.descriptor.id}`);
  }
  if (
    provider.descriptor.enabled !== matrix.enabled
    || provider.descriptor.role !== matrix.role
    || provider.descriptor.priority !== matrix.priority
    || !provider.descriptor.assetClasses.includes('crypto')
    || !provider.descriptor.capabilities.includes('snapshot')
  ) {
    throw new Error(`CRYPTO_SPOT_PROVIDER_REGISTRY_MISMATCH:${provider.descriptor.id}`);
  }
}

function createProvider(providerId: SpotPriceProviderId, options: CryptoSpotConsensusOptions): MarketDataProvider {
  const common = { fetchImpl: options.fetchImpl, timeoutMs: options.timeoutMs, nowMs: options.nowMs };
  if (providerId === 'coinapi') {
    return new CoinAPIMarketDataProvider({ ...common, apiKey: options.apiKeys?.coinapi });
  }
  if (providerId === 'twelvedata') {
    return new TwelveDataMarketDataProvider({ ...common, apiKey: options.apiKeys?.twelvedata });
  }
  return new EODHDMarketDataProvider({ ...common, apiKey: options.apiKeys?.eodhd });
}

function createConsensusGateway(options: CryptoSpotConsensusOptions): MarketDataGateway {
  const registry = new ProviderRegistry();
  for (const providerId of CRYPTO_SPOT_CONSENSUS_PROVIDER_IDS) {
    if (!isCryptoSpotConsensusProviderAuthorized(providerId)) continue;
    const provider = createProvider(providerId, options);
    assertProviderMatchesMatrix(provider);
    registry.register(provider);
  }
  return new MarketDataGateway(registry, {
    nowMs: options.nowMs,
    cacheTtlMs: 0,
  });
}

/**
 * Cross-provider crypto reference-price quorum using only canonical MarketDataGateway snapshots.
 *
 * Each provider is requested independently through an explicit allowedProviderIds gate. Historical
 * EODHD evidence is preserved by the provider/gateway contracts but cannot become a current spot
 * observation because only LIVE/DELAYED snapshots enter this quorum. No score or execution
 * authority is created here.
 */
export async function getCryptoSpotConsensus(
  symbol: string,
  options: CryptoSpotConsensusOptions = {},
): Promise<CryptoSpotConsensusResult> {
  const gateway = createConsensusGateway(options);
  const observations: MarketObservation[] = [];
  const nowMs = options.nowMs ?? Date.now;
  const normalizedSymbol = symbol.toUpperCase().trim();
  const correlationId = options.correlationId?.trim()
    || `crypto-spot-consensus:${normalizedSymbol}:${nowMs()}`;

  for (const providerId of CRYPTO_SPOT_CONSENSUS_PROVIDER_IDS) {
    if (!isCryptoSpotConsensusProviderAuthorized(providerId)) continue;
    const started = nowMs();
    const result = await gateway.getSnapshot({
      symbol: normalizedSymbol,
      assetClass: 'crypto',
      correlationId: `${correlationId}:${providerId}`,
      allowedProviderIds: [providerId],
      maxAgeMs: 5 * 60 * 1000,
      allowStale: false,
      includeShadow: false,
    });
    const observation = marketObservationFromCanonicalSnapshot(result.snapshot);
    if (observation) observations.push(observation);
    recordMarketDataProviderOutcome({
      provider: providerId,
      success: observation !== null,
      latencyMs: Math.max(0, nowMs() - started),
    });
  }

  const consensus = evaluateMarketConsensus(observations, {
    minimumSources: 2,
    toleranceBps: 100,
    maxObservationSkewMs: 5 * 60 * 1000,
  });
  const qualities = consensus.observations
    .map(observation => observation.qualityState)
    .filter((quality): quality is 'LIVE' | 'DELAYED' => quality === 'LIVE' || quality === 'DELAYED');
  const units = [...new Set(consensus.observations.map(observation => observation.unit))];

  return {
    ...consensus,
    correlationId,
    qualityState: qualities.length === consensus.observations.length && qualities.length > 0
      ? qualities.includes('DELAYED') ? 'DELAYED' : 'LIVE'
      : null,
    unit: units.length === 1 ? units[0] : null,
  };
}
