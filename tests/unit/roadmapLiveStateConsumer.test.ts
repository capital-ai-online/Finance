import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  matchesRoadmapLiveItemFilters,
  parseRoadmapLiveProjection,
  splitRoadmapLiveItems,
} from '../../src/features/public/ui/roadmapLiveState';

const sha = '5c1b6727762364229516d4c74e85d9bf960574d1';

function projection(stale = false) {
  return {
    schemaVersion: 'roadmap-live-state/1.0.0',
    role: 'NON_AUTHORIZING_LIVE_PROJECTION',
    observedAt: '2026-09-24T06:05:00.000Z',
    stale,
    repository: { currentMainSha: sha },
    sources: ['docs/architecture/ROADMAP.md'],
    items: [
      {
        id: 'OPS-LIVE-01',
        title: 'Active Operations Work',
        projectId: 'CAPITAL-AI-OPS',
        projectFolder: 'docs/projects/operations/',
        projectLabel: 'project:CAPITAL-AI-OPS',
        pvcRelationship: 'PVC-02',
        state: 'ACTIVE',
        stateLabel: 'ACTIVE',
        source: 'docs/projects/operations/ROADMAP.md',
        sourceSha: sha,
        detail: 'Active work from exact current main.',
        dependencies: [],
        executionGroup: 'OPS-LIVE-01',
        workerCandidate: true,
      },
      {
        id: 'QM-LIVE-02',
        title: 'Held Quality Work',
        projectId: 'CAPITAL-AI-QM',
        projectFolder: 'docs/projects/quality-management/',
        projectLabel: 'project:CAPITAL-AI-QM',
        pvcRelationship: 'cross-cutting',
        state: 'HELD',
        stateLabel: 'HELD',
        source: 'docs/architecture/ROADMAP.md',
        sourceSha: sha,
        detail: 'Dependency held.',
        dependencies: ['QM-LIVE-01'],
        executionGroup: 'QM-LIVE-02',
        workerCandidate: false,
      },
    ],
    warnings: [],
  };
}

describe('Roadmap live-state consumer', () => {
  it('accepts the canonical live projection and preserves explicit stale state', () => {
    const live = parseRoadmapLiveProjection(projection(true));
    expect(live.repository.currentMainSha).toBe(sha);
    expect(live.stale).toBe(true);
    expect(live.items).toHaveLength(2);
  });

  it('fails closed on malformed repository generations', () => {
    const invalid = projection();
    invalid.repository.currentMainSha = 'not-a-sha';
    expect(() => parseRoadmapLiveProjection(invalid)).toThrow(
      'roadmap-live-current-main-invalid',
    );
  });

  it('rejects mixed-generation live items instead of presenting them as current', () => {
    const invalid = projection();
    invalid.items[0].sourceSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    expect(() => parseRoadmapLiveProjection(invalid)).toThrow(
      'roadmap-live-generation-mismatch',
    );
  });

  it('maps live ACTIVE/HELD state into the existing presentation contracts', () => {
    const live = parseRoadmapLiveProjection(projection());
    const split = splitRoadmapLiveItems(live.items);

    expect(split.activeWorkPackages.map((item) => item.id)).toEqual(['OPS-LIVE-01']);
    expect(split.activeWorkPackages[0]?.sourceType).toBe('canonical-roadmap');
    expect(split.queuedItems.map((item) => item.id)).toEqual(['QM-LIVE-02']);
    expect(split.queuedItems[0]?.dependsOn).toEqual(['QM-LIVE-01']);
  });

  it('filters live items by their generation-carried project metadata', () => {
    const live = parseRoadmapLiveProjection(projection());
    expect(
      live.items.filter((item) =>
        matchesRoadmapLiveItemFilters(item, {
          owner: 'CAPITAL-AI-OPS',
          folder: 'docs/projects/operations/',
          label: 'project:CAPITAL-AI-OPS',
        }),
      ).map((item) => item.id),
    ).toEqual(['OPS-LIVE-01']);
  });

  it('uses /api/roadmap/state as primary current-work truth and fails closed without it', () => {
    const dashboard = fs.readFileSync(
      path.join(process.cwd(), 'src/features/public/ui/RoadmapDashboard.tsx'),
      'utf8',
    );

    expect(dashboard).toContain("fetch('/api/roadmap/state'");
    expect(dashboard).toContain("fetch('/api/roadmap/branches'");
    expect(dashboard).toContain("cache: 'no-store'");
    expect(dashboard).toContain("fetch('/healthz'");
    expect(dashboard).toContain("data-roadmap-live-state");
    expect(dashboard).toContain('STALE · letzte bestätigte Repository-Generation');
    expect(dashboard).toContain('aktive Arbeit wird fail-closed ausgeblendet');
    expect(dashboard).not.toContain('ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.filter');
    expect(dashboard).not.toContain('ROADMAP_DASHBOARD_SNAPSHOT.queuedItems.filter');
    expect(dashboard).not.toContain('ROADMAP_DASHBOARD_SNAPSHOT.currentMainSha');
    expect(dashboard).toContain('ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.filter');
  });
});
