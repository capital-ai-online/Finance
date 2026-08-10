import { describe, expect, it } from 'vitest';
import { createDocumentaryDocument } from '../../src/platform/Documentary/Models/DocumentaryDocument';
import { resolveDocumentaryVersionContext } from '../../src/platform/Documentary/Versioning/DocumentaryVersion';

const commit = '6d917ea200bb3a6814cdd9068d49af3204ca07aa';

describe('Documentary D3 document model and provenance', () => {
  it('creates a versioned provenance-capable document model', () => {
    const versions = resolveDocumentaryVersionContext(process.cwd());
    const document = createDocumentaryDocument({
      documentId: 'DOC-COMP-DOCUMENTARY-0001',
      documentType: 'component',
      sourceCommit: commit,
      generatedAt: '2026-08-10T01:50:00.000Z',
      title: 'Documentary Component',
      content: 'Deterministic component evidence.',
      conceptIds: ['VOC-PLATFORM-0001'],
      traceabilityIds: ['TRACE-DOC-0001'],
      provenance: [{ kind: 'code', referenceId: 'CODE-DOC-0001', sourceCommit: commit, path: 'src/platform/Documentary/manifest.json', evidenceId: 'evidence-1' }],
    }, versions);

    expect(document.schemaVersion).toBe('1.0.0');
    expect(document.componentVersion).toBe(versions.componentVersion);
    expect(document.platformVersion).toBe(versions.platformVersion);
    expect(document.reviewStatus).toBe('generated');
    expect(document.fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it('keeps the fingerprint stable across lifecycle-only metadata changes', () => {
    const versions = resolveDocumentaryVersionContext(process.cwd());
    const base = {
      documentId: 'DOC-COMP-DOCUMENTARY-0001',
      documentType: 'component' as const,
      sourceCommit: commit,
      title: 'Documentary Component',
      content: 'Same deterministic content.',
      provenance: [{ kind: 'manual' as const, referenceId: 'EVIDENCE-1' }],
    };

    const first = createDocumentaryDocument({ ...base, generatedAt: '2026-08-10T01:50:00.000Z', reviewStatus: 'generated' }, versions);
    const second = createDocumentaryDocument({ ...base, generatedAt: '2026-08-10T02:00:00.000Z', reviewStatus: 'reviewed' }, versions);
    expect(first.fingerprint).toBe(second.fingerprint);
  });

  it('fails closed without provenance or valid code provenance', () => {
    const versions = resolveDocumentaryVersionContext(process.cwd());
    expect(() => createDocumentaryDocument({ documentId: 'DOC-FAIL-1', documentType: 'component', sourceCommit: commit, generatedAt: '2026-08-10T01:50:00.000Z', title: 'Invalid', content: 'No evidence.', provenance: [] }, versions)).toThrow(/provenance/i);
    expect(() => createDocumentaryDocument({ documentId: 'DOC-FAIL-2', documentType: 'component', sourceCommit: commit, generatedAt: '2026-08-10T01:50:00.000Z', title: 'Invalid', content: 'Bad code evidence.', provenance: [{ kind: 'code', referenceId: 'CODE-1', sourceCommit: 'bad', path: 'x.ts' }] }, versions)).toThrow(/sourceCommit/i);
  });
});
