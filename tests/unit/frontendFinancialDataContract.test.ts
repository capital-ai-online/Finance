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
    expect(code).toContain('buildTraditionalView(body, symbol, assetName, assetType)');
    expect(code).not.toContain('noch kein freigegebener provenance-backed kanonischer Scoring-Contract aktiv');
    expect(code).not.toContain('charCodeAt');
    expect(code).not.toContain('Math.random');
    // AUD3-F-001 removed a legacy `getTradingSetup(symbol, price, score, type)` helper that
    // derived entry/SL/TP purely from hardcoded fixed multipliers (e.g. `price * 0.94`) applied
    // to the (partly synthetic/bootstrap) registry price - fabricated, not evidence-gated.
    // The current trade-setup panel is intentionally different: it renders `tradeSetup`/
    // `priceStats` fields computed server-side by tradeSetupLevels.ts purely from verified
    // ReturnStats (real 30d history), gated behind the same data-quality gate as the rest of
    // the 9-factor model. These assertions guard against the legacy pattern reappearing while
    // still allowing the new, evidence-gated feature.
    expect(code).not.toContain('getTradingSetup');
    expect(code).not.toMatch(/price \* 0\.\d/);
    expect(code).not.toMatch(/\.price\s*\*/);
    expect(code).toContain('tradeSetup');
  });

  it('verified asset snapshot presents market and scoring evidence without registry bootstrap values', () => {
    const code = source('src/components/VerifiedAssetSnapshot.tsx');
    expect(code).toContain('/api/crypto/price-consensus/');
    expect(code).toContain('/verified-quote');
    expect(code).toContain('Verifizierte Asset-Daten');
    expect(code).toContain('Fehlende Daten werden nicht durch Registry-Bootstrapwerte ersetzt.');
    expect(code).toContain('<dl');
    expect(code).toContain('Letzte Evidence');
    expect(code).toContain('No Demo Data');
    expect(code).not.toContain('assetRegistry');
    expect(code).not.toContain('Math.random');
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
    // AI Kurzanalyse moved out to EnterpriseBinanceQuickAnalysis.tsx (see below) - it used to
    // live inline here bound only to already-verified scoring facts, no live market data.
    expect(code).not.toContain('AI Kurzanalyse');
  });

  it('enterprise scorer AI Kurzanalyse is crypto-only, Binance-live-data-backed and reuses the scorer asset selection', () => {
    const quickAnalysisCode = source('src/components/EnterpriseBinanceQuickAnalysis.tsx');
    expect(quickAnalysisCode).toContain('AI Kurzanalyse mit Binance Spot');
    expect(quickAnalysisCode).toContain('/api/registry/assets/');
    expect(quickAnalysisCode).toContain('/quick-analysis');
    // Driven purely by the `symbol` prop from CryptoScoringEnterprise - no independent
    // free-text search input duplicating the Enterprise Scorer's own Asset-Suche.
    expect(quickAnalysisCode).not.toContain("useState('BTC')");
    expect(quickAnalysisCode).not.toContain('placeholder="BTC, ETH, SOL ...."');

    const enterpriseScorerCode = source('src/components/CryptoScoringEnterprise.tsx');
    expect(enterpriseScorerCode).toContain('EnterpriseBinanceQuickAnalysis');
    expect(enterpriseScorerCode).toContain('VerifiedAssetSnapshot');
    expect(enterpriseScorerCode).toContain("const showBinanceQuickAnalysis = selectedAssetType === 'crypto';");
    expect(enterpriseScorerCode).toContain('{showBinanceQuickAnalysis && (');
    // Display order top to bottom: Asset-Suche, selected asset header, universal verified
    // asset snapshot, then the crypto-only Binance quick analysis.
    const assetSearchIndex = enterpriseScorerCode.indexOf('Asset-Suche');
    const selectedAssetHeaderIndex = enterpriseScorerCode.indexOf('Enterprise Universum Scorer');
    const snapshotIndex = enterpriseScorerCode.indexOf('<VerifiedAssetSnapshot');
    const quickAnalysisIndex = enterpriseScorerCode.indexOf('<EnterpriseBinanceQuickAnalysis');
    expect(assetSearchIndex).toBeGreaterThan(-1);
    expect(selectedAssetHeaderIndex).toBeGreaterThan(-1);
    expect(snapshotIndex).toBeGreaterThan(-1);
    expect(quickAnalysisIndex).toBeGreaterThan(-1);
    expect(assetSearchIndex).toBeLessThan(selectedAssetHeaderIndex);
    expect(selectedAssetHeaderIndex).toBeLessThan(snapshotIndex);
    expect(snapshotIndex).toBeLessThan(quickAnalysisIndex);
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
    // CryptoEnterpriseEvaluator.tsx (a near-total visual/data duplicate of CryptoScoringEnterprise
    // - same /api/crypto/score call, its own score gauge, its own EnterpriseAnalysisPanels
    // instance) was removed so the dashboard renders exactly one enterprise scorer instead of two
    // overlapping ones. This guard now scans every component for the banned legacy copy instead
    // of one specific (now-deleted) file.
    const code = allComponentSources();
    expect(code).not.toContain('P0-Sicherheitsmodus');
    expect(fs.existsSync(path.join(repoRoot, 'src/components/CryptoEnterpriseEvaluator.tsx'))).toBe(false);
  });
});
