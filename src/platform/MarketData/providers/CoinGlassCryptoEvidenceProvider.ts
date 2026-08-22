import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const COINGLASS_PROVIDER_ID = 'coinglass' as const;
export const COINGLASS_BASE_URL = 'https://open-api-v4.coinglass.com' as const;
export const COINGLASS_EVIDENCE_CONTRACT_VERSION = 'coinglass-crypto-evidence/1.0.0' as const;

export type CoinGlassEvidenceStatus = 'VERIFIED' | 'PARTIAL' | 'NOT_CONFIGURED' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface CoinGlassDerivativesEvidence {
  readonly contractVersion: typeof COINGLASS_EVIDENCE_CONTRACT_VERSION;
  readonly status: CoinGlassEvidenceStatus;
  readonly symbol: string;
  readonly retrievedAt: string;
  readonly evidenceRefs: readonly string[];
  readonly openInterestUsd: number | null;
  readonly openInterestChange5mPct: number | null;
  readonly openInterestChange1hPct: number | null;
  readonly openInterestChange4hPct: number | null;
  readonly openInterestChange24hPct: number | null;
  readonly meanFundingRate: number | null;
  readonly liquidationUsd24h: number | null;
  readonly longLiquidationUsd24h: number | null;
  readonly shortLiquidationUsd24h: number | null;
  readonly aggregatedBidsUsd1Pct: number | null;
  readonly aggregatedAsksUsd1Pct: number | null;
  readonly orderbookObservedAt: string | null;
  readonly reason?: string;
}

export interface CoinGlassUnlockEvidence {
  readonly contractVersion: typeof COINGLASS_EVIDENCE_CONTRACT_VERSION;
  readonly status: CoinGlassEvidenceStatus;
  readonly symbol: string;
  readonly retrievedAt: string;
  readonly evidenceRef: string | null;
  readonly nextUnlockAt: string | null;
  readonly nextUnlockTokens: number | null;
  readonly nextUnlockOfCirculatingPct: number | null;
  readonly nextUnlockOfSupplyPct: number | null;
  readonly totalLockedTokens: number | null;
  readonly reason?: string;
}

export interface CoinGlassCryptoEvidenceProviderOptions {
  readonly apiKey?: string | null;
  readonly env?: NodeJS.ProcessEnv;
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

function arrayData(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') return [];
  const root = value as Record<string, unknown>;
  if (String(root.code) !== '0' || !Array.isArray(root.data)) return [];
  return root.data.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'));
}

function mean(values: readonly number[]): number | null {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function failedStatus(statuses: readonly string[]): CoinGlassEvidenceStatus {
  if (statuses.every((status) => status === 'NOT_CONFIGURED')) return 'NOT_CONFIGURED';
  if (statuses.every((status) => status !== 'READY')) return 'SOURCE_UNAVAILABLE';
  return 'PARTIAL';
}

export class CoinGlassCryptoEvidenceProvider {
  private readonly http: ResearchEvidenceProviderHttp;

  constructor(options: CoinGlassCryptoEvidenceProviderOptions = {}) {
    const env = options.env ?? process.env;
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? COINGLASS_BASE_URL,
      apiKey: options.apiKey ?? env.COINGLASS_API_KEY ?? null,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: options.nowMs,
      authHeaders: (apiKey) => ({ 'CG-API-KEY': apiKey }),
    };
    this.http = new ResearchEvidenceProviderHttp(COINGLASS_PROVIDER_ID, 'derivatives', transport);
  }

  public async getDerivativesEvidence(symbolInput: string): Promise<CoinGlassDerivativesEvidence> {
    const symbol = symbolInput.toUpperCase().trim();
    if (!/^[A-Z0-9]{2,15}$/.test(symbol)) {
      const retrievedAt = new Date().toISOString();
      return Object.freeze({
        contractVersion: COINGLASS_EVIDENCE_CONTRACT_VERSION,
        status: 'INVALID',
        symbol,
        retrievedAt,
        evidenceRefs: Object.freeze([]),
        openInterestUsd: null,
        openInterestChange5mPct: null,
        openInterestChange1hPct: null,
        openInterestChange4hPct: null,
        openInterestChange24hPct: null,
        meanFundingRate: null,
        liquidationUsd24h: null,
        longLiquidationUsd24h: null,
        shortLiquidationUsd24h: null,
        aggregatedBidsUsd1Pct: null,
        aggregatedAsksUsd1Pct: null,
        orderbookObservedAt: null,
        reason: 'CoinGlass symbol format is invalid.',
      });
    }

    const [oi, funding, liquidations, depth] = await Promise.all([
      this.http.requestJson(`/api/futures/open-interest/exchange-list?symbol=${encodeURIComponent(symbol)}`),
      this.http.requestJson(`/api/futures/funding-rate/exchange-list?symbol=${encodeURIComponent(symbol)}`),
      this.http.requestJson(`/api/futures/liquidation/exchange-list?symbol=${encodeURIComponent(symbol)}&range=24h`),
      this.http.requestJson(`/api/spot/orderbook/aggregated-ask-bids-history?exchange_list=ALL&symbol=${encodeURIComponent(symbol)}&interval=1h&limit=1&range=1`),
    ]);

    const statuses = [oi.status, funding.status, liquidations.status, depth.status];
    const oiRows = oi.status === 'READY' ? arrayData(oi.data) : [];
    const oiRow = oiRows.find((row) => String(row.exchange).toLowerCase() === 'all') ?? oiRows[0];

    const fundingRows = funding.status === 'READY' ? arrayData(funding.data) : [];
    const fundingRow = fundingRows.find((row) => String(row.symbol).toUpperCase() === symbol) ?? fundingRows[0];
    const fundingRates = [
      ...(Array.isArray(fundingRow?.stablecoin_margin_list) ? fundingRow.stablecoin_margin_list : []),
      ...(Array.isArray(fundingRow?.token_margin_list) ? fundingRow.token_margin_list : []),
    ]
      .map((entry) => entry && typeof entry === 'object' ? finite((entry as Record<string, unknown>).funding_rate) : null)
      .filter((value): value is number => value !== null);

    const liqRows = liquidations.status === 'READY' ? arrayData(liquidations.data) : [];
    const liqRow = liqRows.find((row) => String(row.exchange).toLowerCase() === 'all') ?? liqRows[0];

    const depthRows = depth.status === 'READY' ? arrayData(depth.data) : [];
    const depthRow = depthRows.length > 0 ? depthRows[depthRows.length - 1] : undefined;
    const depthTime = finite(depthRow?.time);
    const orderbookObservedAt = depthTime === null ? null : new Date(depthTime).toISOString();

    const evidenceRefs = [
      oi.status === 'READY' ? `coinglass:open-interest:${symbol}:${oi.retrievedAt}` : null,
      funding.status === 'READY' ? `coinglass:funding:${symbol}:${funding.retrievedAt}` : null,
      liquidations.status === 'READY' ? `coinglass:liquidation:${symbol}:${liquidations.retrievedAt}` : null,
      depth.status === 'READY' ? `coinglass:orderbook-depth:${symbol}:${depth.retrievedAt}` : null,
    ].filter((value): value is string => value !== null);

    const readyCount = statuses.filter((status) => status === 'READY').length;
    const status: CoinGlassEvidenceStatus = readyCount === statuses.length
      ? 'VERIFIED'
      : readyCount > 0
        ? 'PARTIAL'
        : failedStatus(statuses);

    return Object.freeze({
      contractVersion: COINGLASS_EVIDENCE_CONTRACT_VERSION,
      status,
      symbol,
      retrievedAt: [oi.retrievedAt, funding.retrievedAt, liquidations.retrievedAt, depth.retrievedAt].sort().at(-1)!,
      evidenceRefs: Object.freeze(evidenceRefs),
      openInterestUsd: finite(oiRow?.open_interest_usd),
      openInterestChange5mPct: finite(oiRow?.open_interest_change_percent_5m),
      openInterestChange1hPct: finite(oiRow?.open_interest_change_percent_1h),
      openInterestChange4hPct: finite(oiRow?.open_interest_change_percent_4h),
      openInterestChange24hPct: finite(oiRow?.open_interest_change_percent_24h),
      meanFundingRate: mean(fundingRates),
      liquidationUsd24h: finite(liqRow?.liquidation_usd),
      longLiquidationUsd24h: finite(liqRow?.long_liquidation_usd),
      shortLiquidationUsd24h: finite(liqRow?.short_liquidation_usd),
      aggregatedBidsUsd1Pct: finite(depthRow?.aggregated_bids_usd),
      aggregatedAsksUsd1Pct: finite(depthRow?.aggregated_asks_usd),
      orderbookObservedAt,
      reason: status === 'VERIFIED' ? undefined : 'One or more CoinGlass evidence families were unavailable; missing fields remain null.',
    });
  }

  public async getUnlockEvidence(symbolInput: string): Promise<CoinGlassUnlockEvidence> {
    const symbol = symbolInput.toUpperCase().trim();
    const result = await this.http.requestJson('/api/coin/unlock-list?per_page=100&page=1');
    if (result.status !== 'READY') {
      return Object.freeze({
        contractVersion: COINGLASS_EVIDENCE_CONTRACT_VERSION,
        status: result.status === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'SOURCE_UNAVAILABLE',
        symbol,
        retrievedAt: result.retrievedAt,
        evidenceRef: null,
        nextUnlockAt: null,
        nextUnlockTokens: null,
        nextUnlockOfCirculatingPct: null,
        nextUnlockOfSupplyPct: null,
        totalLockedTokens: null,
        reason: result.reason,
      });
    }

    const row = arrayData(result.data).find((entry) => String(entry.symbol).toUpperCase() === symbol);
    if (!row) {
      return Object.freeze({
        contractVersion: COINGLASS_EVIDENCE_CONTRACT_VERSION,
        status: 'SOURCE_UNAVAILABLE',
        symbol,
        retrievedAt: result.retrievedAt,
        evidenceRef: null,
        nextUnlockAt: null,
        nextUnlockTokens: null,
        nextUnlockOfCirculatingPct: null,
        nextUnlockOfSupplyPct: null,
        totalLockedTokens: null,
        reason: 'CoinGlass unlock list has no exact symbol match.',
      });
    }

    const nextUnlockMs = finite(row.next_unlock_date);
    return Object.freeze({
      contractVersion: COINGLASS_EVIDENCE_CONTRACT_VERSION,
      status: 'VERIFIED',
      symbol,
      retrievedAt: result.retrievedAt,
      evidenceRef: `coinglass:unlock:${symbol}:${result.retrievedAt}`,
      nextUnlockAt: nextUnlockMs === null ? null : new Date(nextUnlockMs).toISOString(),
      nextUnlockTokens: finite(row.next_unlock_tokens),
      nextUnlockOfCirculatingPct: finite(row.next_unlock_of_circulating),
      nextUnlockOfSupplyPct: finite(row.next_unlock_of_supply),
      totalLockedTokens: finite(row.total_locked),
    });
  }
}
