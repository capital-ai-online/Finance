import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const runtime = read('src/features/public/ui/landing-runtime/LandingRuntimeBinding.tsx');
const landing = read('src/features/public/ui/LandingPage.tsx');
const sourceLock = JSON.parse(
  read('src/features/public/ui/frontend-port/source-lock.json'),
) as {
  sourceCommit: string;
  lockMode: string;
};

describe('landing productive runtime binding', () => {
  it('keeps the pinned graphical source immutable and binds productive logic outside frontend-port', () => {
    expect(sourceLock.sourceCommit).toBe('8f6b629c985ca2e46c822ff911f53741d0141e07');
    expect(sourceLock.lockMode).toBe('EXACT_GIT_BLOB_WITH_FINANCE_BRANDING_ADAPTER');
    expect(landing).toContain("from './landing-runtime/LandingRuntimeBinding'");
    expect(landing).toContain('data-landing-runtime-binding="verified-asset-display/1.0.0"');
    expect(runtime).toContain("from '../frontend-port/data/mockData'");
  });

  it('neutralizes presentation fixtures before they can act as productive finance evidence', () => {
    expect(runtime).toContain('neutralizePinnedPresentationFixtures()');
    expect(runtime).toContain("value: 'Auf Auswahl verifizieren'");
    expect(runtime).toContain("change: '—'");
    expect(runtime).toContain("high24h: '—'");
    expect(runtime).toContain("low24h: '—'");
    expect(runtime).toContain("volume24h: '—'");
    expect(runtime).toContain("newsItems: []");
    expect(runtime).toContain('Keine Demo- oder Fallback-Finanzwerte.');
  });

  it('hydrates market values progressively through the existing verified display contract', () => {
    expect(runtime).toContain("const VERIFIED_DISPLAY_CONTRACT = 'verified-asset-display/1.0.0' as const");
    expect(runtime).toContain('/api/registry/assets/');
    expect(runtime).toContain('/verified-display');
    expect(runtime).toContain("payload.contractVersion !== VERIFIED_DISPLAY_CONTRACT");
    expect(runtime).not.toContain('/api/v3/ticker');
    expect(runtime).not.toContain('data-api.binance.vision');
    expect(runtime).not.toContain('financialmodelingprep.com');
    expect(runtime).not.toContain('api.twelvedata.com');
  });

  it('maps the pinned design symbols to canonical Finance catalog identities', () => {
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

  it('keeps productive landing scoring fail-closed until FIN-LF-01 dependencies are proven', () => {
    expect(runtime).toContain("const FINTECH_LANDING_SCORER_GATE = 'FIN-LF-01' as const");
    expect(runtime).toContain('LF-02_AUTH_PROFILE_PASS');
    expect(runtime).toContain('LF-03_PRICING_ENTITLEMENTS_PASS');
    expect(runtime).toContain('SEC_REVIEW_READY');
    expect(runtime).toContain('QM_VALIDATION_READY');
    expect(runtime).not.toContain('PublicCryptoScoringPreview');
    expect(runtime).not.toContain('/api/crypto/score');
    expect(runtime).not.toContain('/api/landing/quick-analysis');
  });

  it('keeps protected module actions behind the existing login boundary', () => {
    expect(runtime).toContain("window.location.assign('/login')");
    expect(runtime).toContain("module?.id === 'enterprise-scorer'");
    expect(runtime).toContain("description: 'Aktien-only Value-Analyse; produktiver Zugriff bleibt entitlement- und login-gebunden.'");
  });
});
