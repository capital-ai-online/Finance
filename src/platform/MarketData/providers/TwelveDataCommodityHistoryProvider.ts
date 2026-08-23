import {
  MARKET_DATA_HISTORY_CONTRACT_VERSION,
  type CanonicalMarketDataHistory,
  type HistoryRequest,
  type MarketDataHistoryProvider,
  type MarketDataProviderDescriptor,
} from '../contracts';
import { ResearchEvidenceProviderHttp } from './ResearchEvidenceProviderHttp';

export interface TwelveDataCommodityHistoryProviderOptions {
  readonly providerSymbols: Readonly<Record<string, string>>;
  readonly transport: ResearchEvidenceProviderHttp;
}

/**
 * TwelveData commodity-history adapter for MarketDataHistoryGateway.
 *
 * HTTP/rate-limit/circuit-breaker/provider-health governance is delegated to the existing
 * ResearchEvidenceProviderHttp transport. This class only maps the vendor payload into the
 * canonical history contract and has no scoring authority.
 */
export class TwelveDataCommodityHistoryProvider implements MarketDataHistoryProvider {
  readonly descriptor: MarketDataProviderDescriptor = {
    id: 'twelvedata',
    role: 'primary',
    capabilities: ['history'],
    assetClasses: ['commodity'],
    enabled: true,
    priority: 10,
  };

  constructor(private readonly options: TwelveDataCommodityHistoryProviderOptions) {}

  async getHistory(request: HistoryRequest): Promise<CanonicalMarketDataHistory> {
    const symbol = request.symbol.toUpperCase().trim();
    const providerSymbol = this.options.providerSymbols[symbol];
    if (!providerSymbol) return this.unavailable(request, 'No approved TwelveData commodity identity mapping is configured.');

    const maxPoints = Math.min(Math.max(request.maxPoints ?? 90, 20), 365);
    const response = await this.options.transport.requestJson(
      `/time_series?symbol=${encodeURIComponent(providerSymbol)}&interval=1day&outputsize=${maxPoints}`,
    );
    if (response.status !== 'READY') return this.unavailable(request, response.reason ?? `TwelveData transport status ${response.status}.`, response.retrievedAt);

    const data = response.data as any;
    const returnedSymbol = typeof data?.meta?.symbol === 'string' ? data.meta.symbol.trim().toUpperCase() : '';
    if (returnedSymbol && returnedSymbol !== providerSymbol.toUpperCase()) {
      return this.invalid(request, response.retrievedAt, `TwelveData identity mismatch: expected ${providerSymbol}, received ${returnedSymbol}.`);
    }
    if (typeof data?.meta?.type === 'string' && !data.meta.type.toLowerCase().includes('commodity')) {
      return this.invalid(request, response.retrievedAt, `TwelveData returned non-commodity instrument type ${data.meta.type}.`);
    }
    if (!Array.isArray(data?.values)) return this.invalid(request, response.retrievedAt, 'TwelveData returned no commodity time-series values.');

    const points = data.values
      .map((row: any) => ({
        timestamp: typeof row?.datetime === 'string' && /^\d{4}-\d{2}-\d{2}/.test(row.datetime)
          ? `${row.datetime.slice(0, 10)}T23:59:59.000Z`
          : '',
        close: Number(row?.close),
      }))
      .filter((point: { timestamp: string; close: number }) => Number.isFinite(Date.parse(point.timestamp)) && Number.isFinite(point.close) && point.close > 0)
      .sort((a: { timestamp: string }, b: { timestamp: string }) => a.timestamp.localeCompare(b.timestamp))
      .slice(-maxPoints);

    if (points.length < 20) return this.invalid(request, response.retrievedAt, `TwelveData returned only ${points.length} valid commodity observations.`);

    return {
      contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
      provider: 'twelvedata',
      providerFeed: 'time_series/1day',
      symbol,
      assetClass: 'commodity',
      currency: typeof data?.meta?.currency === 'string'
        ? data.meta.currency
        : providerSymbol.includes('/')
          ? providerSymbol.split('/').at(-1) ?? null
          : null,
      receivedAt: response.retrievedAt,
      qualityState: 'HISTORICAL',
      correlationId: request.correlationId,
      points,
      evidenceId: `history:twelvedata:${providerSymbol}:${points[0].timestamp.slice(0, 10)}:${points.at(-1)!.timestamp.slice(0, 10)}`,
      barInterval: '1d',
    };
  }

  private unavailable(request: HistoryRequest, reason: string, receivedAt = new Date().toISOString()): CanonicalMarketDataHistory {
    return {
      contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
      provider: 'twelvedata',
      providerFeed: 'time_series/1day',
      symbol: request.symbol.toUpperCase().trim(),
      assetClass: 'commodity',
      currency: null,
      receivedAt,
      qualityState: 'UNAVAILABLE',
      correlationId: request.correlationId,
      points: [],
      evidenceId: null,
      barInterval: '1d',
      reason,
    };
  }

  private invalid(request: HistoryRequest, receivedAt: string, reason: string): CanonicalMarketDataHistory {
    return {
      ...this.unavailable(request, reason, receivedAt),
      qualityState: 'INVALID',
    };
  }
}
