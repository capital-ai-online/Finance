import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SC-2 scoring dispatcher request narrowing', () => {
  it('narrows the discriminated request union on input.assetClass before reading execution', () => {
    const dispatcher = readFileSync(
      new URL('../../src/platform/Scoring/ScoringDispatcher.ts', import.meta.url),
      'utf8',
    );

    expect(dispatcher).toContain("if (input.assetClass === 'crypto')");
    expect(dispatcher).toContain(
      "if (input.assetClass === 'stock' || input.assetClass === 'forex' || input.assetClass === 'index')",
    );
    expect(dispatcher).toContain("if (input.assetClass === 'commodity')");
    expect(dispatcher).toContain("if (input.assetClass === 'bond')");

    expect(dispatcher).not.toContain("if (asset.assetClass === 'stock'");
    expect(dispatcher).not.toContain("if (asset.assetClass === 'commodity')");
    expect(dispatcher).not.toContain("if (asset.assetClass === 'bond')");
  });
});
