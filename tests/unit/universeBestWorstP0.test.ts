import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const code = fs.readFileSync(path.join(process.cwd(), 'src/components/UniverseBestWorst.tsx'), 'utf8');

describe('UniverseBestWorst P0 ranking coverage', () => {
  it('does not truncate each asset class to the first eight catalog symbols', () => {
    expect(code).not.toContain('.slice(0, 8)');
    expect(code).toContain('RANKING_CANDIDATE_LIMIT = 24');
    expect(code).toContain('selectRankingCandidates');
    expect(code).toContain("asset.origin === 'legacy-registry'");
  });

  it('keeps unavailable scoring results visible instead of fabricating replacement scores', () => {
    expect(code).toContain('SCORE_NOT_COMPUTABLE');
    expect(code).toContain('PROVIDER_TIMEOUT');
    expect(code).toContain('PROVIDER_UNAVAILABLE');
    expect(code).toContain('Nicht berechenbar');
    expect(code).not.toContain('Math.random');
    expect(code).not.toMatch(/score:\s*50/);
  });

  it('reports ranking coverage and only ranks READY scores', () => {
    expect(code).toContain("row.status === 'READY' && row.score !== null");
    expect(code).toContain('totalCoverage');
    expect(code).toContain('Coverage');
  });
});
