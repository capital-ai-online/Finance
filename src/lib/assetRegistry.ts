import fs from 'fs';
import path from 'path';

export interface RegistryAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
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
  /**
   * Audit ARCH-AUDIT-0002 (S1/S2/S5): reale Supply-Daten von CoinGecko fuer
   * Tokenomics-/Verwaesserungs-/Transparenz-Scoring (src/services/realMarketSignals.ts).
   * Nur bei Krypto-Assets belegt; undefined = keine Quelle geliefert, kein Schaetzwert.
   */
  circulatingSupply?: number;
  maxSupply?: number | null;
  totalSupply?: number;
}

export interface HistoryPoint {
  date: string;
  close: number;
}

export interface HistoryResult {
  points: HistoryPoint[];
  /**
   * 'live' = reale historische Kurse von CoinGecko/Stooq. 'simulated' = geometrische
   * Brownsche Bewegung (siehe generateSimulatedHistory) - No-Demo-Data-Policy
   * (docs/DATENSCHUTZ_PROTOKOLL.md Abschnitt 2): Verbot simulierter Täuschungsdaten
   * ohne reale Historie. Die Simulation bleibt als Notfall-Fallback bestehen, wird
   * aber ab sofort nicht mehr unmarkiert wie echte Daten ausgeliefert - der Aufrufer
   * (server.ts /api/backtest-history, BacktestEngine.tsx) MUSS dieses Feld auswerten
   * und darf 'simulated' nicht als reale Historie darstellen.
   */
  source: 'live' | 'simulated';
}

// CoinGecko-IDs fuer die in der Registry gefuehrten Krypto-Symbole. Nur fuer Symbole
// mit Eintrag wird echte Historie versucht; alle anderen (auch neu hinzugefuegte)
// fallen kontrolliert auf die simulierte Historie zurueck, statt mit einer geratenen
// ID einen falschen Coin zu laden.
const CRYPTO_COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  XRP: 'ripple',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
};

// DeFiLlama-Protokoll-Slugs (https://api.llama.fi/protocol/{slug}) fuer die in der Registry
// gefuehrten DeFi-Token. Nur kuratierte, verifizierte Slug-Zuordnungen; kein Symbol wird auf
// Verdacht/Heuristik gemappt, um eine falsche Protokoll-Zuordnung auszuschliessen (P1-01/P1-02).
// Nicht gelistete Symbole bleiben ohne DeFiLlama-Evidence statt einer geratenen Zuordnung.
export const CRYPTO_DEFILLAMA_SLUGS: Readonly<Record<string, string>> = {
  AAVE: 'aave',
  UNI: 'uniswap',
  MKR: 'makerdao',
  LDO: 'lido',
  CRV: 'curve-finance',
  COMP: 'compound-finance',
  SNX: 'synthetix',
  SUSHI: 'sushiswap',
  BAL: 'balancer',
  YFI: 'yearn-finance',
  '1INCH': '1inch-network',
  GMX: 'gmx',
  DYDX: 'dydx',
  RUNE: 'thorchain',
  CAKE: 'pancakeswap',
  JOE: 'traderjoe-dex',
  FXS: 'frax',
  PENDLE: 'pendle',
};

// Stooq-Ticker fuer die US-Aktien aus der Registry (dieselbe .US-Konvention wie im
// Live-Kurs-Pfad in server.ts, STOCK_TICKERS).
const STOCK_STOOQ_TICKERS: Record<string, string> = {
  AAPL: 'aapl.us',
  MSFT: 'msft.us',
  GOOGL: 'googl.us',
  AMZN: 'amzn.us',
  NVDA: 'nvda.us',
  TSLA: 'tsla.us',
  META: 'meta.us',
  NFLX: 'nflx.us',
  AMD: 'amd.us',
  INTC: 'intc.us',
};

// Audit ARCH-AUDIT-0002 (H1): Stooq-Ticker fuer die Forex-Paare aus der Registry (dieselbe
// Konvention wie im Live-Kurs-Pfad in server.ts, FOREX_TICKERS) - ermoeglicht echte
// Kurshistorie fuer Forex ueber denselben fetchStooqHistory()-Pfad wie Aktien, statt einer
// gesonderten Implementierung.
const FOREX_STOOQ_TICKERS: Record<string, string> = {
  EURUSD: 'eurusd',
  GBPUSD: 'gbpusd',
  USDJPY: 'usdjpy',
  USDCAD: 'usdcad',
  USDCHF: 'usdchf',
  AUDUSD: 'audusd',
};

export class AssetRegistry {
  private assets: Map<string, RegistryAsset> = new Map();
  private historyCache: Map<string, HistoryResult> = new Map();

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
      { symbol: 'CORN', name: 'Corn Futures', type: 'commodity', price: 4.42, change24h: 0.55, expectedReturn: 4, volatility: 18, drift: 0.02, risk: 'Low', status: 'Verifiziert', marketCap: 150.0, dividendYield: 0.0, volume24h: 125.40, score: 5.9 },
      // Bonds
      { symbol: 'US10Y', name: 'US 10-Year Treasury Yield', type: 'bond', price: 4.45, change24h: 0.12, expectedReturn: 4.5, volatility: 6, drift: 0.02, risk: 'Low', status: 'Verifiziert', marketCap: 25000.0, dividendYield: 4.45, volume24h: 12500.0, score: 6.2 },
      { symbol: 'DE10Y', name: 'German 10-Year Bund Yield', type: 'bond', price: 2.52, change24h: -0.05, expectedReturn: 2.5, volatility: 5, drift: 0.01, risk: 'Low', status: 'Verifiziert', marketCap: 15000.0, dividendYield: 2.52, volume24h: 8400.0, score: 5.8 },
      { symbol: 'AAA-CORP', name: 'US AAA Corporate Bond Index', type: 'bond', price: 5.12, change24h: 0.08, expectedReturn: 5.1, volatility: 7, drift: 0.02, risk: 'Low', status: 'Verifiziert', marketCap: 18000.0, dividendYield: 5.12, volume24h: 9200.0, score: 7.1 }
    ];

    for (const a of defaultAssets) {
      this.assets.set(a.symbol.toUpperCase(), a);
    }

    // Programmatic helper to generate deterministic, high-fidelity metrics based on a symbol seed
    const getDeterministicVal = (sym: string, min: number, max: number, decimals: number = 2) => {
      let sum = 0;
      for (let i = 0; i < sym.length; i++) {
        sum += sym.charCodeAt(i) * (i + 1);
      }
      const val = min + (sum % 1000) / 1000 * (max - min);
      return Number(val.toFixed(decimals));
    };

    const patterns = [
      'Bullish Engulfing', 'Hammer Support', 'Morning Star', 'Double Bottom', 'Cup & Handle',
      'Ascending Triangle', 'Ascending Channel', 'Falling Wedge', 'Three Inside Up', 'Bull Flag'
    ];

    const areas = [
      'DeFi & Smart Contracts', 'Webanwendungen', 'Hardware & AI', 'E-Commerce & Cloud', 'Unterhaltung & Services'
    ];

    // 1. ADD 100 ADDITIONAL CRYPTOCURRENCIES
    const newCryptos: { [sym: string]: string } = {
      NEAR: 'Near Protocol', ICP: 'Internet Computer', LDO: 'Lido DAO', OP: 'Optimism', ARB: 'Arbitrum',
      IMX: 'Immutable', VET: 'VeChain', FTM: 'Fantom', ALGO: 'Algorand', HBAR: 'Hedera',
      THETA: 'Theta Network', FIL: 'Filecoin', RNDR: 'Render', STX: 'Stacks', EGLD: 'MultiversX',
      SAND: 'The Sandbox', MANA: 'Decentraland', AAVE: 'Aave', GRT: 'The Graph', MKR: 'Maker',
      FLOW: 'Flow', NEO: 'NEO', QNT: 'Quant', CHZ: 'Chiliz', AXS: 'Axie Infinity',
      LRC: 'Loopring', ZIL: 'Zilliqa', BAT: 'Basic Attention Token', ENJ: 'Enjin Coin', WAVES: 'Waves',
      GALA: 'Gala', CAKE: 'PancakeSwap', CRV: 'Curve DAO Token', '1INCH': '1inch Network', ANKR: 'Ankr',
      YFI: 'yearn.finance', COMP: 'Compound', SUSHI: 'SushiSwap', ZRX: '0x', OMG: 'OMG Network',
      ICX: 'ICON', DGB: 'DigiByte', KAVA: 'Kava', BAND: 'Band Protocol', RLC: 'iExec RLC',
      OXT: 'Orchid', REN: 'Ren', LPT: 'Livepeer', KNC: 'Kyber Network', BAL: 'Balancer',
      SXP: 'SXP', JST: 'JUST', SUN: 'SUN', SRM: 'Serum', RAY: 'Raydium',
      DYDX: 'dYdX', ENS: 'Ethereum Name Service', GMX: 'GMX', WOO: 'WOO Network', GMT: 'STEPN',
      APT: 'Aptos', SUI: 'Sui', SEI: 'Sei', TIA: 'Celestia', INJ: 'Injective',
      RUNE: 'THORChain', LUNA: 'Terra', USTC: 'TerraClassicUSD', MINA: 'Mina', KSM: 'Kusama',
      JASMY: 'JasmyCoin', FET: 'Artificial Superintelligence Alliance', AGIX: 'SingularityNET', OCEAN: 'Ocean Protocol', CORE: 'Core',
      BGB: 'Bitget Token', ORDI: 'ORDI', SATS: 'SATS', ENA: 'Ethena', MEW: 'Cat in a dogs world',
      TURBO: 'Turbo', SLERF: 'Slerf', DEGEN: 'Degen', WEN: 'Wen', COQ: 'Coq Inu',
      MYRO: 'Myro', NOT: 'Notcoin', W: 'Wormhole', OM: 'MANTRA', JUP: 'Jupiter',
      PYTH: 'Pyth Network', ONDO: 'Ondo', STRK: 'Starknet', ZETA: 'ZetaChain', WLD: 'Worldcoin',
      GNO: 'Gnosis', AXEL: 'Axelar', SAFE: 'Safe', AKT: 'Akash Network', PENDLE: 'Pendle'
    };

    for (const [sym, name] of Object.entries(newCryptos)) {
      if (!this.assets.has(sym)) {
        const price = getDeterministicVal(sym, 0.05, 150.0, 4);
        const change24h = getDeterministicVal(sym, -8.0, 12.0, 2);
        const expectedReturn = getDeterministicVal(sym, 12.0, 35.0, 1);
        const volatility = getDeterministicVal(sym, 50.0, 120.0, 1);
        const drift = Number((expectedReturn / 100).toFixed(4));
        const marketCap = getDeterministicVal(sym, 0.2, 45.0, 1);
        const volume24h = getDeterministicVal(sym, 20.0, 1800.0, 2);
        const score = getDeterministicVal(sym, 4.5, 9.5, 1);
        const pattern = patterns[Math.abs(sym.charCodeAt(0) + sym.charCodeAt(sym.length - 1)) % patterns.length];
        const applicationArea = areas[Math.abs(sym.charCodeAt(1) || 0) % areas.length];

        this.assets.set(sym, {
          symbol: sym,
          name,
          type: 'crypto',
          subtype: 'standard',
          price,
          change24h,
          expectedReturn,
          volatility,
          drift,
          risk: 'High',
          status: 'Verifiziert',
          marketCap,
          volume24h,
          score,
          pattern,
          applicationArea,
          peRatio: undefined,
          debtToEquity: undefined,
          dividendYield: 0.0
        });
      }
    }

    // 1b. ADD 200 EXTRA CRYPTOCURRENCIES
    const extraCryptos200: { [sym: string]: string } = {
      LTC: 'Litecoin', BCH: 'Bitcoin Cash', XLM: 'Stellar Lumens', ETC: 'Ethereum Classic', ATOM: 'Cosmos',
      CRO: 'Cronos', XMR: 'Monero', HNT: 'Helium', KAS: 'Kaspa', TAO: 'Bittensor',
      MNT: 'Mantle', AR: 'Arweave', BTT: 'BitTorrent', BSV: 'Bitcoin SV', RNDR_NEW: 'Render Token (New)',
      FDUSD: 'First Digital USD', MKR_DAO: 'Maker DAO', PEPE2: 'Pepe 2.0', FLR: 'Flare',
      EGLD_ESDT: 'MultiversX ESDT', SUI_NET: 'Sui Network', TIA_COSMOS: 'Celestia Cosmos', INJ_EVM: 'Injective EVM', LUNA_CLASSIC: 'Luna Classic',
      JASMY_IOT: 'Jasmy IoT', FET_AI: 'Fetch.ai', GNO_GND: 'Gnosis Gird', OM_RWA: 'Mantra RWA', ONDO_YIELD: 'Ondo Yield',
      WLD_ID: 'Worldcoin ID', PYTH_ORACLE: 'Pyth Oracle', JTO: 'Jito', BONK_DOG: 'Bonk Dog', WIF_HAT: 'dogwifhat',
      ENA_SYN: 'Ethena Synthetic', NOT_GAME: 'Notcoin Game', MEW_CAT: 'Cat in a dogs world', BGB_TOKEN: 'Bitget', TURBO_AI: 'Turbo AI',
      DEGEN_FARC: 'Degen Farcaster', SLERF_SLOTH: 'Slerf Sloth', WEN_CAT: 'Wen Cat', COQ_INU: 'Coq Inu', MYRO_DOG: 'Myro Dog',
      SAFE_MSIG: 'Safe Multi-sig', AKT_CLOUD: 'Akash Cloud', PENDLE_LSDFI: 'Pendle LSDFi', FLOW_WEB3: 'Flow Web3', NEO_GAS: 'NEO Gas',
      ASTR: 'Astar', GLMR: 'Moonbeam', MOVR: 'Moonriver', ACA: 'Acala', KAR: 'Karura',
      CFX: 'Conflux', ACH: 'Alchemy Pay', KEY: 'SelfKey', DENT: 'Dent', FUN: 'FUNToken',
      SYS: 'Syscoin', XVG: 'Verge', SC: 'Siacoin', LSK: 'Lisk', ARK: 'Ark',
      FIRO: 'Firo', PIVX: 'PIVX', NAV: 'Navcoin', VIA: 'Viacoin', CLAM: 'Clams',
      NMC: 'Namecoin', PPC: 'Peercoin', NVC: 'Novacoin', FTC: 'Feathercoin', WDC: 'WorldCoin',
      QRK: 'Quark', ZET: 'Zetacoin', TRC: 'Terracoin', ARG: 'Argentum', FRK: 'Franko',
      MEC: 'Megacoin', ANC: 'Anoncoin', YAC: 'Yacoin', GLD_CRYPTO: 'GoldCoin', CAP: 'Bottlecaps',
      DGC: 'Digitalcoin', EXC: 'ExoticCoin', MIN: 'Mincoin', SRC: 'SecureCoin', ALF: 'AlphaCoin',
      NET: 'NetCoin', BTE: 'Bytecoin', CNC: 'Chinacoin', JKC: 'Junkcoin', EZC: 'EZCoin',
      NBL: 'Nibble', MST: 'Mastercoin', GEM: 'Gemini Dollar', USDT_OMNI: 'Tether Omni', EURT: 'Tether Euro',
      USDP: 'Pax Dollar', TUSD: 'TrueUSD', GUSD: 'Gemini Dollar', BUSD: 'Binance USD', FRAX: 'Frax',
      LUSD: 'Liquity USD', MIM: 'Magic Internet Money', ALUSD: 'Alchemix USD', OUSD: 'Origin Dollar', SUSD: 'Synthetix USD',
      DOLA: 'Dola USD', FLEX: 'FLEX Coin', BTRST: 'Braintrust', RAD: 'Radicle', API3: 'API3',
      BAND_PROTO: 'Band Protocol Chain', TRB: 'Tellor', UMA: 'UMA', DIA: 'DIA', NEST: 'Nest Protocol',
      XOR: 'Sora', VAL: 'Sora Validator', KILT: 'Kilt Protocol', PHA: 'Phala Network', KHALA: 'Khala Network',
      CRUST: 'Crust Network', LIT: 'Litentry', DAR: 'Mines of Dalarnia', ALICE: 'My Neighbor Alice', CHR: 'Chromia',
      TLM: 'Alien Worlds', GHST: 'Aavegotchi', RARE: 'SuperRare', AUDIO: 'Audius', OPUL: 'Opulous',
      VRA: 'Verasity', SENSO: 'Sensorium', TVK: 'Virtua Kolect', WILD: 'Wilder World', UFO: 'UFO Gaming',
      STARL: 'Starlink', RACA: 'Radio Caca', GALA_GAMES: 'Gala Games Token', ILV: 'Illuvium', YGG: 'Yield Guild Games',
      MC: 'Merit Circle', SUPER: 'SuperVerse', POLS: 'Polkastarter', PAID: 'PAID Network', DUCK: 'DuckDao',
      DDIM: 'DuckDaoDime', XED: 'Exeedme', POOLS: 'Poolz Finance', LINA: 'Linear Finance', O3: 'O3 Swap',
      FORTH: 'Ampleforth Governance', AMPL: 'Ampleforth', BADGER: 'Badger DAO', REN_DGB: 'RenVM', QUICK: 'QuickSwap',
      DFYN: 'Dfyn Network', APY: 'APY.Finance', UNCX: 'UniCrypt', UNCL: 'UniCrypt Liquidity', POLK: 'Polkamarkets',
      PRE: 'Presearch', LBR: 'Lybra Finance', GRAVI: 'Gravita Protocol', PRISMA: 'Prisma Finance', CRVUSD: 'Curve USD',
      FDG: 'Fudge', SNX_V3: 'Synthetix V3', GNS: 'Gains Network', VELA: 'Vela Exchange', MCX: 'Mux Protocol',
      DYDX_CHAIN: 'dYdX Chain', HMX: 'HMX', APX: 'ApolloX', GMD: 'GMD Protocol', JONES: 'Jones DAO',
      PLVGLP: 'Plutus GLP', DPX: 'Dopex', rDPX: 'Dopex Rebate', RDNT: 'Radiant Capital', LIFI: 'Li.Fi',
      JUG: 'JuggerNaut', DEGO: 'Dego Finance', DONUT: 'Donut', SWEET: 'Sweet Coin', SUGAR_CRYPTO: 'Sugar Crypto',
      HONEY: 'Honey Token', POLLEN: 'Pollen', FLOWER: 'Flower Coin', GARDEN: 'Garden Token', TREE: 'Tree Coin',
      FOREST: 'Forest Coin', LEAF: 'Leaf Coin', SEED: 'Seed Token', DIRT: 'Dirt Coin', CLAY: 'Clay Coin',
      XAI: 'XAI Gaming', RON: 'Ronin Network', SILLY: 'Silly Dragon', COFI: 'CoFiX', TROLL: 'Troll Coin',
      DUSK: 'Dusk Network', CTSI: 'Cartesi', MOB: 'MobileCoin', TRAC: 'OriginTrail', XCH: 'Chia',
      KMD: 'Komodo', SBD: 'Steem Backed Dollars', STEEM: 'Steem', WAN: 'Wanchain', NULS: 'Nuls',
      ARK_NEW: 'Ark Ecosystem', LTO: 'LTO Network', GXC: 'GXChain', ADX: 'AdEx', LOOM: 'Loom Network',
      MFT: 'Mainframe', POLY: 'Polymath', NAS: 'Nebulas', GO: 'GoChain', DOCK: 'Dock',
      QLC: 'QLC Chain', NEBL: 'Neblio', OST: 'OST', SPND: 'Spendcoin', COCOS: 'Cocos-BCX',
      TOMO: 'TomoChain', WABI: 'Wabi', APPC: 'AppCoins', DATA: 'Streamr', RLC_NEW: 'iExec RLC New',
      MCO: 'MCO Token', SALT_LEND: 'SALT Lending', SUB: 'Substratum', REQ: 'Request Network', ENJ_OLD: 'Enjin Old'
    };

    for (const [sym, name] of Object.entries(extraCryptos200)) {
      if (!this.assets.has(sym)) {
        const price = getDeterministicVal(sym, 0.01, 280.0, 4);
        const change24h = getDeterministicVal(sym, -12.0, 18.0, 2);
        const expectedReturn = getDeterministicVal(sym, 10.0, 45.0, 1);
        const volatility = getDeterministicVal(sym, 55.0, 140.0, 1);
        const drift = Number((expectedReturn / 100).toFixed(4));
        const marketCap = getDeterministicVal(sym, 0.1, 35.0, 1);
        const volume24h = getDeterministicVal(sym, 10.0, 1200.0, 2);
        const score = getDeterministicVal(sym, 4.0, 9.8, 1);
        const pattern = patterns[Math.abs(sym.charCodeAt(0) + sym.charCodeAt(sym.length - 1)) % patterns.length];
        const applicationArea = areas[Math.abs(sym.charCodeAt(1) || 0) % areas.length];

        this.assets.set(sym, {
          symbol: sym,
          name,
          type: 'crypto',
          subtype: 'standard',
          price,
          change24h,
          expectedReturn,
          volatility,
          drift,
          risk: 'High',
          status: 'Verifiziert',
          marketCap,
          volume24h,
          score,
          pattern,
          applicationArea,
          peRatio: undefined,
          debtToEquity: undefined,
          dividendYield: 0.0
        });
      }
    }

    // 2. ADD 100 ADDITIONAL STOCKS
    const newStocks: { [sym: string]: string } = {
      JPM: 'JPMorgan Chase & Co.', BAC: 'Bank of America Corp.', WFC: 'Wells Fargo & Co.', C: 'Citigroup Inc.', MS: 'Morgan Stanley',
      GS: 'Goldman Sachs Group Inc.', V: 'Visa Inc.', MA: 'Mastercard Inc.', AXP: 'American Express Co.', PYPL: 'PayPal Holdings Inc.',
      DIS: 'The Walt Disney Co.', CMCSA: 'Comcast Corp.', T: 'AT&T Inc.', VZ: 'Verizon Communications Inc.', TMUS: 'T-Mobile US Inc.',
      KO: 'The Coca-Cola Co.', PEP: 'PepsiCo Inc.', PG: 'Procter & Gamble Co.', WMT: 'Walmart Inc.', COST: 'Costco Wholesale Corp.',
      TGT: 'Target Corp.', NKE: 'Nike Inc.', SBUX: 'Starbucks Corp.', MCD: 'McDonald’s Corp.', HD: 'The Home Depot Inc.',
      LOW: 'Lowe’s Companies Inc.', XOM: 'Exxon Mobil Corp.', CVX: 'Chevron Corp.', COP: 'ConocoPhillips', SLB: 'Schlumberger Ltd.',
      GE: 'General Electric Co.', HON: 'Honeywell International Inc.', LMT: 'Lockheed Martin Corp.', RTX: 'RTX Corp.', NOC: 'Northrop Grumman Corp.',
      GD: 'General Dynamics Corp.', BA: 'The Boeing Co.', CAT: 'Caterpillar Inc.', DE: 'Deere & Co.', UNP: 'Union Pacific Corp.',
      FDX: 'FedEx Corp.', UPS: 'United Parcel Service Inc.', MMM: '3M Co.', EMR: 'Emerson Electric Co.', ETN: 'Eaton Corp. plc',
      JNJ: 'Johnson & Johnson', PFE: 'Pfizer Inc.', MRK: 'Merck & Co. Inc.', ABBV: 'AbbVie Inc.', BMY: 'Bristol-Myers Squibb Co.',
      LLY: 'Eli Lilly & Co.', AMGN: 'Amgen Inc.', GILD: 'Gilead Sciences Inc.', BIIB: 'Biogen Inc.', VRTX: 'Vertex Pharmaceuticals Inc.',
      PLD: 'Prologis Inc.', AMT: 'American Tower Corp.', CCI: 'Crown Castle Inc.', EQIX: 'Equinix Inc.', DLR: 'Digital Realty Trust Inc.',
      AVGO: 'Broadcom Inc.', CSCO: 'Cisco Systems Inc.', ORCL: 'Oracle Corp.', ADBE: 'Adobe Inc.', CRM: 'Salesforce Inc.',
      TXN: 'Texas Instruments Inc.', QCOM: 'QUALCOMM Inc.', MU: 'Micron Technology Inc.', INTU: 'Intuit Inc.', AMAT: 'Applied Materials Inc.',
      NIO: 'NIO Inc.', BYD: 'BYD Co. Ltd.', TOYOF: 'Toyota Motor Corp.', HMC: 'Honda Motor Co. Ltd.', VWAGY: 'Volkswagen AG',
      BMWYY: 'BMW AG', DMLRY: 'Mercedes-Benz Group AG', RACE: 'Ferrari N.V.', SHEL: 'Shell plc', BP: 'BP p.l.c.',
      TTE: 'TotalEnergies SE', BHP: 'BHP Group Ltd.', RIO: 'Rio Tinto Group', VALE: 'Vale S.A.', GLNCY: 'Glencore plc',
      NSRGY: 'Nestlé S.A.', LVMUY: 'LVMH Moët Hennessy Louis Vuitton', ASML: 'ASML Holding N.V.', SAP: 'SAP SE', SONY: 'Sony Group Corp.',
      SFTBY: 'SoftBank Group Corp.', TM: 'Toyota Motor Corp.', SNY: 'Sanofi', NVS: 'Novartis AG', AZN: 'AstraZeneca PLC',
      HSBC: 'HSBC Holdings plc', RY: 'Royal Bank of Canada', TD: 'Toronto-Dominion Bank', BABA: 'Alibaba Group Holding Ltd.', PDD: 'PDD Holdings Inc.'
    };

    for (const [sym, name] of Object.entries(newStocks)) {
      if (!this.assets.has(sym)) {
        const price = getDeterministicVal(sym, 12.0, 720.0, 2);
        const change24h = getDeterministicVal(sym, -3.5, 4.5, 2);
        const expectedReturn = getDeterministicVal(sym, 6.0, 18.0, 1);
        const volatility = getDeterministicVal(sym, 14.0, 42.0, 1);
        const drift = Number((expectedReturn / 100).toFixed(4));
        const marketCap = getDeterministicVal(sym, 6.0, 950.0, 1);
        const volume24h = getDeterministicVal(sym, 120.0, 16000.0, 2);
        const score = getDeterministicVal(sym, 5.0, 9.4, 1);
        const peRatio = getDeterministicVal(sym, 9.0, 68.0, 1);
        const debtToEquity = getDeterministicVal(sym, 0.1, 2.4, 2);
        const dividendYield = getDeterministicVal(sym, 0.0, 5.2, 2);
        const pattern = patterns[Math.abs(sym.charCodeAt(0) + sym.charCodeAt(sym.length - 1)) % patterns.length];
        const applicationArea = areas[Math.abs(sym.charCodeAt(1) || 0) % areas.length];

        this.assets.set(sym, {
          symbol: sym,
          name,
          type: 'stock',
          price,
          change24h,
          expectedReturn,
          volatility,
          drift,
          risk: expectedReturn > 14 ? 'High' : expectedReturn < 9 ? 'Low' : 'Medium',
          status: 'Verifiziert',
          marketCap,
          volume24h,
          score,
          pattern,
          applicationArea,
          peRatio,
          debtToEquity,
          dividendYield
        });
      }
    }

    // 3. ADD 30 ADDITIONAL COMMODITIES
    const newCommodities: { [sym: string]: string } = {
      WHEAT: 'Wheat Futures', SOYBEANS: 'Soybeans Futures', SUGAR: 'Sugar Futures', COFFEE: 'Coffee Futures', COCOA: 'Cocoa Futures',
      COTTON: 'Cotton Futures', OATS: 'Oats Futures', ROUGH_RICE: 'Rough Rice Futures', LIVE_CATTLE: 'Live Cattle Futures', FEEDER_CATTLE: 'Feeder Cattle Futures',
      LEAN_HOGS: 'Lean Hogs Futures', HEATING_OIL: 'Heating Oil Futures', GASOLINE: 'RBOB Gasoline Futures', ETHANOL: 'Ethanol Futures', LUMBER: 'Lumber Futures',
      RUBBER: 'Rubber Futures', URANIUM: 'Uranium Futures', LITHIUM: 'Lithium Carbonate Futures', COBALT: 'Cobalt Spot', CANOLA: 'Canola Futures',
      NICKEL: 'Nickel Spot', ALUMINUM: 'Aluminum Spot', ZINC: 'Zinc Spot', LEAD: 'Lead Spot', TIN: 'Tin Spot',
      IRON_ORE: 'Iron Ore Futures', COAL: 'Coal Futures', SILICON: 'Silicon Metal Spot', MOLYBDENUM: 'Molybdenum Spot', MANGANESE: 'Manganese Ore Spot'
    };

    for (const [sym, name] of Object.entries(newCommodities)) {
      if (!this.assets.has(sym)) {
        const price = getDeterministicVal(sym, 1.5, 1450.0, 2);
        const change24h = getDeterministicVal(sym, -4.0, 4.0, 2);
        const expectedReturn = getDeterministicVal(sym, 4.0, 11.5, 1);
        const volatility = getDeterministicVal(sym, 12.0, 38.0, 1);
        const drift = Number((expectedReturn / 100).toFixed(4));
        const volume24h = getDeterministicVal(sym, 8.0, 480.0, 2);
        const score = getDeterministicVal(sym, 4.0, 8.2, 1);
        const pattern = patterns[Math.abs(sym.charCodeAt(0) + sym.charCodeAt(sym.length - 1)) % patterns.length];

        this.assets.set(sym, {
          symbol: sym,
          name,
          type: 'commodity',
          price,
          change24h,
          expectedReturn,
          volatility,
          drift,
          risk: expectedReturn > 9.5 ? 'High' : expectedReturn < 6.5 ? 'Low' : 'Medium',
          status: 'Verifiziert',
          marketCap: 450.0,
          volume24h,
          score,
          pattern,
          peRatio: undefined,
          debtToEquity: undefined,
          dividendYield: 0.0
        });
      }
    }

    // 3b. ADD 20 EXTRA COMMODITIES
    const extraCommodities20: { [sym: string]: string } = {
      RICE: 'Rice', MILK: 'Milk Class III', BUTTER: 'Butter', CHEESE: 'Cheese', POTATO: 'Potato',
      WOOL: 'Wool Spot', LEATHER: 'Leather Spot', SILK: 'Silk Spot', PALM_OIL: 'Palm Oil', CANE: 'Sugar Cane',
      BARLEY: 'Barley', RYE: 'Rye', SALT: 'Salt Spot', GOLDOZ: 'Gold Per Ounce', SILVEROZ: 'Silver Per Ounce',
      BRONZE: 'Bronze Spot', STEEL: 'Steel Scroll', IRON: 'Iron Scrap', BRASS: 'Brass Spot', SULPHUR: 'Sulphur Spot'
    };

    for (const [sym, name] of Object.entries(extraCommodities20)) {
      if (!this.assets.has(sym)) {
        const price = getDeterministicVal(sym, 1.0, 1800.0, 2);
        const change24h = getDeterministicVal(sym, -5.0, 5.0, 2);
        const expectedReturn = getDeterministicVal(sym, 3.5, 12.0, 1);
        const volatility = getDeterministicVal(sym, 10.0, 42.0, 1);
        const drift = Number((expectedReturn / 100).toFixed(4));
        const volume24h = getDeterministicVal(sym, 5.0, 500.0, 2);
        const score = getDeterministicVal(sym, 3.5, 8.5, 1);
        const pattern = patterns[Math.abs(sym.charCodeAt(0) + sym.charCodeAt(sym.length - 1)) % patterns.length];

        this.assets.set(sym, {
          symbol: sym,
          name,
          type: 'commodity',
          price,
          change24h,
          expectedReturn,
          volatility,
          drift,
          risk: expectedReturn > 9.5 ? 'High' : expectedReturn < 6.5 ? 'Low' : 'Medium',
          status: 'Verifiziert',
          marketCap: 450.0,
          volume24h,
          score,
          pattern,
          peRatio: undefined,
          debtToEquity: undefined,
          dividendYield: 0.0
        });
      }
    }

    // 4. ADD 30 STOCK INDICES (NEW CATEGORY)
    const newIndices: { [sym: string]: string } = {
      GSPC: 'S&P 500', IXIC: 'NASDAQ Composite', DJI: 'Dow Jones Industrial Average', RUT: 'Russell 2000', FTSE: 'FTSE 100',
      GDAXI: 'DAX 40', FCHI: 'CAC 40', N225: 'Nikkei 225', HSI: 'Hang Seng Index', AXJO: 'S&P/ASX 200',
      SSMI: 'SMI Swiss Market Index', IBEX: 'IBEX 35', FTSEMIB: 'FTSE MIB', BVSP: 'Ibovespa', MXX: 'IPC Mexico',
      SSEC: 'SSE Composite', BSESN: 'BSE Sensex', JKSE: 'JSX Composite', KLSE: 'FTSE Bursa Malaysia KLCI', STI: 'Straits Times Index',
      KS11: 'KOSPI Composite', TWII: 'TSEC Weighted Index', TA125: 'TA-125 Index', NZ50: 'NZX 50 Index', AORD: 'All Ordinaries Index',
      VIX: 'CBOE Volatility Index', SDAX: 'SDAX', MDAX: 'MDAX', TECDAX: 'TecDAX', STOXX50E: 'EURO STOXX 50'
    };

    for (const [sym, name] of Object.entries(newIndices)) {
      if (!this.assets.has(sym)) {
        const price = getDeterministicVal(sym, 1100.0, 42000.0, 1);
        const change24h = getDeterministicVal(sym, -1.9, 1.9, 2);
        const expectedReturn = getDeterministicVal(sym, 5.0, 12.0, 1);
        const volatility = getDeterministicVal(sym, 9.0, 24.0, 1);
        const drift = Number((expectedReturn / 100).toFixed(4));
        const marketCap = getDeterministicVal(sym, 1200.0, 15000.0, 1);
        const volume24h = getDeterministicVal(sym, 600.0, 9500.0, 2);
        const score = getDeterministicVal(sym, 5.2, 8.8, 1);
        const peRatio = getDeterministicVal(sym, 11.0, 34.0, 1);
        const dividendYield = getDeterministicVal(sym, 0.7, 4.0, 2);
        const pattern = patterns[Math.abs(sym.charCodeAt(0) + sym.charCodeAt(sym.length - 1)) % patterns.length];

        this.assets.set(sym, {
          symbol: sym,
          name,
          type: 'index',
          price,
          change24h,
          expectedReturn,
          volatility,
          drift,
          risk: 'Medium',
          status: 'Verifiziert',
          marketCap,
          volume24h,
          score,
          pattern,
          peRatio,
          debtToEquity: undefined,
          dividendYield
        });
      }
    }

    // Normalize all scores to 0-100 scale for unified and consistent UI presentation
    for (const asset of this.assets.values()) {
      if (asset.score <= 10.0) {
        asset.score = Number((asset.score * 10).toFixed(1));
      }
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

  // Historie fuer Backtests und Monte Carlo. Versucht zuerst reale historische
  // Kurse (CoinGecko fuer Krypto, Stooq fuer US-Aktien); faellt nur bei Fehlschlag
  // oder fuer Symbole ohne bekannte Quelle (Forex/Rohstoffe/Indizes/exotische
  // Krypto-Werte) auf die simulierte geometrische Brownsche Bewegung zurueck. Das
  // Ergebnis ist immer mit source markiert - No-Demo-Data-Policy
  // (docs/DATENSCHUTZ_PROTOKOLL.md): simulierte Daten duerfen nie unmarkiert wie
  // reale Historie ausgeliefert werden.
  public async getHistory(symbol: string, limit: number): Promise<HistoryResult> {
    const s = symbol.toUpperCase().trim();
    const cacheKey = `${s}_${limit}`;

    if (this.historyCache.has(cacheKey)) {
      return this.historyCache.get(cacheKey)!;
    }

    let result: HistoryResult | null = null;

    const coingeckoId = CRYPTO_COINGECKO_IDS[s];
    if (coingeckoId) {
      result = await this.fetchCoinGeckoHistory(coingeckoId, limit);
    } else {
      const stooqTicker = STOCK_STOOQ_TICKERS[s] || FOREX_STOOQ_TICKERS[s];
      if (stooqTicker) {
        result = await this.fetchStooqHistory(stooqTicker, limit, s);
      }
    }

    if (!result || result.points.length === 0) {
      result = { points: this.generateSimulatedHistory(s, limit), source: 'simulated' };
    }

    this.historyCache.set(cacheKey, result);
    return result;
  }

  private async fetchCoinGeckoHistory(coingeckoId: string, limit: number): Promise<HistoryResult | null> {
    try {
      const days = Math.min(Math.max(limit, 1), 1825);
      const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data: any = await res.json();
      const prices: [number, number][] = data?.prices;
      if (!Array.isArray(prices) || prices.length === 0) return null;

      const points: HistoryPoint[] = prices.map(([timestampMs, close]) => {
        const date = new Date(timestampMs);
        return {
          date: `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getFullYear()).substring(2)}`,
          close: Number(close.toFixed(close > 10 ? 2 : 6)),
        };
      });
      return { points, source: 'live' };
    } catch (err) {
      console.warn(`[AssetRegistry] CoinGecko-Historie fuer ${coingeckoId} fehlgeschlagen, falle auf Simulation zurueck:`, (err as Error)?.message || err);
      return null;
    }
  }

  private async fetchStooqHistory(ticker: string, limit: number, displaySymbol: string): Promise<HistoryResult | null> {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - Math.min(Math.max(limit, 1), 1825) * 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      const url = `https://stooq.com/q/d/l/?s=${ticker}&d1=${fmt(start)}&d2=${fmt(end)}&i=d`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const text = await res.text();
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) return null;

      const headers = lines[0].split(',').map((h) => h.toLowerCase());
      const dateIdx = headers.indexOf('date');
      const closeIdx = headers.indexOf('close');
      if (dateIdx === -1 || closeIdx === -1) return null;

      const points: HistoryPoint[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length <= Math.max(dateIdx, closeIdx)) continue;
        const rawDate = cols[dateIdx]; // Stooq-Format: YYYY-MM-DD
        const close = parseFloat(cols[closeIdx]);
        if (isNaN(close) || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) continue;
        const [y, m, d] = rawDate.split('-');
        points.push({ date: `${d}.${m}.${y.slice(2)}`, close: Number(close.toFixed(2)) });
      }
      if (points.length === 0) return null;
      return { points, source: 'live' };
    } catch (err) {
      console.warn(`[AssetRegistry] Stooq-Historie fuer ${displaySymbol} fehlgeschlagen, falle auf Simulation zurueck:`, (err as Error)?.message || err);
      return null;
    }
  }

  private generateSimulatedHistory(s: string, limit: number): HistoryPoint[] {
    const asset = this.getAsset(s);
    const startPrice = asset ? asset.price : 100;
    const vol = asset ? asset.volatility / 100 : 0.25;
    const drift = asset ? asset.drift : 0.08;

    // Geometrische Brownsche Bewegung als Notfall-Fallback, wenn weder eine
    // CoinGecko- noch eine Stooq-Quelle fuer dieses Symbol existiert oder beide
    // fehlschlagen. Liefert NIEMALS reale Historie - Aufrufer muessen
    // HistoryResult.source === 'simulated' auswerten und entsprechend kennzeichnen.
    const history: HistoryPoint[] = [];
    let currentPrice = startPrice;
    const now = new Date();

    for (let i = limit; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateFormatted = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getFullYear()).substring(2)}`;

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
