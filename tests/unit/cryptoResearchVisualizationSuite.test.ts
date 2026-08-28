import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('crypto research visualization suite', () => {
  it('keeps CV-4/5/6/8 fail-closed without runtime evidence', () => {
    const source = read('src/features/crypto/ui/CryptoResearchVisualizationSuite.tsx');
    expect(source).toContain('CV-4 / CV-5 / CV-6 / CV-8');
    expect(source).toContain('NOT_COMPUTABLE');
    expect(source).toContain('Keine zweite Ranking-Berechnung im Browser');
    expect(source).toContain('keine automatisch erzeugten Buy-/Sell-Signale');
  });

  it('keeps the canonical 30x1D score basis explicit', () => {
    const source = read('src/features/crypto/ui/CryptoResearchVisualizationSuite.tsx');
    expect(source).toContain("tf === '1D'");
    expect(source).toContain('Canonical basis · 30 bars');
    expect(source).toContain('Research context');
  });

  it('is composed only through the feature-owned workspace', () => {
    const workspace = read('src/features/crypto/ui/CryptoScoringWorkspace.tsx');
    expect(workspace).toContain("from './CryptoResearchVisualizationSuite'");
    expect(workspace).toContain('<CryptoResearchVisualizationSuite selectedSymbol={props.selectedSymbol} />');
  });
});
