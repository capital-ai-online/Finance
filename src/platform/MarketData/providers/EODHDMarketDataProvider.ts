/**
 * SC-5 Phase D — EODHD crypto adapter for MarketDataGateway.
 * EOD-only reference observation: intentionally labelled HISTORICAL (never LIVE/DELAYED) so it
 * cannot silently masquerade as a current execution price. Registers EODHD as a gateway-hardened
 * (matrix RL/CB/cache) crypto snapshot source for a later, explicitly Owner-gated quorum step. Does
 * not itself change executionPriceEligible, scoring formulas or eligibility thresholds, and is not
 * yet consumed by cryptoQuoteEvidence (which still pins allowedProviderIds to ['coingecko']).
 */

import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
  type MarketDataProvider,
  type MarketDataProviderDescriptor,
  type SnapshotRequest,
} from '../contracts';

export interface EODHDMarketDataProviderOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  apiKey?: string;
}

export class EODHDMarketDataProvider implements MarketDataProvider {
  readonly descriptor: MarketDataProviderDescriptor = {
    id: 'eodhd',
    role: 'secondary',
    capabilities: ['snapshot', 'history'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 40,
  };

  constructor(private readonly options: EODHDMarketDataProviderOptions = {}) {}

  async getSnapshot(request: SnapshotRequest): Promise<CanonicalMarketDataSnapshot> {
    const nowMs = this.options.nowMs?.() ?? Date.now();
    const retrievedAt = new Date(nowMs).toISOString();
    const symbol = request.symbol.toUpperCase().trim();

    if (request.assetClass !== 'crypto') {
      return this.unavailable(request, retrievedAt, `EODHD provider does not support assetClass=${request.assetClass}.`);
    }

    const apiKey = this.options.apiKey ?? process.env.EODHD_API_KEY;
    if (!apiKey) return this.unavailable(request, retrievedAt, 'EODHD_API_KEY is not configured.');

    const ticker = `${symbol}-USD.CC`;
    const fromDate = retrievedAt.slice(0, 10);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 4_000);
    try {
      const response = await (this.options.fetchImpl ?? fetch)(
        `https://eodhd.com/api/eod/${encodeURIComponent(ticker)}?api_token=${encodeURIComponent(apiKey)}&fmt=json&period=d&order=d&from=${fromDate}`,
        {
          headers: { Accept: 'application/json', 'User-Agent': 'CAPITAL-AI/0.6.3' },
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: any = await response.json();
      const row = Array.isArray(data) ? data[0] : null;
      const price = Number(row?.adjusted_close ?? row?.close);
      if (!Number.isFinite(price) || price <= 0) throw new Error('EODHD returned no valid latest EOD close.');

      const observedAt =
        typeof row?.date === 'string' ? `${row.date.slice(0, 10)}T23:59:59.000Z` : retrievedAt;

      return {
        contractVersion: MARKET_DATA_CONTRACT_VERSION,
        provider: 'EODHD',
        providerFeed: 'eod',
        symbol,
        assetClass: 'crypto',
        currency: 'USD',
        sourceTimestamp: observedAt,
        ingestedAt: retrievedAt,
        receivedAt: retrievedAt,
        freshnessMs: Math.max(0, nowMs - Date.parse(observedAt)),
        // EOD close, not a live/delayed feed — must never be mistaken for a current execution price.
        qualityState: 'HISTORICAL',
        isRealtime: false,
        isDelayed: false,
        correlationId: request.correlationId,
        price,
        evidenceId: `quote:eodhd:${symbol}:USD:${observedAt}`,
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
      provider: 'EODHD',
      providerFeed: 'eod',
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
