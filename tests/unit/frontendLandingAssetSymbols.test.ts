import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MARKET_ASSETS } from '../../src/features/public/ui/frontend-port/data/mockData';

const marketOverview = fs.readFileSync(
  path.join(process.cwd(), 'src/features/public/ui/frontend-port/components/MarketOverview.tsx'),
  'utf8',
);

const EXPECTED_VISIBLE_ASSET_SYMBOLS = [
  'SPX',
  'DAX',
  'NDX',
  'BTC/USD',
  'ETH/USD',
  'SOL/USD',
  'NVDA',
  'AAPL',
  'MSFT',
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'XAU/USD',
  'XAG/USD',
  'BRENT',
] as const;

describe('landing asset symbol coverage', () => {
  it('keeps a visible symbol/ticker for every asset already present on the landing page', () => {
    expect(MARKET_ASSETS).toHaveLength(EXPECTED_VISIBLE_ASSET_SYMBOLS.length);
    expect(MARKET_ASSETS.map((asset) => asset.symbol)).toEqual(EXPECTED_VISIBLE_ASSET_SYMBOLS);

    for (const asset of MARKET_ASSETS) {
      expect(asset.id.trim()).not.toBe('');
      expect(asset.name.trim()).not.toBe('');
      expect(asset.symbol.trim()).not.toBe('');
      expect(asset.iconType.trim()).not.toBe('');
    }
  });

  it('renders each asset symbol in the active landing market card instead of keeping symbols only in fixture data', () => {
    expect(marketOverview).toContain('{asset.symbol}');
    expect(marketOverview).toContain('font-mono truncate');
  });
});
