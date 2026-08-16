/**
 * SC-5 Phase A — CoinGecko crypto price adapter for MarketDataGateway.
 * Price-only canonical snapshot. Multi-field market-cap/supply remains in
 * cryptoSnapshotProvider until a later SC-5 phase migrates that path.
 */

import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
  type MarketDataProvider,
  type MarketDataProviderDescriptor,
  type SnapshotRequest,
} from '../contracts';

export interface CoinGeckoMarketDataProviderOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  /** Optional API key (Demo/Pro); free tier works without. */
  apiKey?: string;
}

/** Symbol → CoinGecko id map (core coverage; expand under SC-5 follow-ups). */
export const COINGECKO_SYMBOL_IDS: Readonly<Record<string, string>> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  XRP: 'ripple',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
};

export class CoinGeckoMarketDataProvider implements MarketDataProvider {
  readonly descriptor: MarketDataProviderDescriptor = {
    id: 'coingecko',
    role: 'primary',
    capabilities: ['snapshot', 'quote'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 10,
  };

  constructor(private readonly options: CoinGeckoMarketDataProviderOptions = {}) {}

  async getSnapshot(request: SnapshotRequest): Promise<CanonicalMarketDataSnapshot> {
    const nowMs = this.options.nowMs?.() ?? Date.now();
    const retrievedAt = new Date(nowMs).toISOString();
    const symbol = request.symbol.toUpperCase().trim();

    if (request.assetClass !== 'crypto') {
      return this.unavailable(request, retrievedAt, `CoinGecko provider does not support assetClass=${request.assetClass}.`);
    }

    const coinId = COINGECKO_SYMBOL_IDS[symbol];
    if (!coinId) {
      return this.unavailable(request, retrievedAt, `No approved CoinGecko mapping for symbol ${symbol}.`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 5_000);
    try {
      const url =
        `https://api.coingecko.com/api/v3/simple/price` +
        `?ids=${encodeURIComponent(coinId)}` +
        `&vs_currencies=usd&include_last_updated_at=true`;
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': 'CAPITAL-AI/0.6.3',
      };
      const apiKey = this.options.apiKey ?? process.env.COINGECKO_API_KEY;
      if (apiKey) headers['x-cg-demo-api-key'] = apiKey;

      const response = await (this.options.fetchImpl ?? fetch)(url, {
        headers,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: any = await response.json();
      const row = data?.[coinId];
      const price = Number(row?.usd);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error('CoinGecko returned no valid USD price.');
      }

      const lastUpdatedSec = Number(row?.last_updated_at);
      const observedAt = Number.isFinite(lastUpdatedSec) && lastUpdatedSec > 0
        ? new Date(lastUpdatedSec * 1000).toISOString()
        : retrievedAt;
      const freshnessMs = Math.max(0, nowMs - Date.parse(observedAt));

      return {
        contractVersion: MARKET_DATA_CONTRACT_VERSION,
        provider: 'CoinGecko',
        providerFeed: 'simple/price',
        symbol,
        assetClass: 'crypto',
        currency: 'USD',
        sourceTimestamp: observedAt,
        ingestedAt: retrievedAt,
        receivedAt: retrievedAt,
        freshnessMs,
        qualityState: 'LIVE',
        isRealtime: true,
        isDelayed: false,
        correlationId: request.correlationId,
        price,
        evidenceId: `quote:coingecko:${coinId}:USD:${observedAt}`,
      };
    } catch (error) {
      return this.unavailable(
        request,
        retrievedAt,
        error instanceof Error ? error.message : String(error),
      );
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
      provider: 'CoinGecko',
      providerFeed: 'simple/price',
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
