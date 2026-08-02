import { fetchExternalHistory, isExternalProviderConfigured, type ExternalMarketDataProvider } from './externalMarketDataAdapters';
import { MARKET_DATA_PROVIDER_REGISTRY } from './marketDataProviderRegistry';
import { rankMarketDataProviders, recordMarketDataProviderOutcome } from './marketDataProviderRouter';
import { recordProviderHealth } from '../platform/Supervisor/providerHealth';

export interface VerifiedTraditionalFallbackHistory {
  provider: 'TwelveData' | 'EODHD';
  closes: number[];
  sourcePath: string;
  retrievedAt: string;
}

const PROVIDERS: Array<'TwelveData' | 'EODHD'> = ['TwelveData', 'EODHD'];

export async function getVerifiedTraditionalFallbackHistory(
  symbol: string,
  assetClass: 'stock' | 'forex',
  days = 30,
): Promise<VerifiedTraditionalFallbackHistory | null> {
  const available = PROVIDERS
    .filter(provider => isExternalProviderConfigured(provider))
    .map(provider => MARKET_DATA_PROVIDER_REGISTRY.find(entry => entry.id === provider))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const ranked = rankMarketDataProviders(available, { assetClass, capability: 'history' });
  for (const rankedProvider of ranked) {
    const provider = rankedProvider.provider.id as 'TwelveData' | 'EODHD';
    const started = Date.now();
    try {
      const result = await fetchExternalHistory(provider as ExternalMarketDataProvider, { symbol, assetClass, days });
      const closes = result.points.map(point => point.close).filter(value => Number.isFinite(value) && value > 0);
      if (closes.length < 20) throw new Error(`${provider} returned only ${closes.length} valid closes.`);
      recordMarketDataProviderOutcome({ provider, success: true, latencyMs: Date.now() - started });
      recordProviderHealth({
        provider,
        capability: `${assetClass}-history`,
        state: 'healthy',
        cacheMode: 'live',
        message: `${closes.length} verified history points used for ${symbol}.`,
      });
      return { provider, closes, sourcePath: result.sourcePath, retrievedAt: result.retrievedAt };
    } catch (error) {
      recordMarketDataProviderOutcome({ provider, success: false });
      recordProviderHealth({
        provider,
        capability: `${assetClass}-history`,
        state: 'unavailable',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return null;
}
