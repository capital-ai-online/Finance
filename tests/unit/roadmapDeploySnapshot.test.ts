import { describe, expect, it } from 'vitest';
import { buildRoadmapDeploySnapshot } from '../../scripts/automation/buildRoadmapDeploySnapshot';

const SHA = 'a'.repeat(40);

describe('Roadmap deploy snapshot', () => {
  it('binds every projected item to the deployed source generation without network access', () => {
    const projection = buildRoadmapDeploySnapshot(SHA);
    expect(projection.repository.currentMainSha).toBe(SHA);
    expect(projection.stale).toBe(false);
    expect(projection.items.length).toBeGreaterThan(0);
    expect(projection.items.every((item) => item.sourceSha === SHA)).toBe(true);
    expect(projection.sources).toContain('docs/architecture/ROADMAP.md');
    expect(projection.sources).toContain('docs/projects/frontend/ROADMAP.md');
  });

  it('rejects a missing or malformed release source identity', () => {
    expect(() => buildRoadmapDeploySnapshot('')).toThrow('ROADMAP_DEPLOY_SOURCE_SHA_INVALID');
  });
});
