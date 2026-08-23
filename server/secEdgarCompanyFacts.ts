import { getCleanEnv } from './env';
import { recordProviderHealth } from '../src/platform/Supervisor/providerHealth';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../src/platform/MarketData/evidenceQualityContracts';

export const SEC_EDGAR_EVIDENCE_VERSION = 'sec-edgar-companyfacts-evidence/0.1.0' as const;
export const SEC_EDGAR_FUNDAMENTAL_MAX_AGE_MS = 190 * 24 * 60 * 60 * 1000;
export const SEC_EDGAR_DEFAULT_MIN_REQUEST_GAP_MS = 150;
export const SEC_EDGAR_TICKER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const SEC_EDGAR_FACTS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const SEC_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
const SEC_COMPANYFACTS_BASE = 'https://data.sec.gov/api/xbrl/companyfacts';
const ALLOWED_FORMS = new Set(['10-Q', '10-Q/A', '10-K', '10-K/A']);

export type SecEdgarRawField =
  | 'revenue'
  | 'netIncome'
  | 'operatingIncome'
  | 'currentAssets'
  | 'currentLiabilities'
  | 'shareholdersEquity'
  | 'longTermDebtCurrent'
  | 'longTermDebtNoncurrent'
  | 'interestExpense'
  | 'operatingCashFlow'
  | 'capitalExpenditure'
  | 'dividendsPaid'
  | 'shareRepurchases'
  | 'sharesOutstanding'
  | 'dilutedEps';

export type SecFactContext = 'instant' | 'periodic' | 'ytd';

interface SecMetricDescriptor {
  readonly field: SecEdgarRawField;
  readonly taxonomy: 'us-gaap' | 'dei';
  readonly tags: readonly string[];
  readonly units: readonly string[];
  readonly context: SecFactContext;
}

const METRICS: readonly SecMetricDescriptor[] = Object.freeze([
  { field: 'revenue', taxonomy: 'us-gaap', tags: ['RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet'], units: ['USD'], context: 'periodic' },
  { field: 'netIncome', taxonomy: 'us-gaap', tags: ['NetIncomeLoss', 'ProfitLoss'], units: ['USD'], context: 'periodic' },
  { field: 'operatingIncome', taxonomy: 'us-gaap', tags: ['OperatingIncomeLoss'], units: ['USD'], context: 'periodic' },
  { field: 'currentAssets', taxonomy: 'us-gaap', tags: ['AssetsCurrent'], units: ['USD'], context: 'instant' },
  { field: 'currentLiabilities', taxonomy: 'us-gaap', tags: ['LiabilitiesCurrent'], units: ['USD'], context: 'instant' },
  { field: 'shareholdersEquity', taxonomy: 'us-gaap', tags: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'], units: ['USD'], context: 'instant' },
  { field: 'longTermDebtCurrent', taxonomy: 'us-gaap', tags: ['LongTermDebtCurrent', 'LongTermDebtAndFinanceLeaseObligationsCurrent'], units: ['USD'], context: 'instant' },
  { field: 'longTermDebtNoncurrent', taxonomy: 'us-gaap', tags: ['LongTermDebtNoncurrent', 'LongTermDebtAndFinanceLeaseObligationsNoncurrent'], units: ['USD'], context: 'instant' },
  { field: 'interestExpense', taxonomy: 'us-gaap', tags: ['InterestExpenseNonOperating', 'InterestAndDebtExpense'], units: ['USD'], context: 'periodic' },
  { field: 'operatingCashFlow', taxonomy: 'us-gaap', tags: ['NetCashProvidedByUsedInOperatingActivities'], units: ['USD'], context: 'ytd' },
  { field: 'capitalExpenditure', taxonomy: 'us-gaap', tags: ['PaymentsToAcquirePropertyPlantAndEquipment'], units: ['USD'], context: 'ytd' },
  { field: 'dividendsPaid', taxonomy: 'us-gaap', tags: ['PaymentsOfDividends', 'PaymentsOfDividendsCommonStock'], units: ['USD'], context: 'ytd' },
  { field: 'shareRepurchases', taxonomy: 'us-gaap', tags: ['PaymentsForRepurchaseOfCommonStock'], units: ['USD'], context: 'ytd' },
  { field: 'sharesOutstanding', taxonomy: 'dei', tags: ['EntityCommonStockSharesOutstanding'], units: ['shares'], context: 'instant' },
  { field: 'dilutedEps', taxonomy: 'us-gaap', tags: ['EarningsPerShareDiluted'], units: ['USD/shares', 'USD-per-shares'], context: 'periodic' },
]);

interface SecTickerRow {
  readonly cik_str: number;
  readonly ticker: string;
  readonly title: string;
}

interface SecFactUnitRow {
  readonly start?: string;
  readonly end?: string;
  readonly val?: number;
  readonly accn?: string;
  readonly fy?: number;
  readonly fp?: string;
  readonly form?: string;
  readonly filed?: string;
  readonly frame?: string;
}

interface SelectedFact {
  readonly taxonomy: string;
  readonly tag: string;
  readonly unit: string;
  readonly context: SecFactContext;
  readonly tagPriority: number;
  readonly unitPriority: number;
  readonly row: SecFactUnitRow;
}

export interface SecEdgarFactEvidence {
  readonly field: SecEdgarRawField;
  readonly value: number;
  readonly unit: string;
  readonly taxonomy: string;
  readonly tag: string;
  readonly context: SecFactContext;
  readonly periodStart: string | null;
  readonly periodEnd: string;
  readonly filedAt: string;
  readonly form: string;
  readonly accession: string;
  readonly frame: string | null;
  readonly evidence: MarketEvidenceQualityRecord;
}

export type SecEdgarCompanyFactsStatus = 'READY' | 'PARTIAL' | 'STALE' | 'SOURCE_UNAVAILABLE';

export interface SecEdgarCompanyFactsResult {
  readonly contractVersion: typeof SEC_EDGAR_EVIDENCE_VERSION;
  readonly status: SecEdgarCompanyFactsStatus;
  readonly symbol: string;
  readonly cik: string | null;
  readonly entityName: string | null;
  readonly evaluatedAt: string;
  readonly retrievedAt: string | null;
  readonly facts: Readonly<Partial<Record<SecEdgarRawField, SecEdgarFactEvidence>>>;
  readonly missingFields: readonly SecEdgarRawField[];
  readonly staleFields: readonly SecEdgarRawField[];
  readonly reason?: string;
  readonly scoreEligible: false;
  readonly executionEligible: false;
}

export interface SecEdgarAdapterOptions {
  readonly fetchImpl?: typeof fetch;
  readonly nowMs?: () => number;
  readonly userAgent?: string;
  readonly minRequestGapMs?: number;
  readonly requestTimeoutMs?: number;
  readonly tickerCacheTtlMs?: number;
  readonly factsCacheTtlMs?: number;
}

interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
  readonly retrievedAt: string;
}

function isoDay(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const iso = `${value}T00:00:00.000Z`;
  return Number.isFinite(Date.parse(iso)) ? iso : null;
}

function finiteValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function padCik(value: number | string): string {
  return String(value).replace(/\D/g, '').padStart(10, '0');
}

function durationDays(row: SecFactUnitRow): number | null {
  const start = isoDay(row.start);
  const end = isoDay(row.end);
  if (!start || !end) return null;
  const duration = (Date.parse(end) - Date.parse(start)) / 86_400_000;
  return Number.isFinite(duration) && duration >= 0 ? duration : null;
}

function contextRank(candidate: SelectedFact): number {
  const duration = durationDays(candidate.row);
  if (candidate.context === 'instant') return duration === null ? 0 : 100_000 + duration;
  if (duration === null) return 90_000;
  if (candidate.context === 'ytd') return -duration;

  const annual = candidate.row.form === '10-K' || candidate.row.form === '10-K/A';
  const target = annual ? 365 : 91;
  const frameBonus = candidate.row.frame ? -5 : 0;
  return Math.abs(duration - target) + frameBonus;
}

function compareCandidates(a: SelectedFact, b: SelectedFact): number {
  const filed = String(b.row.filed).localeCompare(String(a.row.filed));
  if (filed !== 0) return filed;
  const end = String(b.row.end).localeCompare(String(a.row.end));
  if (end !== 0) return end;
  const accession = String(b.row.accn).localeCompare(String(a.row.accn));
  if (accession !== 0) return accession;
  const context = contextRank(a) - contextRank(b);
  if (context !== 0) return context;
  if (a.tagPriority !== b.tagPriority) return a.tagPriority - b.tagPriority;
  return a.unitPriority - b.unitPriority;
}

function latestFact(body: any, descriptor: SecMetricDescriptor, asOfMs: number): SelectedFact | null {
  const candidates: SelectedFact[] = [];
  descriptor.tags.forEach((tag, tagPriority) => {
    const concept = body?.facts?.[descriptor.taxonomy]?.[tag];
    if (!concept?.units || typeof concept.units !== 'object') return;
    descriptor.units.forEach((unit, unitPriority) => {
      const rows = concept.units[unit];
      if (!Array.isArray(rows)) return;
      for (const row of rows as SecFactUnitRow[]) {
        if (!finiteValue(row.val) || !row.accn || !row.form || !row.filed || !row.end) continue;
        if (!ALLOWED_FORMS.has(row.form)) continue;
        const filedAt = isoDay(row.filed);
        const periodEnd = isoDay(row.end);
        if (!filedAt || !periodEnd || Date.parse(filedAt) > asOfMs) continue;
        candidates.push({ taxonomy: descriptor.taxonomy, tag, unit, context: descriptor.context, tagPriority, unitPriority, row });
      }
    });
  });
  candidates.sort(compareCandidates);
  return candidates[0] ?? null;
}

function sourceFailure(symbol: string, evaluatedAt: string, reason: string, cik: string | null = null): SecEdgarCompanyFactsResult {
  return Object.freeze({
    contractVersion: SEC_EDGAR_EVIDENCE_VERSION,
    status: 'SOURCE_UNAVAILABLE' as const,
    symbol,
    cik,
    entityName: null,
    evaluatedAt,
    retrievedAt: null,
    facts: Object.freeze({}),
    missingFields: Object.freeze(METRICS.map(metric => metric.field)),
    staleFields: Object.freeze([]),
    reason,
    scoreEligible: false as const,
    executionEligible: false as const,
  });
}

export class SecEdgarCompanyFactsAdapter {
  private readonly fetchImpl: typeof fetch;
  private readonly nowMs: () => number;
  private readonly userAgent: string;
  private readonly minRequestGapMs: number;
  private readonly requestTimeoutMs: number;
  private readonly tickerCacheTtlMs: number;
  private readonly factsCacheTtlMs: number;
  private tickerCache: CacheEntry<Map<string, SecTickerRow>> | null = null;
  private readonly factsCache = new Map<string, CacheEntry<any>>();
  private requestQueue: Promise<void> = Promise.resolve();
  private lastRequestStartedAt = 0;

  constructor(options: SecEdgarAdapterOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.nowMs = options.nowMs ?? Date.now;
    this.userAgent = (options.userAgent ?? getCleanEnv('SEC_EDGAR_USER_AGENT')).trim();
    this.minRequestGapMs = Math.max(0, options.minRequestGapMs ?? SEC_EDGAR_DEFAULT_MIN_REQUEST_GAP_MS);
    this.requestTimeoutMs = Math.max(1000, options.requestTimeoutMs ?? 8000);
    this.tickerCacheTtlMs = Math.max(60_000, options.tickerCacheTtlMs ?? SEC_EDGAR_TICKER_CACHE_TTL_MS);
    this.factsCacheTtlMs = Math.max(60_000, options.factsCacheTtlMs ?? SEC_EDGAR_FACTS_CACHE_TTL_MS);
  }

  private async requestJson(url: string): Promise<{ body: any; retrievedAt: string }> {
    if (!this.userAgent) throw new Error('SEC_EDGAR_USER_AGENT_NOT_CONFIGURED');

    let release!: () => void;
    const previous = this.requestQueue;
    this.requestQueue = new Promise<void>((resolve) => { release = resolve; });
    await previous;

    try {
      const waitMs = Math.max(0, this.minRequestGapMs - (this.nowMs() - this.lastRequestStartedAt));
      if (waitMs > 0) await new Promise(resolve => setTimeout(resolve, waitMs));
      this.lastRequestStartedAt = this.nowMs();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
      try {
        const response = await this.fetchImpl(url, {
          headers: { Accept: 'application/json', 'User-Agent': this.userAgent },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`SEC_EDGAR_HTTP_${response.status}`);
        return { body: await response.json(), retrievedAt: new Date(this.nowMs()).toISOString() };
      } finally {
        clearTimeout(timeout);
      }
    } finally {
      release();
    }
  }

  private async tickerMap(): Promise<CacheEntry<Map<string, SecTickerRow>>> {
    const now = this.nowMs();
    if (this.tickerCache && this.tickerCache.expiresAt > now) return this.tickerCache;
    const response = await this.requestJson(SEC_TICKERS_URL);
    const map = new Map<string, SecTickerRow>();
    for (const row of Object.values(response.body ?? {}) as SecTickerRow[]) {
      if (!row || typeof row.ticker !== 'string' || !Number.isFinite(row.cik_str)) continue;
      map.set(row.ticker.toUpperCase().trim(), row);
    }
    this.tickerCache = { value: map, retrievedAt: response.retrievedAt, expiresAt: now + this.tickerCacheTtlMs };
    return this.tickerCache;
  }

  private async companyFacts(cik: string): Promise<CacheEntry<any>> {
    const now = this.nowMs();
    const cached = this.factsCache.get(cik);
    if (cached && cached.expiresAt > now) return cached;
    const response = await this.requestJson(`${SEC_COMPANYFACTS_BASE}/CIK${cik}.json`);
    const entry = { value: response.body, retrievedAt: response.retrievedAt, expiresAt: now + this.factsCacheTtlMs };
    this.factsCache.set(cik, entry);
    return entry;
  }

  async fetchEvidence(input: { symbol: string; asOf?: string }): Promise<SecEdgarCompanyFactsResult> {
    const symbol = input.symbol.toUpperCase().trim();
    const evaluatedAt = input.asOf && Number.isFinite(Date.parse(input.asOf))
      ? new Date(input.asOf).toISOString()
      : new Date(this.nowMs()).toISOString();
    const asOfMs = Date.parse(evaluatedAt);

    try {
      const tickers = await this.tickerMap();
      const ticker = tickers.value.get(symbol);
      if (!ticker) {
        recordProviderHealth({
          provider: 'SEC-EDGAR', capability: 'stock-companyfacts', state: 'unavailable',
          diagnosticCode: 'provider_error', payloadUsable: false,
          message: `No SEC ticker/CIK association available for ${symbol}.`,
        });
        return sourceFailure(symbol, evaluatedAt, 'SEC_TICKER_CIK_MAPPING_UNAVAILABLE');
      }

      const cik = padCik(ticker.cik_str);
      const companyFacts = await this.companyFacts(cik);
      const facts: Partial<Record<SecEdgarRawField, SecEdgarFactEvidence>> = {};
      const missingFields: SecEdgarRawField[] = [];
      const staleFields: SecEdgarRawField[] = [];

      for (const descriptor of METRICS) {
        const selected = latestFact(companyFacts.value, descriptor, asOfMs);
        if (!selected) {
          missingFields.push(descriptor.field);
          continue;
        }
        const filedAt = isoDay(selected.row.filed)!;
        const periodEnd = isoDay(selected.row.end)!;
        const periodStart = isoDay(selected.row.start);
        const ageMs = Math.max(0, asOfMs - Date.parse(filedAt));
        const qualityStatus = ageMs <= SEC_EDGAR_FUNDAMENTAL_MAX_AGE_MS ? 'VERIFIED' : 'STALE';
        const evidenceRef = `sec-edgar:${cik}:${selected.row.accn}:${selected.taxonomy}:${selected.tag}:${selected.row.end}`;
        if (qualityStatus === 'STALE') staleFields.push(descriptor.field);

        facts[descriptor.field] = Object.freeze({
          field: descriptor.field,
          value: selected.row.val!,
          unit: selected.unit,
          taxonomy: selected.taxonomy,
          tag: selected.tag,
          context: selected.context,
          periodStart,
          periodEnd,
          filedAt,
          form: selected.row.form!,
          accession: selected.row.accn!,
          frame: selected.row.frame ?? null,
          evidence: Object.freeze({
            assetId: `stock:${symbol}`,
            providerId: 'sec-edgar',
            capability: 'companyfacts',
            field: descriptor.field,
            observedAt: filedAt,
            retrievedAt: companyFacts.retrievedAt,
            freshness: { ageMs, maxAgeMs: SEC_EDGAR_FUNDAMENTAL_MAX_AGE_MS, evaluatedAt },
            contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
            qualityStatus,
            evidenceRef,
          }),
        });
      }

      const verifiedCount = Object.values(facts).filter(fact => fact?.evidence.qualityStatus === 'VERIFIED').length;
      const coreFields: readonly SecEdgarRawField[] = [
        'revenue', 'netIncome', 'operatingCashFlow', 'currentAssets', 'currentLiabilities', 'shareholdersEquity',
      ];
      const verifiedCore = coreFields.filter(field => facts[field]?.evidence.qualityStatus === 'VERIFIED').length;
      const status: SecEdgarCompanyFactsStatus = verifiedCore === coreFields.length
        ? 'READY'
        : verifiedCount > 0
          ? 'PARTIAL'
          : staleFields.length > 0
            ? 'STALE'
            : 'SOURCE_UNAVAILABLE';

      recordProviderHealth({
        provider: 'SEC-EDGAR',
        capability: 'stock-companyfacts',
        state: status === 'READY' ? 'healthy' : status === 'PARTIAL' || status === 'STALE' ? 'degraded' : 'unavailable',
        diagnosticCode: status === 'STALE' ? 'stale' : status === 'SOURCE_UNAVAILABLE' ? 'provider_error' : 'healthy',
        payloadUsable: verifiedCount > 0,
        cacheMode: 'bounded-json-cache',
        message: `${status}: ${verifiedCount} verified SEC CompanyFacts fields for ${symbol}.`,
      });

      return Object.freeze({
        contractVersion: SEC_EDGAR_EVIDENCE_VERSION,
        status,
        symbol,
        cik,
        entityName: typeof companyFacts.value?.entityName === 'string' ? companyFacts.value.entityName : ticker.title,
        evaluatedAt,
        retrievedAt: companyFacts.retrievedAt,
        facts: Object.freeze({ ...facts }),
        missingFields: Object.freeze([...missingFields]),
        staleFields: Object.freeze([...staleFields]),
        scoreEligible: false as const,
        executionEligible: false as const,
      });
    } catch (error) {
      recordProviderHealth({
        provider: 'SEC-EDGAR', capability: 'stock-companyfacts', state: 'unavailable',
        diagnosticCode: error instanceof Error && error.message === 'SEC_EDGAR_USER_AGENT_NOT_CONFIGURED'
          ? 'not_configured'
          : 'transport_error',
        payloadUsable: false,
        message: error instanceof Error ? error.message : String(error),
      });
      return sourceFailure(symbol, evaluatedAt, error instanceof Error ? error.message : 'SEC_EDGAR_UNKNOWN_ERROR');
    }
  }
}
