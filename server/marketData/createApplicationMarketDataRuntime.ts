import { randomUUID } from 'node:crypto';
import type { MarketDataAsset } from './marketDataCoordinator';
import type { StooqFallbackAsset } from './stooqProviderStage';
import { runMarketDataCompatibilityRefresh } from './marketDataCompatibilityFacade';
import { createMarketDataRuntimeFacade } from './marketDataRuntimeFacade';
import {
  enrichAssetWithCanonicalScore,
  isCanonicalScorableMarketDataAsset,
} from './canonicalCryptoScoreEnrichment';
import {
  ASYNC_EXECUTION_ENVELOPE_SCHEMA,
  createInlineAsyncExecutionPort,
  type AsyncExecutionEnvelope,
  type AsyncExecutionPort,
} from '../../src/platform/Supervisor/Execution/AsyncExecutionPort';

const STOCK_TICKERS = ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'NVDA.US', 'TSLA.US', 'META.US', 'NFLX.US', 'AMD.US', 'INTC.US'];
const FOREX_TICKERS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD'];
const COMMODITY_TICKERS = ['XAUUSD', 'XAGUSD', 'CL.F', 'NG.F', 'CO.F'];
export const APPLICATION_BACKGROUND_REFRESH_INTERVAL_MS = 90_000;

export const MARKET_DATA_ASYNC_TASKS = Object.freeze({
  PERSIST_SNAPSHOTS: 'market-data.persist-snapshots',
  EVALUATE_ALERTS: 'market-data.evaluate-alerts',
} as const);

interface MarketDataAsyncPayload {
  assets: MarketDataAsset[];
}

export interface ApplicationMarketDataRuntimeOptions {
  fallbackAssets: StooqFallbackAsset[];
  registryAssets: () => MarketDataAsset[];
  enrichAsset: (asset: MarketDataAsset) => Promise<MarketDataAsset>;
  syncAsset: (asset: MarketDataAsset) => void;
  persistSnapshots?: (assets: MarketDataAsset[]) => Promise<void> | void;
  evaluateAlerts?: (assets: MarketDataAsset[]) => Promise<void> | void;
  onProviderFailure?: (stage: string, error: unknown) => void;
  onRefreshFailure?: (error: unknown) => void;
  ttlMs?: number;
  /**
   * ADR-0037 execution-mechanics adapter. The adapter may execute inline today or dispatch to a
   * durable external engine later. It has no authority to select scoring/domain behavior.
   */
  executionPort?: AsyncExecutionPort;
}

function envelope(
  taskType: string,
  correlationId: string,
  assets: MarketDataAsset[],
): AsyncExecutionEnvelope<MarketDataAsyncPayload> {
  return {
    schemaVersion: ASYNC_EXECUTION_ENVELOPE_SCHEMA,
    taskType,
    taskId: randomUUID(),
    correlationId,
    createdAt: new Date().toISOString(),
    payload: { assets },
    policy: {
      maxAttempts: 3,
      timeoutMs: 120_000,
    },
  };
}

/**
 * Canonical application-level composition for CAPITAL-AI market data.
 *
 * Provider ordering, cache/TTL and compatibility fallback completion stay owned by the market-data
 * architecture. Financial scoring authority remains UAI -> ScoringModelRegistry ->
 * ScoringDispatcher. ADR-0037 background execution is exposed only through AsyncExecutionPort;
 * the default adapter preserves current inline semantics without introducing a second orchestrator.
 */
export function createApplicationMarketDataRuntime(options: ApplicationMarketDataRuntimeOptions) {
  const inlineExecutionPort = createInlineAsyncExecutionPort({
    [MARKET_DATA_ASYNC_TASKS.PERSIST_SNAPSHOTS]: async (payload: MarketDataAsyncPayload) => {
      await options.persistSnapshots?.(payload.assets);
    },
    [MARKET_DATA_ASYNC_TASKS.EVALUATE_ALERTS]: async (payload: MarketDataAsyncPayload) => {
      await options.evaluateAlerts?.(payload.assets);
    },
  });
  const executionPort = options.executionPort ?? inlineExecutionPort;

  return createMarketDataRuntimeFacade({
    ttlMs: options.ttlMs,
    backgroundRefreshIntervalMs: APPLICATION_BACKGROUND_REFRESH_INTERVAL_MS,
    syncAsset: options.syncAsset,
    onRefreshFailure: options.onRefreshFailure,
    refresh: async () => {
      const correlationId = `market-refresh:${randomUUID()}`;
      return runMarketDataCompatibilityRefresh({
        fallbackAssets: options.fallbackAssets,
        stockTickers: STOCK_TICKERS,
        forexTickers: FOREX_TICKERS,
        commodityTickers: COMMODITY_TICKERS,
        registryAssets: options.registryAssets,
        enrichAsset: (asset) => isCanonicalScorableMarketDataAsset(asset)
          ? enrichAssetWithCanonicalScore(asset)
          : options.enrichAsset(asset),
        persistSnapshots: options.persistSnapshots
          ? async (assets) => {
            await executionPort.dispatch(envelope(
              MARKET_DATA_ASYNC_TASKS.PERSIST_SNAPSHOTS,
              correlationId,
              assets,
            ));
          }
          : undefined,
        evaluateAlerts: options.evaluateAlerts
          ? async (assets) => {
            await executionPort.dispatch(envelope(
              MARKET_DATA_ASYNC_TASKS.EVALUATE_ALERTS,
              correlationId,
              assets,
            ));
          }
          : undefined,
        onProviderFailure: options.onProviderFailure,
      });
    },
  });
}
