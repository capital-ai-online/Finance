import { fetchExternalHistory, isExternalProviderConfigured, type ExternalHistoryAssetClass, type ExternalMarketDataProvider } from './externalMarketDataAdapters';
import { selectHorizonValidationEvidence, type HorizonValidationEvidence, type VerifiedHistoricalPricePoint } from './horizonValidationEvidence';

export const HORIZON_VALIDATION_PROVIDER_VERSION = 'horizon-validation-provider/1.0.0' as const;

export interface HorizonValidationProviderRequest {
  symbol: string;
  assetClass: ExternalHistoryAssetClass;
  snapshotDate: string;
  horizonDays: number;
  maxDistanceMs?: number;
}

export interface HorizonValidationProviderResult {
  contractVersion: typeof HORIZON_VALIDATION_PROVIDER_VERSION;
  evidence: HorizonValidationEvidence;
  providersAttempted: ExternalMarketDataProvider[];
  providersSucceeded: ExternalMarketDataProvider[];
  sourceErrors: Array<{ provider: ExternalMarketDataProvider; reason: string }>;
  requestBudget: {
    maxProvidersPerSnapshot: number;
    stopAfterFirstReady: boolean;
    exhausted: boolean;
  };
  syntheticEvidenceAllowed: false;
}

export interface HorizonValidationProviderOptions {
  apiKeys?: Partial<Record<ExternalMarketDataProvider, string>>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  nowMs?: () => number;
  maxProvidersPerSnapshot?: number;
  stopAfterFirstReady?: boolean;
}

function providersFor(assetClass: ExternalHistoryAssetClass): ExternalMarketDataProvider[] {
  if (assetClass === 'crypto') return ['CoinAPI', 'TwelveData', 'EODHD'];
  if (assetClass === 'stock' || assetClass === 'forex') return ['TwelveData', 'EODHD'];
  return ['TwelveData'];
}

function toVerifiedPoints(provider: ExternalMarketDataProvider, points: Array<{ date: string; close: number }>): VerifiedHistoricalPricePoint[] {
  return points
    .filter(point => Number.isFinite(point.close) && point.close > 0 && /^\d{4}-\d{2}-\d{2}$/.test(point.date))
    .map(point => ({
      observedAt: `${point.date}T00:00:00.000Z`,
      price: point.close,
      provider,
      evidenceId: `${provider.toLowerCase()}:horizon:${point.date}:${point.close}`,
    }));
}

export async function resolveHorizonValidationEvidence(
  request: HorizonValidationProviderRequest,
  options: HorizonValidationProviderOptions = {},
): Promise<HorizonValidationProviderResult> {
  const allConfigured = providersFor(request.assetClass).filter(provider => isExternalProviderConfigured(provider, options));
  const maxProvidersPerSnapshot = Math.max(1, Math.min(3, Math.floor(options.maxProvidersPerSnapshot ?? allConfigured.length || 1)));
  const configured = allConfigured.slice(0, maxProvidersPerSnapshot);
  const stopAfterFirstReady = options.stopAfterFirstReady ?? false;
  const providersAttempted: ExternalMarketDataProvider[] = [];
  const providersSucceeded: ExternalMarketDataProvider[] = [];
  const sourceErrors: Array<{ provider: ExternalMarketDataProvider; reason: string }> = [];
  const verifiedPoints: VerifiedHistoricalPricePoint[] = [];

  const requestedDays = Math.min(365, Math.max(30, request.horizonDays + 14));

  for (const provider of configured) {
    providersAttempted.push(provider);
    try {
      const history = await fetchExternalHistory(provider, {
        symbol: request.symbol,
        assetClass: request.assetClass,
        days: requestedDays,
      }, options);
      providersSucceeded.push(provider);
      verifiedPoints.push(...toVerifiedPoints(provider, history.points));

      if (stopAfterFirstReady) {
        const partial = selectHorizonValidationEvidence({
          snapshotDate: request.snapshotDate,
          horizonDays: request.horizonDays,
          points: verifiedPoints,
          maxDistanceMs: request.maxDistanceMs,
        });
        if (partial.status === 'READY') break;
      }
    } catch (error) {
      sourceErrors.push({ provider, reason: error instanceof Error ? error.message : String(error) });
    }
  }

  const evidence = selectHorizonValidationEvidence({
    snapshotDate: request.snapshotDate,
    horizonDays: request.horizonDays,
    points: verifiedPoints,
    maxDistanceMs: request.maxDistanceMs,
  });

  return {
    contractVersion: HORIZON_VALIDATION_PROVIDER_VERSION,
    evidence,
    providersAttempted,
    providersSucceeded,
    sourceErrors,
    requestBudget: {
      maxProvidersPerSnapshot,
      stopAfterFirstReady,
      exhausted: allConfigured.length > providersAttempted.length && evidence.status !== 'READY',
    },
    syntheticEvidenceAllowed: false,
  };
}
