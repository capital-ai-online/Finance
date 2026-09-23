import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROADMAP_DASHBOARD_SNAPSHOT } from '../../src/features/public/ui/roadmapSnapshot';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Roadmap dashboard projection', () => {
  it('binds the UI snapshot to the exact correlated current-main identity', () => {
    expect(ROADMAP_DASHBOARD_SNAPSHOT.currentMainSha).toBe(
      '7bcc6aee2700d6fa3f926ff8615b04cde136750c',
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.role).toBe('NON_AUTHORIZING_DERIVED_UI_PROJECTION');
  });

  it('terminalizes merged PR 1297 and keeps current provider-backed work visible', () => {
    expect(ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some((item) => item.prNumber === 1297)).toBe(false);
    expect(ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some((item) => item.prNumber === 1299)).toBe(true);
    expect(ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some((item) => item.prNumber === 1300)).toBe(true);
    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some(
        (item) => item.id === 'SEC-SH02-11A-RETRY-SAFE-INDEPENDENT-VERIFICATION',
      ),
    ).toBe(true);
    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some(
        (item) => item.id === 'DOCUMENTARY-STARTUP-FAILURE-PERMISSION-CEILING',
      ),
    ).toBe(true);
  });

  it('keeps canonical active packages traceable to owner roadmap sources', () => {
    for (const item of ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages) {
      if (item.sourceType !== 'canonical-roadmap') continue;
      expect(read(item.source), `${item.id} source must contain its canonical identity`).toContain(item.id);
    }
  });

  it('uses only canonical branding and shared presentation contracts', () => {
    const dashboard = read('src/features/public/ui/RoadmapDashboard.tsx');

    expect(dashboard).toContain("../../../shared/branding/CapitalAiLogo");
    expect(dashboard).toContain("../../../shared/ui/Card");
    expect(dashboard).toContain('text-brand-primary');
    expect(dashboard).toContain('text-roadmap-foundation');
    expect(dashboard).toContain('text-roadmap-automation');
    expect(dashboard).toContain('text-roadmap-runtime');
    expect(dashboard).toContain('text-roadmap-product-market');
    expect(dashboard).toContain('text-roadmap-scaling');

    expect(ROADMAP_DASHBOARD_SNAPSHOT.branding.brandmark).toBe('docs/frontend/brandmark.json');
    expect(ROADMAP_DASHBOARD_SNAPSHOT.branding.designTokens).toBe(
      'docs/frontend/design-tokens.json',
    );
  });

  it('keeps production identity separate from repository current-main truth', () => {
    const dashboard = read('src/features/public/ui/RoadmapDashboard.tsx');

    expect(dashboard).toContain("fetch('/healthz'");
    expect(dashboard).toContain('x-capital-ai-commit');
    expect(dashboard).toContain('separater Runtime-Stand');
  });
});
