import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GOV_DOC_003_RULE,
  collectGovDoc003Findings,
} from '../../src/platform/Documentary/Governance/Validators/DocumentationValidator';
import type {
  SemanticFreshnessFinding,
  SemanticFreshnessReport,
} from '../../src/platform/Documentary/Discovery/SemanticFreshnessAnalyzer';

const SOURCE_SHA = 'a'.repeat(40);

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function write(root: string, relative: string, content: string): void {
  const absolute = path.join(root, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content, 'utf8');
}

function semanticFinding(overrides: Partial<SemanticFreshnessFinding> = {}): SemanticFreshnessFinding {
  return {
    documentId: 'DOC-FOO',
    path: 'docs/architecture/FOO.md',
    type: 'architecture',
    lifecycle: 'approved',
    mutationClass: 'PATCHABLE',
    candidate: true,
    reasons: ['DIRECT_SOURCE_REFERENCE'],
    sourcePaths: ['src/platform/Foo/service.ts'],
    contentSha256: null,
    ...overrides,
  };
}

function freshness(findings: SemanticFreshnessFinding[]): SemanticFreshnessReport {
  return {
    analyzerVersion: 'documentary-semantic-freshness/1.0.0',
    correlationId: 'corr-gov-doc-003',
    sourceCommit: SOURCE_SHA,
    generatedAt: '2026-09-07T00:00:00.000Z',
    fullScan: false,
    sourceChanges: [
      { path: 'src/platform/Foo/service.ts', summary: 'Foo behavior changed.' },
      { path: 'src/platform/Bar/service.ts', summary: 'Bar behavior changed.' },
    ],
    findings,
    summary: { registered: findings.length, candidates: findings.filter((item) => item.candidate).length, patchable: 0, reviewOnly: 0, skipped: 0 },
  };
}

describe('DocumentationValidator GOV-DOC-003', () => {
  it('emits a canonical Medium finding only when the freshness candidate has concrete FileReference evidence', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-003-positive-'));
    const content = [
      '# Foo architecture',
      '',
      'Implementation: `src/platform/Foo/service.ts`',
      '',
    ].join('\n');
    write(root, 'docs/architecture/FOO.md', content);

    const findings = collectGovDoc003Findings({
      repoRoot: root,
      freshness: freshness([
        semanticFinding({ contentSha256: sha256(content) }),
      ]),
    });

    expect(GOV_DOC_003_RULE).toMatchObject({
      ruleId: 'GOV-DOC-003',
      area: 'DOC',
      severity: 'Medium',
      evidenceType: 'FileReference',
      version: '1.0.0',
    });
    expect(findings).toEqual([
      {
        ruleId: 'GOV-DOC-003',
        severity: 'Medium',
        area: 'DOC',
        documentId: 'DOC-FOO',
        documentPath: 'docs/architecture/FOO.md',
        message: 'DOC-FOO: document references 1 changed component source path(s) while the document itself is unchanged in the correlated freshness evidence.',
        evidence: [
          {
            type: 'FileReference',
            path: 'docs/architecture/FOO.md',
            line: 3,
            referencedPath: 'src/platform/Foo/service.ts',
            sourceCommit: SOURCE_SHA,
            correlationId: 'corr-gov-doc-003',
          },
        ],
      },
    ]);
  });

  it('discards candidates without concrete evidence and fails closed on stale document hashes', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-003-negative-'));
    const semanticOnly = '# Foo architecture\nComponent Foo is documented semantically, without a source path.\n';
    write(root, 'docs/architecture/FOO.md', semanticOnly);
    write(root, 'docs/architecture/BAR.md', '# Bar architecture\nImplementation: `src/platform/Bar/service.ts`\n');

    const report = freshness([
      semanticFinding({
        contentSha256: sha256(semanticOnly),
        reasons: ['COMPONENT_SEMANTIC_SCOPE'],
      }),
      semanticFinding({
        documentId: 'DOC-BAR',
        path: 'docs/architecture/BAR.md',
        sourcePaths: ['src/platform/Bar/service.ts'],
        contentSha256: '0'.repeat(64),
      }),
    ]);

    expect(collectGovDoc003Findings({ repoRoot: root, freshness: report })).toEqual([]);
  });

  it('does not flag a document that changed in the same correlated source-change set', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-003-synchronized-'));
    const content = '# Foo\n`src/platform/Foo/service.ts`\n';
    write(root, 'docs/architecture/FOO.md', content);
    const report = freshness([semanticFinding({ contentSha256: sha256(content) })]);
    report.sourceChanges.push({ path: 'docs/architecture/FOO.md', summary: 'Documentation updated with component.' });

    expect(collectGovDoc003Findings({ repoRoot: root, freshness: report })).toEqual([]);
  });

  it('returns deterministic findings and evidence ordering for identical freshness evidence', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-003-deterministic-'));
    const foo = '# Foo\n`src/platform/Bar/service.ts`\n`src/platform/Foo/service.ts`\n';
    const alpha = '# Alpha\n`src/platform/Foo/service.ts`\n';
    write(root, 'docs/architecture/FOO.md', foo);
    write(root, 'docs/architecture/ALPHA.md', alpha);

    const report = freshness([
      semanticFinding({
        contentSha256: sha256(foo),
        sourcePaths: ['src/platform/Foo/service.ts', 'src/platform/Bar/service.ts'],
      }),
      semanticFinding({
        documentId: 'DOC-ALPHA',
        path: 'docs/architecture/ALPHA.md',
        contentSha256: sha256(alpha),
      }),
    ]);

    const first = collectGovDoc003Findings({ repoRoot: root, freshness: report });
    const second = collectGovDoc003Findings({ repoRoot: root, freshness: report });

    expect(second).toEqual(first);
    expect(first.map((item) => item.documentId)).toEqual(['DOC-ALPHA', 'DOC-FOO']);
    expect(first.find((item) => item.documentId === 'DOC-FOO')?.evidence.map((item) => item.referencedPath)).toEqual([
      'src/platform/Bar/service.ts',
      'src/platform/Foo/service.ts',
    ]);
  });

  it('does not convert periodic full-scan candidates into GOV-DOC-003 findings without changed component evidence', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-003-fullscan-'));
    const content = '# Foo\n`src/platform/Foo/service.ts`\n';
    write(root, 'docs/architecture/FOO.md', content);
    const report = freshness([semanticFinding({ contentSha256: sha256(content) })]);
    report.fullScan = true;
    report.sourceChanges = [];

    expect(collectGovDoc003Findings({ repoRoot: root, freshness: report })).toEqual([]);
  });
});
