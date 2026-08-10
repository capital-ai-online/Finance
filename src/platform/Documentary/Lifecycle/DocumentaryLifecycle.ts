import type { DocumentaryDocument, DocumentaryDocumentStatus } from '../Models/DocumentaryDocument';

export type DocumentaryReviewAction = 'submit-review' | 'approve' | 'supersede' | 'archive';

export interface DocumentaryReviewEvidence {
  actorId: string;
  action: DocumentaryReviewAction;
  occurredAt: string;
  reason?: string;
  evidenceReferences: string[];
}

export interface DocumentaryLifecycleRecord {
  documentId: string;
  fromStatus: DocumentaryDocumentStatus;
  toStatus: DocumentaryDocumentStatus;
  actorId: string;
  occurredAt: string;
  reason?: string;
  evidenceReferences: string[];
}

const ALLOWED_TRANSITIONS: Readonly<Record<DocumentaryDocumentStatus, readonly DocumentaryDocumentStatus[]>> = Object.freeze({
  draft: ['generated'],
  generated: ['reviewed'],
  reviewed: ['approved'],
  approved: ['superseded', 'archived'],
  superseded: ['archived'],
  archived: [],
});

function requireValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`[DocumentaryLifecycle] ${field} is required.`);
  return normalized;
}

export function isDocumentaryTransitionAllowed(from: DocumentaryDocumentStatus, to: DocumentaryDocumentStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function transitionDocumentaryDocument(
  document: DocumentaryDocument,
  toStatus: DocumentaryDocumentStatus,
  evidence: DocumentaryReviewEvidence,
): { document: DocumentaryDocument; lifecycle: DocumentaryLifecycleRecord } {
  if (!isDocumentaryTransitionAllowed(document.reviewStatus, toStatus)) {
    throw new Error(`[DocumentaryLifecycle] transition ${document.reviewStatus} -> ${toStatus} is not allowed.`);
  }
  if (Number.isNaN(Date.parse(evidence.occurredAt))) {
    throw new Error('[DocumentaryLifecycle] occurredAt must be an ISO-compatible timestamp.');
  }

  const actorId = requireValue(evidence.actorId, 'actorId');
  const evidenceReferences = [...new Set(evidence.evidenceReferences.map((value) => value.trim()).filter(Boolean))].sort();
  if (evidenceReferences.length === 0) {
    throw new Error('[DocumentaryLifecycle] at least one evidence reference is required.');
  }

  const expectedAction: Record<DocumentaryDocumentStatus, DocumentaryReviewAction | undefined> = {
    draft: undefined,
    generated: 'submit-review',
    reviewed: 'approve',
    approved: toStatus === 'superseded' ? 'supersede' : 'archive',
    superseded: 'archive',
    archived: undefined,
  };
  if (expectedAction[document.reviewStatus] !== evidence.action) {
    throw new Error(`[DocumentaryLifecycle] action ${evidence.action} does not authorize ${document.reviewStatus} -> ${toStatus}.`);
  }

  const lifecycle = Object.freeze({
    documentId: document.documentId,
    fromStatus: document.reviewStatus,
    toStatus,
    actorId,
    occurredAt: evidence.occurredAt,
    reason: evidence.reason?.trim() || undefined,
    evidenceReferences,
  });

  return {
    document: Object.freeze({ ...document, reviewStatus: toStatus }),
    lifecycle,
  };
}
