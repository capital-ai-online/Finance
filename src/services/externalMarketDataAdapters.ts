export type ExternalMarketDataProvider = 'CoinAPI' | 'EODHD' | 'TwelveData';
export type ExternalHistoryAssetClass = 'crypto' | 'stock' | 'forex' | 'index';

export interface ExternalHistoryPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface ExternalHistoryResult {
  provider: ExternalMarketDataProvider;
  points: ExternalHistoryPoint[];
  sourcePath: string;
  retrievedAt: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface ExternalHistoryRequest {
  symbol: string;
  assetClass: ExternalHistoryAssetClass;
  days?: number;
}

export interface ExternalAdapterOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  apiKeys?: Partial<Record<ExternalMarketDataProvider, string>>;
}

const COINAPI_SYMBOLS: Record<string, string> = {
  BTC: 'COINBASE_SPOT_BTC_USD',
  ETH: 'COINBASE_SPOT_ETH_USD',
  SOL: 'COINBASE_SPOT_SOL_USD',
  ADA: 'COINBASE_SPOT_ADA_USD',
  XRP: 'COINBASE_SPOT_XRP_USD',
  DOT: 'COINBASE_SPOT_DOT_USD',
  AVAX: 'COINBASE_SPOT_AVAX_USD',
  LINK: 'COINBASE_SPOT_LINK_USD',
  DOGE: 'COINBASE_SPOT_DOGE_USD',
};

function configuredKey(provider: ExternalMarketDataProvider, options: ExternalAdapterOptions): string | undefined {
  const explicit = options.apiKeys?.[provider];
  if (explicit) return explicit;
  if (provider === 'CoinAPI') return process.env.COIN_API_KEY;
  if (provider === 'EODHD') return process.env.EODHD_API_KEY;
  return process.env.TWELVEDATA_API_KEY;
}

function normalizedDays(days?: number): number {
  return Math.min(Math.max(days ?? 30, 20), 365);
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const isoDay = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return isoDay;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function finitePositive(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function finiteNonNegative(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function normalizePoints(points: ExternalHistoryPoint[]): ExternalHistoryPoint[] {
  const byDate = new Map<string, ExternalHistoryPoint>();
  for (const point of points) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date) || !Number.isFinite(point.close) || point.close <= 0) continue;
    byDate.set(point.date, point);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchJson(
  url: string,
  init: RequestInit,
  options: ExternalAdapterOptions,
): Promise<any> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5_000);
  try {
    const response = await fetchImpl(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function toTwelveSymbol(symbol: string, assetClass: ExternalHistoryAssetClass): string {
  const s = symbol.toUpperCase().trim();
  if (assetClass === 'crypto') return s.includes('/') ? s : `${s}/USD`;
  if (assetClass === 'forex') {
    if (s.includes('/')) return s;
    if (s.length === 6) return `${s.slice(0, 3)}/${s.slice(3)}`;
  }
  return s;
}

function toEodhdSymbol(symbol: string, assetClass: ExternalHistoryAssetClass): string | null {
  const s = symbol.toUpperCase().trim();
  if (assetClass === 'crypto') return `${s.replace('/USD', '').replace('-USD', '')}-USD.CC`;
  if (assetClass === 'forex') return `${s.replace('/', '').replace('-', '')}.FOREX`;
  if (assetClass === 'stock') return s.includes('.') ? s : `${s}.US`;
  return null;
}

async function fetchCoinApiHistory(request: ExternalHistoryRequest, options: ExternalAdapterOptions): Promise<ExternalHistoryResult> {
  if (request.assetClass !== 'crypto') throw new Error('CoinAPI adapter currently supports crypto history only.');
  const key = configuredKey('CoinAPI', options);
  if (!key) throw new Error('COIN_API_KEY is not configured.');
  const symbol = request.symbol.toUpperCase().trim();
  const symbolId = COINAPI_SYMBOLS[symbol];
  if (!symbolId) throw new Error(`CoinAPI symbol mapping unavailable for ${symbol}.`);
  const days = normalizedDays(request.days);
  const now = options.nowMs?.() ?? Date.now();
  const timeStart = new Date(now - days * 86_400_000).toISOString();
  const url = `https://rest.coinapi.io/v1/ohlcv/${encodeURIComponent(symbolId)}/history?period_id=1DAY&time_start=${encodeURIComponent(timeStart)}&limit=${days + 5}`;
  const rows = await fetchJson(url, {
    headers: { Accept: 'application/json', 'X-CoinAPI-Key': key, 'User-Agent': 'CAPITAL-AI/0.6.3' },
  }, options);
  if (!Array.isArray(rows)) throw new Error('CoinAPI returned no OHLCV array.');
  const points = normalizePoints(rows.map((row: any) => ({
    date: normalizeDate(row?.time_period_start) ?? '',
    open: finitePositive(row?.price_open),
    high: finitePositive(row?.price_high),
    low: finitePositive(row?.price_low),
    close: finitePositive(row?.price_close) ?? 0,
    volume: finiteNonNegative(row?.volume_traded),
  })));
  return {
    provider: 'CoinAPI',
    points,
    sourcePath: `https://rest.coinapi.io/v1/ohlcv/${symbolId}/history`,
    retrievedAt: new Date(options.nowMs?.() ?? Date.now()).toISOString(),
    metadata: { symbolId, periodId: '1DAY' },
  };
}

async function fetchTwelveDataHistory(request: ExternalHistoryRequest, options: ExternalAdapterOptions): Promise<ExternalHistoryResult> {
  const key = configuredKey('TwelveData', options);
  if (!key) throw new Error('TWELVEDATA_API_KEY is not configured.');
  const days = normalizedDays(request.days);
  const providerSymbol = toTwelveSymbol(request.symbol, request.assetClass);
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(providerSymbol)}&interval=1day&outputsize=${days}`;
  const data = await fetchJson(url, {
    headers: { Accept: 'application/json', Authorization: `apikey ${key}`, 'User-Agent': 'CAPITAL-AI/0.6.3' },
  }, options);
  if (data?.status === 'error') throw new Error(`Twelve Data: ${data?.message || 'provider error'}`);
  if (!Array.isArray(data?.values)) throw new Error('Twelve Data returned no time_series values.');
  const points = normalizePoints(data.values.map((row: any) => ({
    date: normalizeDate(row?.datetime) ?? '',
    open: finitePositive(row?.open),
    high: finitePositive(row?.high),
    low: finitePositive(row?.low),
    close: finitePositive(row?.close) ?? 0,
    volume: finiteNonNegative(row?.volume),
  })));
  return {
    provider: 'TwelveData',
    points,
    sourcePath: 'https://api.twelvedata.com/time_series',
    retrievedAt: new Date(options.nowMs?.() ?? Date.now()).toISOString(),
    metadata: {
      symbol: String(data?.meta?.symbol ?? providerSymbol),
      exchange: data?.meta?.exchange,
      currency: data?.meta?.currency,
      timezone: data?.meta?.exchange_timezone,
      micCode: data?.meta?.mic_code,
      type: data?.meta?.type,
    },
  };
}

async function fetchEodhdHistory(request: ExternalHistoryRequest, options: ExternalAdapterOptions): Promise<ExternalHistoryResult> {
  const key = configuredKey('EODHD', options);
  if (!key) throw new Error('EODHD_API_KEY is not configured.');
  const providerSymbol = toEodhdSymbol(request.symbol, request.assetClass);
  if (!providerSymbol) throw new Error(`EODHD mapping for ${request.assetClass} is not enabled for ${request.symbol}.`);
  const days = normalizedDays(request.days);
  const now = options.nowMs?.() ?? Date.now();
  const from = new Date(now - (days + 10) * 86_400_000).toISOString().slice(0, 10);
  const url = `https://eodhd.com/api/eod/${encodeURIComponent(providerSymbol)}?api_token=${encodeURIComponent(key)}&fmt=json&period=d&order=a&from=${from}`;
  const rows = await fetchJson(url, { headers: { Accept: 'application/json', 'User-Agent': 'CAPITAL-AI/0.6.3' } }, options);
  if (!Array.isArray(rows)) throw new Error('EODHD returned no EOD array.');
  const points = normalizePoints(rows.map((row: any) => ({
    date: normalizeDate(row?.date) ?? '',
    open: finitePositive(row?.open),
    high: finitePositive(row?.high),
    low: finitePositive(row?.low),
    close: finitePositive(row?.adjusted_close) ?? finitePositive(row?.close) ?? 0,
    volume: finiteNonNegative(row?.volume),
  }))).slice(-days);
  return {
    provider: 'EODHD',
    points,
    sourcePath: `https://eodhd.com/api/eod/${providerSymbol}`,
    retrievedAt: new Date(options.nowMs?.() ?? Date.now()).toISOString(),
    metadata: { symbol: providerSymbol, period: 'd', adjustedClosePreferred: true },
  };
}

export async function fetchExternalHistory(
  provider: ExternalMarketDataProvider,
  request: ExternalHistoryRequest,
  options: ExternalAdapterOptions = {},
): Promise<ExternalHistoryResult> {
  if (provider === 'CoinAPI') return fetchCoinApiHistory(request, options);
  if (provider === 'TwelveData') return fetchTwelveDataHistory(request, options);
  return fetchEodhdHistory(request, options);
}

export function isExternalProviderConfigured(provider: ExternalMarketDataProvider, options: ExternalAdapterOptions = {}): boolean {
  return Boolean(configuredKey(provider, options));
}
