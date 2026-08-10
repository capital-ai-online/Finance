import type { EventContract } from '../Contracts/EventContract';
import type { EventPayload } from '../Contracts/EventPayload';

export type EventReplayDecision = 'process' | 'duplicate' | 'stale';

export interface EventReplayResult {
  decision: EventReplayDecision;
  idempotencyKey: string;
  eventId: string;
  correlationId: string;
  reason?: string;
}

export class EventReplayGuard {
  private readonly processedEventIds = new Set<string>();
  private readonly latestTimestampByCorrelation = new Map<string, number>();

  evaluate<TPayload extends EventPayload>(event: EventContract<TPayload>): EventReplayResult {
    const eventId = event.metadata.eventId.trim();
    const correlationId = event.metadata.correlationId.trim();
    const timestamp = Date.parse(event.metadata.timestamp);

    if (!eventId) throw new Error('[EventReplayGuard] eventId is required.');
    if (!correlationId) throw new Error('[EventReplayGuard] correlationId is required.');
    if (Number.isNaN(timestamp)) throw new Error('[EventReplayGuard] timestamp must be ISO-compatible.');

    const idempotencyKey = eventId;
    if (this.processedEventIds.has(idempotencyKey)) {
      return Object.freeze({ decision: 'duplicate', idempotencyKey, eventId, correlationId, reason: 'eventId already processed' });
    }

    const latest = this.latestTimestampByCorrelation.get(correlationId);
    if (latest !== undefined && timestamp < latest) {
      return Object.freeze({ decision: 'stale', idempotencyKey, eventId, correlationId, reason: 'event timestamp precedes latest processed correlation event' });
    }

    this.processedEventIds.add(idempotencyKey);
    this.latestTimestampByCorrelation.set(correlationId, timestamp);
    return Object.freeze({ decision: 'process', idempotencyKey, eventId, correlationId });
  }

  reset(): void {
    this.processedEventIds.clear();
    this.latestTimestampByCorrelation.clear();
  }
}
