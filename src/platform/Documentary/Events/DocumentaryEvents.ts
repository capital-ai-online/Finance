import type { EventPayload } from '../../EventMesh/Contracts/EventPayload';
import type { DocumentaryTraceabilityRecord } from '../Traceability/DocumentaryTraceability';

export interface DocumentationGeneratedEventPayload extends EventPayload {
  documentId: string;
  documentFingerprint: string;
  sourceCommit: string;
  causationId: string;
  traceability: DocumentaryTraceabilityRecord;
}

export interface DocumentationValidatedEventPayload extends EventPayload {
  documentId: string;
  documentFingerprint: string;
  sourceCommit: string;
  causationId: string;
  validationStatus: 'valid' | 'invalid';
  traceability: DocumentaryTraceabilityRecord;
}
