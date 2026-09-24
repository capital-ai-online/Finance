import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildRoadmapStateFromSources,
  parseRoadmapProjectRouting,
} from '../../server/routes/roadmapStateProjection';

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

function localProjection() {
  const projectMapping = read('docs/projects/README.md');
  const routes = parseRoadmapProjectRouting(projectMapping);
  const projectRoadmaps = Object.fromEntries(
    routes.map((route) => [
      route.folder + 'ROADMAP.md',
      read(route.folder + 'ROADMAP.md'),
    ]),
  );

  return buildRoadmapStateFromSources({
    currentMainSha: 'f'.repeat(40),
    projectMapping,
    liveRoadmap: read('docs/architecture/ROADMAP.md'),
    projectRoadmaps,
  });
}

describe('application-wide Roadmap CURRENT_MAIN projection', () => {
  it('reads every canonical project Roadmap plus the central Live Roadmap', () => {
    const projection = localProjection();

    expect(projection.role).toBe('NON_AUTHORIZING_LIVE_PROJECTION');
    expect(projection.repository.currentMainSha).toBe('f'.repeat(40));
    expect(projection.sources).toContain('docs/architecture/ROADMAP.md');
    expect(projection.sources).toEqual(
      expect.arrayContaining([
        'docs/projects/agent-client/ROADMAP.md',
        'docs/projects/operations/ROADMAP.md',
        'docs/projects/documentary/ROADMAP.md',
        'docs/projects/governance/ROADMAP.md',
        'docs/projects/fintech/ROADMAP.md',
        'docs/projects/quality-management/ROADMAP.md',
        'docs/projects/security/ROADMAP.md',
        'docs/projects/compliance/ROADMAP.md',
        'docs/projects/frontend/ROADMAP.md',
        'docs/projects/seo/ROADMAP.md',
        'docs/projects/social-media/ROADMAP.md',
      ]),
    );
  });

  it('projects the application-wide current identities that were missing from the static UI snapshot', () => {
    const projection = localProjection();
    const ids = new Set(projection.items.map((item) => item.id));

    for (const id of [
      'CLIENT-RUNTIME-01',
      'CLIENT-LF-01',
      'OPS-MERGE-CADENCE-01',
      'OPS-AUTH-RENDER-MGMT-TOKEN-RECOVERY-01',
      'OPS-RENDER-MCP-AI-DEBUG-01',
      'OPS-LIVE-ROADMAP-CURRENT-MAIN-STATE-01',
      'GOV-DEPLOY-BATCH-01',
      'WP-SEO-TOPICS',
      'WP-SEO-CONTENT',
      'REQ-COMP-032',
      'REQ-COMP-034',
      'REQ-COMP-017',
      'REQ-COMP-019',
      'REQ-COMP-021',
      'REQ-COMP-031',
      'FIN-LF-01',
      'SOCIAL-P1',
      'SOCIAL-P2',
      'SOCIAL-P3',
      'SEC-WEB-00',
      'SEC-WEB-10',
      'SEC-WEB-20',
      'SEC-WEB-30',
      'SEC-WEB-40',
      'SEC-WEB-50',
      'QM-PR900-03',
      'QM-PR900-04',
    ]) {
      expect(ids.has(id), id + ' must be projected from its canonical current-state source').toBe(true);
    }
  });

  it('keeps dependency-held and evidence-gated work fail-closed', () => {
    const projection = localProjection();
    const item = (id: string) => projection.items.find((candidate) => candidate.id === id);

    expect(item('CLIENT-RUNTIME-01')?.state).toBe('HELD');
    expect(item('CLIENT-LF-01')?.state).toBe('HELD');
    expect(item('SEC-WEB-20')?.state).toBe('HELD');
    expect(item('SEC-WEB-20')?.dependencies).toEqual(
      expect.arrayContaining(['SEC-WEB-00', 'SEC-WEB-10']),
    );
    expect(item('QM-PR900-04')?.state).toBe('HELD');
    expect(item('QM-PR900-04')?.dependencies).toContain('QM-PR900-03');
    expect(item('COMP-FINREG-01')?.state).toBe('EVIDENCE_GATE');
    expect(item('REQ-COMP-017')?.state).toBe('EVIDENCE_GATE');
  });

  it('keeps Compliance gap aliases visible without creating duplicate task authority', () => {
    const projection = localProjection();
    const item = (id: string) => projection.items.find((candidate) => candidate.id === id);

    expect(item('REQ-COMP-032')?.title).toContain('COMP-GAP-007');
    expect(item('REQ-COMP-017')?.title).toContain('COMP-GAP-004');
    expect(item('REQ-COMP-021')?.title).toContain('COMP-GAP-005');
  });

  it('uses the central Live Roadmap for migrated SEC and QM state', () => {
    const projection = localProjection();
    const item = (id: string) => projection.items.find((candidate) => candidate.id === id);

    expect(item('SEC-WEB-00')?.source).toBe('docs/architecture/ROADMAP.md');
    expect(item('QM-PR900-03')?.source).toBe('docs/architecture/ROADMAP.md');
    expect(item('QM-PR900-04')?.source).toBe('docs/architecture/ROADMAP.md');
  });

  it('does not revive known terminal or superseded identities', () => {
    const projection = localProjection();
    const ids = new Set(projection.items.map((item) => item.id));

    for (const id of [
      'SEC-AUTH-DIAG-AAL2-01',
      'QM-PR900-01',
      'QM-PR900-02',
      'CLIENT-01',
      'SOCIAL-P0',
    ]) {
      expect(ids.has(id), id + ' must remain non-active evidence').toBe(false);
    }
  });

  it('surfaces stale branch-state text on CURRENT_MAIN rather than silently treating it as active', () => {
    const projection = localProjection();
    const gov = projection.items.find((item) => item.id === 'GOV-DEPLOY-BATCH-01');

    expect(gov?.state).toBe('EVIDENCE_GATE');
    expect(
      projection.warnings.some(
        (warning) =>
          warning.code === 'STALE_BRANCH_STATE_ON_CURRENT_MAIN' &&
          warning.itemId === 'GOV-DEPLOY-BATCH-01',
      ),
    ).toBe(true);
  });

  it('keeps worker candidates informational and dependency aware', () => {
    const projection = localProjection();
    const item = (id: string) => projection.items.find((candidate) => candidate.id === id);

    expect(item('WP-SEO-TOPICS')?.state).toBe('READY');
    expect(item('WP-SEO-CONTENT')?.state).toBe('READY');
    expect(item('SEC-WEB-20')?.workerCandidate).toBe(false);
    expect(item('QM-PR900-04')?.workerCandidate).toBe(false);
  });
});
