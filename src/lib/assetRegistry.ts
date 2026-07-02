import fs from 'fs';
import path from 'path';

export interface RegistryAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
  subtype?: 'memecoin' | 'standard';
  price: number;
  change24h: number;
  expectedReturn: number; // in %
  volatility: number;     // in %
  drift: number;          // drift factor for GBM
  risk: 'High' | 'Medium' | 'Low';
  status: string;
  marketCap?: number;
  volume24h: number;
  score: number;
  pattern?: string;
  applicationArea?: string;
  peRatio?: number;
  debtToEquity?: number;
  dividendYield?: number;
  isLocked?: boolean;
}

export class AssetRegistry {
  private assets: Map<string, RegistryAsset> = new Map();
  private historyCache: Map<string, { date: string, close: number }[]> = new Map();

  constructor() {
    this.initializeDefaultRegistry();
  }

  private initializeDefaultRegistry() {
    const defaultAssets: RegistryAsset[] = [
      // Standard Cryptos
      { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', subtype: 'standard', price: 68500.0, change24h: 2.45, expectedReturn: 18, volatility: 55, drift: 0.25, risk: 'High', status: 'Verifiziert', marketCap: 1340.0, dividendYield: 0.0, volume24h: 28500.0, score: 8.5, pattern: 'Bullish Engulfing', applicationArea: 'DeFi & Smart Contracts' },
      { symbol: 'ETH', name: 'Ethereum', type: 'crypto', subtype: 'standard', price: 3450.0, change24h: -1.2, expectedReturn: 15, volatility: 58, drift: 0.18, risk: 'High', status: 'Verifiziert', marketCap: 415.0, dividendYield: 0.0, volume24h: 15200.0, score: 7.4, pattern: 'Hammer Support', applicationArea: 'Webanwendungen' },
      { symbol: 'SOL', name: 'Solana', type: 'crypto', subtype: 'standard', price: 145.2, change24h: 5.8, expectedReturn: 22, volatility: 75, drift: 0.35, risk: 'High', status: 'Verifiziert', marketCap: 67.5, dividendYield: 0.0, volume24h: 3800.0, score: 8.6, pattern: 'Morning Star', applicationArea: 'Webanwendungen' },
      { symbol: 'ADA', name: 'Cardano', type: 'crypto', subtype: 'standard', price: 0.42, change24h: -0.8, expectedReturn: 10, volatility: 65, drift: 0.10, risk: 'High', status: 'Verifiziert', marketCap: 15.1, dividendYield: 0.0, volume24h: 420.0, score: 6.5, pattern: 'Double Bottom', applicationArea: 'Webanwendungen' },
      { symbol: 'XRP', name: 'Ripple', type: 'crypto', subtype: 'standard', price: 0.58, change24h: 1.1, expectedReturn: 12, volatility: 48, drift: 0.15, risk: 'Medium', status: 'Verifiziert', marketCap: 31.2, dividendYield: 0.0, volume24h: 850.0, score: 6.8, pattern: 'Cup & Handle', applicationArea: 'DeFi & Smart Contracts' },
      { symbol: 'DOT', name: 'Polkadot', type: 'crypto', subtype: 'standard', price: 6.20, change24h: -2.3, expectedReturn: 11, volatility: 52, drift: 0.12, risk: 'Medium', status: 'Verifiziert', marketCap: 6.5, dividendYield: 0.0, volume24h: 180.0, score: 5.9, pattern: 'Double Bottom', applicationArea: 'Webanwendungen' },
      { symbol: 'AVAX', name: 'Avalanche', type: 'crypto', subtype: 'standard', price: 28.50, change24h: 3.2, expectedReturn: 16, volatility: 62, drift: 0.22, risk: 'High', status: 'Verifiziert', marketCap: 10.8, dividendYield: 0.0, volume24h: 320.0, score: 7.2, pattern: 'Morning Star', applicationArea: 'Webanwendungen' },
      { symbol: 'LINK', name: 'Chainlink', type: 'crypto', subtype: 'standard', price: 15.40, change24h: -0.5, expectedReturn: 14, volatility: 50, drift: 0.18, risk: 'Medium', status: 'Verifiziert', marketCap: 8.9, dividendYield: 0.0, volume24h: 240.0, score: 7.5, pattern: 'Hammer Support', applicationArea: 'DeFi & Smart Contracts' },
      { symbol: 'BNB', name: 'Binance Coin', type: 'crypto', subtype: 'standard', price: 585.00, change24h: 0.7, expectedReturn: 13, volatility: 40, drift: 0.16, risk: 'Medium', status: 'Verifiziert', marketCap: 87.2, dividendYield: 0.0, volume24h: 1150.0, score: 7.8, pattern: 'Ascending Triangle', applicationArea: 'DeFi & Smart Contracts' },
      { symbol: 'MATIC', name: 'Polygon', type: 'crypto', subtype: 'standard', price: 0.55, change24h: 1.5, expectedReturn: 12, volatility: 56, drift: 0.14, risk: 'High', status: 'Verifiziert', marketCap: 5.1, dividendYield: 0.0, volume24h: 140.0, score: 6.4, pattern: 'Cup & Handle', applicationArea: 'Webanwendungen' },

      // Meme Cryptos
      { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', subtype: 'memecoin', price: 0.134, change24h: 8.4, expectedReturn: 25, volatility: 95, drift: 0.45, risk: 'High', status: 'Verifiziert', marketCap: 18.4, dividendYield: 0.0, volume24h: 1540.0, score: 7.9, pattern: 'Bull Flag', applicationArea: 'Meme Community' },
      { symbol: 'SHIB', name: 'Shiba Inu', type: 'crypto', subtype: 'memecoin', price: 0.0000174, change24h: 4.2, expectedReturn: 28, volatility: 110, drift: 0.50, risk: 'High', status: 'Verifiziert', marketCap: 10.2, dividendYield: 0.0, volume24h: 920.0, score: 7.4, pattern: 'Ascending Triangle', applicationArea: 'Meme Community' },
      { symbol: 'PEPE', name: 'Pepe', type: 'crypto', subtype: 'memecoin', price: 0.0000115, change24h: 12.8, expectedReturn: 35, volatility: 130, drift: 0.65, risk: 'High', status: 'Verifiziert', marketCap: 4.8, dividendYield: 0.0, volume24h: 1250.0, score: 8.2, pattern: 'Bullish Engulfing', applicationArea: 'Meme Community' },
      { symbol: 'WIF', name: 'dogwifhat', type: 'crypto', subtype: 'memecoin', price: 2.15, change24h: -5.4, expectedReturn: 30, volatility: 120, drift: 0.55, risk: 'High', status: 'Verifiziert', marketCap: 2.15, dividendYield: 0.0, volume24h: 420.0, score: 6.8, pattern: 'Falling Wedge', applicationArea: 'Meme Community' },
      { symbol: 'BONK', name: 'Bonk', type: 'crypto', subtype: 'memecoin', price: 0.0000212, change24h: -1.8, expectedReturn: 26, volatility: 105, drift: 0.48, risk: 'High', status: 'Verifiziert', marketCap: 1.45, dividendYield: 0.0, volume24h: 210.0, score: 6.2, pattern: 'Double Bottom', applicationArea: 'Meme Community' },
      { symbol: 'FLOKI', name: 'Floki', type: 'crypto', subtype: 'memecoin', price: 0.000145, change24h: 3.5, expectedReturn: 24, volatility: 100, drift: 0.44, risk: 'High', status: 'Verifiziert', marketCap: 1.38, dividendYield: 0.0, volume24h: 180.0, score: 7.1, pattern: 'Cup & Handle', applicationArea: 'Meme Community' },
      { symbol: 'POPCAT', name: 'Popcat', type: 'crypto', subtype: 'memecoin', price: 0.45, change24h: 15.6, expectedReturn: 40, volatility: 140, drift: 0.70, risk: 'High', status: 'Verifiziert', marketCap: 0.44, dividendYield: 0.0, volume24h: 85.0, score: 8.5, pattern: 'Morning Star', applicationArea: 'Meme Community' },
      { symbol: 'BRETT', name: 'Brett', type: 'crypto', subtype: 'memecoin', price: 0.125, change24h: 6.1, expectedReturn: 32, volatility: 115, drift: 0.58, risk: 'High', status: 'Verifiziert', marketCap: 1.24, dividendYield: 0.0, volume24h: 95.0, score: 7.5, pattern: 'Ascending Channel', applicationArea: 'Meme Community' },
      { symbol: 'MOG', name: 'Mog Coin', type: 'crypto', subtype: 'memecoin', price: 0.00000185, change24h: -3.2, expectedReturn: 29, volatility: 110, drift: 0.52, risk: 'High', status: 'Verifiziert', marketCap: 0.71, dividendYield: 0.0, volume24h: 48.0, score: 6.0, pattern: 'Double Top', applicationArea: 'Meme Community' },
      { symbol: 'BOME', name: 'Book of Meme', type: 'crypto', subtype: 'memecoin', price: 0.0084, change24h: -0.9, expectedReturn: 22, volatility: 95, drift: 0.40, risk: 'High', status: 'Verifiziert', marketCap: 0.58, dividendYield: 0.0, volume24h: 110.0, score: 6.4, pattern: 'Hammer Support', applicationArea: 'Meme Community' },

      // Stocks
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', price: 189.3, change24h: 1.15, expectedReturn: 11, volatility: 18, drift: 0.12, risk: 'Low', status: 'Verifiziert', peRatio: 28.5, debtToEquity: 1.45, marketCap: 2950.0, dividendYield: 0.51, volume24h: 9500.0, score: 7.2, pattern: 'Cup & Handle', applicationArea: 'Unterhaltung & Services' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock', price: 415.6, change24h: 0.85, expectedReturn: 12, volatility: 15, drift: 0.15, risk: 'Low', status: 'Verifiziert', peRatio: 35.2, debtToEquity: 0.28, marketCap: 3080.0, dividendYield: 0.72, volume24h: 12400.0, score: 7.8, pattern: 'Ascending Channel', applicationArea: 'E-Commerce & Cloud' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', price: 172.5, change24h: -0.42, expectedReturn: 11, volatility: 20, drift: 0.14, risk: 'Low', status: 'Verifiziert', peRatio: 25.4, debtToEquity: 0.06, marketCap: 2150.0, dividendYield: 0.46, volume24h: 8100.0, score: 7.1, pattern: 'Three Inside Up', applicationArea: 'Webanwendungen' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', price: 185.2, change24h: -1.1, expectedReturn: 12, volatility: 22, drift: 0.16, risk: 'Medium', status: 'Verifiziert', peRatio: 40.1, debtToEquity: 0.42, marketCap: 1920.0, dividendYield: 0.0, volume24h: 9100.0, score: 6.4, pattern: 'Falling Wedge', applicationArea: 'E-Commerce & Cloud' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'stock', price: 127.4, change24h: 4.62, expectedReturn: 25, volatility: 45, drift: 0.45, risk: 'High', status: 'Verifiziert', peRatio: 68.4, debtToEquity: 0.15, marketCap: 3120.0, dividendYield: 0.03, volume24h: 24500.0, score: 9.1, pattern: 'Ascending Triangle', applicationArea: 'Hardware & AI' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', price: 178.4, change24h: -3.45, expectedReturn: 15, volatility: 40, drift: 0.15, risk: 'High', status: 'Verifiziert', peRatio: 48.2, debtToEquity: 0.05, marketCap: 565.0, dividendYield: 0.0, volume24h: 14800.0, score: 5.8, pattern: 'Double Bottom', applicationArea: 'Andere' },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', price: 504.2, change24h: 1.68, expectedReturn: 14, volatility: 28, drift: 0.20, risk: 'Medium', status: 'Verifiziert', peRatio: 28.1, debtToEquity: 0.07, marketCap: 1280.0, dividendYield: 0.4, volume24h: 11200.0, score: 7.8, pattern: 'Cup & Handle', applicationArea: 'Webanwendungen' },
      { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', price: 610.5, change24h: -0.5, expectedReturn: 13, volatility: 30, drift: 0.15, risk: 'Medium', status: 'Verifiziert', peRatio: 36.5, debtToEquity: 0.85, marketCap: 265.0, dividendYield: 0.0, volume24h: 4500.0, score: 7.5, pattern: 'Morning Star', applicationArea: 'Webanwendungen' },
      { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', price: 160.2, change24h: 2.1, expectedReturn: 15, volatility: 35, drift: 0.22, risk: 'High', status: 'Verifiziert', peRatio: 52.0, debtToEquity: 0.04, marketCap: 258.0, dividendYield: 0.0, volume24h: 7500.0, score: 7.2, pattern: 'Double Bottom', applicationArea: 'Hardware & AI' },
      { symbol: 'INTC', name: 'Intel Corp.', type: 'stock', price: 30.4, change24h: -0.95, expectedReturn: 5, volatility: 25, drift: 0.05, risk: 'Low', status: 'Verifiziert', peRatio: 22.8, debtToEquity: 0.38, marketCap: 129.0, dividendYield: 1.64, volume24h: 3100.0, score: 5.4, pattern: 'Bull Flag', applicationArea: 'Hardware & AI' },

      // Forex
      { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex', price: 1.0824, change24h: 0.12, expectedReturn: 3, volatility: 8, drift: 0.01, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1202.48, score: 5.5 },
      { symbol: 'GBPUSD', name: 'British Pound / US Dollar', type: 'forex', price: 1.2645, change24h: -0.15, expectedReturn: 3, volatility: 8, drift: 0.01, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1205.29, score: 5.0 },
      { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', type: 'forex', price: 156.85, change24h: 0.35, expectedReturn: 4, volatility: 10, drift: 0.02, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1203.7, score: 6.1 },
      { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', type: 'forex', price: 1.3652, change24h: 0.04, expectedReturn: 3, volatility: 7, drift: 0.01, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.3, score: 5.2 },
      { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', type: 'forex', price: 0.9085, change24h: -0.21, expectedReturn: 2, volatility: 8, drift: 0.01, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.82, score: 4.7 },
      { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', type: 'forex', price: 0.6625, change24h: 0.18, expectedReturn: 4, volatility: 9, drift: 0.02, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.25, score: 5.6 },
      { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', type: 'forex', price: 0.6125, change24h: 0.15, expectedReturn: 3, volatility: 9, drift: 0.01, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.12, score: 5.4 },
      { symbol: 'EURGBP', name: 'Euro / British Pound', type: 'forex', price: 0.8552, change24h: -0.08, expectedReturn: 2, volatility: 6, drift: 0.01, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1201.05, score: 5.1 },
      { symbol: 'EURJPY', name: 'Euro / Japanese Yen', type: 'forex', price: 169.54, change24h: 0.28, expectedReturn: 4, volatility: 10, drift: 0.02, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1202.15, score: 5.8 },
      { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', type: 'forex', price: 198.24, change24h: 0.42, expectedReturn: 5, volatility: 11, drift: 0.02, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 1203.45, score: 6.2 },

      // Commodities
      { symbol: 'GLD', name: 'Gold Spot', type: 'commodity', price: 2340.5, change24h: 0.65, expectedReturn: 6, volatility: 14, drift: 0.04, risk: 'Low', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 360.25, score: 6.8 },
      { symbol: 'SLV', name: 'Silver Spot', type: 'commodity', price: 30.12, change24h: 1.45, expectedReturn: 7, volatility: 20, drift: 0.05, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 350.12, score: 7.4 },
      { symbol: 'USO', name: 'Crude Oil', type: 'commodity', price: 78.45, change24h: -1.82, expectedReturn: 5, volatility: 25, drift: 0.03, risk: 'Medium', status: 'Verifiziert', marketCap: 450.0, dividendYield: 0.0, volume24h: 358.45, score: 4.1 },
      { symbol: 'NG=F', name: 'Natural Gas', type: 'commodity', price: 2.54, change24h: 3.12, expectedReturn: 8, volatility: 45, drift: 0.08, risk: 'High', status: 'Verifiziert', marketCap: 180.0, dividendYield: 0.0, volume24h: 220.50, score: 6.5 },
      { symbol: 'WTI', name: 'WTI Crude Oil', type: 'commodity', price: 77.20, change24h: -1.40, expectedReturn: 6, volatility: 25, drift: 0.04, risk: 'Medium', status: 'Verifiziert', marketCap: 1050.0, dividendYield: 0.0, volume24h: 410.80, score: 5.8 },
      { symbol: 'BRENT', name: 'Brent Crude Oil', type: 'commodity', price: 81.85, change24h: -1.25, expectedReturn: 5, volatility: 23, drift: 0.03, risk: 'Medium', status: 'Verifiziert', marketCap: 1150.0, dividendYield: 0.0, volume24h: 460.20, score: 6.1 },
      { symbol: 'COPPER', name: 'Copper Spot', type: 'commodity', price: 4.54, change24h: 1.12, expectedReturn: 6, volatility: 22, drift: 0.04, risk: 'Medium', status: 'Verifiziert', marketCap: 650.0, dividendYield: 0.0, volume24h: 210.40, score: 6.6 },
      { symbol: 'PALL', name: 'Palladium Spot', type: 'commodity', price: 955.00, change24h: -2.15, expectedReturn: 5, volatility: 32, drift: 0.03, risk: 'High', status: 'Verifiziert', marketCap: 380.0, dividendYield: 0.0, volume24h: 45.20, score: 4.8 },
      { symbol: 'PLAT', name: 'Platinum Spot', type: 'commodity', price: 980.00, change24h: -0.85, expectedReturn: 5, volatility: 25, drift: 0.03, risk: 'Medium', status: 'Verifiziert', marketCap: 420.0, dividendYield: 0.0, volume24h: 58.50, score: 5.3 },
      { symbol: 'CORN', name: 'Corn Futures', type: 'commodity', price: 4.42, change24h: 0.55, expectedReturn: 4, volatility: 18, drift: 0.02, risk: 'Low', status: 'Verifiziert', marketCap: 150.0, dividendYield: 0.0, volume24h: 125.40, score: 5.9 }
    ];

    default_assets: for (const a of defaultAssets) {
      this.assets.set(a.symbol.toUpperCase(), a);
    }
  }

  public getAssets(): RegistryAsset[] {
    return Array.from(this.assets.values());
  }

  public getAsset(symbol: string): RegistryAsset | undefined {
    return this.assets.get(symbol.toUpperCase());
  }

  public updateAsset(symbol: string, updates: Partial<RegistryAsset>, isManual: boolean = false) {
    const asset = this.getAsset(symbol);
    if (asset) {
      if (asset.isLocked && !isManual) {
        // If locked and not updated manually, skip price and change metrics
        const { price, change24h, marketCap, volume24h, score, ...otherUpdates } = updates;
        Object.assign(asset, otherUpdates);
      } else {
        Object.assign(asset, updates);
        if (isManual) {
          if (updates.isLocked !== undefined) {
            asset.isLocked = updates.isLocked;
          } else {
            asset.isLocked = true; // lock on manual override by default
          }
        }
      }
      this.assets.set(symbol.toUpperCase(), asset);
    }
  }

  // Pre-cached or generated high-speed history data for Backtests and Monte Carlo
  public async getHistory(symbol: string, limit: number): Promise<{ date: string, close: number }[]> {
    const s = symbol.toUpperCase().trim();
    const cacheKey = `${s}_${limit}`;

    if (this.historyCache.has(cacheKey)) {
      return this.historyCache.get(cacheKey)!;
    }

    const asset = this.getAsset(s);
    const startPrice = asset ? asset.price : 100;
    const vol = asset ? asset.volatility / 100 : 0.25;
    const drift = asset ? asset.drift : 0.08;

    // Fast deterministic generation based on geometric brownian motion parameters
    // This reduces external Stooq and Alpha Vantage query load dramatically
    const history = [];
    let currentPrice = startPrice;
    const now = new Date();

    for (let i = limit; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateFormatted = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getFullYear()).substring(2)}`;
      
      // Geometric Brownian motion step simulation
      const rand = this.seededRandom(s, i);
      const dailyDrift = (drift - 0.5 * vol * vol) / 252;
      const dailyVol = vol / Math.sqrt(252);
      currentPrice = currentPrice * Math.exp(dailyDrift + dailyVol * rand);

      if (currentPrice <= 0) currentPrice = 0.01;

      history.push({
        date: dateFormatted,
        close: Number(currentPrice.toFixed(s === 'EURUSD' || s === 'GBPUSD' ? 4 : 2))
      });
    }

    this.historyCache.set(cacheKey, history);
    return history;
  }

  // Deterministic random generation so different backtest runs of same asset match perfectly
  private seededRandom(seed: string, step: number): number {
    const str = seed + step;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    // Convert hash to seeded normal distribution using Box-Muller transform
    const r1 = Math.abs((Math.sin(hash) * 10000) % 1);
    const r2 = Math.abs((Math.cos(hash) * 10000) % 1);
    const z0 = Math.sqrt(-2.0 * Math.log(r1 || 0.0001)) * Math.cos(2.0 * Math.PI * r2);
    return z0;
  }
}

export const assetRegistry = new AssetRegistry();
