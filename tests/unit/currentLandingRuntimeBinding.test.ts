import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const landing = read('src/features/public/ui/LandingPage.tsx');
const referenceApp = read('src/features/public/ui/frontend-port/ReferenceApp.tsx');
const runtime = read('src/features/public/ui/runtime/CurrentLandingRuntimeBinding.tsx');
const sourceLock = JSON.parse(
  read('src/features/public/ui/frontend-port/source-lock.json'),
) as { sourceCommit: string; lockMode: string };

describe('current f2a101 landing runtime binding', () => {
  it('uses the newly promoted FRONTEND generation as the only graphical reference', () => {
    expect(sourceLock.sourceCommit).toBe('f2a101330d74420c373f0ec56fa58caac53d741d');
    expect(sourceLock.lockMode).toBe('EXACT_GIT_BLOB_WITH_FINANCE_PRESENTATION_ADAPTERS');
    expect(landing).toContain('data-landing-design-commit="f2a101330d74420c373f0ec56fa58caac53d741d"');
    expect(landing).toContain('data-market-data-binding="verified-on-selection"');
    expect(landing).toContain('data-landing-scorer-gate="FIN-LF-01"');
    expect(referenceApp).toContain('useCurrentLandingRuntimeBinding');
  });

  it('binds all 15 visible market identities to canonical Finance symbols', () => {
    for (const mapping of [
      "sp500: 'GSPC'",
      "dax: 'GDAXI'",
      "nasdaq: 'NDX'",
      "btc: 'BTC'",
      "eth: 'ETH'",
      "sol: 'SOL'",
      "nvda: 'NVDA'",
      "aapl: 'AAPL'",
      "msft: 'MSFT'",
      "eurusd: 'EURUSD'",
      "gbpusd: 'GBPUSD'",
      "usdjpy: 'USDJPY'",
      "gold: 'CMD_GOLD_COMEX'",
      "silver: 'CMD_SILVER_COMEX'",
      "brent: 'CMD_BRENT_ICE'",
    ]) {
      expect(runtime).toContain(mapping);
    }
  });

  it('loads selected market evidence only through the existing verified display contract', () => {
    expect(runtime).toContain("const VERIFIED_DISPLAY_CONTRACT = 'verified-asset-display/1.0.0' as const");
    expect(runtime).toContain('/api/registry/assets/');
    expect(runtime).toContain('/verified-display');
    expect(runtime).toContain('payload.contractVersion !== VERIFIED_DISPLAY_CONTRACT');
    expect(runtime).not.toContain('financialmodelingprep.com');
    expect(runtime).not.toContain('api.twelvedata.com');
    expect(runtime).not.toContain('data-api.binance.vision');
    expect(runtime).not.toContain('api.coingecko.com');
  });

  it('wires current f2a101 market selection directly into verified hydration', () => {
    expect(referenceApp).toContain('onSelectAsset={runtimeBinding.openVerifiedAsset}');
    expect(referenceApp).toContain('runtimeBinding.openVerifiedAsset(asset)');
    expect(referenceApp).not.toContain('onSelectAsset={(asset) => setSelectedAsset(asset)}');
  });

  it('prevents the pinned mock analysis from becoming productive landing scoring', () => {
    expect(referenceApp).toContain('onOpenAnalysis={runtimeBinding.openScorerGate}');
    expect(referenceApp).toContain('onStartAnalysis={runtimeBinding.openScorerGate}');
    expect(referenceApp).not.toContain('onOpenAnalysis={() => setIsAnalysisOpen(true)}');
    expect(referenceApp).not.toContain('onStartAnalysis={() => setIsAnalysisOpen(true)}');

    expect(runtime).toContain("const FINTECH_LANDING_SCORER_GATE = 'FIN-LF-01' as const");
    expect(runtime).toContain('LF-02_AUTH_PROFILE_PASS');
    expect(runtime).toContain('LF-03_PRICING_ENTITLEMENTS_PASS');
    expect(runtime).toContain('SEC_REVIEW_READY');
    expect(runtime).toContain('QM_VALIDATION_READY');
    expect(runtime).not.toContain('/api/crypto/score');
    expect(runtime).not.toContain('/api/landing/quick-analysis');
  });

  it('does not expose pinned AI Newsfeed fixtures as productive live data', () => {
    expect(runtime).toContain("module.id === 'ai-newsfeed'");
    expect(runtime).toContain('Produktiver Datenpfad geschützt');
    expect(runtime).toContain('serverseitige Daten-/Entitlement-Pfad');
  });

  it('keeps login and new subclass navigation from f2a101 intact', () => {
    expect(referenceApp).toContain("window.location.assign('/login')");
    expect(referenceApp).toContain('onSelectSubclass');
    expect(referenceApp).toContain('<SubclassDetailModal');
    expect(referenceApp).toContain('runtimeBinding.openScorerGate();');
  });
});
