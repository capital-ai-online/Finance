import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createCryptoVisualizationMetric,
  createCryptoVisualizationViewModel,
} from '../../src/features/crypto/ui/cryptoVisualizationViewModel';

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('CV-0 crypto visualization authority contract', () => {
  it('preserves missing canonical values instead of converting them into zero or PASS', () => {
    const metric = createCryptoVisualizationMetric({
      id: 'canonical-score:BTC',
      label: 'Canonical Score',
      value: null,
      authority: 'CANONICAL_SCORE',
      status: 'SCORE_NOT_COMPUTABLE',
      providers: [],
      evidenceIds: [],
      scoreEligible: false,
    });

    expect(metric.value).toBeNull();
    expect(metric.status).toBe('SCORE_NOT_COMPUTABLE');
    expect(metric.providers).toEqual([]);
    expect(metric.evidenceIds).toEqual([]);
  });

  it('rejects a research projection that claims score or execution eligibility', () => {
    expect(() => createCryptoVisualizationMetric({
      id: 'meme-research:BTC',
      label: 'Meme Research',
      value: 72,
      authority: 'RESEARCH',
      status: 'READY',
      scoreEligible: true,
      executionEligible: false,
    })).toThrow('CRYPTO_VISUALIZATION_RESEARCH_AUTHORITY_MISMATCH');

    expect(() => createCryptoVisualizationMetric({
      id: 'defi-research:ETH',
      label: 'DeFi Research',
      value: 64,
      authority: 'RESEARCH',
      status: 'READY',
      scoreEligible: false,
      executionEligible: true,
    })).toThrow('CRYPTO_VISUALIZATION_RESEARCH_AUTHORITY_MISMATCH');
  });

  it('requires evidence-only projections to remain explicitly non-authorizing', () => {
    const metric = createCryptoVisualizationMetric({
      id: 'evidence:BTC',
      label: 'Extended Evidence',
      value: { verifiedFeatureCount: 8 },
      authority: 'EVIDENCE_ONLY',
      status: 'PARTIAL',
      scoreEligible: false,
      executionEligible: false,
      providers: ['dune', 'dune', 'goplus'],
      evidenceIds: ['ev-2', 'ev-2', 'ev-1'],
    });

    expect(metric.authority).toBe('EVIDENCE_ONLY');
    expect(metric.scoreEligible).toBe(false);
    expect(metric.executionEligible).toBe(false);
    expect(metric.providers).toEqual(['dune', 'goplus']);
    expect(metric.evidenceIds).toEqual(['ev-2', 'ev-1']);
  });

  it('does not require market-data projections to invent score/execution eligibility', () => {
    const metric = createCryptoVisualizationMetric({
      id: 'market-history:BTC:4h',
      label: 'Verified 4h Market Bars',
      value: 90,
      authority: 'MARKET_DATA',
      status: 'HISTORICAL',
      observedAt: '2026-08-23T12:00:00.000Z',
      retrievedAt: '2026-08-23T12:01:00.000Z',
      providers: ['binance'],
      evidenceIds: ['history-1'],
    });

    expect(metric.scoreEligible).toBeUndefined();
    expect(metric.executionEligible).toBeUndefined();
    expect(metric.observedAt).toBe('2026-08-23T12:00:00.000Z');
  });

  it('freezes the read-only visualization model', () => {
    const metric = createCryptoVisualizationMetric({
      id: 'research:signal',
      label: 'Research Signal',
      value: 55,
      authority: 'RESEARCH',
      status: 'PARTIAL',
      scoreEligible: false,
      executionEligible: false,
    });
    const model = createCryptoVisualizationViewModel([metric]);

    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.metrics)).toBe(true);
  });

  it('uses distinct semantic authority primitives without local branding hex values', () => {
    const authority = source('src/shared/ui/AuthorityBadge.tsx');
    const freshness = source('src/shared/ui/FreshnessBadge.tsx');
    const evidence = source('src/shared/ui/EvidenceStateIndicator.tsx');
    const research = source('src/shared/ui/ResearchOnlyBanner.tsx');
    const combined = `${authority}\n${freshness}\n${evidence}\n${research}`;

    expect(authority).toContain("CANONICAL_SCORE");
    expect(authority).toContain("RESEARCH");
    expect(authority).toContain("EVIDENCE_ONLY");
    expect(authority).toContain("MARKET_DATA");
    expect(authority).toContain('text-brand-primary');
    expect(authority).toContain('text-brand-accent');
    expect(authority).toContain('text-brand-cyan');
    expect(research).toContain('Score-eligible: nein');
    expect(research).toContain('Execution-eligible: nein');
    expect(research).toContain('data-score-eligible');
    expect(research).toContain('data-execution-eligible');
    expect(freshness).not.toContain('Date.now');
    expect(combined).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it('wires research and market-data authority labels into existing crypto presentation surfaces', () => {
    const quickAnalysis = source('src/features/crypto/ui/EnterpriseBinanceQuickAnalysis.tsx');
    const chart = source('src/features/crypto/ui/EnterpriseAsset4hChart.tsx');

    expect(quickAnalysis).toContain('<AuthorityBadge authority="RESEARCH"');
    expect(quickAnalysis).toContain('<AuthorityBadge authority="MARKET_DATA"');
    expect(quickAnalysis).toContain('<ResearchOnlyBanner');
    expect(quickAnalysis).toContain('<FreshnessBadge');

    expect(chart).toContain("authority: 'MARKET_DATA'");
    expect(chart).toContain('createCryptoVisualizationMetric');
    expect(chart).toContain('<EvidenceStateIndicator');
    expect(chart).toContain('<FreshnessBadge');
    expect(chart).not.toContain('4H · verified');
  });
});
