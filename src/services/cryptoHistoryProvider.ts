export interface VerifiedCryptoHistoryPoint {
  date: string; // YYYY-MM-DD
  close: number;
}

export interface VerifiedCryptoHistory {
  points: VerifiedCryptoHistoryPoint[];
  provider: 'CoinGecko';
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

const cache = new Map<string, CacheEntry>();
const circuits = new Map<string, CircuitState>();

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function stateFor(providerKey: string): CircuitState {
  let state = circuits.get(providerKey);
  if (!state) {
    state = { consecutiveFailures: 0, openUntilMs: 0 };
    circuits.set(providerKey, state);
  }
  return state;
}

async function fetchJsonWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  timeoutMs: number,
): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'CAPITAL-AI/0.6.1' },
    });
    if (!response.ok) {
      const error = new Error(`CoinGecko HTTP ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Server-side verified history provider for financial scoring.
 *
 * No simulated history is ever returned. Transient provider failures use bounded retries with
 * exponential backoff + jitter. After repeated failed calls a small in-memory circuit breaker
 * opens. A previously verified response may be used as Last-Known-Good; its market timestamp
 * is still validated later by the scoring DataQualityGate, so this cannot turn old data into
 * apparently fresh evidence.
 */
export async function getVerifiedCryptoHistory(
  symbol: string,
  days = 30,
  options: CryptoHistoryProviderOptions = {},
): Promise<VerifiedCryptoHistory | null> {
  const s = symbol.toUpperCase().trim();
  const id = COINGECKO_IDS[s];
  if (!id) return null;

  const fetchImpl = options.fetchImpl ?? fetch;
  const nowMs = options.nowMs ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000;
  const circuitFailureThreshold = Math.max(1, options.circuitFailureThreshold ?? 3);
  const circuitCooldownMs = options.circuitCooldownMs ?? 60_000;

  const boundedDays = Math.min(Math.max(days, 20), 365);
  const key = `${s}:${boundedDays}`;
  const providerKey = 'CoinGecko';
  const now = nowMs();
  const cached = cache.get(key);

  if (cached && now - cached.cachedAtMs <= cacheTtlMs) {
    return { ...cached.value, cacheMode: 'cache-hit', degraded: false };
  }

  const circuit = stateFor(providerKey);
  if (circuit.openUntilMs > now) {
    return cached ? { ...cached.value, cacheMode: 'last-known-good', degraded: true } : null;
  }

  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${boundedDays}&interval=daily`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const data = await fetchJsonWithTimeout(fetchImpl, url, timeoutMs);
      const prices: [number, number][] = data?.prices;
      if (!Array.isArray(prices) || prices.length < 20) {
        throw new Error('CoinGecko returned insufficient history points.');
      }

      const points = prices
        .filter((item) => Array.isArray(item) && Number.isFinite(item[0]) && Number.isFinite(item[1]))
        .map(([timestampMs, close]) => ({
          date: new Date(timestampMs).toISOString().slice(0, 10),
          close: Number(close),
        }));

      if (points.length < 20) {
        throw new Error('CoinGecko history contained insufficient valid observations.');
      }

      const value = {
        points,
        provider: 'CoinGecko' as const,
        retrievedAt: new Date(nowMs()).toISOString(),
      };
      cache.set(key, { value, cachedAtMs: nowMs() });
      circuit.consecutiveFailures = 0;
      circuit.openUntilMs = 0;
      return { ...value, cacheMode: 'fresh', degraded: false };
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

  if (lastError) {
    console.warn(`[CryptoHistoryProvider] ${s}: verified CoinGecko history unavailable after ${maxAttempts} attempts.`, (lastError as Error)?.message || lastError);
  }

  return cached ? { ...cached.value, cacheMode: 'last-known-good', degraded: true } : null;
}

/** Test-only reset for deterministic unit tests. */
export function resetCryptoHistoryProviderState(): void {
  cache.clear();
  circuits.clear();
}
