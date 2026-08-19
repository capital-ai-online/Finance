import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('SC-2 crypto research/enrichment boundary', () => {
  it('removes score, rank and value-corridor computation from CryptoOrchestrator', () => {
    const source = readFileSync(new URL('../../src/orchestrator/cryptoOrchestrator.ts', import.meta.url), 'utf8');

    expect(source).not.toContain('generateCryptoScores');
    expect(source).not.toContain('calculateBaseScore');
    expect(source).not.toContain('calculateDefiScore');
    expect(source).not.toContain('calculateRankScore');
    expect(source).not.toContain('isTop10Eligible');
    expect(source).not.toContain('calculateValueCorridor');
    expect(source).toContain("mode: 'research-enrichment'");
    expect(source).toContain('scoreEligible: false');
  });

  it('rejects caller scoring overrides on /api/crypto/analyze', () => {
    const source = readFileSync(new URL('../../src/routes/cryptoRoutes.ts', import.meta.url), 'utf8');
    const analyzeStart = source.indexOf("router.post('/analyze'");
    const scoreStart = source.indexOf("router.post('/score'", analyzeStart);
    const analyzeRoute = source.slice(analyzeStart, scoreStart);

    expect(analyzeStart).toBeGreaterThanOrEqual(0);
    expect(scoreStart).toBeGreaterThan(analyzeStart);
    expect(analyzeRoute).toContain('customInput');
    expect(analyzeRoute).toContain("status: 'RESEARCH_ONLY'");
    expect(analyzeRoute).toContain('scoreEligible: false');
    expect(analyzeRoute).toContain('orchestrator.analyzeCrypto(targetSymbol.toUpperCase().trim())');
  });

  it('prevents DeFi UI from recalculating a production score or replacing it with agent output', () => {
    const source = readFileSync(new URL('../../src/components/DeFiOrchestration.tsx', import.meta.url), 'utf8');

    expect(source).not.toContain("from '../services/scoring.service'");
    expect(source).not.toContain('calculateDefiScore');
    expect(source).not.toContain('generateCryptoScores');
    expect(source).toContain("fetch('/api/crypto/score'");
    expect(source).toContain("fetch('/api/crypto/analyze'");
    expect(source).not.toContain('setScores(data.scores)');
  });
});
