import { describe, expect, it } from 'vitest';
import { createDocumentaryDocument } from '../Models/DocumentaryDocument';
import { transitionDocumentaryDocument } from '../Governance/DocumentaryLifecycle';

const versions = { componentVersion: '1.6.0', documentSchemaVersion: '1.0.0', platformVersion: '0.6.0' };
const sourceCommit = 'a'.repeat(40);

function document() {
  return createDocumentaryDocument({
    documentId: 'DOC-D4-001',
    documentType: 'architecture',
    sourceCommit,
    generatedAt: '2026-08-10T03:30:00.000Z',
    title: 'Lifecycle test',
    content: 'Governed documentary content.',
    conceptIds: ['VOC-PLATFORM-0001'],
    traceabilityIds: ['TRACE-D4-001'],
    provenance: [{ kind: 'code', referenceId: 'src/platform/Documentary', sourceCommit, repositoryPath: 'src/platform/Documentary' }],
  }, versions);
}

const evidence = (action: 'submit-review' | 'approve' | 'supersede' | 'archive') => ({
  actorId: 'owner-reviewer',
  action,
  occurredAt: '2026-08-10T03:31:00.000Z',
  evidenceReferences: ['TRACE-D4-001'],
});

describe('Documentary D4 lifecycle governance', () => {
  it('enforces generated -> reviewed -> approved with explicit evidence', () => {
    const reviewed = transitionDocumentaryDocument(document(), 'reviewed', evidence('submit-review'));
    expect(reviewed.document.reviewStatus).toBe('reviewed');
    expect(reviewed.lifecycle.fromStatus).toBe('generated');

    const approved = transitionDocumentaryDocument(reviewed.document, 'approved', evidence('approve'));
    expect(approved.document.reviewStatus).toBe('approved');
    expect(approved.document.fingerprint).toBe(document().fingerprint);
  });

  it('blocks skipped approval states', () => {
    expect(() => transitionDocumentaryDocument(document(), 'approved', evidence('approve'))).toThrow(/not allowed/);
  });

  it('requires review evidence and the correct action', () => {
    expect(() => transitionDocumentaryDocument(document(), 'reviewed', { ...evidence('submit-review'), evidenceReferences: [] })).toThrow(/evidence reference/);
    expect(() => transitionDocumentaryDocument(document(), 'reviewed', evidence('approve'))).toThrow(/does not authorize/);
  });

  it('supports controlled supersede and archive transitions', () => {
    const reviewed = transitionDocumentaryDocument(document(), 'reviewed', evidence('submit-review')).document;
    const approved = transitionDocumentaryDocument(reviewed, 'approved', evidence('approve')).document;
    const superseded = transitionDocumentaryDocument(approved, 'superseded', evidence('supersede')).document;
    expect(transitionDocumentaryDocument(superseded, 'archived', evidence('archive')).document.reviewStatus).toBe('archived');
  });
});
