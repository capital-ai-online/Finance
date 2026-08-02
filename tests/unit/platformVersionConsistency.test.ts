import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// GOV-VER-001 / GOV-VER-002: package.json is the platform-version source of truth.
// The release gate must keep the lockfile, metadata and all governed declarations aligned.

const repoRoot = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const currentVersion = packageJson.version as string;

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('GOV-VER-001/GOV-VER-002 platform version consistency', () => {
  it('package.json declares a strict MAJOR.MINOR.PATCH version', () => {
    expect(currentVersion).toMatch(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  });

  it('package.json, package-lock root metadata and metadata.json declare the same version', () => {
    const metadata = JSON.parse(read('metadata.json'));
    const lock = JSON.parse(read('package-lock.json'));
    expect(metadata.version).toBe(currentVersion);
    expect(lock.version).toBe(currentVersion);
    expect(lock.packages?.['']?.version).toBe(currentVersion);
  });

  const declarationFiles = [
    'README.md',
    'AGENTS.md',
    'docs/code-quality/CODE_QUALITY_STANDARDS.md',
    'docs/ceo/EXECUTIVE_SUMMARY.md',
    'docs/API.md',
    'index.html',
  ];

  it.each(declarationFiles.map((relativePath) => [relativePath]))('%s declares the current package.json version', (relativePath) => {
    const code = read(relativePath);
    expect(code).toContain(currentVersion);
  });

  it('does not declare a stale pre-0.6.0 platform version as the current release', () => {
    for (const relativePath of declarationFiles) {
      const code = read(relativePath);
      expect(code).not.toMatch(/\b0\.5\.\d\b/);
    }
  });
});
