import crypto from 'node:crypto';
import type { DocumentaryDocument } from '../Models/DocumentaryDocument';

export interface DocumentaryKnowledgeNode {
  id: string;
  type: 'documentation';
  origin: {
    sourceCommit: string;
    documentId: string;
    fingerprint: string;
  };
  conceptIds: string[];
  traceabilityIds: string[];
  provenanceReferences: string[];
}

export interface DocumentaryKnowledgeRelationship {
  from: string;
  to: string;
  type: 'REFERENCES_CONCEPT' | 'TRACEABLE_TO' | 'DERIVED_FROM';
}

export interface DocumentaryKnowledgeProjection {
  sourceCommit: string;
  documentId: string;
  checksum: string;
  nodes: DocumentaryKnowledgeNode[];
  relationships: DocumentaryKnowledgeRelationship[];
}

function stableUnique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function checksum(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function projectDocumentaryKnowledge(document: DocumentaryDocument): DocumentaryKnowledgeProjection {
  const documentNodeId = `document:${document.documentId}`;
  const provenanceReferences = stableUnique(
    document.provenance.map((item) => `${item.kind}:${item.referenceId}${item.evidenceId ? `:${item.evidenceId}` : ''}`),
  );
  const conceptIds = stableUnique(document.conceptIds);
  const traceabilityIds = stableUnique(document.traceabilityIds);

  const nodes: DocumentaryKnowledgeNode[] = [{
    id: documentNodeId,
    type: 'documentation',
    origin: {
      sourceCommit: document.sourceCommit,
      documentId: document.documentId,
      fingerprint: document.fingerprint,
    },
    conceptIds,
    traceabilityIds,
    provenanceReferences,
  }];

  const relationships: DocumentaryKnowledgeRelationship[] = [
    ...conceptIds.map((id) => ({ from: documentNodeId, to: `concept:${id}`, type: 'REFERENCES_CONCEPT' as const })),
    ...traceabilityIds.map((id) => ({ from: documentNodeId, to: `traceability:${id}`, type: 'TRACEABLE_TO' as const })),
    ...provenanceReferences.map((id) => ({ from: documentNodeId, to: `origin:${id}`, type: 'DERIVED_FROM' as const })),
  ].sort((a, b) => `${a.type}|${a.to}`.localeCompare(`${b.type}|${b.to}`));

  const stablePayload = { sourceCommit: document.sourceCommit, documentId: document.documentId, nodes, relationships };
  return Object.freeze({ ...stablePayload, checksum: checksum(stablePayload) });
}
