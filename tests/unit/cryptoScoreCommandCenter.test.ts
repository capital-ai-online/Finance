import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('CV-1 crypto score command center', () => {
  it('makes the canonical score the leading visual authority and keeps ranking secondary', () => {
    const code = source('src/features/crypto/ui/CryptoScoringEnterprise.tsx');
    const commandCenterIndex = code.indexOf('CV-1 · Score Command Center');
    const canonicalIndex = code.indexOf('Canonical Score als führende Entscheidungsmetrik');
    const rankingIndex = code.indexOf('Ranking Score');

    expect(commandCenterIndex).toBeGreaterThan(-1);
    expect(canonicalIndex).toBeGreaterThan(commandCenterIndex);
    expect(rankingIndex).toBeGreaterThan(canonicalIndex);
    expect(code).toContain('<AuthorityBadge authority="CANONICAL_SCORE"');
    expect(code).toContain('sekundäre Ranking Projection · kein kanonischer Score');
    expect(code).toContain('fill="var(--color-brand-primary)"');
  });

  it('projects backend model lineage instead of inventing model metadata in the frontend', () => {
    const code = source('src/features/crypto/ui/CryptoScoringEnterprise.tsx');

    expect(code).toContain('integrity?.modelId');
    expect(code).toContain('integrity?.modelVersion');
    expect(code).toContain('integrity?.modelAlias');
    expect(code).toContain('integrity?.modelLifecycle');
    expect(code).toContain('integrity?.observedAt');
    expect(code).toContain('integrity?.retrievedAt');
    expect(code).toContain('createCryptoVisualizationMetric');
    expect(code).toContain("authority: 'CANONICAL_SCORE'");
    expect(code).toContain('30 verifizierte 1D-Bars');
  });

  it('keeps technical, research and evidence lenses visually and semantically separated', () => {
    const code = source('src/features/crypto/ui/CryptoScoringEnterprise.tsx');

    expect(code).toContain('Technical / Canonical');
    expect(code).toContain('Research Context');
    expect(code).toContain('Evidence Health');
    expect(code).toContain('<AuthorityBadge authority="RESEARCH"');
    expect(code).toContain('<ResearchOnlyBanner');
    expect(code).toContain('<EvidenceStateIndicator');
    expect(code).toContain('<FreshnessBadge');
    expect(code).toContain('verändern den Canonical Score nicht');
  });

  it('does not infer a decision tier from numeric score thresholds in presentation code', () => {
    const code = source('src/features/crypto/ui/CryptoScoringEnterprise.tsx');

    expect(code).toContain('function decisionStyle(decision: string | null)');
    expect(code).not.toContain('function scoreTier');
    expect(code).not.toMatch(/score\s*>?=\s*(80|65|50|35)/);
    expect(code).not.toContain('Math.random');
    expect(code).not.toContain('charCodeAt');
  });

  it('preserves the existing asset search and canonical 30x1D timeframe boundary', () => {
    const code = source('src/features/crypto/ui/CryptoScoringEnterprise.tsx');

    expect(code).toContain('Asset-Suche');
    expect(code).toContain('Analyse-Zeitraum');
    expect(code).toContain('aria-label="Analyse-Zeitraum des Enterprise Universum Scorers"');
    expect(code).toContain("uiTimeframe: '1 tag'");
    expect(code).toContain("barInterval: '1d'");
    expect(code).toContain('lookbackBars: 30');
    expect(code).toContain("{ value: '1 tag', label: '1 Tag', scoreBound: true }");
    expect(code).toContain('Intraday-Scores werden nicht synthetisiert.');
  });

  it('places the research/market quick analysis below the score command center', () => {
    const code = source('src/features/crypto/ui/CryptoScoringEnterprise.tsx');
    const commandCenterIndex = code.indexOf('id="crypto-score-command-center"');
    const quickAnalysisIndex = code.indexOf('<EnterpriseBinanceQuickAnalysis');

    expect(commandCenterIndex).toBeGreaterThan(-1);
    expect(quickAnalysisIndex).toBeGreaterThan(commandCenterIndex);
  });
});
