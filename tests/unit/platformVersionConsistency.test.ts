import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// GOV-VER-001 (mehrfach von Vorgänger-Audits identifiziert, zuletzt in
// ENTERPRISE_SCREENING_SCORING_MASTER_ARCHITECTURE.md 0.15): AGENTS.md/README.md pinnten
// "0.5.4", package.json/metadata.json "0.6.0", docs/code-quality/CODE_QUALITY_STANDARDS.md
// "0.5.0" - drei widersprüchliche Versionsangaben gleichzeitig. Dieser Test macht
// package.json zur single source of truth und verhindert das erneute Auseinanderlaufen der
// user-/entscheider-sichtbaren Versionsdeklarationen.

const repoRoot = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const currentVersion = packageJson.version as string;

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('GOV-VER-001 platform version consistency', () => {
  it('package.json and metadata.json declare the same version', () => {
    const metadata = JSON.parse(read('metadata.json'));
    expect(metadata.version).toBe(currentVersion);
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
