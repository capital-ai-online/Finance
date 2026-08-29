import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('crypto research topology panels', () => {
  it('keeps meme and defi specialized families explicit and fail-closed', () => {
    const source = read('src/features/crypto/ui/CryptoResearchTopologyPanels.tsx');
    expect(source).toContain('Liquidity / Execution');
    expect(source).toContain('Holder / Distribution');
    expect(source).toContain('Social Authenticity');
    expect(source).toContain('Contract / Rug Risk');
    expect(source).toContain('Scale / Activity Correlation Family');
    expect(source).toContain('Oracle Integrity');
    expect(source).toContain('NOT_COMPUTABLE');
  });

  it('is composed after the base CV-3/CV-7 lens in the canonical workspace', () => {
    const workspace = read('src/features/crypto/ui/CryptoScoringWorkspace.tsx');
    const lensIndex = workspace.indexOf('CryptoCategoryResearchLenses');
    const topologyIndex = workspace.indexOf('CryptoResearchTopologyPanels');
    expect(lensIndex).toBeGreaterThan(-1);
    expect(topologyIndex).toBeGreaterThan(lensIndex);
  });
});
