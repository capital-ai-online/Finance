import { describe, expect, it, vi } from 'vitest';
import {
  buildRoadmapBranchProjection,
  buildRoadmapCadenceProjection,
} from '../../server/routes/roadmapCadenceRoutes';

function response(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function contentsResponse(value: unknown): Response {
  return response({
    encoding: 'base64',
    content: Buffer.from(JSON.stringify(value), 'utf8').toString('base64'),
  });
}

function textContentsResponse(value: string): Response {
  return response({
    encoding: 'base64',
    content: Buffer.from(value, 'utf8').toString('base64'),
  });
}

describe('roadmap cadence live projection', () => {
  it('projects latest GitHub main separately from an older healthy Production identity', async () => {
    const currentMain = 'f'.repeat(40);
    const productionSha = 'a'.repeat(40);
    const epochSha = 'b'.repeat(40);
    const mergeCommit = (sha: string, pr: number) => ({
      sha,
      parents: [{ sha: '1'.repeat(40) }, { sha: '2'.repeat(40) }],
      commit: { message: 'Merge pull request #' + String(pr) + ' from capital-ai-online/test' },
    });

    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/commits?sha=main')) {
        return response([
          mergeCommit(currentMain, 1340),
          mergeCommit('e'.repeat(40), 1339),
          mergeCommit('d'.repeat(40), 1338),
          mergeCommit(epochSha, 1336),
          { sha: 'c'.repeat(40), parents: [{ sha: '0'.repeat(40) }], commit: { message: 'older' } },
        ]);
      }
      if (url.includes('/contents/docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json?ref=')) {
        return contentsResponse({
          version: '1.1.0',
          automaticMaterializationPolicy: {
            mode: 'MERGED_PR_CADENCE_PATCH',
            mergeOrdinalBoundaries: 'POSITIVE_MULTIPLES_OF_10',
          },
        });
      }
      if (url.includes('/contents/package.json?ref=')) {
        return contentsResponse({ version: '0.6.0' });
      }
      if (url.includes('/compare/')) return response({ status: 'ahead' });
      throw new Error('Unexpected URL ' + url);
    });
    const fetchMock = fetchSpy as typeof fetch;

    const projection = await buildRoadmapCadenceProjection(fetchMock, {
      version: '0.6.0',
      commitSha: productionSha,
      branch: 'main',
      repoSlug: 'capital-ai-online/Finance',
      provider: 'render',
      isPullRequest: false,
    });

    expect(projection.repository.currentMainSha).toBe(currentMain);
    expect(projection.production.commitSha).toBe(productionSha);
    expect(fetchSpy.mock.calls.some(([url]) =>
      String(url).includes('/contents/package.json?ref=' + currentMain),
    )).toBe(true);
    expect(fetchSpy.mock.calls.some(([url]) =>
      String(url).includes('/contents/docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json?ref=' + currentMain),
    )).toBe(true);
    expect(projection.cadence).toMatchObject({
      mode: 'CADENCE_5_10',
      activationPullRequest: 1336,
      activationMergeSha: epochSha,
      mergeOrdinal: 3,
      deployment: {
        progress: 3,
        remaining: 2,
        state: 'DEPLOYMENT_QUEUED',
        nextTargetSha: currentMain,
      },
      version: {
        progress: 3,
        remaining: 7,
        current: '0.6.0',
        nextPatch: '0.6.1',
      },
    });
  });

  it('projects only behind=0 ahead branches and resolves Project Owner from canonical branch slugs', async () => {
    const currentMain = 'f'.repeat(40);
    const frontendHead = 'a'.repeat(40);
    const operationsHead = 'b'.repeat(40);
    const divergedHead = 'c'.repeat(40);
    const unresolvedHead = 'd'.repeat(40);
    const projectMapping = [
      '## Canonical project-folder routing',
      '| Project ID | PVC relationship | Folder | Branch slug | Display name | Symbol | Color | Owner | Label |',
      '|---|---|---|---|---|---|---|---|---|',
      '| CAPITAL-AI-FE | cross-cutting | docs/projects/frontend/ | frontend | Frontend | ◇ | #A855F7 | CAPITAL-AI-FE | project:CAPITAL-AI-FE |',
      '| CAPITAL-AI-OPS | PVC-02 / PVC-08 | docs/projects/operations/ | operations | Operations | ✈ | #845CDC | CAPITAL-AI-OPS | project:CAPITAL-AI-OPS |',
      '| CAPITAL-AI-FINTECH | PVC-09..17 | docs/projects/fintech/ | fintech | FinTech | ₿ | #E080AC | CAPITAL-AI-FINTECH | project:CAPITAL-AI-FINTECH |',
    ].join('\n');

    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/commits/main')) return response({ sha: currentMain });
      if (url.includes('/contents/docs/projects/README.md?ref=' + currentMain)) {
        return textContentsResponse(projectMapping);
      }
      if (url.includes('/branches?per_page=100&page=1')) {
        return response([
          { name: 'main', commit: { sha: currentMain } },
          { name: 'agent/frontend-control-center-roadmap-mobile-20260928', commit: { sha: frontendHead } },
          { name: 'agent/operations-roadmap-branch-evidence-20260928', commit: { sha: operationsHead } },
          { name: 'agent/fintech-diverged', commit: { sha: divergedHead } },
          { name: 'agent/mystery-live', commit: { sha: unresolvedHead } },
        ]);
      }
      if (url.includes('/compare/' + currentMain + '...' + frontendHead)) {
        return response({ status: 'ahead', ahead_by: 7, behind_by: 0 });
      }
      if (url.includes('/compare/' + currentMain + '...' + operationsHead)) {
        return response({ status: 'ahead', ahead_by: 4, behind_by: 0 });
      }
      if (url.includes('/compare/' + currentMain + '...' + divergedHead)) {
        return response({ status: 'diverged', ahead_by: 5, behind_by: 3 });
      }
      if (url.includes('/compare/' + currentMain + '...' + unresolvedHead)) {
        return response({ status: 'ahead', ahead_by: 1, behind_by: 0 });
      }
      throw new Error('Unexpected URL ' + url);
    });

    const projection = await buildRoadmapBranchProjection(fetchSpy as typeof fetch);

    expect(projection.repository.currentMainSha).toBe(currentMain);
    expect(projection.stale).toBe(false);
    expect(projection.branches).toHaveLength(3);
    expect(projection.branches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'agent/frontend-control-center-roadmap-mobile-20260928',
          aheadBy: 7,
          behindBy: 0,
          projectId: 'CAPITAL-AI-FE',
          projectLabel: 'project:CAPITAL-AI-FE',
          ownerResolution: 'RESOLVED',
        }),
        expect.objectContaining({
          name: 'agent/operations-roadmap-branch-evidence-20260928',
          aheadBy: 4,
          behindBy: 0,
          projectId: 'CAPITAL-AI-OPS',
          ownerResolution: 'RESOLVED',
        }),
        expect.objectContaining({
          name: 'agent/mystery-live',
          aheadBy: 1,
          behindBy: 0,
          projectId: null,
          ownerResolution: 'UNRESOLVED',
        }),
      ]),
    );
    expect(projection.branches.some((item) => item.name === 'agent/fintech-diverged')).toBe(false);
    expect(projection.scan).toMatchObject({
      candidateCount: 4,
      comparedCount: 4,
      excludedCount: 1,
      comparisonFailures: 0,
      truncated: false,
    });
  });

});
