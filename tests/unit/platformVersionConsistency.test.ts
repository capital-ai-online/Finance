import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// GOV-VER-001 / GOV-VER-002: package.json is the platform-version source of truth.
// The release gate keeps current, canonical release declarations aligned.
// Governance control-plane versions and archived evidence are separate version domains.

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

  const currentDeclarationFiles = [
    'README.md',
    'docs/code-quality/CODE_QUALITY_STANDARDS.md',
    'docs/ceo/EXECUTIVE_SUMMARY.md',
    'index.html',
  ];

  it.each(currentDeclarationFiles.map((relativePath) => [relativePath]))(
    '%s declares the current package.json version',
    (relativePath) => {
      const code = read(relativePath);
      expect(code).toContain(currentVersion);
    },
  );

  it('keeps the AGENTS governance version outside the platform-release projection contract', () => {
    const agents = read('AGENTS.md');
    expect(agents).toMatch(/\*\*Control Plane Version:\*\* `\d+\.\d+\.\d+`/);
    expect(currentDeclarationFiles).not.toContain('AGENTS.md');
  });

  it('does not declare a stale pre-0.6.0 platform version in current release declarations', () => {
    for (const relativePath of currentDeclarationFiles) {
      const code = read(relativePath);
      expect(code).not.toMatch(/\b0\.5\.\d\b/);
    }
  });

  it('keeps archived historical documentation outside the current-release version contract', () => {
    const archivedApiPath = path.join(repoRoot, 'docs', 'archive', 'raw-materials', 'API.md');
    expect(fs.existsSync(archivedApiPath)).toBe(true);
    expect(currentDeclarationFiles).not.toContain('docs/archive/raw-materials/API.md');
  });
});
