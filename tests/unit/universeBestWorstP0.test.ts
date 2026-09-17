import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const code = fs.readFileSync(path.join(process.cwd(), 'src/components/UniverseBestWorst.tsx'), 'utf8');

describe('UniverseBestWorst P0 ranking coverage', () => {
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
});
