import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('frontend financial data contract regression gate', () => {
  it('Best/Worst consumes verified scoring boundaries and has no synthetic missing-score fallback', () => {
    const code = source('src/components/UniverseBestWorst.tsx');

    expect(code).toContain('/api/crypto/list');
    expect(code).toContain('/api/registry/assets/verified-scores');
    expect(code).toContain("scoreStatus === 'READY'");
    expect(code).not.toMatch(/return\s+50(?:\.0)?\s*;/);
    expect(code).not.toMatch(/price\.toLocaleString/);
    expect(code).not.toMatch(/asset\.change24h\.toFixed/);
  });

  it('Enterprise scoring surface uses verified backend contracts and contains no symbol-hash/random finance path', () => {
    const code = source('src/components/CryptoScoringEnterprise.tsx');

    expect(code).toContain('/api/crypto/score');
    expect(code).toContain('/verified-score');
    expect(code).not.toContain('charCodeAt');
    expect(code).not.toContain('Math.random');
    expect(code).not.toContain('getTradingSetup');
    expect(code).not.toMatch(/entryMin|entryMax|stopLoss|takeProfit/);
  });

  it('Legacy P0 copy is not presented as current provider status', () => {
    const code = source('src/components/CryptoEnterpriseEvaluator.tsx');
    expect(code).not.toContain('P0-Sicherheitsmodus');
    expect(code).toContain('Verifizierte Server-Provider');
  });
});
