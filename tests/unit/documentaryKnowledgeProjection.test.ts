import { describe, expect, it } from 'vitest';
import { createDocumentaryDocument } from '../../src/platform/Documentary/Models/DocumentaryDocument';
import { projectDocumentaryKnowledge } from '../../src/platform/Documentary/Knowledge/DocumentaryKnowledgeProjection';

const sourceCommit = 'c'.repeat(40);
const versions = { componentVersion: '1.8.0', documentSchemaVersion: '1.0.0', platformVersion: '0.6.0' };

function makeDocument() {
  return createDocumentaryDocument({
    documentId: 'DOC-D7-001',
    documentType: 'architecture',
    sourceCommit,
    generatedAt: '2026-08-10T06:58:00.000Z',
    title: 'Knowledge projection',
    content: 'Stable knowledge projection source.',
    conceptIds: ['VOC-002', 'VOC-001', 'VOC-001'],
    traceabilityIds: ['TRACE-002', 'TRACE-001'],
    provenance: [{ kind: 'code', referenceId: 'src/platform/Documentary', sourceCommit, path: 'src/platform/Documentary' }],
  }, versions);
}

describe('Documentary D7 knowledge projection', () => {
  it('is deterministic for the same governed document', () => {
    expect(projectDocumentaryKnowledge(makeDocument())).toEqual(projectDocumentaryKnowledge(makeDocument()));
  });

  it('preserves origin, fingerprint, concepts and traceability', () => {
    const document = makeDocument();
    const projection = projectDocumentaryKnowledge(document);
    expect(projection.sourceCommit).toBe(sourceCommit);
    expect(projection.nodes[0].origin.fingerprint).toBe(document.fingerprint);
    expect(projection.nodes[0].conceptIds).toEqual(['VOC-001', 'VOC-002']);
    expect(projection.nodes[0].traceabilityIds).toEqual(['TRACE-001', 'TRACE-002']);
  });

  it('derives directed relationships without persistence side effects', () => {
    const projection = projectDocumentaryKnowledge(makeDocument());
    expect(projection.relationships.some((item) => item.type === 'REFERENCES_CONCEPT')).toBe(true);
    expect(projection.relationships.some((item) => item.type === 'TRACEABLE_TO')).toBe(true);
    expect(projection.relationships.some((item) => item.type === 'DERIVED_FROM')).toBe(true);
    expect(projection.checksum).toMatch(/^[0-9a-f]{64}$/);
  });
});
