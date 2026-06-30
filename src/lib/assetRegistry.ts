/**
 * Live Asset Registry.
 *
 * No-Demo-Data-Policy compliance note: this module previously shipped with
 * hardcoded "fundamentals" (price, P/E, debt-to-equity, market cap) for
 * real, named companies (AAPL, NVDA, TSLA, ...) marked `status: 'Verifiziert'`,
 * and a getHistory() method that generated synthetic price histories via
 * Geometric Brownian Motion "to reduce Stooq/Alpha Vantage load" — both
 * presented to users as real data. Both have been removed.
 *
 * The registry is now a thin, in-memory cache that is only ever populated
 * from REAL data returned by /api/market-data (CoinGecko/Stooq). Until the
 * first successful live fetch happens, getAsset()/getAssets() return
 * nothing rather than fabricated defaults. Historical price series are no
 * longer served from this module at all — /api/backtest-history fetches
 * real history directly from Stooq/Alpha Vantage (see server.ts).
 */

export interface RegistryAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
  price: number;
  change24h: number;
  risk: 'High' | 'Medium' | 'Low';
  status: 'Live';
  marketCap?: number;
  volume24h: number;
  score: number;
  pattern?: string;
  applicationArea?: string;
  // Fundamentals (P/E, debt/equity, dividend yield) are intentionally NOT
  // part of this registry until a real fundamentals provider (e.g. Alpha
  // Vantage OVERVIEW) is integrated — they must never be hardcoded again.
  lastUpdated: number;
}

export class AssetRegistry {
  private assets: Map<string, RegistryAsset> = new Map();

  /**
   * Called by /api/market-data after every successful live fetch from
   * CoinGecko/Stooq. This is the ONLY way assets enter the registry.
   */
  public updateFromLiveData(liveAssets: Array<Record<string, any>>) {
    const now = Date.now();
    for (const a of liveAssets) {
      if (!a?.symbol || typeof a.price !== 'number') continue;
      this.assets.set(String(a.symbol).toUpperCase(), {
        symbol: a.symbol,
        name: a.name || a.symbol,
        type: a.type,
        price: a.price,
        change24h: a.change24h ?? 0,
        risk: a.risk || 'Medium',
        status: 'Live',
        marketCap: a.marketCap,
        volume24h: a.volume24h ?? 0,
        score: a.score ?? 0,
        pattern: a.pattern,
        applicationArea: a.applicationArea,
        lastUpdated: now,
      });
    }
  }

  public getAssets(): RegistryAsset[] {
    return Array.from(this.assets.values());
  }

  public getAsset(symbol: string): RegistryAsset | undefined {
    return this.assets.get(symbol.toUpperCase());
  }

  public hasLiveData(): boolean {
    return this.assets.size > 0;
  }
}

export const assetRegistry = new AssetRegistry();
