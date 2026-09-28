import { describe, expect, it } from 'vitest';
import { parseRoadmapBranchProjection } from '../../src/features/public/ui/roadmapBranchState';

const currentMainSha = '14677ea3acc5316e025d784c7dc35d3a6b2dfe1a';

function projection(): any {
  return {
    schemaVersion: 'roadmap-branch-evidence/1.0.0',
    role: 'NON_AUTHORIZING_LIVE_PROJECTION',
    observedAt: '2026-09-28T01:29:32.000Z',
    stale: false,
    repository: { currentMainSha },
    scan: {
      candidateCount: 2,
      comparedCount: 2,
      excludedCount: 1,
      comparisonFailures: 0,
      truncated: false,
    },
    branches: [
      {
        name: 'agent/frontend-control-center-roadmap-mobile-20260928',
        headSha: 'a'.repeat(40),
        currentMainSha,
        aheadBy: 7,
        behindBy: 0,
        relation: 'LIVE_CURRENT_MAIN_DESCENDANT',
        projectId: 'CAPITAL-AI-FE',
        projectFolder: 'docs/projects/frontend/',
        projectLabel: 'project:CAPITAL-AI-FE',
        ownerResolution: 'RESOLVED',
      },
    ],
  };
}

describe('Roadmap branch evidence consumer', () => {
  it('accepts only the explicit behind=0 live-branch contract', () => {
    const parsed = parseRoadmapBranchProjection(projection());
    expect(parsed.repository.currentMainSha).toBe(currentMainSha);
    expect(parsed.branches).toEqual([
      expect.objectContaining({
        name: 'agent/frontend-control-center-roadmap-mobile-20260928',
        aheadBy: 7,
        behindBy: 0,
        projectId: 'CAPITAL-AI-FE',
      }),
    ]);
  });

  it('fails closed if a provider payload tries to present a behind branch as Live', () => {
    const invalid = projection();
    invalid.branches[0].behindBy = 1;
    expect(() => parseRoadmapBranchProjection(invalid)).toThrow(
      'roadmap-branch-0-relation-invalid',
    );
  });

  it('fails closed when branch evidence belongs to another CURRENT_MAIN generation', () => {
    const invalid = projection();
    invalid.branches[0].currentMainSha = 'b'.repeat(40);
    expect(() => parseRoadmapBranchProjection(invalid)).toThrow(
      'roadmap-branch-0-main-mismatch',
    );
  });

  it('keeps unresolved owner attribution explicit instead of inventing a Project Owner', () => {
    const unresolved = projection();
    unresolved.branches[0] = {
      ...unresolved.branches[0],
      name: 'agent/mystery-live',
      projectId: null,
      projectFolder: null,
      projectLabel: null,
      ownerResolution: 'UNRESOLVED',
    };
    expect(parseRoadmapBranchProjection(unresolved).branches[0]).toMatchObject({
      projectId: null,
      projectLabel: null,
      ownerResolution: 'UNRESOLVED',
    });
  });
});
