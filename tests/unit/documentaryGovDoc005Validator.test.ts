import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GOV_DOC_005_RULE,
  collectGovDoc005Findings,
} from '../../src/platform/Documentary/Governance/Validators/GovDoc005Validator';
import type { RegistryEntry } from '../../src/platform/Documentary/Governance/Services/DocumentationHygieneValidator';

function write(root: string, relative: string, content = '# Documentation\n'): void {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, 'utf8');
}

function registeredEntry(pathValue: string, documentId = 'DOC-EXCEPTION'): RegistryEntry {
  return {
    documentId,
    type: 'repository-overview',
    owner: 'CAPITAL-AI-DOC',
    authority: 'ESS-0012',
    version: '1.0.0',
    language: 'en',
    lifecycle: 'approved',
    path: pathValue,
  };
}

describe('GOV-DOC-005 documentation path exceptions', () => {
  it('emits a High FileReference finding for Markdown outside docs/ without an exact registry exception', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-005-positive-'));
    write(root, 'src/platform/Foo/README.md');

    expect(GOV_DOC_005_RULE).toMatchObject({
      ruleId: 'GOV-DOC-005',
      area: 'DOC',
      severity: 'High',
      evidenceType: 'FileReference',
      version: '1.0.0',
    });

    expect(collectGovDoc005Findings({
      repoRoot: root,
      documentPaths: ['src/platform/Foo/README.md'],
      entries: [],
    })).toEqual([
      {
        ruleId: 'GOV-DOC-005',
        severity: 'High',
        area: 'DOC',
        documentId: 'UNREGISTERED:src/platform/Foo/README.md',
        documentPath: 'src/platform/Foo/README.md',
        message: 'src/platform/Foo/README.md: Markdown documentation is outside docs/ and has no exact registered exception in docs/governance/document-registry.json.',
        evidence: [{
          type: 'FileReference',
          path: 'src/platform/Foo/README.md',
          line: 1,
          referencedPath: 'src/platform/Foo/README.md',
        }],
      },
    ]);
  });

  it('accepts docs/ Markdown and exact registered exceptions outside docs/', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-005-exceptions-'));
    write(root, 'docs/architecture/IN-DOCS.md');
    write(root, 'README.md');
    write(root, 'src/platform/Foo/README.md');

    expect(collectGovDoc005Findings({
      repoRoot: root,
      documentPaths: [
        'docs/architecture/IN-DOCS.md',
        './README.md',
        'src\\platform\\Foo\\README.md',
      ],
      entries: [
        registeredEntry('README.md', 'DOC-ROOT-README'),
        registeredEntry('src/platform/Foo/README.md', 'DOC-FOO-README'),
      ],
    })).toEqual([]);
  });

  it('does not scan for undocumented Markdown that was not supplied as input', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-005-input-only-'));
    write(root, 'src/platform/Foo/README.md');
    write(root, 'src/platform/Bar/README.md');

    const findings = collectGovDoc005Findings({
      repoRoot: root,
      documentPaths: ['src/platform/Foo/README.md'],
      entries: [],
    });

    expect(findings.map((finding) => finding.documentPath)).toEqual(['src/platform/Foo/README.md']);
  });

  it('ignores non-Markdown, missing and escaping paths and keeps deterministic de-duplicated ordering', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-005-bounded-'));
    write(root, 'z/README.md');
    write(root, 'a/README.md');
    write(root, 'src/platform/Foo/manifest.json', '{}\n');

    const findings = collectGovDoc005Findings({
      repoRoot: root,
      documentPaths: [
        'z/README.md',
        'a/README.md',
        './z/README.md',
        'src/platform/Foo/manifest.json',
        'missing/README.md',
        '../outside.md',
      ],
      entries: [],
    });

    expect(findings.map((finding) => finding.documentPath)).toEqual([
      'a/README.md',
      'z/README.md',
    ]);
  });
});
