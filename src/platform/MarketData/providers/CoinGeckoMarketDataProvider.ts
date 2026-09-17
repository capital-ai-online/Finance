/**
 * SC-5 Phase C — CoinGecko crypto adapter for MarketDataGateway.
 * Canonical snapshot includes price plus optional marketCap/supply fields.
 * executionPriceEligible / scoreImpact remain false (Owner-gated later).
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

function finitePositive(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

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
      // coins/{id} supplies current_price + market_cap/volume/supply in one call
      // (same payload shape as cryptoSnapshotProvider multi-field path).
      const url =
        `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}` +
        `?localization=false&tickers=false&market_data=true` +
        `&community_data=false&developer_data=false&sparkline=false`;
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
      const md = data?.market_data;
      if (!md || typeof md !== 'object') {
        throw new Error('CoinGecko snapshot missing market_data.');
      }

      const price = finitePositive(md?.current_price?.usd);
      if (price === undefined) {
        throw new Error('CoinGecko returned no valid USD price.');
      }

      const marketCapUsd = finitePositive(md?.market_cap?.usd) ?? null;
      const volume24hUsd = finitePositive(md?.total_volume?.usd) ?? null;
      const circulatingSupply = finitePositive(md?.circulating_supply) ?? null;
      const maxSupplyRaw = md?.max_supply;
      const maxSupply =
        maxSupplyRaw === null
          ? null
          : finitePositive(maxSupplyRaw) ?? null;
      const totalSupply = finitePositive(md?.total_supply) ?? null;

      const observedCandidate =
        typeof md?.last_updated === 'string' ? Date.parse(md.last_updated) : Number.NaN;
      const observedAt = Number.isFinite(observedCandidate)
        ? new Date(observedCandidate).toISOString()
        : retrievedAt;
      const freshnessMs = Math.max(0, nowMs - Date.parse(observedAt));

      return {
        contractVersion: MARKET_DATA_CONTRACT_VERSION,
        provider: 'CoinGecko',
        providerFeed: 'coins/market_data',
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
        marketCapUsd,
        volume24hUsd,
        circulatingSupply,
        maxSupply,
        totalSupply,
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
      providerFeed: 'coins/market_data',
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
