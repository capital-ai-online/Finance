import {
  rankMarketDataProviders,
  recordMarketDataProviderOutcome,
  type MarketDataProviderDescriptor,
} from './marketDataProviderRouter';
import { MARKET_DATA_PROVIDER_REGISTRY } from './marketDataProviderRegistry';

export interface VerifiedCryptoHistoryPoint {
  date: string; // YYYY-MM-DD
  close: number;
}

export type VerifiedCryptoHistoryProvider = 'CoinGecko' | 'Binance' | 'Kraken';

export interface VerifiedCryptoHistory {
  points: VerifiedCryptoHistoryPoint[];
  provider: VerifiedCryptoHistoryProvider;
  retrievedAt: string;
  cacheMode: 'fresh' | 'cache-hit' | 'last-known-good';
  degraded: boolean;
}

interface CacheEntry {
  value: Omit<VerifiedCryptoHistory, 'cacheMode' | 'degraded'>;
  cachedAtMs: number;
}

interface CircuitState {
  consecutiveFailures: number;
  openUntilMs: number;
}

export interface CryptoHistoryProviderOptions {
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  timeoutMs?: number;
  maxAttempts?: number;
  cacheTtlMs?: number;
  circuitFailureThreshold?: number;
  circuitCooldownMs?: number;
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', ADA: 'cardano', XRP: 'ripple', DOT: 'polkadot',
  AVAX: 'avalanche-2', LINK: 'chainlink', BNB: 'binancecoin', MATIC: 'matic-network',
  DOGE: 'dogecoin', SHIB: 'shiba-inu',
};

const BINANCE_SYMBOLS: Record<string, string> = {
  BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT', ADA: 'ADAUSDT', XRP: 'XRPUSDT', DOT: 'DOTUSDT',
  AVAX: 'AVAXUSDT', LINK: 'LINKUSDT', BNB: 'BNBUSDT', MATIC: 'MATICUSDT', DOGE: 'DOGEUSDT', SHIB: 'SHIBUSDT',
};

const KRAKEN_SYMBOLS: Record<string, string> = {
  BTC: 'XBTUSD', ETH: 'ETHUSD', SOL: 'SOLUSD', ADA: 'ADAUSD', XRP: 'XRPUSD', DOT: 'DOTUSD',
  AVAX: 'AVAXUSD', LINK: 'LINKUSD', DOGE: 'DOGEUSD', SHIB: 'SHIBUSD',
};

const cache = new Map<string, CacheEntry>();
const circuits = new Map<VerifiedCryptoHistoryProvider, CircuitState>();
const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function stateFor(provider: VerifiedCryptoHistoryProvider): CircuitState {
  let state = circuits.get(provider);
  if (!state) {
    state = { consecutiveFailures: 0, openUntilMs: 0 };
    circuits.set(provider, state);
  }
  return state;
}

async function fetchResponseWithTimeout(fetchImpl: typeof fetch, url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'CAPITAL-AI/0.6.3' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePoints(points: VerifiedCryptoHistoryPoint[]): VerifiedCryptoHistoryPoint[] {
  const deduplicated = new Map<string, number>();
  for (const point of points) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(point.date) && Number.isFinite(point.close) && point.close > 0) {
      deduplicated.set(point.date, point.close);
    }
  }
  return [...deduplicated.entries()]
    .map(([date, close]) => ({ date, close }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchCoinGecko(
  symbol: string,
  days: number,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<VerifiedCryptoHistoryPoint[]> {
  const id = COINGECKO_IDS[symbol];
  if (!id) throw new Error(`CoinGecko mapping unavailable for ${symbol}.`);
  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
  const response = await fetchResponseWithTimeout(fetchImpl, url, timeoutMs);
  const data: any = await response.json();
  const prices: [number, number][] = data?.prices;
  if (!Array.isArray(prices)) throw new Error('CoinGecko returned no prices array.');
  return normalizePoints(prices.map(([timestampMs, close]) => ({
    date: new Date(timestampMs).toISOString().slice(0, 10),
    close: Number(close),
  })));
}

async function fetchBinance(
  symbol: string,
  days: number,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<VerifiedCryptoHistoryPoint[]> {
  const market = BINANCE_SYMBOLS[symbol];
  if (!market) throw new Error(`Binance mapping unavailable for ${symbol}.`);
  const url = `https://api.binance.com/api/v3/klines?symbol=${market}&interval=1d&limit=${Math.min(Math.max(days, 20), 365)}`;
  const response = await fetchResponseWithTimeout(fetchImpl, url, timeoutMs);
  const data: any = await response.json();
  if (!Array.isArray(data)) throw new Error('Binance returned no kline array.');
  return normalizePoints(data.map((item: any[]) => ({
    date: new Date(Number(item?.[0])).toISOString().slice(0, 10),
    close: Number(item?.[4]),
  })));
}

async function fetchKraken(
  symbol: string,
  days: number,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<VerifiedCryptoHistoryPoint[]> {
  const pair = KRAKEN_SYMBOLS[symbol];
  if (!pair) throw new Error(`Kraken mapping unavailable for ${symbol}.`);
  const since = Math.floor((Date.now() - Math.min(Math.max(days, 20), 365) * 24 * 60 * 60 * 1000) / 1000);
  const url = `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=1440&since=${since}`;
  const response = await fetchResponseWithTimeout(fetchImpl, url, timeoutMs);
  const data: any = await response.json();
  if (Array.isArray(data?.error) && data.error.length > 0) throw new Error(`Kraken: ${data.error.join(', ')}`);
  const result = data?.result;
  const rows = result && typeof result === 'object'
    ? Object.entries(result).find(([key, value]) => key !== 'last' && Array.isArray(value))?.[1]
    : undefined;
  if (!Array.isArray(rows)) throw new Error('Kraken returned no OHLC rows.');
  return normalizePoints(rows.map((item: any[]) => ({
    date: new Date(Number(item?.[0]) * 1000).toISOString().slice(0, 10),
    close: Number(item?.[4]),
  })));
}

const providerFetchers: Array<{
  provider: VerifiedCryptoHistoryProvider;
  fetcher: (symbol: string, days: number, fetchImpl: typeof fetch, timeoutMs: number) => Promise<VerifiedCryptoHistoryPoint[]>;
}> = [
  { provider: 'CoinGecko', fetcher: fetchCoinGecko },
  { provider: 'Binance', fetcher: fetchBinance },
  { provider: 'Kraken', fetcher: fetchKraken },
];

function getRankedCryptoHistoryCandidates(nowMs: number) {
  const descriptors = providerFetchers.map(candidate => {
    const registry = MARKET_DATA_PROVIDER_REGISTRY.find(entry => entry.id === candidate.provider);
    const descriptor: MarketDataProviderDescriptor = registry ?? {
      id: candidate.provider,
      assetClasses: ['crypto'],
      capabilities: ['history'],
      basePriority: candidate.provider === 'CoinGecko' ? 1 : candidate.provider === 'Binance' ? 2 : 3,
      enabled: true,
    };
    return { candidate, descriptor };
  });
  const ranked = rankMarketDataProviders(descriptors.map(item => item.descriptor), {
    nowMs,
    assetClass: 'crypto',
    capability: 'history',
  });
  return ranked
    .map(item => descriptors.find(candidate => candidate.descriptor.id === item.provider.id)?.candidate)
    .filter((candidate): candidate is (typeof providerFetchers)[number] => Boolean(candidate));
}

/**
 * Server-side verified crypto history with adaptive provider routing.
 *
 * No simulated history is ever returned. Governance base-priority still prefers CoinGecko, but
 * observed failures/cooldowns/latency can move Binance or Kraken ahead temporarily. This behaves
 * like an application-level market-data load balancer while preserving provider provenance.
 */
export async function getVerifiedCryptoHistory(
  symbol: string,
  days = 30,
  options: CryptoHistoryProviderOptions = {},
): Promise<VerifiedCryptoHistory | null> {
  const s = symbol.toUpperCase().trim();
  if (!COINGECKO_IDS[s] && !BINANCE_SYMBOLS[s] && !KRAKEN_SYMBOLS[s]) return null;

  const fetchImpl = options.fetchImpl ?? fetch;
  const nowMs = options.nowMs ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 2);
  const cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000;
  const circuitFailureThreshold = Math.max(1, options.circuitFailureThreshold ?? 3);
  const circuitCooldownMs = options.circuitCooldownMs ?? 60_000;
  const boundedDays = Math.min(Math.max(days, 20), 365);
  const key = `${s}:${boundedDays}`;
  const now = nowMs();
  const cached = cache.get(key);

  if (cached && now - cached.cachedAtMs <= cacheTtlMs) {
    return { ...cached.value, cacheMode: 'cache-hit', degraded: false };
  }

  const failures: string[] = [];
  const candidates = getRankedCryptoHistoryCandidates(now);
  for (const candidate of candidates) {
    const circuit = stateFor(candidate.provider);
    if (circuit.openUntilMs > now) {
      failures.push(`${candidate.provider}: circuit open`);
      recordMarketDataProviderOutcome({ provider: candidate.provider, success: false, nowMs: now, failureCooldownMs: circuit.openUntilMs - now });
      continue;
    }

    let lastError: unknown;
    const providerStartedAt = Date.now();
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const points = await candidate.fetcher(s, boundedDays, fetchImpl, timeoutMs);
        if (points.length < 20) throw new Error(`${candidate.provider} returned only ${points.length} valid history points.`);

        const value = {
          points,
          provider: candidate.provider,
          retrievedAt: new Date(nowMs()).toISOString(),
        };
        cache.set(key, { value, cachedAtMs: nowMs() });
        circuit.consecutiveFailures = 0;
        circuit.openUntilMs = 0;
        recordMarketDataProviderOutcome({
          provider: candidate.provider,
          success: true,
          latencyMs: Math.max(0, Date.now() - providerStartedAt),
          nowMs: nowMs(),
        });
        return { ...value, cacheMode: 'fresh', degraded: candidate.provider !== 'CoinGecko' };
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          const exponential = 200 * 2 ** (attempt - 1);
          const jitter = Math.floor(random() * 100);
          await sleep(exponential + jitter);
        }
      }
    }

    circuit.consecutiveFailures += 1;
    if (circuit.consecutiveFailures >= circuitFailureThreshold) {
      circuit.openUntilMs = nowMs() + circuitCooldownMs;
    }
    recordMarketDataProviderOutcome({
      provider: candidate.provider,
      success: false,
      nowMs: nowMs(),
      failureCooldownMs: circuit.consecutiveFailures >= circuitFailureThreshold ? circuitCooldownMs : undefined,
    });
    failures.push(`${candidate.provider}: ${(lastError as Error)?.message || String(lastError)}`);
  }

  if (failures.length > 0) {
    console.warn(`[CryptoHistoryProvider] ${s}: no verified live history provider succeeded. ${failures.join(' | ')}`);
  }
  return cached ? { ...cached.value, cacheMode: 'last-known-good', degraded: true } : null;
}

/** Test-only reset for deterministic unit tests. */
export function resetCryptoHistoryProviderState(): void {
  cache.clear();
  circuits.clear();
}
