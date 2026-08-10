import crypto from 'node:crypto';
import type { CodeEvidence } from '../Discovery/CodeEvidence';
import type { DocumentaryEngineRequest, DocumentaryEngineResult, IDocumentaryEngine } from '../Interfaces/IDocumentaryEngine';
import { createDocumentaryDocument } from '../Models/DocumentaryDocument';
import type { DocumentaryProvenanceReference } from '../Models/DocumentaryProvenance';

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`[DocumentaryEngine] ${field} is required.`);
  return normalized;
}

function stableUnique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function requestFingerprint(request: DocumentaryEngineRequest): string {
  const stable = JSON.stringify({
    correlationId: request.correlationId,
    documentId: request.documentId,
    documentType: request.documentType,
    sourceCommit: request.sourceCommit,
    title: request.title,
    content: request.content,
    conceptIds: stableUnique(request.conceptIds),
    traceabilityIds: stableUnique(request.traceabilityIds),
    evidenceIds: stableUnique(request.codeEvidence.evidence.map((item) => item.evidenceId)),
    authority: [...(request.authorityProvenance ?? [])].sort((a, b) => `${a.kind}|${a.referenceId}`.localeCompare(`${b.kind}|${b.referenceId}`)),
    versions: request.versions,
  });
  return crypto.createHash('sha256').update(stable).digest('hex');
}

function toCodeProvenance(evidence: CodeEvidence): DocumentaryProvenanceReference {
  return {
    kind: 'code',
    referenceId: evidence.symbol ?? evidence.path,
    sourceCommit: evidence.sourceCommit,
    path: evidence.path,
    symbol: evidence.symbol,
    evidenceId: evidence.evidenceId,
    detail: evidence.detail,
  };
}

export class DocumentaryEngine implements IDocumentaryEngine {
  private readonly processed = new Map<string, { requestFingerprint: string; result: DocumentaryEngineResult }>();

  generate(request: DocumentaryEngineRequest): DocumentaryEngineResult {
    const correlationId = requireNonEmpty(request.correlationId, 'correlationId');
    requireNonEmpty(request.documentId, 'documentId');

    if (!/^[0-9a-f]{40}$/i.test(request.sourceCommit)) {
      throw new Error('[DocumentaryEngine] sourceCommit must be a full 40-character Git commit SHA.');
    }
    if (request.codeEvidence.sourceCommit !== request.sourceCommit) {
      throw new Error('[DocumentaryEngine] code evidence sourceCommit must match request sourceCommit.');
    }
    if (request.codeEvidence.evidence.length === 0) {
      throw new Error('[DocumentaryEngine] at least one code evidence item is required.');
    }
    if (request.codeEvidence.evidence.some((item) => item.sourceCommit !== request.sourceCommit)) {
      throw new Error('[DocumentaryEngine] every code evidence item must match request sourceCommit.');
    }
    if (stableUnique(request.conceptIds).length === 0) {
      throw new Error('[DocumentaryEngine] at least one conceptId authority is required.');
    }
    if (stableUnique(request.traceabilityIds).length === 0) {
      throw new Error('[DocumentaryEngine] at least one traceabilityId is required.');
    }
    if (!request.versions.componentVersion || !request.versions.documentSchemaVersion || !request.versions.platformVersion) {
      throw new Error('[DocumentaryEngine] complete version context is required.');
    }

    const fingerprint = requestFingerprint(request);
    const prior = this.processed.get(correlationId);
    if (prior) {
      if (prior.requestFingerprint !== fingerprint) {
        throw new Error('[DocumentaryEngine] correlationId was already used for a different request.');
      }
      return prior.result;
    }

    const provenance: DocumentaryProvenanceReference[] = [
      ...request.codeEvidence.evidence.map(toCodeProvenance),
      ...(request.authorityProvenance ?? []),
    ];

    const document = createDocumentaryDocument({
      documentId: request.documentId,
      documentType: request.documentType,
      sourceCommit: request.sourceCommit,
      generatedAt: request.generatedAt,
      reviewStatus: 'generated',
      title: request.title,
      content: request.content,
      conceptIds: request.conceptIds,
      traceabilityIds: request.traceabilityIds,
      provenance,
    }, request.versions);

    const result = Object.freeze({
      correlationId,
      document,
      evidenceIds: stableUnique(request.codeEvidence.evidence.map((item) => item.evidenceId)),
    });
    this.processed.set(correlationId, { requestFingerprint: fingerprint, result });
    return result;
  }
}
