import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
  type MarketDataProvider,
  type MarketDataProviderDescriptor,
  type SnapshotRequest,
} from '../contracts';

export interface TwelveDataMarketDataProviderOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  apiKey?: string;
}

function providerSymbol(symbol: string, assetClass: 'stock' | 'forex' | 'crypto'): string {
  const normalized = symbol.toUpperCase().trim();
  if (assetClass === 'forex' && !normalized.includes('/') && normalized.length === 6) {
    return `${normalized.slice(0, 3)}/${normalized.slice(3)}`;
  }
  // SC-5 Phase D: crypto pairs quote against USD, same "/quote" endpoint as stock/forex.
  if (assetClass === 'crypto' && !normalized.includes('/')) {
    return `${normalized}/USD`;
  }
  return normalized;
}

export class TwelveDataMarketDataProvider implements MarketDataProvider {
  readonly descriptor: MarketDataProviderDescriptor = {
    id: 'twelvedata',
    role: 'primary',
    capabilities: ['snapshot', 'quote'],
    assetClasses: ['stock', 'forex', 'crypto'],
    enabled: true,
    priority: 10,
  };

  constructor(private readonly options: TwelveDataMarketDataProviderOptions = {}) {}

  async getSnapshot(request: SnapshotRequest): Promise<CanonicalMarketDataSnapshot> {
    const nowMs = this.options.nowMs?.() ?? Date.now();
    const retrievedAt = new Date(nowMs).toISOString();
    const apiKey = this.options.apiKey ?? process.env.TWELVEDATA_API_KEY;
    if (!apiKey) return this.unavailable(request, retrievedAt, 'TWELVEDATA_API_KEY is not configured.');

    const symbol = providerSymbol(request.symbol, request.assetClass as 'stock' | 'forex' | 'crypto');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 4_000);
    try {
      const response = await (this.options.fetchImpl ?? fetch)(
        `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `apikey ${apiKey}`,
            'User-Agent': 'CAPITAL-AI/0.6.3',
          },
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: any = await response.json();
      if (data?.status === 'error') throw new Error(data?.message || 'Twelve Data provider error');
      const price = Number(data?.close ?? data?.price);
      if (!Number.isFinite(price) || price <= 0) throw new Error('Twelve Data returned no valid quote price.');

      const observedAt = typeof data?.datetime === 'string' && Number.isFinite(Date.parse(data.datetime))
        ? new Date(data.datetime).toISOString()
        : retrievedAt;
      const currency = typeof data?.currency === 'string'
        ? data.currency
        : request.assetClass === 'forex' || request.assetClass === 'crypto'
          ? symbol.slice(-3)
          : null;
      return {
        contractVersion: MARKET_DATA_CONTRACT_VERSION,
        provider: 'TwelveData',
        providerFeed: typeof data?.exchange === 'string' ? data.exchange : 'quote',
        symbol: request.symbol.toUpperCase().trim(),
        assetClass: request.assetClass,
        currency,
        sourceTimestamp: observedAt,
        ingestedAt: retrievedAt,
        receivedAt: retrievedAt,
        freshnessMs: Math.max(0, nowMs - Date.parse(observedAt)),
        qualityState: 'DELAYED',
        isRealtime: false,
        isDelayed: true,
        correlationId: request.correlationId,
        price,
        evidenceId: `quote:twelvedata:${symbol}:${observedAt}`,
      };
    } catch (error) {
      return this.unavailable(request, retrievedAt, error instanceof Error ? error.message : String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  private unavailable(request: SnapshotRequest, retrievedAt: string, reason: string): CanonicalMarketDataSnapshot {
    return {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'TwelveData',
      providerFeed: 'quote',
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
