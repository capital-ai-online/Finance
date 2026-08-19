import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DOCUMENTARY_DOCUMENT_SCHEMA_VERSION,
  resolveDocumentaryVersionContext,
} from '../../src/platform/Documentary/Versioning/DocumentaryVersion';

const repoRoot = process.cwd();
const documentaryRoot = path.join(repoRoot, 'src/platform/Documentary');

function readJson(relativePath: string): any {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function countRuntimeCodeFiles(relativeArea: string): number {
  const root = path.join(documentaryRoot, relativeArea);
  if (!fs.existsSync(root)) return 0;
  let count = 0;
  const walk = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.d.ts')) count += 1;
    }
  };
  walk(root);
  return count;
}

describe('Documentary D0 version authority and baseline', () => {
  it('separates component, document-schema and platform versions', () => {
    const manifest = readJson('src/platform/Documentary/manifest.json');
    const packageJson = readJson('package.json');
    const context = resolveDocumentaryVersionContext(repoRoot);

    expect(context.componentVersion).toBe(manifest.version);
    expect(context.documentSchemaVersion).toBe(DOCUMENTARY_DOCUMENT_SCHEMA_VERSION);
    expect(context.platformVersion).toBe(packageJson.version);
    expect(context).toEqual({
      componentVersion: manifest.version,
      documentSchemaVersion: DOCUMENTARY_DOCUMENT_SCHEMA_VERSION,
      platformVersion: packageJson.version,
    });
  });

  it('keeps README and manifest on the same Documentary component version', () => {
    const manifest = readJson('src/platform/Documentary/manifest.json');
    const readme = fs.readFileSync(path.join(documentaryRoot, 'README.md'), 'utf8');
    expect(readme).toContain(`Version: ${manifest.version}`);
  });

  it('requires every declared implemented area to contain runtime code', () => {
    const baseline = readJson('src/platform/Documentary/Architecture/documentary-baseline.json');
    for (const area of baseline.implementedAreas as string[]) {
      expect(countRuntimeCodeFiles(area), `${area} must contain runtime code`).toBeGreaterThan(0);
    }
  });

  it('records all three version authorities explicitly', () => {
    const baseline = readJson('src/platform/Documentary/Architecture/documentary-baseline.json');
    expect(baseline.versionAuthorities.componentVersion).toContain('manifest.json#version');
    expect(baseline.versionAuthorities.documentSchemaVersion).toContain('DOCUMENTARY_DOCUMENT_SCHEMA_VERSION');
    expect(baseline.versionAuthorities.platformVersion).toContain('Release/Services/platformVersionControlPlane.ts#getPlatformVersion');
    expect(baseline.versionAuthorities.platformVersion).toContain('package.json#version');
  });
});
