import { recordProviderHealth } from '../platform/Supervisor/providerHealth';
import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';

export interface KrakenSpotMarketEvidence {
  provider: 'Kraken';
  symbol: string;
  pair: string;
  priceUsd: number;
  change24hPct: number;
  baseVolume24h: number;
  notionalVolume24hUsd: number;
  liquidityScore: number;
  observedAt: string;
  retrievedAt: string;
  evidenceId: string;
  semanticScope: 'single-exchange-spot-24h-liquidity-usd';
}

export interface KrakenSpotMarketEvidenceOptions {
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
  timeoutMs?: number;
}

const PAIRS: Record<string, string> = {
  BTC: 'XBTUSD',
  ETH: 'ETHUSD',
  SOL: 'SOLUSD',
  ADA: 'ADAUSD',
  DOGE: 'DOGEUSD',
  XRP: 'XRPUSD',
  DOT: 'DOTUSD',
  LTC: 'LTCUSD',
  LINK: 'LINKUSD',
  AVAX: 'AVAXUSD',
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; value: KrakenSpotMarketEvidence | null }>();

function finitePositive(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function liquidityScore(notionalVolumeUsd: number): number {
  // Deterministic log scale: <= $1m -> 0, >= $1bn -> 1. This is an exchange-liquidity
  // quality factor, not a global market-volume estimate.
  if (!Number.isFinite(notionalVolumeUsd) || notionalVolumeUsd <= 0) return 0;
  const low = 6;
  const high = 9;
  const value = (Math.log10(notionalVolumeUsd) - low) / (high - low);
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

export async function getKrakenSpotMarketEvidence(
  symbol: string,
  options: KrakenSpotMarketEvidenceOptions = {},
): Promise<KrakenSpotMarketEvidence | null> {
  const s = symbol.toUpperCase().trim();
  const pair = PAIRS[s];
  if (!pair) return null;

  const now = options.nowMs?.() ?? Date.now();
  const cached = cache.get(s);
  if (cached && cached.expiresAt > now) return cached.value;

  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5_000);
  const started = Date.now();

  try {
    const response = await fetchImpl(
      `https://api.kraken.com/0/public/Ticker?pair=${encodeURIComponent(pair)}&assetVersion=1`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CAPITAL-AI/0.6.0',
        },
      },
    );
    if (!response.ok) throw new Error(`Kraken HTTP ${response.status}`);

    const payload: any = await response.json();
    if (Array.isArray(payload?.error) && payload.error.length > 0) {
      throw new Error(`Kraken API error: ${payload.error.join(', ')}`);
    }

    const rows = Object.entries(payload?.result ?? {}) as Array<[string, any]>;
    const row = rows[0]?.[1];
    if (!row) throw new Error(`Kraken returned no ticker for ${pair}`);

    const priceUsd = finitePositive(row?.c?.[0]);
    const baseVolume24h = finitePositive(row?.v?.[1]);
    const open24h = finitePositive(row?.o);
    const vwap24h = finitePositive(row?.p?.[1]) ?? priceUsd;
    if (priceUsd === null || baseVolume24h === null || vwap24h === null) {
      throw new Error(`Kraken ticker for ${pair} is missing price/volume evidence`);
    }

    const notionalVolume24hUsd = baseVolume24h * vwap24h;
    const change24hPct = open24h && open24h > 0 ? ((priceUsd - open24h) / open24h) * 100 : 0;
    const retrievedAt = new Date(now).toISOString();
    const evidence: KrakenSpotMarketEvidence = {
      provider: 'Kraken',
      symbol: s,
      pair,
      priceUsd,
      change24hPct: Number(change24hPct.toFixed(4)),
      baseVolume24h,
      notionalVolume24hUsd: Number(notionalVolume24hUsd.toFixed(2)),
      liquidityScore: liquidityScore(notionalVolume24hUsd),
      observedAt: retrievedAt,
      retrievedAt,
      evidenceId: `kraken:spot-ticker:${s}:${retrievedAt.slice(0, 16)}`,
      semanticScope: 'single-exchange-spot-24h-liquidity-usd',
    };

    cache.set(s, { expiresAt: now + CACHE_TTL_MS, value: evidence });
    recordProviderHealth({
      provider: 'Kraken',
      capability: 'crypto-exchange-liquidity',
      state: 'healthy',
      cacheMode: 'live',
      message: `${s}: verified Kraken spot price and 24h exchange-liquidity evidence available.`,
    });
    recordMarketDataProviderOutcome({ provider: 'Kraken', success: true, latencyMs: Math.max(0, Date.now() - started) });
    return evidence;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    cache.set(s, { expiresAt: now + 30_000, value: null });
    recordProviderHealth({
      provider: 'Kraken',
      capability: 'crypto-exchange-liquidity',
      state: 'unavailable',
      message,
    });
    recordMarketDataProviderOutcome({ provider: 'Kraken', success: false });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
