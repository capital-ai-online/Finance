import crypto from 'node:crypto';
import type {
  DocumentaryKnowledgeProjection,
  DocumentaryKnowledgeRelationship,
} from '../Knowledge/DocumentaryKnowledgeProjection';

export type DocumentaryMermaidDirection = 'TD' | 'LR';

export interface DocumentaryMermaidArtifact {
  documentId: string;
  sourceCommit: string;
  projectionChecksum: string;
  direction: DocumentaryMermaidDirection;
  fileName: string;
  mediaType: 'text/vnd.mermaid';
  body: string;
  checksum: string;
}

const RELATIONSHIP_TYPES = Object.freeze(new Set<DocumentaryKnowledgeRelationship['type']>([
  'REFERENCES_CONCEPT',
  'TRACEABLE_TO',
  'DERIVED_FROM',
]));

function stableUnique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function safeFileToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'document';
}

function mermaidNodeAlias(nodeId: string): string {
  return `n_${sha256(nodeId)}`;
}

function escapeMermaidLabel(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/:\/\//g, '&#58;//')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .trim();
}

function validateProjection(projection: DocumentaryKnowledgeProjection): void {
  if (!projection.documentId?.trim()) throw new Error('Documentary Mermaid projection requires documentId');
  if (!/^[0-9a-f]{40}$/i.test(projection.sourceCommit)) {
    throw new Error('Documentary Mermaid projection requires a full sourceCommit SHA');
  }
  if (!/^[0-9a-f]{64}$/i.test(projection.checksum)) {
    throw new Error('Documentary Mermaid projection requires a SHA-256 projection checksum');
  }
  if (!Array.isArray(projection.nodes) || projection.nodes.length === 0) {
    throw new Error('Documentary Mermaid projection requires at least one node');
  }
  if (!Array.isArray(projection.relationships)) {
    throw new Error('Documentary Mermaid projection requires a relationships array');
  }

  for (const node of projection.nodes) {
    if (!node?.id?.trim()) {
      throw new Error('Documentary Mermaid nodes require non-empty identifiers');
    }
  }
  for (const relationship of projection.relationships) {
    if (!relationship.from?.trim() || !relationship.to?.trim()) {
      throw new Error('Documentary Mermaid relationships require non-empty from/to identifiers');
    }
    if (!RELATIONSHIP_TYPES.has(relationship.type)) {
      throw new Error(`Unsupported Documentary Mermaid relationship type: ${String(relationship.type)}`);
    }
  }
}

function collectNodeIds(projection: DocumentaryKnowledgeProjection): string[] {
  return stableUnique([
    ...projection.nodes.map((node) => node.id),
    ...projection.relationships.flatMap((relationship) => [relationship.from, relationship.to]),
  ]);
}

function renderRelationship(relationship: DocumentaryKnowledgeRelationship): string {
  return `  ${mermaidNodeAlias(relationship.from)} -->|${relationship.type}| ${mermaidNodeAlias(relationship.to)}`;
}

export function renderDocumentaryMermaid(
  projection: DocumentaryKnowledgeProjection,
  direction: DocumentaryMermaidDirection = 'TD',
): string {
  validateProjection(projection);
  if (direction !== 'TD' && direction !== 'LR') {
    throw new Error(`Unsupported Documentary Mermaid direction: ${String(direction)}`);
  }

  const nodes = collectNodeIds(projection)
    .map((nodeId) => `  ${mermaidNodeAlias(nodeId)}["${escapeMermaidLabel(nodeId)}"]`);
  const relationships = [...projection.relationships]
    .sort((a, b) => `${a.type}|${a.from}|${a.to}`.localeCompare(`${b.type}|${b.from}|${b.to}`))
    .map(renderRelationship);

  return [
    `flowchart ${direction}`,
    ...nodes,
    ...relationships,
    '',
  ].join('\n');
}

export function generateDocumentaryMermaidArtifact(
  projection: DocumentaryKnowledgeProjection,
  direction: DocumentaryMermaidDirection = 'TD',
): DocumentaryMermaidArtifact {
  const body = renderDocumentaryMermaid(projection, direction);
  return Object.freeze({
    documentId: projection.documentId,
    sourceCommit: projection.sourceCommit,
    projectionChecksum: projection.checksum,
    direction,
    fileName: `${safeFileToken(projection.documentId)}.mmd`,
    mediaType: 'text/vnd.mermaid' as const,
    body,
    checksum: sha256(body),
  });
}
