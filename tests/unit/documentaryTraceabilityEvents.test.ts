import { describe, expect, it } from 'vitest';
import type { EventPayload } from '../../src/platform/EventMesh/Contracts/EventPayload';
import type { IEventPublisher, PublishOptions } from '../../src/platform/EventMesh/Interfaces/IEventPublisher';
import type { EventContract } from '../../src/platform/EventMesh/Contracts/EventContract';
import { INITIAL_EVENT_VERSION } from '../../src/platform/EventMesh/Contracts/EventVersion';
import { createDocumentaryDocument } from '../../src/platform/Documentary/Models/DocumentaryDocument';
import { DocumentaryEventPublisher } from '../../src/platform/Documentary/Events/DocumentaryEventPublisher';
import { buildDocumentaryTraceabilityRecord } from '../../src/platform/Documentary/Traceability/DocumentaryTraceability';

class FakePublisher implements IEventPublisher {
  public readonly published: Array<{ name: string; payload: EventPayload; options: PublishOptions }> = [];

  publish<TPayload extends EventPayload>(eventName: string, payload: TPayload, options: PublishOptions): EventContract<TPayload> {
    this.published.push({ name: eventName, payload, options });
    return {
      metadata: {
        eventId: `evt-${this.published.length}`,
        name: eventName,
        timestamp: '2026-08-10T00:00:00.000Z',
        sourceComponent: options.sourceComponent,
        targetComponent: options.targetComponent,
        correlationId: options.correlationId ?? 'generated-correlation',
        essReferences: options.essReferences,
        adrReferences: options.adrReferences ?? [],
      },
      version: INITIAL_EVENT_VERSION,
      payload,
    };
  }
}

function document() {
  return createDocumentaryDocument({
    documentId: 'DOC-001',
    documentType: 'architecture',
    sourceCommit: 'c805914e544d63c6cdce1ed8a759b8bc48664fce',
    generatedAt: '2026-08-10T00:00:00.000Z',
    title: 'Documentary traceability',
    content: 'Evidence-backed content',
    conceptIds: ['VOC-PLATFORM-0001'],
    traceabilityIds: ['TRACE-DOC-001'],
    provenance: [{ kind: 'code', referenceId: 'DocumentaryEngine', sourceCommit: 'c805914e544d63c6cdce1ed8a759b8bc48664fce', path: 'src/platform/Documentary/Engine/DocumentaryEngine.ts' }],
  }, { componentVersion: '1.4.0', documentSchemaVersion: '1.0.0', platformVersion: '0.6.0' });
}

describe('Documentary traceability and events', () => {
  it('builds an end-to-end traceability record', () => {
    const record = buildDocumentaryTraceabilityRecord(document(), 'corr-1', 'cause-1');
    expect(record.correlationId).toBe('corr-1');
    expect(record.causationId).toBe('cause-1');
    expect(record.traceabilityIds).toEqual(['TRACE-DOC-001']);
    expect(record.documentFingerprint).toMatch(/^[0-9a-f]{64}$/);
  });

  it('publishes generated evidence through the existing EventMesh publisher contract', () => {
    const publisher = new FakePublisher();
    const bridge = new DocumentaryEventPublisher(publisher);
    bridge.publishGenerated(document(), 'corr-1', 'cause-1');

    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0].name).toBe('DocumentationGeneratedEvent');
    expect(publisher.published[0].options.sourceComponent).toBe('Documentary');
    expect(publisher.published[0].options.correlationId).toBe('corr-1');
    expect(publisher.published[0].payload.causationId).toBe('cause-1');
  });

  it('fails closed without causation evidence', () => {
    expect(() => buildDocumentaryTraceabilityRecord(document(), 'corr-1', '   ')).toThrow(/causationId/);
  });
});
