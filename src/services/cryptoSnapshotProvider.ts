export type CryptoSnapshotField =
  | 'marketCapUsd'
  | 'volume24hUsd'
  | 'circulatingSupply'
  | 'maxSupply'
  | 'totalSupply';

export interface VerifiedFieldProvenance {
  field: CryptoSnapshotField;
  provider: 'CoinGecko';
  sourcePath: string;
  observedAt: string;
  retrievedAt: string;
  value: number | null;
  unit: 'USD' | 'token';
}

export interface VerifiedCryptoSnapshot {
  symbol: string;
  provider: 'CoinGecko';
  observedAt: string;
  retrievedAt: string;
  marketCapUsd?: number;
  volume24hUsd?: number;
  circulatingSupply?: number;
  maxSupply?: number | null;
  totalSupply?: number;
  provenance: Partial<Record<CryptoSnapshotField, VerifiedFieldProvenance>>;
  cacheMode: 'fresh' | 'cache-hit' | 'last-known-good';
  degraded: boolean;
}

interface CacheEntry {
  value: Omit<VerifiedCryptoSnapshot, 'cacheMode' | 'degraded'>;
  cachedAtMs: number;
}

interface CircuitState {
  consecutiveFailures: number;
  openUntilMs: number;
}

export interface CryptoSnapshotProviderOptions {
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
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', ADA: 'cardano', XRP: 'ripple',
  DOT: 'polkadot', AVAX: 'avalanche-2', LINK: 'chainlink', BNB: 'binancecoin',
  MATIC: 'matic-network', DOGE: 'dogecoin', SHIB: 'shiba-inu',
};

const cache = new Map<string, CacheEntry>();
const circuit: CircuitState = { consecutiveFailures: 0, openUntilMs: 0 };
const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function finitePositive(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

async function fetchJsonWithTimeout(fetchImpl: typeof fetch, url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'CAPITAL-AI/0.6.1' },
    });
    if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function buildProvenance(
  field: CryptoSnapshotField,
  value: number | null | undefined,
  sourcePath: string,
  observedAt: string,
  retrievedAt: string,
  unit: 'USD' | 'token',
): VerifiedFieldProvenance | undefined {
  if (value === undefined) return undefined;
  return { field, provider: 'CoinGecko', sourcePath, observedAt, retrievedAt, value, unit };
}

/**
 * Fetches a verified market snapshot with per-field provenance. No AssetRegistry bootstrap
 * value is used as fallback. On provider failure only a previously verified last-known-good
 * snapshot may be returned, explicitly marked degraded; freshness is enforced by the scoring gate.
 */
export async function getVerifiedCryptoSnapshot(
  symbol: string,
  options: CryptoSnapshotProviderOptions = {},
): Promise<VerifiedCryptoSnapshot | null> {
  const s = symbol.toUpperCase().trim();
  const id = COINGECKO_IDS[s];
  if (!id) return null;

  const fetchImpl = options.fetchImpl ?? fetch;
  const nowMs = options.nowMs ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const cacheTtlMs = options.cacheTtlMs ?? 2 * 60 * 1000;
  const circuitFailureThreshold = Math.max(1, options.circuitFailureThreshold ?? 3);
  const circuitCooldownMs = options.circuitCooldownMs ?? 60_000;
  const now = nowMs();
  const cached = cache.get(s);

  if (cached && now - cached.cachedAtMs <= cacheTtlMs) {
    return { ...cached.value, cacheMode: 'cache-hit', degraded: false };
  }
  if (circuit.openUntilMs > now) {
    return cached ? { ...cached.value, cacheMode: 'last-known-good', degraded: true } : null;
  }

  const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const data = await fetchJsonWithTimeout(fetchImpl, url, timeoutMs);
      const md = data?.market_data;
      if (!md || typeof md !== 'object') throw new Error('CoinGecko snapshot missing market_data.');

      const marketCapUsd = finitePositive(md?.market_cap?.usd);
      const volume24hUsd = finitePositive(md?.total_volume?.usd);
      const circulatingSupply = finitePositive(md?.circulating_supply);
      const maxSupplyRaw = md?.max_supply;
      const maxSupply = maxSupplyRaw === null ? null : finitePositive(maxSupplyRaw);
      const totalSupply = finitePositive(md?.total_supply);

      if (!marketCapUsd && !volume24hUsd && !circulatingSupply && maxSupply === undefined && !totalSupply) {
        throw new Error('CoinGecko snapshot contained no usable market fields.');
      }

      const retrievedAt = new Date(nowMs()).toISOString();
      const observedCandidate = typeof md?.last_updated === 'string' ? Date.parse(md.last_updated) : Number.NaN;
      const observedAt = Number.isFinite(observedCandidate)
        ? new Date(observedCandidate).toISOString()
        : retrievedAt;

      const provenance: VerifiedCryptoSnapshot['provenance'] = {};
      const entries: Array<[CryptoSnapshotField, number | null | undefined, string, 'USD' | 'token']> = [
        ['marketCapUsd', marketCapUsd, 'market_data.market_cap.usd', 'USD'],
        ['volume24hUsd', volume24hUsd, 'market_data.total_volume.usd', 'USD'],
        ['circulatingSupply', circulatingSupply, 'market_data.circulating_supply', 'token'],
        ['maxSupply', maxSupply, 'market_data.max_supply', 'token'],
        ['totalSupply', totalSupply, 'market_data.total_supply', 'token'],
      ];
      for (const [field, value, sourcePath, unit] of entries) {
        const ref = buildProvenance(field, value, sourcePath, observedAt, retrievedAt, unit);
        if (ref) provenance[field] = ref;
      }

      const value = {
        symbol: s,
        provider: 'CoinGecko' as const,
        observedAt,
        retrievedAt,
        marketCapUsd,
        volume24hUsd,
        circulatingSupply,
        maxSupply,
        totalSupply,
        provenance,
      };
      cache.set(s, { value, cachedAtMs: nowMs() });
      circuit.consecutiveFailures = 0;
      circuit.openUntilMs = 0;
      return { ...value, cacheMode: 'fresh', degraded: false };
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(200 * 2 ** (attempt - 1) + Math.floor(random() * 100));
      }
    }
  }

  circuit.consecutiveFailures += 1;
  if (circuit.consecutiveFailures >= circuitFailureThreshold) {
    circuit.openUntilMs = nowMs() + circuitCooldownMs;
  }
  if (lastError) {
    console.warn(`[CryptoSnapshotProvider] ${s}: verified CoinGecko snapshot unavailable.`, (lastError as Error)?.message || lastError);
  }
  return cached ? { ...cached.value, cacheMode: 'last-known-good', degraded: true } : null;
}

export function resetCryptoSnapshotProviderState(): void {
  cache.clear();
  circuit.consecutiveFailures = 0;
  circuit.openUntilMs = 0;
}
