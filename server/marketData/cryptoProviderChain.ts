export type CryptoFallbackAsset = {
  symbol: string;
  type: string;
  price: number;
  change24h: number;
  volume24h?: number;
  score?: number;
  [key: string]: unknown;
};

export type CryptoMarketPoint = {
  price: number;
  change24h: number;
  volume: number;
};

export type CryptoProviderResult = {
  assets: CryptoFallbackAsset[];
  source: 'binance' | 'kraken' | 'coinbase' | 'fallback';
};

type FetchLike = typeof fetch;

const COINBASE_SYMBOLS = [
  ['BTCUSDT', 'BTC-USD'],
  ['ETHUSDT', 'ETH-USD'],
  ['SOLUSDT', 'SOL-USD'],
  ['ADAUSDT', 'ADA-USD'],
] as const;

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function enrichFallbackAssets(
  fallbackAssets: CryptoFallbackAsset[],
  liveByPair: Map<string, CryptoMarketPoint>,
): CryptoFallbackAsset[] {
  return fallbackAssets
    .filter((asset) => asset.type === 'crypto')
    .map((asset) => {
      const live = liveByPair.get(`${asset.symbol.toUpperCase()}USDT`);
      if (!live || !Number.isFinite(live.price) || live.price <= 0) {
        return { ...asset, status: 'Fallback', dataSource: 'fallback' };
      }

      const change24h = toFiniteNumber(live.change24h);
      const baseMomentum = 5 + (change24h > 0 ? Math.min(4, change24h / 2) : Math.max(-4, change24h / 2));
      const score = Math.min(10, Math.max(1, Number((baseMomentum * 0.75 + 0.4).toFixed(1))));

      return {
        ...asset,
        price: live.price,
        change24h: Number(change24h.toFixed(2)),
        momentum: Number(baseMomentum.toFixed(1)),
        score,
        volume24h: live.volume > 0 ? Number(((live.volume * live.price) / 1e6).toFixed(2)) : asset.volume24h,
        dataSource: 'live',
      };
    });
}

async function fetchBinance(fetchImpl: FetchLike): Promise<Map<string, CryptoMarketPoint>> {
  const response = await fetchImpl('https://api.binance.com/api/v3/ticker/24hr');
  if (!response.ok) throw new Error(`Binance API returned status ${response.status}`);
  const payload = await response.json() as Array<Record<string, unknown>>;
  const map = new Map<string, CryptoMarketPoint>();
  for (const item of payload) {
    const symbol = String(item.symbol || '');
    if (!symbol.endsWith('USDT')) continue;
    const price = toFiniteNumber(item.lastPrice, NaN);
    if (!Number.isFinite(price) || price <= 0) continue;
    map.set(symbol, {
      price,
      change24h: toFiniteNumber(item.priceChangePercent),
      volume: toFiniteNumber(item.volume),
    });
  }
  return map;
}

async function fetchKraken(fetchImpl: FetchLike): Promise<Map<string, CryptoMarketPoint>> {
  const response = await fetchImpl('https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD,SOLUSD,ADAUSD');
  if (!response.ok) throw new Error(`Kraken API returned status ${response.status}`);
  const payload = await response.json() as any;
  const result = payload?.result || {};
  const aliases: Record<string, string> = {
    XXBTZUSD: 'BTCUSDT',
    XETHZUSD: 'ETHUSDT',
    SOLUSD: 'SOLUSDT',
    ADAUSD: 'ADAUSDT',
  };
  const map = new Map<string, CryptoMarketPoint>();
  for (const [rawKey, item] of Object.entries(result) as Array<[string, any]>) {
    const symbol = aliases[rawKey];
    if (!symbol) continue;
    const price = toFiniteNumber(item?.c?.[0], NaN);
    if (!Number.isFinite(price) || price <= 0) continue;
    const open24h = toFiniteNumber(item?.o, price);
    const change24h = open24h > 0 ? ((price - open24h) / open24h) * 100 : 0;
    map.set(symbol, {
      price,
      change24h,
      volume: toFiniteNumber(item?.v?.[1]),
    });
  }
  return map;
}

async function fetchCoinbase(fetchImpl: FetchLike): Promise<Map<string, CryptoMarketPoint>> {
  const map = new Map<string, CryptoMarketPoint>();
  await Promise.all(COINBASE_SYMBOLS.map(async ([symbol, pair]) => {
    const response = await fetchImpl(`https://api.coinbase.com/v2/prices/${pair}/spot`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) return;
    const payload = await response.json() as any;
    const price = toFiniteNumber(payload?.data?.amount, NaN);
    if (!Number.isFinite(price) || price <= 0) return;
    map.set(symbol, { price, change24h: 0, volume: 0 });
  }));
  return map;
}

export async function fetchCryptoMarketAssets(options: {
  fallbackAssets: CryptoFallbackAsset[];
  fetchImpl?: FetchLike;
  logger?: Pick<Console, 'info' | 'warn'>;
}): Promise<CryptoProviderResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const logger = options.logger ?? console;

  const providers: Array<['binance' | 'kraken' | 'coinbase', () => Promise<Map<string, CryptoMarketPoint>>]> = [
    ['binance', () => fetchBinance(fetchImpl)],
    ['kraken', () => fetchKraken(fetchImpl)],
    ['coinbase', () => fetchCoinbase(fetchImpl)],
  ];

  for (const [source, run] of providers) {
    try {
      const live = await run();
      if (live.has('BTCUSDT') || live.has('ETHUSDT')) {
        logger.info(`[Crypto Live API] ${source} successfully retrieved live prices`);
        return { assets: enrichFallbackAssets(options.fallbackAssets, live), source };
      }
    } catch (error: any) {
      logger.warn(`[Crypto Live API Warning] ${source} failed:`, error?.message || error);
    }
  }

  return {
    source: 'fallback',
    assets: options.fallbackAssets
      .filter((asset) => asset.type === 'crypto')
      .map((asset) => ({ ...asset, status: 'Fallback', dataSource: 'fallback' })),
  };
}
