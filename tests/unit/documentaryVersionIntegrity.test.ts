import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Documentary version integrity', () => {
  it('keeps one component-version authority and exact current projections', () => {
    const manifest = JSON.parse(read('src/platform/Documentary/manifest.json'));
    const readme = read('src/platform/Documentary/README.md');
    const roadmap = read('docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md');
    const validator = read('scripts/automation/validateDocumentaryMaintenanceControlLoop.mjs');

    expect(manifest.version).toBe('1.22.0');
    expect(manifest.versionAuthority.componentVersion).toBe('manifest.json#version');
    expect(readme).toContain('Version: 1.22.0');
    expect(readme).toContain('manifest.json#version');
    expect(roadmap).toContain('Documentary component version');
    expect(roadmap).toContain('1.22.0');
    expect(validator).not.toMatch(/documentaryManifest\.version\s*!==\s*['"][0-9]+\.[0-9]+\.[0-9]+['"]/);
  });
});
