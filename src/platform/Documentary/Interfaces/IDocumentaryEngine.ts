import type { CodeEvidenceMap } from '../Discovery/CodeEvidence';
import type { DocumentaryDocument, DocumentaryDocumentType } from '../Models/DocumentaryDocument';
import type { DocumentaryProvenanceReference } from '../Models/DocumentaryProvenance';
import type { DocumentaryVersionContext } from '../Versioning/DocumentaryVersion';

export interface DocumentaryEngineRequest {
  correlationId: string;
  documentId: string;
  documentType: DocumentaryDocumentType;
  sourceCommit: string;
  generatedAt: string;
  title: string;
  content: string;
  conceptIds: string[];
  traceabilityIds: string[];
  codeEvidence: CodeEvidenceMap;
  authorityProvenance?: DocumentaryProvenanceReference[];
  versions: DocumentaryVersionContext;
}

export interface DocumentaryEngineResult {
  correlationId: string;
  document: DocumentaryDocument;
  evidenceIds: string[];
}

export interface IDocumentaryEngine {
  generate(request: DocumentaryEngineRequest): DocumentaryEngineResult;
}
