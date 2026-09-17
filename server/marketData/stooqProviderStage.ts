import type { MarketDataProviderStage } from './marketDataCoordinator';

export type StooqFallbackAsset = Record<string, any> & {
  symbol: string;
  type: string;
  price: number;
  change24h: number;
  volume24h?: number;
  score?: number;
};

const COMMODITY_TARGETS: Record<string, Array<{ symbol: string; name: string }>> = {
  XAUUSD: [{ symbol: 'GLD', name: 'Gold Spot' }],
  XAGUSD: [{ symbol: 'SLV', name: 'Silver Spot' }],
  'CL.F': [{ symbol: 'USO', name: 'Crude Oil' }, { symbol: 'WTI', name: 'WTI Crude Oil' }],
  'NG.F': [{ symbol: 'NG=F', name: 'Natural Gas' }],
  'CO.F': [{ symbol: 'BRENT', name: 'Brent Crude Oil' }],
};

function finite(value: unknown, fallback = 0): number {
  const n = Number(String(value ?? '').replace('%', ''));
  return Number.isFinite(n) ? n : fallback;
}

export function createStooqProviderStage(options: {
  stockTickers: string[];
  forexTickers: string[];
  commodityTickers: string[];
  fallbackAssets: StooqFallbackAsset[];
  fetchImpl?: typeof fetch;
  logger?: Pick<Console, 'warn'>;
}): MarketDataProviderStage {
  const fetchImpl = options.fetchImpl ?? fetch;
  const logger = options.logger ?? console;
  const allTickers = [...options.stockTickers, ...options.forexTickers, ...options.commodityTickers];
  const stockSet = new Set(options.stockTickers);
  const forexSet = new Set(options.forexTickers);
  const commoditySet = new Set(options.commodityTickers);

  return {
    name: 'stooq',
    async load() {
      try {
        const url = `https://stooq.com/q/d/l/?s=${allTickers.join('+')}&f=sdnjg1v`;
        const response = await fetchImpl(url);
        if (!response.ok) throw new Error(`Stooq API returned status ${response.status}`);
        const text = await response.text();
        const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
        if (lines.length <= 1) throw new Error('Stooq API returned empty data');

        const headers = lines[0].split(',').map(h => h.toLowerCase().trim());
        const indexOf = (names: string[], fallback: number) => {
          const idx = headers.findIndex(h => names.includes(h));
          return idx === -1 ? fallback : idx;
        };
        const symbolIdx = indexOf(['symbol', 'skrót', 'skrot'], 0);
        const nameIdx = indexOf(['name', 'nazwa'], 3);
        const closeIdx = indexOf(['close', 'kurs', 'cena', 'price'], 4);
        const changeIdx = indexOf(['change%', 'zmiana%', 'changepercent'], 6);
        const volumeIdx = indexOf(['volume', 'obrót', 'obrot'], 7);
        const assets: StooqFallbackAsset[] = [];

        for (let i = 1; i < lines.length; i += 1) {
          const cols = lines[i].split(',');
          const rawSymbol = cols[symbolIdx]?.trim();
          if (!rawSymbol) continue;
          const price = finite(cols[closeIdx], NaN);
          if (!Number.isFinite(price)) continue;
          const change24h = finite(cols[changeIdx], 0);
          const volume = finite(cols[volumeIdx], 0);
          const rawName = cols[nameIdx]?.trim() || rawSymbol;

          if (commoditySet.has(rawSymbol)) {
            for (const target of COMMODITY_TARGETS[rawSymbol] ?? []) {
              const original = options.fallbackAssets.find(asset => asset.symbol === target.symbol);
              const baseMomentum = 5 + (change24h > 0 ? Math.min(4, change24h) : Math.max(-4, change24h));
              assets.push({
                ...(original ?? {}),
                symbol: target.symbol,
                name: target.name,
                type: 'commodity',
                price,
                change24h,
                momentum: Number(baseMomentum.toFixed(1)),
                volume24h: volume > 0 ? Number(((volume * price) / 1e6).toFixed(2)) : original?.volume24h,
                score: original?.score,
                status: 'Verifiziert',
                dataSource: 'live',
              });
            }
            continue;
          }

          let type: 'stock' | 'forex' | undefined;
          let symbol = rawSymbol;
          if (stockSet.has(rawSymbol)) {
            type = 'stock';
            symbol = rawSymbol.endsWith('.US') ? rawSymbol.slice(0, -3) : rawSymbol;
          } else if (forexSet.has(rawSymbol)) {
            type = 'forex';
          }
          if (!type) continue;

          const original = options.fallbackAssets.find(asset => asset.symbol === symbol);
          const baseMomentum = 5 + (change24h > 0 ? Math.min(4, change24h) : Math.max(-4, change24h));
          assets.push({
            ...(original ?? {}),
            symbol,
            name: rawName,
            type,
            price,
            change24h,
            momentum: Number(baseMomentum.toFixed(1)),
            volume24h: volume > 0 ? Number(((volume * price) / 1e6).toFixed(2)) : original?.volume24h,
            score: original?.score,
            status: 'Verifiziert',
            dataSource: 'live',
          });
        }

        return assets;
      } catch (error: any) {
        logger.warn('[Stooq Live API Warning] Stooq failed (using resilient fallback):', error?.message || error);
        return options.fallbackAssets
          .filter(asset => asset.type !== 'crypto' && asset.type !== 'index')
          .map(asset => ({ ...asset, status: 'Fallback', dataSource: 'fallback' as const }));
      }
    },
  };
}
