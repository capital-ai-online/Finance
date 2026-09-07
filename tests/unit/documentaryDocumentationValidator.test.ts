import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  GOV_DOC_001_RULE,
  GOV_DOC_002_RULE,
  GOV_DOC_003_RULE,
  GOV_DOC_006_RULE,
  collectGovDoc001Findings,
  collectGovDoc002Findings,
  collectGovDoc003Findings,
  collectGovDoc006Findings,
} from '../../src/platform/Documentary/Governance/Validators/DocumentationValidator';
import type {
  SemanticFreshnessFinding,
  SemanticFreshnessReport,
} from '../../src/platform/Documentary/Discovery/SemanticFreshnessAnalyzer';
import type { RegistryEntry } from '../../src/platform/Documentary/Governance/Services/DocumentationHygieneValidator';

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

function registeredEntry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  return {
    documentId: 'DOC-GEN-FOO',
    type: 'architecture',
    owner: 'CAPITAL-AI-DOC',
    authority: 'ESS-0010',
    version: '1.0.0',
    language: 'en',
    lifecycle: 'generated',
    path: 'docs/architecture/GEN-FOO.md',
    ...overrides,
  };
}

function generatedEntry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  return registeredEntry(overrides);
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

describe('DocumentationValidator GOV-DOC-006', () => {
  it('emits a Medium finding for a generated document without generator marking', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-006-positive-'));
    write(root, 'docs/architecture/GEN-FOO.md', '# Generated Foo\n\nNo generator contract is declared.\n');

    expect(GOV_DOC_006_RULE).toMatchObject({
      ruleId: 'GOV-DOC-006',
      area: 'DOC',
      severity: 'Medium',
      evidenceType: 'FileReference',
      version: '1.0.0',
    });
    expect(collectGovDoc006Findings({
      repoRoot: root,
      entries: [generatedEntry()],
    })).toEqual([
      {
        ruleId: 'GOV-DOC-006',
        severity: 'Medium',
        area: 'DOC',
        documentId: 'DOC-GEN-FOO',
        documentPath: 'docs/architecture/GEN-FOO.md',
        message: 'DOC-GEN-FOO: generated document has no generator marking.',
        evidence: [{
          type: 'FileReference',
          path: 'docs/architecture/GEN-FOO.md',
          line: 1,
          referencedPath: 'docs/architecture/GEN-FOO.md',
        }],
      },
    ]);
  });

  it('accepts Documentary renderer generator markings and ignores non-generated lifecycles', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-006-marked-'));
    write(root, 'docs/architecture/GEN-FOO.md', '# Foo\n\n- Generated At: `2026-09-07T00:00:00.000Z`\n');
    write(root, 'docs/architecture/GEN-BAR.md', '# Bar\n\n- Generiert am: `2026-09-07T00:00:00.000Z`\n');
    write(root, 'docs/architecture/APPROVED.md', '# Approved\nNo generator line is required.\n');

    expect(collectGovDoc006Findings({
      repoRoot: root,
      entries: [
        generatedEntry(),
        generatedEntry({ documentId: 'DOC-GEN-BAR', path: 'docs/architecture/GEN-BAR.md' }),
        generatedEntry({ documentId: 'DOC-APPROVED', path: 'docs/architecture/APPROVED.md', lifecycle: 'approved' }),
      ],
    })).toEqual([]);
  });

  it('fails closed on missing files and keeps deterministic ordering', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-006-failclosed-'));
    write(root, 'docs/architecture/Z.md', '# Z\n');
    write(root, 'docs/architecture/A.md', '# A\n');

    const first = collectGovDoc006Findings({
      repoRoot: root,
      entries: [
        generatedEntry({ documentId: 'DOC-Z', path: 'docs/architecture/Z.md' }),
        generatedEntry({ documentId: 'DOC-MISSING', path: 'docs/architecture/MISSING.md' }),
        generatedEntry({ documentId: 'DOC-A', path: 'docs/architecture/A.md' }),
      ],
    });
    const second = collectGovDoc006Findings({
      repoRoot: root,
      entries: [
        generatedEntry({ documentId: 'DOC-Z', path: 'docs/architecture/Z.md' }),
        generatedEntry({ documentId: 'DOC-MISSING', path: 'docs/architecture/MISSING.md' }),
        generatedEntry({ documentId: 'DOC-A', path: 'docs/architecture/A.md' }),
      ],
    });

    expect(second).toEqual(first);
    expect(first.map((item) => item.documentId)).toEqual(['DOC-A', 'DOC-Z']);
  });
});

describe('DocumentationValidator GOV-DOC-001', () => {
  it('emits a High finding when a registered document body has no version marking', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-001-positive-'));
    write(root, 'docs/architecture/GEN-FOO.md', '# Generated Foo\n\nRegistry version is not a document version.\n');

    expect(GOV_DOC_001_RULE).toMatchObject({
      ruleId: 'GOV-DOC-001',
      area: 'DOC',
      severity: 'High',
      evidenceType: 'FileReference',
      version: '1.0.0',
    });
    expect(collectGovDoc001Findings({
      repoRoot: root,
      entries: [registeredEntry()],
    })).toEqual([
      {
        ruleId: 'GOV-DOC-001',
        severity: 'High',
        area: 'DOC',
        documentId: 'DOC-GEN-FOO',
        documentPath: 'docs/architecture/GEN-FOO.md',
        message: 'DOC-GEN-FOO: registered document has no version marking.',
        evidence: [{
          type: 'FileReference',
          path: 'docs/architecture/GEN-FOO.md',
          line: 1,
          referencedPath: 'docs/architecture/GEN-FOO.md',
        }],
      },
    ]);
  });

  it('accepts explicit Version and Dokumentversion markings and ignores empty labels', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-001-marked-'));
    write(root, 'docs/architecture/A.md', '# A\n\nVersion: 1.2.0\n');
    write(root, 'docs/architecture/B.md', '# B\n\n- **Dokumentversion:** `0.9.1`\n');
    write(root, 'docs/architecture/C.md', '# C\n\nVersion:\n');

    expect(collectGovDoc001Findings({
      repoRoot: root,
      entries: [
        registeredEntry({ documentId: 'DOC-A', path: 'docs/architecture/A.md', lifecycle: 'approved' }),
        registeredEntry({ documentId: 'DOC-B', path: 'docs/architecture/B.md', lifecycle: 'reviewed' }),
        registeredEntry({ documentId: 'DOC-C', path: 'docs/architecture/C.md' }),
        registeredEntry({ documentId: 'DOC-MISSING', path: 'docs/architecture/MISSING.md' }),
      ],
    })).toEqual([
      {
        ruleId: 'GOV-DOC-001',
        severity: 'High',
        area: 'DOC',
        documentId: 'DOC-C',
        documentPath: 'docs/architecture/C.md',
        message: 'DOC-C: registered document has no version marking.',
        evidence: [{
          type: 'FileReference',
          path: 'docs/architecture/C.md',
          line: 1,
          referencedPath: 'docs/architecture/C.md',
        }],
      },
    ]);
  });

  it('keeps deterministic ordering for unversioned registered documents', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-001-order-'));
    write(root, 'docs/architecture/Z.md', '# Z\n');
    write(root, 'docs/architecture/A.md', '# A\n');

    const entries = [
      registeredEntry({ documentId: 'DOC-Z', path: 'docs/architecture/Z.md' }),
      registeredEntry({ documentId: 'DOC-A', path: 'docs/architecture/A.md' }),
    ];
    const first = collectGovDoc001Findings({ repoRoot: root, entries });
    const second = collectGovDoc001Findings({ repoRoot: root, entries });

    expect(second).toEqual(first);
    expect(first.map((item) => item.documentId)).toEqual(['DOC-A', 'DOC-Z']);
  });
});

describe('DocumentationValidator GOV-DOC-002', () => {
  it('emits a Medium finding when a registered document body has no ESS or ADR reference', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-002-positive-'));
    write(root, 'docs/architecture/GEN-FOO.md', '# Generated Foo\n\nRegistry authority is not an ESS or ADR citation.\n');

    expect(GOV_DOC_002_RULE).toMatchObject({
      ruleId: 'GOV-DOC-002',
      area: 'DOC',
      severity: 'Medium',
      evidenceType: 'FileReference',
      version: '1.0.0',
    });
    expect(collectGovDoc002Findings({
      repoRoot: root,
      entries: [registeredEntry()],
    })).toEqual([
      {
        ruleId: 'GOV-DOC-002',
        severity: 'Medium',
        area: 'DOC',
        documentId: 'DOC-GEN-FOO',
        documentPath: 'docs/architecture/GEN-FOO.md',
        message: 'DOC-GEN-FOO: registered document has no ESS or ADR reference.',
        evidence: [{
          type: 'FileReference',
          path: 'docs/architecture/GEN-FOO.md',
          line: 1,
          referencedPath: 'docs/architecture/GEN-FOO.md',
        }],
      },
    ]);
  });

  it('accepts ESS and ADR identities after markdown normalization and ignores empty labels', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-002-marked-'));
    write(root, 'docs/architecture/A.md', '# A\n\nAuthority: ESS-0012\n');
    write(root, 'docs/architecture/B.md', '# B\n\n- **ADR:** `ADR-0097`\n');
    write(root, 'docs/architecture/C.md', '# C\n\nSee [ESS-0012-CONTRACTS](docs/ess/ESS-0012-CONTRACTS.md).\n');
    write(root, 'docs/architecture/D.md', '# D\n\nESS without a number.\n');

    expect(collectGovDoc002Findings({
      repoRoot: root,
      entries: [
        registeredEntry({ documentId: 'DOC-A', path: 'docs/architecture/A.md', lifecycle: 'approved' }),
        registeredEntry({ documentId: 'DOC-B', path: 'docs/architecture/B.md', lifecycle: 'reviewed' }),
        registeredEntry({ documentId: 'DOC-C', path: 'docs/architecture/C.md' }),
        registeredEntry({ documentId: 'DOC-D', path: 'docs/architecture/D.md' }),
        registeredEntry({ documentId: 'DOC-MISSING', path: 'docs/architecture/MISSING.md' }),
      ],
    })).toEqual([
      {
        ruleId: 'GOV-DOC-002',
        severity: 'Medium',
        area: 'DOC',
        documentId: 'DOC-D',
        documentPath: 'docs/architecture/D.md',
        message: 'DOC-D: registered document has no ESS or ADR reference.',
        evidence: [{
          type: 'FileReference',
          path: 'docs/architecture/D.md',
          line: 1,
          referencedPath: 'docs/architecture/D.md',
        }],
      },
    ]);
  });

  it('keeps deterministic ordering for unreferenced registered documents', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gov-doc-002-order-'));
    write(root, 'docs/architecture/Z.md', '# Z\n');
    write(root, 'docs/architecture/A.md', '# A\n');

    const entries = [
      registeredEntry({ documentId: 'DOC-Z', path: 'docs/architecture/Z.md' }),
      registeredEntry({ documentId: 'DOC-A', path: 'docs/architecture/A.md' }),
    ];
    const first = collectGovDoc002Findings({ repoRoot: root, entries });
    const second = collectGovDoc002Findings({ repoRoot: root, entries });

    expect(second).toEqual(first);
    expect(first.map((item) => item.documentId)).toEqual(['DOC-A', 'DOC-Z']);
  });
});
