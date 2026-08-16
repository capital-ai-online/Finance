/**
 * SC-5 Phase A — verified crypto USD price through MarketDataGateway.
 * Fail-closed; no synthetic prices. Multi-field CoinGecko market snapshot
 * (marketCap/supply) remains on cryptoSnapshotProvider until a later phase.
 */

import { recordProviderHealth } from '../platform/Supervisor/providerHealth';
import { MarketDataGateway } from '../platform/MarketData/MarketDataGateway';
import { ProviderRegistry } from '../platform/MarketData/ProviderRegistry';
import { RateLimitBudget } from '../platform/MarketData/RateLimitBudget';
import { rateLimitOverridesFromMatrix } from '../platform/MarketData/ProviderMatrix';
import {
  CoinGeckoMarketDataProvider,
  COINGECKO_SYMBOL_IDS,
} from '../platform/MarketData/providers/CoinGeckoMarketDataProvider';
import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';

export const CRYPTO_QUOTE_CONTRACT_VERSION = 'crypto-quote/1.0.0' as const;

const DEFAULT_MAX_QUOTE_AGE_MS = 5 * 60 * 1000;

export interface VerifiedCryptoQuote {
  contractVersion: typeof CRYPTO_QUOTE_CONTRACT_VERSION;
  status: 'READY' | 'SOURCE_UNAVAILABLE' | 'STALE_EVIDENCE' | 'UNSUPPORTED_ASSET';
  symbol: string;
  assetClass: 'crypto';
  price: number | null;
  currency: string | null;
  provider: string | null;
  providers: string[];
  observedAt: string | null;
  retrievedAt: string;
  evidenceIds: string[];
  sourcePath: string | null;
  alertEligible: boolean;
  executionPriceEligible: boolean;
  evidenceAgeMs?: number | null;
  maxAgeMs?: number;
  gatewaySource?: 'provider' | 'cache';
  reason?: string;
}

export interface CryptoQuoteOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  maxAgeMs?: number;
  apiKey?: string;
}

function nowMs(options: CryptoQuoteOptions): number {
  return options.nowMs?.() ?? Date.now();
}

function nowIso(options: CryptoQuoteOptions): string {
  return new Date(nowMs(options)).toISOString();
}

let productionCryptoQuoteGateway: MarketDataGateway | undefined;

function cryptoQuoteGateway(options: CryptoQuoteOptions): MarketDataGateway {
  const usesInjectedRuntime = Boolean(
    options.fetchImpl || options.nowMs || options.timeoutMs !== undefined || options.apiKey !== undefined,
  );
  if (!usesInjectedRuntime && productionCryptoQuoteGateway) return productionCryptoQuoteGateway;

  const registry = new ProviderRegistry();
  registry.register(
    new CoinGeckoMarketDataProvider({
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: options.nowMs,
      apiKey: options.apiKey,
    }),
  );
  const gateway = new MarketDataGateway(registry, {
    nowMs: options.nowMs,
    rateLimitBudget: new RateLimitBudget({
      nowMs: options.nowMs,
      perProvider: rateLimitOverridesFromMatrix(),
    }),
  });
  if (!usesInjectedRuntime) productionCryptoQuoteGateway = gateway;
  return gateway;
}

/** Test helper: drop singleton so injected fetch/clock is used. */
export function resetCryptoQuoteGatewayForTests(): void {
  productionCryptoQuoteGateway = undefined;
}

/**
 * Verified crypto USD quote via SC-4/SC-5 gateway path.
 * Does not change scoring formulas or eligibility thresholds.
 */
export async function fetchVerifiedCryptoQuote(
  symbolInput: string,
  options: CryptoQuoteOptions = {},
): Promise<VerifiedCryptoQuote> {
  const symbol = symbolInput.toUpperCase().trim();
  const retrievedAt = nowIso(options);
  if (!symbol) {
    return {
      contractVersion: CRYPTO_QUOTE_CONTRACT_VERSION,
      status: 'UNSUPPORTED_ASSET',
      symbol: '',
      assetClass: 'crypto',
      price: null,
      currency: null,
      provider: null,
      providers: [],
      observedAt: null,
      retrievedAt,
      evidenceIds: [],
      sourcePath: null,
      alertEligible: false,
      executionPriceEligible: false,
      reason: 'Symbol is required.',
    };
  }

  // Short-circuit before gateway: unmapped symbols must stay UNSUPPORTED_ASSET.
  // Gateway DataQuality rejects UNAVAILABLE and replaces the provider reason with a generic
  // "all providers failed" message, which would otherwise collapse to SOURCE_UNAVAILABLE.
  if (!COINGECKO_SYMBOL_IDS[symbol]) {
    return {
      contractVersion: CRYPTO_QUOTE_CONTRACT_VERSION,
      status: 'UNSUPPORTED_ASSET',
      symbol,
      assetClass: 'crypto',
      price: null,
      currency: null,
      provider: null,
      providers: [],
      observedAt: null,
      retrievedAt,
      evidenceIds: [],
      sourcePath: 'https://api.coingecko.com/api/v3/simple/price',
      alertEligible: false,
      executionPriceEligible: false,
      reason: `No approved CoinGecko mapping for symbol ${symbol}.`,
    };
  }

  const startedAt = Date.now();
  const result = await cryptoQuoteGateway(options).getSnapshot({
    symbol,
    assetClass: 'crypto',
    correlationId: `crypto-quote:${symbol}:${nowMs(options)}`,
    maxAgeMs: options.maxAgeMs ?? DEFAULT_MAX_QUOTE_AGE_MS,
    allowStale: true,
    allowedProviderIds: ['coingecko'],
  });

  const snapshot = result.snapshot;
  const stale = snapshot.qualityState === 'STALE';
  const ready = ['LIVE', 'DELAYED', 'HISTORICAL'].includes(snapshot.qualityState);
  const success = ready || stale;
  const unsupported = Boolean(
    snapshot.reason && /No approved CoinGecko mapping/i.test(snapshot.reason),
  );

  recordMarketDataProviderOutcome({
    provider: 'CoinGecko',
    success,
    latencyMs: Date.now() - startedAt,
  });
  recordProviderHealth({
    provider: 'CoinGecko',
    capability: 'crypto-quote',
    state: ready ? 'healthy' : stale ? 'degraded' : 'unavailable',
    cacheMode: result.source,
    message:
      snapshot.reason ??
      (ready
        ? `Verified crypto quote received for ${symbol} through MarketDataGateway.`
        : stale
          ? `Stale crypto quote received for ${symbol} through MarketDataGateway.`
          : `No verified crypto quote available for ${symbol} through MarketDataGateway.`),
  });

  if (unsupported) {
    return {
      contractVersion: CRYPTO_QUOTE_CONTRACT_VERSION,
      status: 'UNSUPPORTED_ASSET',
      symbol,
      assetClass: 'crypto',
      price: null,
      currency: null,
      provider: null,
      providers: [],
      observedAt: null,
      retrievedAt: snapshot.receivedAt,
      evidenceIds: [],
      sourcePath: 'https://api.coingecko.com/api/v3/simple/price',
      alertEligible: false,
      executionPriceEligible: false,
      gatewaySource: result.source,
      reason: snapshot.reason,
    };
  }

  return {
    contractVersion: CRYPTO_QUOTE_CONTRACT_VERSION,
    status: ready ? 'READY' : stale ? 'STALE_EVIDENCE' : 'SOURCE_UNAVAILABLE',
    symbol,
    assetClass: 'crypto',
    price: ready ? snapshot.price : null,
    currency: snapshot.currency,
    provider: success ? 'CoinGecko' : null,
    providers: success ? ['CoinGecko'] : [],
    observedAt: snapshot.sourceTimestamp,
    retrievedAt: snapshot.receivedAt,
    evidenceIds: snapshot.evidenceId ? [snapshot.evidenceId] : [],
    sourcePath: 'https://api.coingecko.com/api/v3/simple/price',
    alertEligible: ready,
    // Spot execution eligibility stays false until multi-provider quorum (cryptoSpotConsensus) is
    // explicitly linked as Owner-gated follow-up.
    executionPriceEligible: false,
    evidenceAgeMs: snapshot.freshnessMs,
    maxAgeMs: options.maxAgeMs ?? DEFAULT_MAX_QUOTE_AGE_MS,
    gatewaySource: result.source,
    reason: snapshot.reason,
  };
}
