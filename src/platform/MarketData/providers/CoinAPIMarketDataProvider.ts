/**
 * SC-5 Phase D — CoinAPI crypto adapter for MarketDataGateway.
 * Registers CoinAPI as a gateway-hardened (matrix RL/CB/cache) crypto snapshot source so a later,
 * explicitly Owner-gated step can form a multi-provider execution quorum. Does not itself change
 * executionPriceEligible, scoring formulas or eligibility thresholds, and is not yet consumed by
 * cryptoQuoteEvidence (which still pins allowedProviderIds to ['coingecko']).
 */

import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
  type MarketDataProvider,
  type MarketDataProviderDescriptor,
  type SnapshotRequest,
} from '../contracts';

export interface CoinAPIMarketDataProviderOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  apiKey?: string;
}

export class CoinAPIMarketDataProvider implements MarketDataProvider {
  readonly descriptor: MarketDataProviderDescriptor = {
    id: 'coinapi',
    role: 'secondary',
    capabilities: ['snapshot', 'quote'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 20,
  };

  constructor(private readonly options: CoinAPIMarketDataProviderOptions = {}) {}

  async getSnapshot(request: SnapshotRequest): Promise<CanonicalMarketDataSnapshot> {
    const nowMs = this.options.nowMs?.() ?? Date.now();
    const retrievedAt = new Date(nowMs).toISOString();
    const symbol = request.symbol.toUpperCase().trim();

    if (request.assetClass !== 'crypto') {
      return this.unavailable(request, retrievedAt, `CoinAPI provider does not support assetClass=${request.assetClass}.`);
    }

    const apiKey = this.options.apiKey ?? process.env.COIN_API_KEY;
    if (!apiKey) return this.unavailable(request, retrievedAt, 'COIN_API_KEY is not configured.');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 4_000);
    try {
      const response = await (this.options.fetchImpl ?? fetch)(
        `https://rest.coinapi.io/v1/exchangerate/${encodeURIComponent(symbol)}/USD`,
        {
          headers: {
            Accept: 'application/json',
            'X-CoinAPI-Key': apiKey,
            'User-Agent': 'CAPITAL-AI/0.6.3',
          },
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: any = await response.json();
      const price = Number(data?.rate);
      if (!Number.isFinite(price) || price <= 0) throw new Error('CoinAPI returned no valid USD rate.');

      const observedAt =
        typeof data?.time === 'string' && Number.isFinite(Date.parse(data.time))
          ? new Date(data.time).toISOString()
          : retrievedAt;

      return {
        contractVersion: MARKET_DATA_CONTRACT_VERSION,
        provider: 'CoinAPI',
        providerFeed: 'exchangerate',
        symbol,
        assetClass: 'crypto',
        currency: 'USD',
        sourceTimestamp: observedAt,
        ingestedAt: retrievedAt,
        receivedAt: retrievedAt,
        freshnessMs: Math.max(0, nowMs - Date.parse(observedAt)),
        qualityState: 'LIVE',
        isRealtime: true,
        isDelayed: false,
        correlationId: request.correlationId,
        price,
        evidenceId: `quote:coinapi:${symbol}:USD:${observedAt}`,
      };
    } catch (error) {
      return this.unavailable(request, retrievedAt, error instanceof Error ? error.message : String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  private unavailable(
    request: SnapshotRequest,
    retrievedAt: string,
    reason: string,
  ): CanonicalMarketDataSnapshot {
    return {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'CoinAPI',
      providerFeed: 'exchangerate',
      symbol: request.symbol.toUpperCase().trim(),
      assetClass: request.assetClass,
      currency: null,
      sourceTimestamp: null,
      ingestedAt: retrievedAt,
      receivedAt: retrievedAt,
      freshnessMs: null,
      qualityState: 'UNAVAILABLE',
      isRealtime: false,
      isDelayed: false,
      correlationId: request.correlationId,
      price: null,
      evidenceId: null,
      reason,
    };
  }
}
