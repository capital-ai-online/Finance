import type { EventContract } from '../../EventMesh/Contracts/EventContract';
import type { EventPayload } from '../../EventMesh/Contracts/EventPayload';

const ALLOWED_DOCUMENTARY_TRIGGERS = new Set(['RepositoryScannedEvent', 'PlatformDecisionEvent']);

export interface DocumentaryEventTrigger {
  correlationId: string;
  causationId: string;
  sourceEventName: string;
  sourceComponent: string;
}

export function consumeDocumentaryTrigger<TPayload extends EventPayload>(event: EventContract<TPayload>): DocumentaryEventTrigger {
  if (!ALLOWED_DOCUMENTARY_TRIGGERS.has(event.metadata.name)) {
    throw new Error(`[DocumentaryEventConsumer] unsupported trigger event: ${event.metadata.name}`);
  }
  if (!event.metadata.correlationId.trim()) throw new Error('[DocumentaryEventConsumer] correlationId is required.');
  if (!event.metadata.eventId.trim()) throw new Error('[DocumentaryEventConsumer] eventId is required as causationId.');

  return Object.freeze({
    correlationId: event.metadata.correlationId,
    causationId: event.metadata.eventId,
    sourceEventName: event.metadata.name,
    sourceComponent: event.metadata.sourceComponent,
  });
}
