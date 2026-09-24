import { MarketDataGateway } from '../platform/MarketData/MarketDataGateway';
import { ProviderRegistry } from '../platform/MarketData/ProviderRegistry';
import { BinanceSpotWebSocketProvider } from '../platform/MarketData/providers/BinanceSpotWebSocketProvider';
import type { CanonicalMarketDataSnapshot } from '../platform/MarketData/contracts';

let productionProvider: BinanceSpotWebSocketProvider | undefined;
let productionGateway: MarketDataGateway | undefined;

/** A separate USDT venue observation; callers must retain the quote currency. */
export async function getBinanceSpotVenueQuote(
  symbol: string,
): Promise<CanonicalMarketDataSnapshot> {
  if (!productionGateway) {
    const provider = new BinanceSpotWebSocketProvider();
    const registry = new ProviderRegistry();
    registry.register(provider);
    productionProvider = provider;
    productionGateway = new MarketDataGateway(registry, { cacheTtlMs: 5_000 });
  }
  return (await productionGateway.getSnapshot({
    symbol,
    assetClass: 'crypto',
    correlationId: `binance-venue:${symbol}:${Date.now()}`,
    maxAgeMs: 90_000,
    allowedProviderIds: ['binance-spot-stream'],
  })).snapshot;
}

export function closeBinanceSpotVenueQuote(): void {
  productionProvider?.close();
  productionProvider = undefined;
  productionGateway = undefined;
}
