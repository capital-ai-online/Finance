import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const KRAKEN_FUTURES_PUBLIC_PROVIDER_ID = 'kraken-futures-public' as const;
export const KRAKEN_FUTURES_CHARTS_BASE_URL = 'https://futures.kraken.com/api/charts/v1' as const;
export const KRAKEN_FUTURES_ANALYTICS_CONTRACT_VERSION = 'kraken-futures-analytics-evidence/1.0.0' as const;

export type KrakenFuturesEvidenceStatus = 'VERIFIED' | 'PARTIAL' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface KrakenFuturesAnalyticsEvidence {
  readonly contractVersion: typeof KRAKEN_FUTURES_ANALYTICS_CONTRACT_VERSION;
  readonly status: KrakenFuturesEvidenceStatus;
  readonly marketSymbol: string;
  readonly retrievedAt: string;
  readonly observedAt: string | null;
  readonly evidenceRefs: readonly string[];
  readonly openInterest: number | null;
  readonly openInterestChangePct: number | null;
  readonly fundingRate: number | null;
  readonly liquidationVolume: number | null;
  readonly bidLiquidity01: number | null;
  readonly askLiquidity01: number | null;
  readonly bidSlippage100k: number | null;
  readonly askSlippage100k: number | null;
  readonly reason?: string;
}

export interface KrakenFuturesAnalyticsProviderOptions {
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function finite(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numericSeries(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const out: number[] = [];
  for (const entry of value) {
    if (Array.isArray(entry)) {
      const nested = numericSeries(entry);
      if (nested.length > 0) out.push(nested[nested.length - 1]);
    } else {
      const parsed = finite(entry);
      if (parsed !== null) out.push(parsed);
    }
  }
  return out;
}

function dataObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const root = value as Record<string, unknown>;
  const result = root.result && typeof root.result === 'object' && !Array.isArray(root.result)
    ? root.result as Record<string, unknown>
    : null;
  if (!result) return null;
  return result.data && typeof result.data === 'object'
    ? result.data as Record<string, unknown>
    : null;
}

function rawData(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const root = value as Record<string, unknown>;
  const result = root.result && typeof root.result === 'object' && !Array.isArray(root.result)
    ? root.result as Record<string, unknown>
    : null;
  return result?.data ?? null;
}

function observedAt(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const root = value as Record<string, unknown>;
  const result = root.result && typeof root.result === 'object' && !Array.isArray(root.result)
    ? root.result as Record<string, unknown>
    : null;
  const timestamps = Array.isArray(result?.timestamp) ? result!.timestamp : [];
  const last = timestamps.length > 0 ? finite(timestamps[timestamps.length - 1]) : null;
  if (last === null) return null;
  const millis = last < 10_000_000_000 ? last * 1000 : last;
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function seriesChangePct(series: readonly number[]): number | null {
  if (series.length < 2 || series[0] === 0) return null;
  return Number((((series[series.length - 1] - series[0]) / Math.abs(series[0])) * 100).toFixed(8));
}

function latestField(data: Record<string, unknown> | null, keys: readonly string[]): number | null {
  if (!data) return null;
  for (const key of keys) {
    const series = numericSeries(data[key]);
    if (series.length > 0) return series[series.length - 1];
  }
  return null;
}

/**
 * Keyless read-only Kraken Futures Charts evidence.
 *
 * Kraken market symbols MUST be resolved by the governed identity registry. The provider does not
 * infer a futures contract from a CAPITAL-AI ticker and never calls trading/private endpoints.
 */
export class KrakenFuturesAnalyticsProvider {
  private readonly http: ResearchEvidenceProviderHttp;
  private readonly nowMs: () => number;

  constructor(options: KrakenFuturesAnalyticsProviderOptions = {}) {
    this.nowMs = options.nowMs ?? Date.now;
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? KRAKEN_FUTURES_CHARTS_BASE_URL,
      apiKey: null,
      apiKeyRequired: false,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: this.nowMs,
    };
    this.http = new ResearchEvidenceProviderHttp(KRAKEN_FUTURES_PUBLIC_PROVIDER_ID, 'derivatives', transport);
  }

  public async getAnalytics(marketSymbolInput: string): Promise<KrakenFuturesAnalyticsEvidence> {
    const marketSymbol = marketSymbolInput.toUpperCase().trim();
    if (!/^[A-Z0-9_.-]{2,40}$/.test(marketSymbol)) {
      return Object.freeze({
        contractVersion: KRAKEN_FUTURES_ANALYTICS_CONTRACT_VERSION,
        status: 'INVALID',
        marketSymbol,
        retrievedAt: new Date(this.nowMs()).toISOString(),
        observedAt: null,
        evidenceRefs: Object.freeze([]),
        openInterest: null,
        openInterestChangePct: null,
        fundingRate: null,
        liquidationVolume: null,
        bidLiquidity01: null,
        askLiquidity01: null,
        bidSlippage100k: null,
        askSlippage100k: null,
        reason: 'Governed Kraken Futures market symbol is invalid.',
      });
    }

    const to = Math.floor(this.nowMs() / 1000);
    const since = to - 60 * 60;
    const query = `since=${since}&to=${to}&interval=300`;
    const types = ['open-interest', 'funding', 'liquidation-volume', 'liquidity', 'slippage'] as const;
    const results = await Promise.all(types.map(type => this.http.requestJson(`/analytics/${encodeURIComponent(marketSymbol)}/${type}?${query}`)));
    const [openInterestResult, fundingResult, liquidationResult, liquidityResult, slippageResult] = results;

    const oiSeries = numericSeries(rawData(openInterestResult.data));
    const fundingData = dataObject(fundingResult.data);
    const liquidationSeries = numericSeries(rawData(liquidationResult.data));
    const liquidityData = dataObject(liquidityResult.data);
    const slippageData = dataObject(slippageResult.data);
    const bidLiquidity = liquidityData?.bid && typeof liquidityData.bid === 'object' ? liquidityData.bid as Record<string, unknown> : null;
    const askLiquidity = liquidityData?.ask && typeof liquidityData.ask === 'object' ? liquidityData.ask as Record<string, unknown> : null;
    const bidSlippage = slippageData?.bid && typeof slippageData.bid === 'object' ? slippageData.bid as Record<string, unknown> : null;
    const askSlippage = slippageData?.ask && typeof slippageData.ask === 'object' ? slippageData.ask as Record<string, unknown> : null;

    const successful = results.map((result, index) => result.status === 'READY' ? types[index] : null).filter((value): value is typeof types[number] => value !== null);
    const evidenceRefs = successful.map(type => `kraken:futures-analytics:${marketSymbol}:${type}:${to}`);
    const status: KrakenFuturesEvidenceStatus = successful.length === types.length
      ? 'VERIFIED'
      : successful.length > 0
        ? 'PARTIAL'
        : 'SOURCE_UNAVAILABLE';

    const observed = results.map(result => observedAt(result.data)).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
    return Object.freeze({
      contractVersion: KRAKEN_FUTURES_ANALYTICS_CONTRACT_VERSION,
      status,
      marketSymbol,
      retrievedAt: results.map(result => result.retrievedAt).sort().at(-1) ?? new Date(this.nowMs()).toISOString(),
      observedAt: observed,
      evidenceRefs: Object.freeze(evidenceRefs),
      openInterest: oiSeries.at(-1) ?? null,
      openInterestChangePct: seriesChangePct(oiSeries),
      fundingRate: latestField(fundingData, ['rate', 'relativeRate']),
      liquidationVolume: liquidationSeries.at(-1) ?? null,
      bidLiquidity01: latestField(bidLiquidity, ['liquidity_01', 'liquidity01']),
      askLiquidity01: latestField(askLiquidity, ['liquidity_01', 'liquidity01']),
      bidSlippage100k: latestField(bidSlippage, ['slippage_100k', 'slippage100k']),
      askSlippage100k: latestField(askSlippage, ['slippage_100k', 'slippage100k']),
      reason: status === 'VERIFIED' ? undefined : 'One or more Kraken public analytics families were unavailable; missing values remain null.',
    });
  }
}
