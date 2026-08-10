import crypto from 'node:crypto';
import { DOCUMENTARY_DOCUMENT_SCHEMA_VERSION, type DocumentaryVersionContext } from '../Versioning/DocumentaryVersion';
import { type DocumentaryProvenanceReference, validateDocumentaryProvenanceReference } from './DocumentaryProvenance';

export type DocumentaryDocumentStatus = 'draft' | 'generated' | 'reviewed' | 'approved' | 'superseded' | 'archived';
export type DocumentaryDocumentType = 'architecture' | 'component' | 'api' | 'runbook' | 'release-evidence' | 'handoff';

export interface DocumentaryDocument {
  documentId: string;
  documentType: DocumentaryDocumentType;
  schemaVersion: string;
  componentVersion: string;
  platformVersion: string;
  sourceCommit: string;
  generatedAt: string;
  reviewStatus: DocumentaryDocumentStatus;
  title: string;
  content: string;
  conceptIds: string[];
  traceabilityIds: string[];
  provenance: DocumentaryProvenanceReference[];
  fingerprint: string;
}

export interface DocumentaryDocumentInput {
  documentId: string;
  documentType: DocumentaryDocumentType;
  sourceCommit: string;
  generatedAt: string;
  reviewStatus?: DocumentaryDocumentStatus;
  title: string;
  content: string;
  conceptIds?: string[];
  traceabilityIds?: string[];
  provenance: DocumentaryProvenanceReference[];
}

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`[DocumentaryDocument] ${field} is required.`);
  return normalized;
}

function stableUnique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

export function computeDocumentaryFingerprint(document: Omit<DocumentaryDocument, 'fingerprint' | 'generatedAt' | 'reviewStatus'>): string {
  const stable = JSON.stringify({
    ...document,
    conceptIds: stableUnique(document.conceptIds),
    traceabilityIds: stableUnique(document.traceabilityIds),
    provenance: [...document.provenance].sort((a, b) => `${a.kind}|${a.referenceId}|${a.evidenceId ?? ''}`.localeCompare(`${b.kind}|${b.referenceId}|${b.evidenceId ?? ''}`)),
  });
  return crypto.createHash('sha256').update(stable).digest('hex');
}

export function createDocumentaryDocument(input: DocumentaryDocumentInput, versions: DocumentaryVersionContext): DocumentaryDocument {
  if (!/^[0-9a-f]{7,40}$/i.test(input.sourceCommit)) throw new Error('[DocumentaryDocument] sourceCommit must be a Git commit SHA.');
  if (Number.isNaN(Date.parse(input.generatedAt))) throw new Error('[DocumentaryDocument] generatedAt must be an ISO-compatible timestamp.');
  if (input.provenance.length === 0) throw new Error('[DocumentaryDocument] at least one provenance reference is required.');
  input.provenance.forEach(validateDocumentaryProvenanceReference);

  const base = {
    documentId: requireNonEmpty(input.documentId, 'documentId'),
    documentType: input.documentType,
    schemaVersion: DOCUMENTARY_DOCUMENT_SCHEMA_VERSION,
    componentVersion: versions.componentVersion,
    platformVersion: versions.platformVersion,
    sourceCommit: input.sourceCommit,
    title: requireNonEmpty(input.title, 'title'),
    content: requireNonEmpty(input.content, 'content'),
    conceptIds: stableUnique(input.conceptIds ?? []),
    traceabilityIds: stableUnique(input.traceabilityIds ?? []),
    provenance: [...input.provenance],
  };

  return Object.freeze({
    ...base,
    generatedAt: input.generatedAt,
    reviewStatus: input.reviewStatus ?? 'generated',
    fingerprint: computeDocumentaryFingerprint(base),
  });
}
