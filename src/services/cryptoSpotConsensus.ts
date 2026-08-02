import { evaluateMarketConsensus, type MarketConsensusResult, type MarketObservation } from './marketDataConsensus';
import { fetchCryptoSpotObservation, type SpotPriceProvider } from './externalSpotPriceAdapters';
import { recordMarketDataProviderOutcome } from './marketDataProviderRouter';
import { recordProviderHealth } from '../platform/Supervisor/providerHealth';

const PROVIDERS: SpotPriceProvider[] = ['CoinAPI', 'TwelveData', 'EODHD'];

function isConfigured(provider: SpotPriceProvider): boolean {
  if (provider === 'CoinAPI') return Boolean(process.env.COIN_API_KEY);
  if (provider === 'TwelveData') return Boolean(process.env.TWELVEDATA_API_KEY);
  return Boolean(process.env.EODHD_API_KEY);
}

/**
 * Cross-provider crypto reference-price quorum.
 * CoinAPI/Twelve Data may form a near-real-time quorum. EODHD is deliberately allowed only as an
 * independent reference observation: its EOD timestamp normally fails the tight observation-skew
 * gate and therefore can never silently masquerade as a current execution price.
 */
export async function getCryptoSpotConsensus(symbol: string): Promise<MarketConsensusResult> {
  const observations: MarketObservation[] = [];
  for (const provider of PROVIDERS.filter(isConfigured)) {
    const started = Date.now();
    try {
      const observation = await fetchCryptoSpotObservation(provider, symbol);
      observations.push(observation);
      recordMarketDataProviderOutcome({ provider, success: true, latencyMs: Date.now() - started });
      recordProviderHealth({ provider, capability: 'crypto-spot-price', state: 'healthy', cacheMode: 'live' });
    } catch (error) {
      recordMarketDataProviderOutcome({ provider, success: false });
      recordProviderHealth({
        provider,
        capability: 'crypto-spot-price',
        state: 'unavailable',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return evaluateMarketConsensus(observations, {
    minimumSources: 2,
    toleranceBps: 100,
    maxObservationSkewMs: 5 * 60 * 1000,
  });
}
