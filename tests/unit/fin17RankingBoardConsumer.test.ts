import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/features/screening/ui/RankingBoard.tsx'),
  'utf8',
);

describe('FIN-17 frontend backend-ranking consumer', () => {
  it('consumes the bounded crypto batch and backend ranking projection', () => {
    expect(source).toContain("'/api/crypto/score'");
    expect(source).toContain('assets: crypto.map');
    expect(source).toContain('buildBackendRankingLookup');
    expect(source).toContain('result.body?.backendRanking');
    expect(source).toContain("authority: 'CrossAssetRanking'");
  });

  it('orders presentation rows only by backend rank and never by financial score', () => {
    expect(source).toContain('a.backendRanking?.rank');
    expect(source).toContain('b.backendRanking?.rank');
    expect(source).not.toContain('.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))');
    expect(source).not.toContain('.sort((a, b) => (a.score ?? 0) - (b.score ?? 0))');
  });

  it('fails closed instead of joining multiple backend ranking cohorts', () => {
    expect(source).toContain('const rankingCohortConflict = cohortKeys.length > 1');
    expect(source).toContain('const backendOrderedRows = rankingCohortConflict');
    expect(source).toContain('? []');
    expect(source).toContain('row.backendRanking.crossCohortOrder === false');
  });
});
