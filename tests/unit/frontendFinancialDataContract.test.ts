import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('frontend financial data contract regression gate', () => {
  it('Best/Worst renders progressively and uses only verified score boundaries', () => {
    const code = source('src/components/UniverseBestWorst.tsx');
    expect(code).toContain('/api/crypto/score');
    expect(code).toContain('/api/registry/assets/verified-scores');
    expect(code).toContain('Progressive Scoring');
    expect(code).toContain('AbortController');
    expect(code).not.toMatch(/return\s+50(?:\.0)?\s*;/);
    expect(code).not.toContain('Math.random');
    expect(code).not.toContain('charCodeAt');
  });

  it('Enterprise scorer supports all asset classes while canonical scoring stays backend-bound', () => {
    const code = source('src/components/CryptoScoringEnterprise.tsx');
    expect(code).toContain('/api/crypto/score');
    expect(code).toContain('/verified-score');
    expect(code).toContain("'commodity'");
    expect(code).toContain("'bond'");
    expect(code).toContain('Asset-Suche');
    expect(code).not.toContain('charCodeAt');
    expect(code).not.toContain('Math.random');
    expect(code).not.toContain('getTradingSetup');
    expect(code).not.toMatch(/entryMin|entryMax|stopLoss|takeProfit/);
  });

  it('restored enterprise analysis panels are explicitly read-only to scoring', () => {
    const code = source('src/components/EnterpriseAnalysisPanels.tsx');
    expect(code).toContain('Ordertiefe / Market Depth');
    expect(code).toContain('Arbitrage Radar');
    expect(code).toContain('Intelligent Feed');
    expect(code).toContain('AI Kurzanalyse');
    expect(code).toContain('Read-only Spiegel des verifizierten kanonischen Scores');
    expect(code).toContain('schreiben weder in den kanonischen Score noch in Ranking');
    expect(code).not.toContain('localStorage.setItem');
    expect(code).not.toContain('/api/registry/assets/');
  });

  it('MarketScreener consumes verified score/context contracts and has no symbol-hash finance logic', () => {
    const code = source('src/components/MarketScreener.tsx');
    expect(code).toContain('/api/crypto/score');
    expect(code).toContain('/verified-context');
    expect(code).toContain('scoreImpactEnabled: false');
    expect(code).toContain('Kein verifiziertes Pattern ableitbar');
    expect(code).not.toContain('charCodeAt');
    expect(code).not.toContain('scanModifier');
    expect(code).not.toContain('getTrafficLightData');
    expect(code).not.toMatch(/entryMin|entryMax|stopLoss|takeProfit/);
    expect(code).not.toContain('Simulate real calculations');
  });

  it('PriceAlert evaluates crypto and traditional assets only through verified quote evidence', () => {
    const code = source('src/components/PriceAlert.tsx');
    expect(code).toContain('/api/crypto/price-consensus/');
    expect(code).toContain('/verified-quote');
    expect(code).toContain("body?.alertEligible === true");
    expect(code).toContain('quoteEvidenceIds');
    expect(code).toContain('quoteObservedAt');
    expect(code).not.toContain('Math.random');
    expect(code).not.toContain('Random walk');
    expect(code).not.toContain('handleSimulateAlertTrigger');
    expect(code).not.toContain('isSimulationActive');
  });

  it('Legacy P0 copy is not presented as current provider status', () => {
    const code = source('src/components/CryptoEnterpriseEvaluator.tsx');
    expect(code).not.toContain('P0-Sicherheitsmodus');
    expect(code).toContain('Verifizierte Server-Provider');
  });
});
