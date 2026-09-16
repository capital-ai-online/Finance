import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const code = fs.readFileSync(path.join(process.cwd(), 'src/features/screening/ui/RankingBoard.tsx'), 'utf8');
const alias = fs.readFileSync(path.join(process.cwd(), 'src/features/screening/ui/UniverseBestWorst.tsx'), 'utf8');
const compatibility = fs.readFileSync(path.join(process.cwd(), 'src/components/UniverseBestWorst.tsx'), 'utf8');

describe('RankingBoard P0 ranking coverage (replaces UniverseBestWorst)', () => {
  it('selects up to 24 candidates per asset class and prioritizes legacy-registry assets', () => {
    expect(code).not.toMatch(/\.slice\(\s*0\s*,\s*8\s*\)/);
    expect(code).toMatch(/const\s+RANKING_CANDIDATE_LIMIT\s*=\s*24/);
    expect(code).toContain('selectRankingCandidates');
    expect(code).toMatch(/\.origin\s*===\s*['"]legacy-registry['"]\s*\?\s*0\s*:\s*1/);
    expect(code).toMatch(/\.slice\(\s*0\s*,\s*RANKING_CANDIDATE_LIMIT\s*\)/);
  });

  it('keeps unavailable scoring results visible and never fabricates fallback scores', () => {
    for (const status of ['SCORE_NOT_COMPUTABLE', 'PROVIDER_TIMEOUT', 'PROVIDER_UNAVAILABLE']) {
      expect(code).toContain(status);
    }
    expect(code).toContain('Nicht berechenbar');
    expect(code).not.toContain('Math.random');
    expect(code).not.toMatch(/score:\s*50(?:\D|$)/);
  });

  it('ranks only READY scores and exposes group plus universe coverage', () => {
    expect(code).toMatch(/row\.status\s*===\s*['"]READY['"]\s*&&\s*row\.score\s*!==\s*null/);
    expect(code).toContain('readyCount');
    expect(code).toContain('candidatesInGroup');
    expect(code).toContain('totalCoverage');
    expect(code).toContain('Coverage');
  });

  it('exposes sentiment, momentum and leading pattern without parallel scoring architecture', () => {
    expect(code).toContain('extractSentiment');
    expect(code).toContain('extractMomentum');
    expect(code).toContain('extractLeadingPattern');
    expect(code).toContain('NO PATTERN');
    expect(code).toContain('/api/crypto/score');
    expect(code).toContain('/api/registry/assets/verified-scores');
  });

  it('uses productive semantic asset-class and score roles; UniverseBestWorst is alias-only; components path is compatibility export', () => {
    for (const token of ['asset-crypto', 'asset-stock', 'asset-index', 'asset-forex', 'asset-commodity']) {
      expect(code).toContain(token);
    }
    expect(code).toContain("type ProductiveAssetType = Exclude<AssetType, 'bond'>;");
    expect(code).not.toContain('text-asset-bond');
    expect(code).toContain('text-score-best');
    expect(code).toContain('text-score-worst');
    expect(alias).toContain("from './RankingBoard'");
    expect(alias).toContain('RankingBoard as UniverseBestWorst');
    expect(alias).not.toContain('RANKING_CANDIDATE_LIMIT');
    expect(compatibility).toContain("../features/screening/ui/UniverseBestWorst");
    expect(compatibility).not.toContain('RANKING_CANDIDATE_LIMIT');
  });
});
