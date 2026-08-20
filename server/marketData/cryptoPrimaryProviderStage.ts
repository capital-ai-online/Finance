import type { MarketDataProviderStage, MarketDataAsset } from './marketDataCoordinator';
import type { CryptoFallbackAsset } from './cryptoProviderChain';

let coingeckoCoolDownUntil = 0;

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCryptoAsset(asset: {
  symbol: string;
  name: string;
  price: unknown;
  change24h: unknown;
  marketCap: unknown;
  volume24h: unknown;
  circulatingSupply?: unknown;
  maxSupply?: unknown;
  totalSupply?: unknown;
}): MarketDataAsset {
  const change24h = toFiniteNumber(asset.change24h);
  const baseMomentum = 5 + (change24h > 0 ? Math.min(4, change24h / 2) : Math.max(-4, change24h / 2));
  const score = Math.min(10, Math.max(1, Number((baseMomentum * 0.75 + 0.4).toFixed(1))));

  return {
    symbol: asset.symbol.toUpperCase(),
    name: asset.name,
    type: 'crypto',
    price: toFiniteNumber(asset.price),
    change24h: Number(change24h.toFixed(2)),
    grahamScore: 0,
    momentum: Number(baseMomentum.toFixed(1)),
    risk: 'High',
    status: 'Verifiziert',
    marketCap: Number((toFiniteNumber(asset.marketCap) / 1e9).toFixed(1)),
    dividendYield: 0,
    volume24h: Number((toFiniteNumber(asset.volume24h) / 1e6).toFixed(2)),
    score,
    dataSource: 'live',
    circulatingSupply: typeof asset.circulatingSupply === 'number' ? asset.circulatingSupply : undefined,
    maxSupply: typeof asset.maxSupply === 'number' ? asset.maxSupply : asset.maxSupply === null ? null : undefined,
    totalSupply: typeof asset.totalSupply === 'number' ? asset.totalSupply : undefined,
  };
}

export function createCryptoPrimaryProviderStage(options: {
  fallbackAssets: CryptoFallbackAsset[];
  fetchImpl?: typeof fetch;
  now?: () => number;
  logger?: Pick<Console, 'info' | 'warn'>;
}): MarketDataProviderStage {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const logger = options.logger ?? console;
  // The background market-data feed is a bounded compatibility surface, not the global asset
  // discovery/scoring engine. Only symbols explicitly present in its configured fallback/core
  // universe are eligible for periodic enrichment. All other catalog symbols are hydrated on
  // demand through verified-asset-display/1.0.0 or their domain evidence contracts.
  const configuredCryptoSymbols = new Set(
    options.fallbackAssets
      .filter(asset => asset.type === 'crypto')
      .map(asset => asset.symbol.toUpperCase()),
  );

  return {
    name: 'crypto-primary-sources',
    async load() {
      if (now() >= coingeckoCoolDownUntil) {
        try {
          const response = await fetchImpl('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false');
          if (!response.ok) {
            coingeckoCoolDownUntil = now() + (response.status === 429 ? 15 * 60_000 : 5 * 60_000);
            throw new Error(`CoinGecko API returned status ${response.status}`);
          }
          const payload = await response.json() as any;
          if (!Array.isArray(payload)) throw new Error('CoinGecko API returned invalid format');
          const boundedPayload = payload.filter((coin: any) => configuredCryptoSymbols.has(String(coin?.symbol ?? '').toUpperCase()));
          logger.info(`[Crypto Live API] CoinGecko loaded ${payload.length} assets; ${boundedPayload.length} configured core assets enter periodic enrichment.`);
          return boundedPayload.map((coin: any) => normalizeCryptoAsset({
            symbol: coin.symbol,
            name: coin.name,
            price: coin.current_price,
            change24h: coin.price_change_percentage_24h,
            marketCap: coin.market_cap,
            volume24h: coin.total_volume,
            circulatingSupply: coin.circulating_supply,
            maxSupply: coin.max_supply,
            totalSupply: coin.total_supply,
          }));
        } catch (error: any) {
          logger.warn('[Crypto Live API Warning] CoinGecko failed:', error?.message || error);
        }
      }

      return [];
    },
  };
}
