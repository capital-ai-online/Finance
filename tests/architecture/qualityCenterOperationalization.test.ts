import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

describe('Quality Center operationalization boundary', () => {
  it('packages the existing QualityCenterReport only after commit-bound build evidence', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
    const build = String(pkg.scripts?.build ?? '');
    const evidence = 'runQualityExecution.ts build scripts/automation/buildRuntimeReleaseManifest.ts';
    const snapshot = 'buildQualityCenterSnapshot.ts';

    expect(build).toContain(evidence);
    expect(build).toContain(snapshot);
    expect(build.indexOf(snapshot)).toBeGreaterThan(build.indexOf(evidence));
    expect(pkg.scripts?.['repository:quality:snapshot']).toBe('tsx scripts/automation/buildQualityCenterSnapshot.ts');
  });

  it('keeps the runtime API read-only, IAM-protected and snapshot-backed', () => {
    const route = read('server/qualityCenter.ts');
    const composition = read('server/routes/registerApplicationRoutes.ts');

    expect(route).toContain("qualityCenterRouter.get('/'");
    expect(route).toContain("checkAdminAccess(req, 'quality-center:read', DIAGNOSTIC_ZONE_ROLES)");
    expect(route).toContain('readQualityCenterReport(process.cwd())');
    expect(route).toContain("res.setHeader('Cache-Control', 'no-store')");
    expect(route).toContain("code: 'quality_snapshot_not_available'");
    expect(route).not.toMatch(/qualityCenterRouter\.(post|put|patch|delete)\(/);
    expect(route).not.toContain('QualityCenterOrchestrator');
    expect(composition).toContain("app.use('/api/admin/quality-center', qualityCenterRouter);");
  });

  it('projects the report through the existing governance/performance UI without score fabrication', () => {
    const panel = read('src/components/QualityCenterPanel.tsx');
    const performance = read('src/components/PerformanceDashboard.tsx');
    const governanceFacade = read('src/features/governance/ui/index.ts');

    expect(panel).toContain("fetch('/api/admin/quality-center'");
    expect(panel).toContain('report.nonAuthorizingStatement');
    expect(panel).toContain("typeof value === 'number' && Number.isFinite(value)");
    expect(panel).not.toMatch(/Math\.random|fallbackScore|syntheticScore/i);
    expect(performance).toContain('<QualityCenterPanel />');
    expect(governanceFacade).toContain("export { QualityCenterPanel } from '../../../components/QualityCenterPanel';");
  });

  it('ships the snapshot inside the existing immutable dist runtime without a new writable store', () => {
    const store = read('src/platform/Quality/Operations/QualityCenterSnapshotStore.ts');
    const dockerfile = read('Dockerfile');

    expect(store).toContain("'dist/quality/quality-center-report.json'");
    expect(store).not.toContain("'quality-center-report/1.3.0'");
    expect(store).toContain('QUALITY_CENTER_REPORT_SCHEMA');
    expect(store).toContain('QUALITY_CENTER_CONTRACT_VERSION');
    expect(dockerfile).toContain('COPY --from=builder --chown=root:root /app/dist ./dist');
    expect(dockerfile).toContain('chmod -R a-w /app/dist /app/server');
  });
});
