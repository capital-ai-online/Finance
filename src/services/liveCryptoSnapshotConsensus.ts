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

function semanticScopeFor(field: SnapshotFieldProvenance['field']): string {
  if (field === 'marketCapUsd') return 'global-circulating-supply-market-cap-usd';
  if (field === 'volume24hUsd') return 'global-aggregate-24h-volume-usd';
  if (field === 'circulatingSupply') return 'circulating-token-supply';
  if (field === 'maxSupply') return 'maximum-token-supply';
  return 'total-token-supply';
}

function resolveCoinMarketCapRow(payload: any, symbol: string): any | null {
  const data = payload?.data;
  if (Array.isArray(data)) {
    return data.find((row: any) => String(row?.symbol || '').toUpperCase() === symbol) ?? data[0] ?? null;
  }
  const raw = data?.[symbol];
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (raw && typeof raw === 'object') return raw;
  return null;
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
    // Current CMC contract. v2 quotes are legacy; keep the parser tolerant of both response
    // shapes so a provider-side format transition cannot silently turn a 200 into no evidence.
    const response = await fetchImpl(
      `https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symbol)}&convert=USD`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'X-CMC_PRO_API_KEY': apiKey,
          'User-Agent': 'CAPITAL-AI/0.6.0',
        },
      },
    );
    if (!response.ok) throw new Error(`CoinMarketCap HTTP ${response.status}`);
    const payload: any = await response.json();
    if (payload?.status?.error_code && payload.status.error_code !== 0) {
      throw new Error(`CoinMarketCap API ${payload.status.error_code}: ${payload.status.error_message || 'unknown error'}`);
    }
    const row = resolveCoinMarketCapRow(payload, symbol);
    if (!row) throw new Error('CoinMarketCap returned no symbol snapshot.');
    const quote = row?.quote?.USD ?? (Array.isArray(row?.quote) ? row.quote.find((q: any) => q?.symbol === 'USD') : undefined) ?? {};
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
    recordProviderHealth({
      provider: 'CoinMarketCap',
      capability: 'crypto-snapshot-consensus',
      state: 'healthy',
      cacheMode: 'live',
      message: `${symbol}: verified snapshot fields available for quorum evaluation.`,
    });
    recordMarketDataProviderOutcome({ provider: 'CoinMarketCap', success: true, latencyMs: Math.max(0, Date.now() - started) });
    return values
      .filter(([, value]) => value !== null)
      .map(([field, value, unit, sourcePath]) => ({
        field,
        provider: 'CoinMarketCap',
        sourcePath,
        observedAt,
        retrievedAt,
        value,
        unit,
        semanticScope: semanticScopeFor(field),
      }));
  } catch (error) {
    recordProviderHealth({
      provider: 'CoinMarketCap',
      capability: 'crypto-snapshot-consensus',
      state: 'unavailable',
      message: error instanceof Error ? error.message : String(error),
    });
    recordMarketDataProviderOutcome({ provider: 'CoinMarketCap', success: false });
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Runtime quorum for global crypto snapshot fields. Only semantically comparable CoinGecko and
 * CoinMarketCap observations may become canonical global volume/supply evidence. Kraken is kept
 * separate because exchange-local volume is not semantically equivalent to a global aggregate.
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
      provenance.push({
        ...item,
        provider: 'CoinGecko',
        semanticScope: semanticScopeFor(item.field),
      });
    }
  }
  return evaluateCryptoSnapshotConsensus(s, provenance);
}
