import type { DocumentaryDocument } from '../Models/DocumentaryDocument';

export interface DocumentaryTraceabilityRecord {
  correlationId: string;
  causationId: string;
  documentId: string;
  documentFingerprint: string;
  sourceCommit: string;
  conceptIds: string[];
  traceabilityIds: string[];
  provenanceReferenceIds: string[];
}

export function buildDocumentaryTraceabilityRecord(
  document: DocumentaryDocument,
  correlationId: string,
  causationId: string
): DocumentaryTraceabilityRecord {
  const normalizedCorrelationId = correlationId.trim();
  const normalizedCausationId = causationId.trim();
  if (!normalizedCorrelationId) throw new Error('[DocumentaryTraceability] correlationId is required.');
  if (!normalizedCausationId) throw new Error('[DocumentaryTraceability] causationId is required.');
  if (document.traceabilityIds.length === 0) throw new Error('[DocumentaryTraceability] document requires traceabilityIds.');

  return Object.freeze({
    correlationId: normalizedCorrelationId,
    causationId: normalizedCausationId,
    documentId: document.documentId,
    documentFingerprint: document.fingerprint,
    sourceCommit: document.sourceCommit,
    conceptIds: [...document.conceptIds].sort(),
    traceabilityIds: [...document.traceabilityIds].sort(),
    provenanceReferenceIds: document.provenance.map((item) => item.referenceId).sort(),
  });
}
