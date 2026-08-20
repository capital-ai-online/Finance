import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { filterBuffettStockCatalog, formatBuffettMetric } from '../../src/components/BuffetValueCheck';

const componentSource = fs.readFileSync(
  path.join(process.cwd(), 'src/components/BuffetValueCheck.tsx'),
  'utf8',
);

const entitlementSource = fs.readFileSync(
  path.join(process.cwd(), 'server/entitlements.ts'),
  'utf8',
);

describe('formatBuffettMetric', () => {
  it('formatiert endliche numerische Werte', () => {
    expect(formatBuffettMetric(1234.5)).toBe((1234.5).toLocaleString('de-DE'));
  });

  it.each([null, undefined, '', Number.NaN, Number.POSITIVE_INFINITY])(
    'liefert für nicht verfügbare Werte einen sicheren Platzhalter: %s',
    value => {
      expect(formatBuffettMetric(value)).toBe('Nicht verfügbar');
    },
  );
});

describe('Buffett verified-data contract', () => {
  it('autorisiert serverseitig vor der verifizierten Datenhydration', () => {
    const authorizeIndex = componentSource.indexOf('/api/entitlements/warren-buffett/authorize');
    const displayIndex = componentSource.indexOf('/verified-display');

    expect(authorizeIndex).toBeGreaterThanOrEqual(0);
    expect(displayIndex).toBeGreaterThan(authorizeIndex);
    expect(componentSource).toContain("authorizationBody.allowed !== true");
    expect(componentSource).toContain("method: 'POST'");
  });

  it('hydratisiert die freigegebene Aktie über den verifizierten Display-Contract', () => {
    expect(componentSource).toContain('/verified-display');
    expect(componentSource).toContain('verified-asset-display/1.0.0');
    expect(componentSource).toContain('Aktie · bei Auswahl laden');
  });

  it('verwendet keine synthetischen EPS-, Score- oder fehlende-Daten-als-PASS-Fallbacks mehr', () => {
    expect(componentSource).not.toContain('price * 0.07');
    expect(componentSource).not.toContain("score || '7.5'");
    expect(componentSource).not.toContain('initialEps <= 0 ? 3.5');
    expect(componentSource).toContain('Fehlende Verschuldungsdaten gelten nicht automatisch als bestanden.');
  });

  it('führt ausschließlich Aktien in der Buffett-Suche', () => {
    const result = filterBuffettStockCatalog([
      { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
      { symbol: 'MSFT', name: 'Microsoft', type: 'stock' },
      { symbol: 'EURUSD', name: 'Euro / US Dollar', type: 'forex' },
      { symbol: 'AAPL', name: 'Apple', type: 'stock' },
      { symbol: 'GLD', name: 'Gold', type: 'commodity' },
    ]);

    expect(result.map(asset => asset.symbol)).toEqual(['AAPL', 'MSFT']);
    expect(result.every(asset => asset.type === 'stock')).toBe(true);
    expect(componentSource).toContain('Buffett Value Check akzeptiert ausschließlich Aktien.');
    expect(componentSource).toContain("stocks.find(asset => asset.symbol.toUpperCase() === 'AAPL')");
  });

  it('lehnt Nicht-Aktien serverseitig vor Quota-Verbrauch ab', () => {
    const stockGateIndex = entitlementSource.indexOf("if (asset.type !== 'stock')");
    const quotaIndex = entitlementSource.indexOf('enforceBuffettValueCheckQuota(req, symbol)');

    expect(stockGateIndex).toBeGreaterThanOrEqual(0);
    expect(quotaIndex).toBeGreaterThan(stockGateIndex);
    expect(entitlementSource).toContain("reason: 'asset-not-eligible'");
    expect(entitlementSource).toContain('Warren Buffett Value Check is available for stocks only.');
  });
});
