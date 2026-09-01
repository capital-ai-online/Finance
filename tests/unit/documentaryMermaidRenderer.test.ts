import { describe, expect, it } from 'vitest';
import { createDocumentaryDocument } from '../../src/platform/Documentary/Models/DocumentaryDocument';
import { projectDocumentaryKnowledge } from '../../src/platform/Documentary/Knowledge/DocumentaryKnowledgeProjection';
import {
  generateDocumentaryMermaidArtifact,
  renderDocumentaryMermaid,
} from '../../src/platform/Documentary/Mermaid/DocumentaryMermaidRenderer';

const sourceCommit = 'd'.repeat(40);
const versions = { componentVersion: '1.14.0', documentSchemaVersion: '1.0.0', platformVersion: '0.6.0' };

function makeProjection() {
  const document = createDocumentaryDocument({
    documentId: 'DOC-D6-MERMAID-001',
    documentType: 'architecture',
    sourceCommit,
    generatedAt: '2026-09-01T11:46:57.000Z',
    title: 'Mermaid projection',
    content: 'Deterministic diagram source.',
    conceptIds: ['VOC-002', 'VOC-001'],
    traceabilityIds: ['TRACE-002', 'TRACE-001'],
    provenance: [{ kind: 'code', referenceId: 'src/platform/Documentary', sourceCommit, path: 'src/platform/Documentary' }],
  }, versions);
  return projectDocumentaryKnowledge(document);
}

describe('Documentary D6 Mermaid projection', () => {
  it('renders deterministic Mermaid from the existing D7 projection', () => {
    const projection = makeProjection();
    const shuffled = {
      ...projection,
      nodes: [...projection.nodes].reverse(),
      relationships: [...projection.relationships].reverse(),
    };

    expect(renderDocumentaryMermaid(shuffled)).toBe(renderDocumentaryMermaid(projection));
    expect(renderDocumentaryMermaid(projection)).toContain('flowchart TD');
    expect(renderDocumentaryMermaid(projection)).toContain('|REFERENCES_CONCEPT|');
    expect(renderDocumentaryMermaid(projection)).toContain('|TRACEABLE_TO|');
    expect(renderDocumentaryMermaid(projection)).toContain('|DERIVED_FROM|');
  });

  it('neutralizes label content instead of emitting Mermaid directives from evidence identifiers', () => {
    const projection = makeProjection();
    const malicious = {
      ...projection,
      relationships: [
        ...projection.relationships,
        { from: `concept:unsafe\"]\nclick injected "https://example.com"`, to: 'document:safe', type: 'REFERENCES_CONCEPT' as const },
      ],
    };

    const body = renderDocumentaryMermaid(malicious);
    expect(body).not.toContain('\nclick injected');
    expect(body).not.toContain('https://example.com');
    expect(body).toContain('&quot;');
  });

  it('returns a stable, non-executing Mermaid text artifact bound to source evidence', () => {
    const projection = makeProjection();
    const artifact = generateDocumentaryMermaidArtifact(projection, 'LR');

    expect(artifact.documentId).toBe(projection.documentId);
    expect(artifact.sourceCommit).toBe(sourceCommit);
    expect(artifact.projectionChecksum).toBe(projection.checksum);
    expect(artifact.direction).toBe('LR');
    expect(artifact.fileName).toBe('doc-d6-mermaid-001.mmd');
    expect(artifact.mediaType).toBe('text/vnd.mermaid');
    expect(artifact.body.startsWith('flowchart LR\n')).toBe(true);
    expect(artifact.checksum).toMatch(/^[0-9a-f]{64}$/);
  });

  it('fails closed for malformed projection identity', () => {
    const projection = makeProjection();
    expect(() => renderDocumentaryMermaid({ ...projection, sourceCommit: 'not-a-sha' })).toThrow(/sourceCommit/);
    expect(() => renderDocumentaryMermaid({ ...projection, checksum: 'bad' })).toThrow(/checksum/);
    expect(() => renderDocumentaryMermaid({ ...projection, nodes: [{ ...projection.nodes[0], id: '   ' }] })).toThrow(/node/i);
  });
});
