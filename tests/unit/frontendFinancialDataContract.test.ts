import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function allComponentSources(): string {
  const dir = path.join(repoRoot, 'src/components');
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => fs.readFileSync(path.join(dir, name), 'utf8'))
    .join('\n');
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
    expect(code).not.toMatch(/price \* 0\.\d/);
    expect(code).not.toMatch(/\.price\s*\*/);
    expect(code).toContain('tradeSetup');
  });

  it('places Enterprise scorer intervals directly after the Asset search and keeps them presentation-only', () => {
    const code = source('src/components/CryptoScoringEnterprise.tsx');
    const assetSearchIndex = code.indexOf('Asset-Suche');
    const timeframeIndex = code.indexOf('Analyse-Zeitraum');
    const selectedAssetHeaderIndex = code.indexOf('Enterprise Universum Scorer');
    const quickAnalysisIndex = code.indexOf('<EnterpriseBinanceQuickAnalysis');

    expect(assetSearchIndex).toBeGreaterThan(-1);
    expect(timeframeIndex).toBeGreaterThan(assetSearchIndex);
    expect(selectedAssetHeaderIndex).toBeGreaterThan(timeframeIndex);
    expect(quickAnalysisIndex).toBeGreaterThan(selectedAssetHeaderIndex);
    expect(code).toContain('aria-label="Analyse-Zeitraum des Enterprise Universum Scorers"');
    expect(code).toContain('Zeitrahmen ist Analysekontext und verändert keinen kanonischen Score im Browser.');
  });

  it('Buffett is stock-only, entitlement-first and hydrates finance values through the verified display boundary', () => {
    const code = source('src/components/BuffetValueCheck.tsx');
    const authorizeIndex = code.indexOf('/api/entitlements/warren-buffett/authorize');
    const displayIndex = code.indexOf('/verified-display');

    expect(code).toContain("asset.type === 'stock'");
    expect(authorizeIndex).toBeGreaterThanOrEqual(0);
    expect(displayIndex).toBeGreaterThan(authorizeIndex);
    expect(code).toContain("authorizationBody.allowed !== true");
    expect(code).toContain('verified-asset-display/1.0.0');
    expect(code).toContain('Aktien-Symbol oder Unternehmen suchen');
    expect(code).toContain('Buffett Value Check akzeptiert ausschließlich Aktien.');
    expect(code).not.toContain('price * 0.07');
    expect(code).not.toContain("score || '7.5'");
    expect(code).not.toContain('initialEps <= 0 ? 3.5');
  });

  it('restored enterprise analysis panels are explicitly read-only to scoring', () => {
    const code = source('src/components/EnterpriseAnalysisPanels.tsx');
    expect(code).toContain('Order-Tree · Market Depth');
    expect(code).toContain('Arbitrage Radar');
    expect(code).toContain('Intelligent Feed');
    expect(code).toContain('Read-only Spiegel des verifizierten kanonischen Scores');
    expect(code).toContain('schreiben weder in den kanonischen Score noch in Ranking');
    expect(code).not.toContain('localStorage.setItem');
    expect(code).not.toContain('/api/registry/assets/');
    expect(code).not.toContain('AI Kurzanalyse');
  });

  it('enterprise scorer AI Kurzanalyse is Binance-live-data-backed and reuses the scorer asset selection', () => {
    const quickAnalysisCode = source('src/components/EnterpriseBinanceQuickAnalysis.tsx');
    expect(quickAnalysisCode).toContain('AI Kurzanalyse mit Binance Spot');
    expect(quickAnalysisCode).toContain('/api/registry/assets/');
    expect(quickAnalysisCode).toContain('/quick-analysis');
    expect(quickAnalysisCode).not.toContain("useState('BTC')");
    expect(quickAnalysisCode).not.toContain('placeholder="BTC, ETH, SOL ...."');

    const enterpriseScorerCode = source('src/components/CryptoScoringEnterprise.tsx');
    expect(enterpriseScorerCode).toContain('EnterpriseBinanceQuickAnalysis');
    const assetSearchIndex = enterpriseScorerCode.indexOf('Asset-Suche');
    const selectedAssetHeaderIndex = enterpriseScorerCode.indexOf('Enterprise Universum Scorer');
    const quickAnalysisIndex = enterpriseScorerCode.indexOf('<EnterpriseBinanceQuickAnalysis');
    expect(assetSearchIndex).toBeGreaterThan(-1);
    expect(selectedAssetHeaderIndex).toBeGreaterThan(-1);
    expect(quickAnalysisIndex).toBeGreaterThan(-1);
    expect(assetSearchIndex).toBeLessThan(selectedAssetHeaderIndex);
    expect(selectedAssetHeaderIndex).toBeLessThan(quickAnalysisIndex);
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

  it('Legacy P0 copy is not presented as current provider status anywhere in the component tree', () => {
    const code = allComponentSources();
    expect(code).not.toContain('P0-Sicherheitsmodus');
    expect(fs.existsSync(path.join(repoRoot, 'src/components/CryptoEnterpriseEvaluator.tsx'))).toBe(false);
  });
});
