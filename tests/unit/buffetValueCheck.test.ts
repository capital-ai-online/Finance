import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatBuffettMetric } from '../../src/components/BuffetValueCheck';

const componentSource = fs.readFileSync(
  path.join(process.cwd(), 'src/components/BuffetValueCheck.tsx'),
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
  it('hydratisiert den gewählten Katalogwert über den verifizierten Display-Contract', () => {
    expect(componentSource).toContain('/verified-display');
    expect(componentSource).toContain('verified-asset-display/1.0.0');
    expect(componentSource).toContain('bei Auswahl laden');
  });

  it('verwendet keine synthetischen EPS-, Score- oder fehlende-Daten-als-PASS-Fallbacks mehr', () => {
    expect(componentSource).not.toContain('price * 0.07');
    expect(componentSource).not.toContain("score || '7.5'");
    expect(componentSource).not.toContain('initialEps <= 0 ? 3.5');
    expect(componentSource).toContain('Fehlende Verschuldungsdaten gelten nicht mehr automatisch als bestanden.');
  });

  it('grenzt Buffett/Graham fachlich auf Aktien ab', () => {
    expect(componentSource).toContain('Buffett/Graham-Unternehmensbewertung nicht anwendbar');
    expect(componentSource).toContain("display?.assetClass === 'stock'");
    expect(componentSource).not.toContain("activeAsset?.type === 'crypto'");
  });
});
