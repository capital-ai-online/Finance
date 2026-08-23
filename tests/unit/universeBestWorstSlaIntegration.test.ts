import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('RankingBoard P1 SLA integration (replaces UniverseBestWorst)', () => {
  it('keeps the existing 24-candidate budget and evaluates availability through the canonical SLA helper', () => {
    const source = readFileSync(new URL('../../src/features/screening/ui/RankingBoard.tsx', import.meta.url), 'utf8');

    expect(source).toContain('const RANKING_CANDIDATE_LIMIT = 24');
    expect(source).toContain('const VERIFIED_SCORE_BATCH_LIMIT = 50');
    expect(source).toContain('chunkVerifiedScoreCandidates');
    expect(source).toContain('buildUniverseAvailabilityProjection');
    expect(source).toContain('evidenceIds');
    expect(source).toContain('Universe SLA');
    expect(source).toContain('fehlende Werte werden nie aufgefüllt');
    expect(source).not.toContain('Math.random');
  });
});
