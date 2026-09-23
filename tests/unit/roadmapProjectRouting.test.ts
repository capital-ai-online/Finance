import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROADMAP_DASHBOARD_SNAPSHOT } from '../../src/features/public/ui/roadmapSnapshot';
import {
  buildRoadmapExecutionLanes,
  matchesRoadmapProjectFilters,
  parseRoadmapProjectRouting,
  resolveRoadmapProjects,
} from '../../src/features/public/ui/roadmapProjectRouting';

const root = process.cwd();
const mapping = fs.readFileSync(path.join(root, 'docs/projects/README.md'), 'utf8');
const routes = parseRoadmapProjectRouting(mapping);

describe('Roadmap project routing and parallel worker projection', () => {
  it('derives project owner, folder and label from the canonical project mapping', () => {
    expect(routes.length).toBeGreaterThanOrEqual(11);

    const sec = routes.find((route) => route.projectId === 'CAPITAL-AI-SEC');
    expect(sec).toMatchObject({
      folder: 'docs/projects/security/',
      displayName: 'Security',
      symbol: '💻',
      color: '#E04C4C',
      label: 'project:CAPITAL-AI-SEC',
    });
  });

  it('filters a multi-owner item by project owner, folder or label without a second registry', () => {
    const owner = 'CAPITAL-AI-SEC · CAPITAL-AI-FE · CAPITAL-AI-OPS';

    expect(resolveRoadmapProjects(owner, routes).map((project) => project.projectId)).toEqual(
      expect.arrayContaining(['CAPITAL-AI-SEC', 'CAPITAL-AI-FE', 'CAPITAL-AI-OPS']),
    );

    expect(
      matchesRoadmapProjectFilters(
        owner,
        { owner: 'CAPITAL-AI-SEC', folder: '', label: '' },
        routes,
      ),
    ).toBe(true);
    expect(
      matchesRoadmapProjectFilters(
        owner,
        { owner: '', folder: 'docs/projects/frontend/', label: '' },
        routes,
      ),
    ).toBe(true);
    expect(
      matchesRoadmapProjectFilters(
        owner,
        { owner: '', folder: '', label: 'project:CAPITAL-AI-OPS' },
        routes,
      ),
    ).toBe(true);
    expect(
      matchesRoadmapProjectFilters(
        owner,
        { owner: 'CAPITAL-AI-QM', folder: '', label: '' },
        routes,
      ),
    ).toBe(false);
  });

  it('bundles related ready/active work and excludes held, queued and evidence-gate items from capacity', () => {
    const lanes = buildRoadmapExecutionLanes(
      ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages,
      ROADMAP_DASHBOARD_SNAPSHOT.queuedItems,
      routes,
    );

    expect(lanes).toHaveLength(8);

    const sec = lanes.find((lane) => lane.id === 'SEC-WEB-HARDENING-01');
    expect(sec?.itemIds).toEqual(
      expect.arrayContaining(['SEC-WEB-HARDENING-01', 'SEC-WEB-00', 'SEC-WEB-10']),
    );
    expect(sec?.itemIds).not.toContain('SEC-WEB-20');

    const social = lanes.find((lane) => lane.id === 'SOCIAL-P1-P2');
    expect(social?.itemIds).toEqual(expect.arrayContaining(['SOCIAL-P1', 'SOCIAL-P2']));

    const qm = lanes.find((lane) => lane.id === 'QM-ACTIONS-ASSURANCE');
    expect(qm?.itemIds).toEqual(['QM-PR900-03']);
    expect(lanes.some((lane) => lane.id === 'QM-READINESS')).toBe(false);

    expect(lanes.some((lane) => lane.id === 'OPS-SH-02.12')).toBe(false);
    expect(lanes.some((lane) => lane.itemIds.includes('COMP-FINREG-01'))).toBe(false);
  });

  it('reduces the worker projection to the selected project while preserving shared ownership', () => {
    const filteredActive = ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.filter((item) =>
      matchesRoadmapProjectFilters(
        item.owner,
        { owner: 'CAPITAL-AI-SEC', folder: '', label: '' },
        routes,
      ),
    );
    const filteredQueue = ROADMAP_DASHBOARD_SNAPSHOT.queuedItems.filter((item) =>
      matchesRoadmapProjectFilters(
        item.owner,
        { owner: 'CAPITAL-AI-SEC', folder: '', label: '' },
        routes,
      ),
    );

    const lanes = buildRoadmapExecutionLanes(filteredActive, filteredQueue, routes);
    expect(lanes).toHaveLength(1);
    expect(lanes[0]?.id).toBe('SEC-WEB-HARDENING-01');
  });
});
