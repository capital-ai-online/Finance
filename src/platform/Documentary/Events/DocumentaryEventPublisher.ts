import type { IEventPublisher } from '../../EventMesh/Interfaces/IEventPublisher';
import type { DocumentaryDocument } from '../Models/DocumentaryDocument';
import { buildDocumentaryTraceabilityRecord } from '../Traceability/DocumentaryTraceability';
import type { DocumentationGeneratedEventPayload, DocumentationValidatedEventPayload } from './DocumentaryEvents';

export class DocumentaryEventPublisher {
  constructor(private readonly publisher: IEventPublisher) {}

  publishGenerated(document: DocumentaryDocument, correlationId: string, causationId: string) {
    const traceability = buildDocumentaryTraceabilityRecord(document, correlationId, causationId);
    const payload: DocumentationGeneratedEventPayload = {
      documentId: document.documentId,
      documentFingerprint: document.fingerprint,
      sourceCommit: document.sourceCommit,
      causationId,
      traceability,
    };

    return this.publisher.publish('DocumentationGeneratedEvent', payload, {
      sourceComponent: 'Documentary',
      targetComponent: 'Traceability',
      correlationId,
      essReferences: ['ESS-0010', 'ESS-0011', 'ESS-0013-CONTRACTS'],
      adrReferences: ['ADR-0018'],
    });
  }

  publishValidated(
    document: DocumentaryDocument,
    correlationId: string,
    causationId: string,
    validationStatus: 'valid' | 'invalid'
  ) {
    const traceability = buildDocumentaryTraceabilityRecord(document, correlationId, causationId);
    const payload: DocumentationValidatedEventPayload = {
      documentId: document.documentId,
      documentFingerprint: document.fingerprint,
      sourceCommit: document.sourceCommit,
      causationId,
      validationStatus,
      traceability,
    };

    return this.publisher.publish('DocumentationValidatedEvent', payload, {
      sourceComponent: 'Documentary',
      targetComponent: 'Traceability',
      correlationId,
      essReferences: ['ESS-0010', 'ESS-0011', 'ESS-0012-CONTRACTS', 'ESS-0013-CONTRACTS'],
      adrReferences: ['ADR-0014', 'ADR-0018'],
    });
  }
}
