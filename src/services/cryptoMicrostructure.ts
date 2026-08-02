export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface VenueOrderBook {
  provider: 'Binance' | 'Kraken';
  symbol: string;
  observedAt: string;
  retrievedAt: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  bestBid: number | null;
  bestAsk: number | null;
  spreadBps: number | null;
  evidenceId: string;
}

export interface ArbitrageObservation {
  status: 'OPPORTUNITY_OBSERVED' | 'NO_OPPORTUNITY' | 'INSUFFICIENT_EVIDENCE';
  buyVenue: string | null;
  sellVenue: string | null;
  buyPrice: number | null;
  sellPrice: number | null;
  grossSpreadBps: number | null;
  executionEligible: false;
  reason: string;
}

export interface CryptoMicrostructureResult {
  status: 'READY' | 'PARTIAL' | 'DATA_UNAVAILABLE';
  symbol: string;
  venues: VenueOrderBook[];
  arbitrage: ArbitrageObservation;
  providers: string[];
  evidenceIds: string[];
  scoringImpact: 'NONE';
  executionEligible: false;
}

function finitePositive(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function spreadBps(bestBid: number | null, bestAsk: number | null): number | null {
  if (bestBid === null || bestAsk === null || bestAsk <= 0) return null;
  const mid = (bestBid + bestAsk) / 2;
  return mid > 0 ? Number((((bestAsk - bestBid) / mid) * 10_000).toFixed(2)) : null;
}

async function requestJson(url: string, timeoutMs: number, fetchImpl: typeof fetch): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeLevels(rows: unknown, limit: number): OrderBookLevel[] {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, limit).map((row) => {
    if (!Array.isArray(row)) return null;
    const price = finitePositive(row[0]);
    const quantity = finitePositive(row[1]);
    return price !== null && quantity !== null ? { price, quantity } : null;
  }).filter((row): row is OrderBookLevel => row !== null);
}

export async function fetchBinanceOrderBook(symbol: string, options: { fetchImpl?: typeof fetch; timeoutMs?: number; limit?: number } = {}): Promise<VenueOrderBook> {
  const asset = symbol.toUpperCase().trim();
  const limit = Math.min(Math.max(options.limit ?? 10, 5), 50);
  const retrievedAt = new Date().toISOString();
  const data = await requestJson(
    `https://api.binance.com/api/v3/depth?symbol=${encodeURIComponent(`${asset}USDT`)}&limit=${limit}`,
    options.timeoutMs ?? 3_000,
    options.fetchImpl ?? fetch,
  );
  const bids = normalizeLevels(data?.bids, limit);
  const asks = normalizeLevels(data?.asks, limit);
  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  return {
    provider: 'Binance', symbol: asset, observedAt: retrievedAt, retrievedAt, bids, asks, bestBid, bestAsk,
    spreadBps: spreadBps(bestBid, bestAsk),
    evidenceId: `orderbook:binance:${asset}:USDT:${retrievedAt}`,
  };
}

function krakenPair(symbol: string): string {
  const asset = symbol.toUpperCase().trim();
  if (asset === 'BTC') return 'XBTUSD';
  return `${asset}USD`;
}

export async function fetchKrakenOrderBook(symbol: string, options: { fetchImpl?: typeof fetch; timeoutMs?: number; limit?: number } = {}): Promise<VenueOrderBook> {
  const asset = symbol.toUpperCase().trim();
  const limit = Math.min(Math.max(options.limit ?? 10, 5), 50);
  const retrievedAt = new Date().toISOString();
  const data = await requestJson(
    `https://api.kraken.com/0/public/Depth?pair=${encodeURIComponent(krakenPair(asset))}&count=${limit}`,
    options.timeoutMs ?? 3_000,
    options.fetchImpl ?? fetch,
  );
  if (Array.isArray(data?.error) && data.error.length > 0) throw new Error(data.error.join(', '));
  const first = data?.result && typeof data.result === 'object' ? Object.values(data.result)[0] as any : null;
  const bids = normalizeLevels(first?.bids, limit);
  const asks = normalizeLevels(first?.asks, limit);
  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  return {
    provider: 'Kraken', symbol: asset, observedAt: retrievedAt, retrievedAt, bids, asks, bestBid, bestAsk,
    spreadBps: spreadBps(bestBid, bestAsk),
    evidenceId: `orderbook:kraken:${asset}:USD:${retrievedAt}`,
  };
}

function evaluateArbitrage(venues: VenueOrderBook[]): ArbitrageObservation {
  if (venues.length < 2) {
    return {
      status: 'INSUFFICIENT_EVIDENCE', buyVenue: null, sellVenue: null, buyPrice: null, sellPrice: null,
      grossSpreadBps: null, executionEligible: false,
      reason: 'Mindestens zwei unabhängige Venue-Orderbücher sind für einen Arbitragevergleich erforderlich.',
    };
  }
  const buy = venues.filter(v => v.bestAsk !== null).sort((a, b) => (a.bestAsk ?? Infinity) - (b.bestAsk ?? Infinity))[0];
  const sell = venues.filter(v => v.bestBid !== null).sort((a, b) => (b.bestBid ?? 0) - (a.bestBid ?? 0))[0];
  if (!buy || !sell || buy.bestAsk === null || sell.bestBid === null) {
    return {
      status: 'INSUFFICIENT_EVIDENCE', buyVenue: null, sellVenue: null, buyPrice: null, sellPrice: null,
      grossSpreadBps: null, executionEligible: false, reason: 'Keine vergleichbaren Best-Bid/Best-Ask-Werte verfügbar.',
    };
  }
  const grossSpreadBps = Number((((sell.bestBid - buy.bestAsk) / buy.bestAsk) * 10_000).toFixed(2));
  return {
    status: grossSpreadBps > 0 ? 'OPPORTUNITY_OBSERVED' : 'NO_OPPORTUNITY',
    buyVenue: buy.provider, sellVenue: sell.provider, buyPrice: buy.bestAsk, sellPrice: sell.bestBid,
    grossSpreadBps, executionEligible: false,
    reason: 'Brutto-Venue-Vergleich ohne Gebühren, Slippage, Transferzeiten oder Ausführungsannahmen; rein beobachtend.',
  };
}

export async function getCryptoMicrostructure(symbol: string): Promise<CryptoMicrostructureResult> {
  const asset = symbol.toUpperCase().trim();
  const settled = await Promise.allSettled([
    fetchBinanceOrderBook(asset),
    fetchKrakenOrderBook(asset),
  ]);
  const venues = settled.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  return {
    status: venues.length >= 2 ? 'READY' : venues.length === 1 ? 'PARTIAL' : 'DATA_UNAVAILABLE',
    symbol: asset,
    venues,
    arbitrage: evaluateArbitrage(venues),
    providers: venues.map(v => v.provider),
    evidenceIds: venues.map(v => v.evidenceId),
    scoringImpact: 'NONE',
    executionEligible: false,
  };
}
