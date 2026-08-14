import { recordProviderHealth } from '../platform/Supervisor/providerHealth';
import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';

export const ALPACA_SHADOW_CONTRACT_VERSION = 'alpaca-shadow/1.0.0' as const;
const DEFAULT_TIMEOUT_MS = 4_000;
const DEFAULT_MAX_AGE_MS = 90_000;
const DEFAULT_MAX_DEVIATION_PCT = 1;

export type AlpacaShadowState = 'NOT_CONFIGURED' | 'READY' | 'STALE' | 'DEGRADED' | 'UNAVAILABLE';

export interface AlpacaShadowObservation {
  contractVersion: typeof ALPACA_SHADOW_CONTRACT_VERSION;
  state: AlpacaShadowState;
  symbol: string;
  feed: 'iex' | 'sip';
  price: number | null;
  observedAt: string | null;
  retrievedAt: string;
  ageMs: number | null;
  deviationPct: number | null;
  canonicalProvider: string | null;
  evidenceId: string | null;
  sourcePath: 'https://data.alpaca.markets/v2/stocks/{symbol}/trades/latest';
  reason?: string;
}

export interface AlpacaShadowOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  apiKeyId?: string;
  apiSecretKey?: string;
  feed?: string;
  maxAgeMs?: number;
  maxDeviationPct?: number;
}

let lastObservation: AlpacaShadowObservation | null = null;

function configured(options: AlpacaShadowOptions): { keyId: string; secret: string } | null {
  const keyId = options.apiKeyId ?? process.env.ALPACA_API_KEY_ID;
  const secret = options.apiSecretKey ?? process.env.ALPACA_API_SECRET_KEY;
  return keyId && secret ? { keyId, secret } : null;
}

function resolveFeed(value: string | undefined): 'iex' | 'sip' {
  return value?.toLowerCase().trim() === 'sip' ? 'sip' : 'iex';
}

export function isAlpacaConfigured(): boolean {
  return Boolean(process.env.ALPACA_API_KEY_ID && process.env.ALPACA_API_SECRET_KEY);
}

export function getAlpacaShadowStatus(): AlpacaShadowObservation | null {
  return lastObservation ? { ...lastObservation } : null;
}

export async function observeAlpacaStockQuote(
  symbolInput: string,
  canonical?: { price: number | null; provider: string | null },
  options: AlpacaShadowOptions = {},
): Promise<AlpacaShadowObservation> {
  const symbol = symbolInput.toUpperCase().trim().replace(/\.US$/, '');
  const now = options.nowMs?.() ?? Date.now();
  const retrievedAt = new Date(now).toISOString();
  const feed = resolveFeed(options.feed ?? process.env.ALPACA_DATA_FEED);
  const credentials = configured(options);
  const sourcePath = 'https://data.alpaca.markets/v2/stocks/{symbol}/trades/latest' as const;

  if (!credentials) {
    lastObservation = {
      contractVersion: ALPACA_SHADOW_CONTRACT_VERSION,
      state: 'NOT_CONFIGURED',
      symbol,
      feed,
      price: null,
      observedAt: null,
      retrievedAt,
      ageMs: null,
      deviationPct: null,
      canonicalProvider: canonical?.provider ?? null,
      evidenceId: null,
      sourcePath,
      reason: 'Alpaca server credentials are not configured.',
    };
    return { ...lastObservation };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await (options.fetchImpl ?? fetch)(
      `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/trades/latest?feed=${feed}`,
      {
        headers: {
          Accept: 'application/json',
          'APCA-API-KEY-ID': credentials.keyId,
          'APCA-API-SECRET-KEY': credentials.secret,
          'User-Agent': 'CAPITAL-AI/0.6.0',
        },
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload: any = await response.json();
    const price = Number(payload?.trade?.p);
    const observedAt = typeof payload?.trade?.t === 'string' ? payload.trade.t : null;
    if (!Number.isFinite(price) || price <= 0 || !observedAt || !Number.isFinite(Date.parse(observedAt))) {
      throw new Error('Alpaca returned an invalid trade observation.');
    }

    const ageMs = Math.max(0, now - Date.parse(observedAt));
    const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
    const canonicalPrice = canonical?.price;
    const deviationPct = canonicalPrice && canonicalPrice > 0
      ? Math.abs(price - canonicalPrice) / canonicalPrice * 100
      : null;
    const maxDeviationPct = options.maxDeviationPct ?? DEFAULT_MAX_DEVIATION_PCT;
    const stale = ageMs > maxAgeMs;
    const deviating = deviationPct !== null && deviationPct > maxDeviationPct;
    const state: AlpacaShadowState = stale ? 'STALE' : deviating ? 'DEGRADED' : 'READY';

    recordMarketDataProviderOutcome({ provider: 'Alpaca', success: true, latencyMs: Date.now() - startedAt });
    recordProviderHealth({
      provider: 'Alpaca',
      capability: 'traditional-quote-shadow',
      state: state === 'READY' ? 'healthy' : 'degraded',
      message: state === 'READY'
        ? `Alpaca shadow observation accepted for ${symbol}.`
        : `Alpaca shadow observation for ${symbol} is ${state.toLowerCase()}.`,
    });

    lastObservation = {
      contractVersion: ALPACA_SHADOW_CONTRACT_VERSION,
      state,
      symbol,
      feed,
      price,
      observedAt: new Date(observedAt).toISOString(),
      retrievedAt,
      ageMs,
      deviationPct: deviationPct === null ? null : Number(deviationPct.toFixed(4)),
      canonicalProvider: canonical?.provider ?? null,
      evidenceId: `quote:alpaca:${feed}:${symbol}:${observedAt}`,
      sourcePath,
      reason: stale
        ? `Observation is older than ${maxAgeMs} ms.`
        : deviating
          ? `Deviation exceeds ${maxDeviationPct}% shadow threshold.`
          : undefined,
    };
    return { ...lastObservation };
  } catch (error) {
    recordMarketDataProviderOutcome({ provider: 'Alpaca', success: false });
    const reason = error instanceof Error ? error.message : String(error);
    recordProviderHealth({ provider: 'Alpaca', capability: 'traditional-quote-shadow', state: 'unavailable', message: reason });
    lastObservation = {
      contractVersion: ALPACA_SHADOW_CONTRACT_VERSION,
      state: 'UNAVAILABLE',
      symbol,
      feed,
      price: null,
      observedAt: null,
      retrievedAt,
      ageMs: null,
      deviationPct: null,
      canonicalProvider: canonical?.provider ?? null,
      evidenceId: null,
      sourcePath,
      reason,
    };
    return { ...lastObservation };
  } finally {
    clearTimeout(timeout);
  }
}


export interface AlpacaShadowSmokeSummary {
  [key: string]: unknown;
  configured: boolean;
  authenticated: boolean;
  state: AlpacaShadowState;
  symbol: string;
  feed: 'iex' | 'sip';
  retrievedAt: string;
}

export async function runAlpacaShadowStartupSmoke(
  symbol = 'AAPL',
  options: AlpacaShadowOptions = {},
): Promise<AlpacaShadowSmokeSummary> {
  const observation = await observeAlpacaStockQuote(symbol, undefined, options);
  return {
    configured: observation.state !== 'NOT_CONFIGURED',
    authenticated: observation.state !== 'NOT_CONFIGURED' && observation.state !== 'UNAVAILABLE',
    state: observation.state,
    symbol: observation.symbol,
    feed: observation.feed,
    retrievedAt: observation.retrievedAt,
  };
}
