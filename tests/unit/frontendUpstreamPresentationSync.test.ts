import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('FRONTEND upstream presentation sync contract', () => {
  const root = process.cwd();
  const config = JSON.parse(fs.readFileSync(path.join(root, '.github/frontend-upstream-sync.json'), 'utf8'));
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/frontend-upstream-presentation-sync.yml'), 'utf8');
  const syncScript = fs.readFileSync(path.join(root, 'scripts/frontend/syncFrontendPresentationSource.mjs'), 'utf8');

  it('adopts the complete allowlisted FRONTEND presentation architecture outside Finance runtime', () => {
    expect(config.source.repository).toBe('SvenKulessa/FRONTEND');
    expect(config.source.ref).toBe('main');
    expect(config.architectureRoots).toEqual(
      expect.arrayContaining(['src/App.tsx', 'src/main.tsx', 'src/index.css', 'src/types.ts']),
    );
    expect(config.allowedPathPatterns.join('\n')).toContain('src/components');
    expect(config.allowedPathPatterns.join('\n')).toContain('/ui/');
    expect(config.destination.startsWith('src/')).toBe(false);
    expect(config.runtimePromotion.automatic).toBe(false);
    expect(config.runtimePromotion.financeComponentsBindAfterArchitectureAdoption).toBe(true);
  });

  it('keeps the upstream demo dataset solely as a visual fixture and excludes productive authorities', () => {
    expect(config.visualFixtureExactPaths).toEqual(['src/data/mockData.ts']);
    expect(config.allowedExactPaths).toContain('src/data/mockData.ts');
    const denied = config.neverCopyPathPatterns.join('\n');
    for (const boundary of ['api', 'server', 'auth', 'billing', 'scoring', 'entitlement', 'provider', 'package']) {
      expect(denied).toContain(boundary);
    }
    expect(syncScript).toContain('VISUAL_FIXTURE_ONLY');
    expect(syncScript).toContain('runtimePromotionEligible: !fixtureOnly');
  });

  it('requires the desktop-only Finance adapter and re-correlates it on every upstream sync', () => {
    expect(config.responsiveRuntimeAdapter).toMatchObject({
      required: true,
      path: 'src/features/public/ui/frontend-port/frontend-port.css',
      validationTest: 'tests/unit/frontendDesktopResponsiveAdapter.test.ts',
      strategy: 'DESKTOP_VIEWPORT_ADAPTER',
      desktopMinPx: 1024,
      preserveMobileSourceLayout: true,
      preserveTabletSourceLayout: true,
      upstreamPreviewChromeRuntimeOnDesktop: false,
      userAgentBranching: false,
    });
    expect(config.responsiveRuntimeAdapter.sourceLayoutMarkers).toEqual(
      expect.arrayContaining(['viewMode', 'sm:max-w-[412px]', 'max-w-md', 'hidden sm:flex']),
    );
    expect(syncScript).toContain('desktop responsive runtime adapter must be required');
    expect(syncScript).toContain('mobile source layout must remain unchanged');
    expect(syncScript).toContain('tablet source layout must remain unchanged');
    expect(syncScript).toContain('desktop adapter correlation required');
    expect(syncScript).toContain('responsiveRuntimeAdapter: config.responsiveRuntimeAdapter');
  });

  it('runs hourly from trusted main with least privilege and immutable actions', () => {
    expect(workflow).toContain("cron: '23 * * * *'");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain('contents: write');
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8');
    expect(workflow).toContain('actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444');
    expect(workflow).not.toContain('npm install');
    expect(workflow).not.toContain('npm run');
  });

  it('never executes upstream code and keeps adapter promotion fail-closed', () => {
    expect(syncScript).toContain('lstatSync');
    expect(syncScript).toContain('isSymbolicLink');
    expect(syncScript).toContain('FULL_PRESENTATION_ARCHITECTURE_SNAPSHOT');
    expect(syncScript).toContain('promotionBlockPatterns');
    expect(syncScript).not.toContain('execFileSync(source');
  });
});
