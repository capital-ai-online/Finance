import { describe, expect, it, vi } from 'vitest';
import { buildRoadmapCadenceProjection } from '../../server/routes/roadmapCadenceRoutes';

function response(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
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

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
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
      if (url.includes('DETERMINISTIC_VERSIONING_RULE_CONTRACT.json')) {
        return response({
          version: '1.1.0',
          automaticMaterializationPolicy: {
            mode: 'MERGED_PR_CADENCE_PATCH',
            mergeOrdinalBoundaries: 'POSITIVE_MULTIPLES_OF_10',
          },
        });
      }
      if (url.endsWith('/main/package.json')) return response({ version: '0.6.0' });
      if (url.includes('/compare/')) return response({ status: 'ahead' });
      throw new Error('Unexpected URL ' + url);
    }) as typeof fetch;

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
});
