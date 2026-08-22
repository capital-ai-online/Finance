import { ResearchEvidenceProviderHttp } from './ResearchEvidenceProviderHttp';

export const BINANCE_PUBLIC_ANALYTICS_PROVIDER_ID = 'binance-public' as const;
export const BINANCE_PUBLIC_ANALYTICS_CONTRACT_VERSION = 'binance-public-analytics/1.0.0' as const;

export type BinancePublicAnalyticsStatus = 'VERIFIED' | 'PARTIAL' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface BinancePublicAnalyticsEvidence {
  readonly contractVersion: typeof BINANCE_PUBLIC_ANALYTICS_CONTRACT_VERSION;
  readonly status: BinancePublicAnalyticsStatus;
  readonly symbol: string;
  readonly retrievedAt: string;
  readonly observedAt: string | null;
  readonly evidenceRefs: readonly string[];
  readonly openInterest: number | null;
  readonly fundingRate: number | null;
  readonly markPrice: number | null;
  readonly indexPrice: number | null;
  readonly bidDepthUsd1Pct: number | null;
  readonly askDepthUsd1Pct: number | null;
  readonly reason?: string;
}

export interface BinancePublicAnalyticsProviderOptions {
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function finite(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function depthUsd(levels: unknown, mid: number, side: 'bid' | 'ask'): number | null {
  if (!Array.isArray(levels) || !Number.isFinite(mid) || mid <= 0) return null;
  const min = mid * 0.99;
  const max = mid * 1.01;
  let total = 0;
  let found = false;
  for (const level of levels) {
    if (!Array.isArray(level) || level.length < 2) continue;
    const price = finite(level[0]);
    const qty = finite(level[1]);
    if (price === null || qty === null || price <= 0 || qty < 0) continue;
    const within = side === 'bid' ? price >= min && price <= mid : price <= max && price >= mid;
    if (!within) continue;
    total += price * qty;
    found = true;
  }
  return found ? total : null;
}

export class BinancePublicAnalyticsProvider {
  private readonly http: ResearchEvidenceProviderHttp;
  private readonly nowMs: () => number;

  constructor(options: BinancePublicAnalyticsProviderOptions = {}) {
    this.nowMs = options.nowMs ?? Date.now;
    this.http = new ResearchEvidenceProviderHttp(BINANCE_PUBLIC_ANALYTICS_PROVIDER_ID, 'derivatives', {
      baseUrl: options.baseUrl ?? 'https://fapi.binance.com',
      apiKeyRequired: false,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: this.nowMs,
    });
  }

  async getAnalytics(symbolInput: string): Promise<BinancePublicAnalyticsEvidence> {
    const symbol = symbolInput.toUpperCase().trim();
    const retrievedAt = new Date(this.nowMs()).toISOString();
    if (!/^[A-Z0-9_]{5,30}$/.test(symbol)) {
      return Object.freeze({ contractVersion: BINANCE_PUBLIC_ANALYTICS_CONTRACT_VERSION, status: 'INVALID', symbol, retrievedAt, observedAt: null, evidenceRefs: Object.freeze([]), openInterest: null, fundingRate: null, markPrice: null, indexPrice: null, bidDepthUsd1Pct: null, askDepthUsd1Pct: null, reason: 'Governed Binance futures symbol is invalid.' });
    }

    const encoded = encodeURIComponent(symbol);
    const [oiResult, premiumResult, depthResult] = await Promise.all([
      this.http.requestJson(`/fapi/v1/openInterest?symbol=${encoded}`),
      this.http.requestJson(`/fapi/v1/premiumIndex?symbol=${encoded}`),
      this.http.requestJson(`/fapi/v1/depth?symbol=${encoded}&limit=100`),
    ]);

    const refs: string[] = [];
    let openInterest: number | null = null;
    let fundingRate: number | null = null;
    let markPrice: number | null = null;
    let indexPrice: number | null = null;
    let bidDepthUsd1Pct: number | null = null;
    let askDepthUsd1Pct: number | null = null;
    let observedAt: string | null = null;

    if (oiResult.status === 'READY' && oiResult.data && typeof oiResult.data === 'object') {
      const row = oiResult.data as Record<string, unknown>;
      openInterest = finite(row.openInterest);
      const time = finite(row.time);
      if (time !== null) observedAt = new Date(time).toISOString();
      refs.push(`binance:futures:open-interest:${symbol}:${oiResult.retrievedAt}`);
    }
    if (premiumResult.status === 'READY' && premiumResult.data && typeof premiumResult.data === 'object') {
      const row = premiumResult.data as Record<string, unknown>;
      fundingRate = finite(row.lastFundingRate);
      markPrice = finite(row.markPrice);
      indexPrice = finite(row.indexPrice);
      const time = finite(row.time);
      if (time !== null) observedAt = new Date(time).toISOString();
      refs.push(`binance:futures:premium-index:${symbol}:${premiumResult.retrievedAt}`);
    }
    if (depthResult.status === 'READY' && depthResult.data && typeof depthResult.data === 'object') {
      const row = depthResult.data as Record<string, unknown>;
      const bids = Array.isArray(row.bids) ? row.bids : [];
      const asks = Array.isArray(row.asks) ? row.asks : [];
      const bestBid = bids.length ? finite((bids[0] as unknown[])[0]) : null;
      const bestAsk = asks.length ? finite((asks[0] as unknown[])[0]) : null;
      const mid = bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : markPrice;
      if (mid !== null) {
        bidDepthUsd1Pct = depthUsd(bids, mid, 'bid');
        askDepthUsd1Pct = depthUsd(asks, mid, 'ask');
      }
      refs.push(`binance:futures:depth:${symbol}:${depthResult.retrievedAt}`);
    }

    const values = [openInterest, fundingRate, markPrice, indexPrice, bidDepthUsd1Pct, askDepthUsd1Pct];
    const available = values.filter((value) => value !== null).length;
    const status: BinancePublicAnalyticsStatus = available === 0 ? 'SOURCE_UNAVAILABLE' : available === values.length ? 'VERIFIED' : 'PARTIAL';
    return Object.freeze({
      contractVersion: BINANCE_PUBLIC_ANALYTICS_CONTRACT_VERSION,
      status,
      symbol,
      retrievedAt,
      observedAt,
      evidenceRefs: Object.freeze(refs),
      openInterest,
      fundingRate,
      markPrice,
      indexPrice,
      bidDepthUsd1Pct,
      askDepthUsd1Pct,
      reason: status === 'PARTIAL' ? 'Binance public analytics returned only a subset of governed evidence fields.' : status === 'SOURCE_UNAVAILABLE' ? 'Binance public analytics returned no usable fields.' : undefined,
    });
  }
}
