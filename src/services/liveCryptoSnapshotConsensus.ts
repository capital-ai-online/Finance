import { getVerifiedCryptoSnapshot } from './cryptoSnapshotProvider';
import { evaluateCryptoSnapshotConsensus, type CryptoSnapshotConsensusResult, type SnapshotFieldProvenance } from './cryptoSnapshotConsensus';
import { recordProviderHealth } from '../platform/Supervisor/providerHealth';
import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';

export interface LiveCryptoSnapshotConsensusOptions {
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
  timeoutMs?: number;
  coinMarketCapApiKey?: string;
}

function positive(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function fetchCoinMarketCapProvenance(
  symbol: string,
  options: LiveCryptoSnapshotConsensusOptions,
): Promise<SnapshotFieldProvenance[]> {
  const apiKey = options.coinMarketCapApiKey ?? process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) return [];
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5_000);
  const started = Date.now();
  try {
    const response = await fetchImpl(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symbol)}&convert=USD`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'X-CMC_PRO_API_KEY': apiKey,
          'User-Agent': 'CAPITAL-AI/0.6.3',
        },
      },
    );
    if (!response.ok) throw new Error(`CoinMarketCap HTTP ${response.status}`);
    const payload: any = await response.json();
    const raw = payload?.data?.[symbol];
    const row = Array.isArray(raw) ? raw[0] : raw;
    if (!row) throw new Error('CoinMarketCap returned no symbol snapshot.');
    const quote = row?.quote?.USD ?? {};
    const retrievedAt = new Date(options.nowMs?.() ?? Date.now()).toISOString();
    const observedRaw = quote?.last_updated ?? row?.last_updated;
    const observedAt = typeof observedRaw === 'string' && Number.isFinite(Date.parse(observedRaw))
      ? new Date(observedRaw).toISOString()
      : retrievedAt;
    const values: Array<[SnapshotFieldProvenance['field'], number | null, 'USD' | 'token', string]> = [
      ['marketCapUsd', positive(quote?.market_cap), 'USD', 'data[].quote.USD.market_cap'],
      ['volume24hUsd', positive(quote?.volume_24h), 'USD', 'data[].quote.USD.volume_24h'],
      ['circulatingSupply', positive(row?.circulating_supply), 'token', 'data[].circulating_supply'],
      ['maxSupply', positive(row?.max_supply), 'token', 'data[].max_supply'],
      ['totalSupply', positive(row?.total_supply), 'token', 'data[].total_supply'],
    ];
    recordProviderHealth({ provider: 'CoinMarketCap', capability: 'crypto-snapshot-consensus', state: 'healthy', consecutiveFailures: 0 });
    recordMarketDataProviderOutcome({ provider: 'CoinMarketCap', success: true, latencyMs: Math.max(0, Date.now() - started) });
    return values
      .filter(([, value]) => value !== null)
      .map(([field, value, unit, sourcePath]) => ({ field, provider: 'CoinMarketCap', sourcePath, observedAt, retrievedAt, value, unit }));
  } catch (error) {
    recordProviderHealth({
      provider: 'CoinMarketCap',
      capability: 'crypto-snapshot-consensus',
      state: 'unavailable',
      consecutiveFailures: 1,
      error: error instanceof Error ? error.message : String(error),
    });
    recordMarketDataProviderOutcome({ provider: 'CoinMarketCap', success: false });
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Observation-only runtime quorum. It deliberately does not hard-gate the production scorer yet;
 * tolerance calibration must first be based on observed CoinGecko/CoinMarketCap divergence.
 */
export async function getLiveCryptoSnapshotConsensus(
  symbol: string,
  options: LiveCryptoSnapshotConsensusOptions = {},
): Promise<CryptoSnapshotConsensusResult> {
  const s = symbol.toUpperCase().trim();
  const nowMs = options.nowMs ?? Date.now;
  const [coinGecko, coinMarketCap] = await Promise.all([
    getVerifiedCryptoSnapshot(s, { fetchImpl: options.fetchImpl, nowMs, timeoutMs: options.timeoutMs }),
    fetchCoinMarketCapProvenance(s, options),
  ]);
  const provenance: SnapshotFieldProvenance[] = [...coinMarketCap];
  if (coinGecko) {
    for (const item of Object.values(coinGecko.provenance)) {
      if (!item) continue;
      provenance.push({ ...item, provider: 'CoinGecko' });
    }
  }
  return evaluateCryptoSnapshotConsensus(s, provenance, {
    minimumSources: 2,
    maxObservationSkewMs: 15 * 60 * 1000,
  });
}
