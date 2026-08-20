import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeSemanticFreshness } from '../../src/platform/Documentary/Discovery/SemanticFreshnessAnalyzer';

function write(root: string, relative: string, content: string): void {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, 'utf8');
}

function registry(entries: unknown[]): string {
  return JSON.stringify({ schemaVersion: '1.2.0', authority: 'docs/governance/DOCUMENTATION_HYGIENE_POLICY.md', entries });
}

describe('Documentary semantic freshness analyzer', () => {
  it('finds registered documents that semantically reference a changed component source', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-freshness-'));
    write(root, 'docs/architecture/FOO.md', '# Foo\nImplementation: `src/platform/Foo/service.ts`\n');
    write(root, 'docs/adr/ADR-0001-test.md', '# Foo decision\nComponent Foo\n');
    write(root, 'docs/governance/document-registry.json', registry([
      { documentId: 'DOC-FOO', type: 'architecture', owner: 'CAPITAL-AI', authority: 'ESS-0010', version: '1.0.0', language: 'en', lifecycle: 'approved', path: 'docs/architecture/FOO.md' },
      { documentId: 'DOC-ADR-FOO', type: 'architecture-decision', owner: 'CAPITAL-AI', authority: 'ADR-0001', version: '1.0.0', language: 'en', lifecycle: 'approved', path: 'docs/adr/ADR-0001-test.md' },
    ]));

    const report = analyzeSemanticFreshness({ repoRoot: root, correlationId: 'corr-foo', sourceCommit: 'a'.repeat(40), sourceChanges: [{ path: 'src/platform/Foo/service.ts', summary: 'Foo behavior changed.' }] });
    const architecture = report.findings.find((finding) => finding.documentId === 'DOC-FOO');
    const adr = report.findings.find((finding) => finding.documentId === 'DOC-ADR-FOO');
    expect(architecture?.candidate).toBe(true);
    expect(architecture?.mutationClass).toBe('PATCHABLE');
    expect(architecture?.reasons).toContain('DIRECT_SOURCE_REFERENCE');
    expect(adr?.candidate).toBe(true);
    expect(adr?.mutationClass).toBe('REVIEW_ONLY');
  });

  it('uses all active registered documents as candidates for a periodic full scan', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-fullscan-'));
    write(root, 'docs/runbooks/RUN.md', '# Runbook\n');
    write(root, 'docs/archive/OLD.md', '# Old\n');
    write(root, 'docs/governance/document-registry.json', registry([
      { documentId: 'DOC-RUN', type: 'runbook', owner: 'CAPITAL-AI', authority: 'ESS-0010', version: '1.0.0', language: 'en', lifecycle: 'approved', path: 'docs/runbooks/RUN.md' },
      { documentId: 'DOC-OLD', type: 'archive', owner: 'CAPITAL-AI', authority: 'ESS-0010', version: '1.0.0', language: 'en', lifecycle: 'archived', path: 'docs/archive/OLD.md' },
    ]));
    const report = analyzeSemanticFreshness({ repoRoot: root, correlationId: 'periodic', sourceCommit: 'b'.repeat(40) });
    expect(report.fullScan).toBe(true);
    expect(report.findings.find((finding) => finding.documentId === 'DOC-RUN')?.candidate).toBe(true);
    expect(report.findings.find((finding) => finding.documentId === 'DOC-OLD')?.candidate).toBe(false);
  });

  it('does not follow symlinked registered documents during freshness discovery', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-freshness-symlink-'));
    write(root, 'outside.md', '# Outside\nImplementation: `src/platform/Foo/service.ts`\n');
    fs.mkdirSync(path.join(root, 'docs/architecture'), { recursive: true });
    fs.symlinkSync('../../outside.md', path.join(root, 'docs/architecture/LINK.md'));
    write(root, 'docs/governance/document-registry.json', registry([
      { documentId: 'DOC-LINK', type: 'architecture', owner: 'CAPITAL-AI', authority: 'ESS-0010', version: '1.0.0', language: 'en', lifecycle: 'approved', path: 'docs/architecture/LINK.md' },
    ]));

    const report = analyzeSemanticFreshness({ repoRoot: root, correlationId: 'symlink-doc', sourceCommit: 'c'.repeat(40), sourceChanges: [{ path: 'src/platform/Foo/service.ts' }] });
    const finding = report.findings[0];
    expect(finding.contentSha256).toBeNull();
    expect(finding.candidate).toBe(false);
  });

  it('rejects a symlinked canonical Document Registry', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-registry-symlink-'));
    write(root, 'registry-target.json', registry([]));
    fs.mkdirSync(path.join(root, 'docs/governance'), { recursive: true });
    fs.symlinkSync('../../registry-target.json', path.join(root, 'docs/governance/document-registry.json'));

    expect(() => analyzeSemanticFreshness({ repoRoot: root, correlationId: 'symlink-registry', sourceCommit: 'd'.repeat(40) })).toThrow(/regular non-symlink file/);
  });
});