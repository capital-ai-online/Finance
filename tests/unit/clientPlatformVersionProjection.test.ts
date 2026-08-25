import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const packageJson = JSON.parse(read('package.json')) as { version: string };
const vite = read('vite.config.ts');
const clientVersion = read('src/platform/Release/clientVersion.ts');
const runtimeBrand = read('src/platform/Branding/runtimeBrand.ts');
const versionManager = read('src/platform/VersionManager/versionManager.ts');
const versionManagerReadme = read('src/platform/VersionManager/README.md');
const routeSeo = read('src/lib/routeSeo.ts');
const prerender = read('scripts/seo/prerender-public-routes.mjs');
const documentary = read('src/components/DocumentHygienePanel.tsx');
const dashboard = read('src/components/Dashboard.tsx');

const auditedRuntimePaths = [
  'src/components/AuditLogs.tsx',
  'src/components/DocumentHygienePanel.tsx',
  'src/components/RawMaterialsDashboard.tsx',
  'src/components/SecurityComplianceAuditor.tsx',
];

describe('client platform version projection', () => {
  it('projects package.json authority into browser code', () => {
    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(vite).toContain('__CAPITAL_AI_VERSION__');
    expect(vite).toContain('packageMetadata.version');
    expect(clientVersion).toContain('__CAPITAL_AI_VERSION__');
    expect(clientVersion).toContain('CAPITAL_AI_VERSION');
    expect(runtimeBrand).toContain("from '../Release/clientVersion'");
  });

  it('keeps VersionManager read-only and delegated to Release control plane', () => {
    expect(versionManager).toContain('readPlatformVersionProjection');
    expect(versionManager).not.toMatch(/router\.post\s*\(/);
    expect(versionManager).not.toContain('uploads/version_manager.json');
    expect(versionManagerReadme).toContain('package.json#version');
    expect(versionManagerReadme).toContain('Release/clientVersion.ts');
  });

  it('removes stale platform-version literals from audited runtime surfaces', () => {
    for (const relativePath of auditedRuntimePaths) {
      const source = read(relativePath);
      expect(source, relativePath).not.toMatch(/(?:CAPITAL-AI|Plattform(?:-Version)?|System-Version|BETA-PHASE)[^\n]{0,80}\b0\.7\.0\b/i);
    }
  });

  it('keeps the Dashboard monolith behind one bounded build-time version strangler', () => {
    expect(dashboard).toContain('Beta · Version 0.7.0');
    expect(vite).toContain('capital-ai-platform-version-projection');
    expect(vite).toContain('DASHBOARD_PLATFORM_VERSION_PATTERN');
    expect(vite).toContain('Beta · Version ${packageMetadata.version}');
    expect(vite).toContain("endsWith('/src/components/Dashboard.tsx')");
  });

  it('keeps SEO client and prerender projections on the same authority', () => {
    expect(routeSeo).toContain('CAPITAL_AI_VERSION');
    expect(routeSeo).not.toContain('Version 0.6.0');
    expect(prerender).toContain("package.json");
    expect(prerender).toContain('PLATFORM_VERSION');
    expect(prerender).not.toContain('Version 0.6.0');
  });

  it('does not make 0.7.0 a universal documentation-version rule', () => {
    expect(documentary).not.toContain("line.includes('0.7.0')");
    expect(documentary).not.toContain('fest auf 0.7.0');
    expect(documentary).toContain('declaredPlatformVersion !== CAPITAL_AI_VERSION');
    expect(documentary).toContain('Model/provider/schema/ADR versions remain independent');
  });
});