// ESS-0013, Core "EventPublisher" — Implementierung von IEventPublisher. Baut den
// EventContract auf, validiert ihn, registriert Producer/Event und uebergibt an
// EventDispatcher zur Zustellung. Fachkomponenten greifen ausschliesslich ueber
// Interfaces/IEventPublisher.ts zu, niemals auf diese Klasse direkt.

import type { IEventPublisher, PublishOptions } from '../Interfaces/IEventPublisher';
import type { EventPayload } from '../Contracts/EventPayload';
import { createEventContract, type EventContract } from '../Contracts/EventContract';
import { INITIAL_EVENT_VERSION } from '../Contracts/EventVersion';
import { EventContractValidator } from '../Validators/EventContractValidator';
import { EventRegistry } from '../Registry/EventRegistry';
import { EventDispatcher } from './EventDispatcher';
import type { EventDeliveryRecord } from '../Models/EventDeliveryRecord';
import { generateEventId } from './generateEventId';

export class EventPublisher implements IEventPublisher {
  private readonly validator = new EventContractValidator();
  private readonly deliveryLog: EventDeliveryRecord[] = [];

  constructor(
    private readonly registry: EventRegistry,
    private readonly dispatcher: EventDispatcher
  ) {}

  publish<TPayload extends EventPayload>(
    eventName: string,
    payload: TPayload,
    options: PublishOptions
  ): EventContract<TPayload> {
    const catalogEntry = this.registry.getCatalogEntry(eventName);

    const event = createEventContract(
      {
        eventId: generateEventId(),
        name: eventName,
        timestamp: new Date().toISOString(),
        sourceComponent: options.sourceComponent,
        targetComponent: options.targetComponent,
        correlationId: options.correlationId ?? generateEventId(),
        essReferences: options.essReferences,
        adrReferences: options.adrReferences ?? [],
        etmReferences: {
          interfaces: ['IEventPublisher'],
          components: [options.sourceComponent],
        },
      },
      catalogEntry ? parseCatalogVersion(catalogEntry.version) : INITIAL_EVENT_VERSION,
      payload
    );

    const result = this.validator.validate(event);
    if (!result.valid) {
      throw new Error(
        `EventContract fuer "${eventName}" ungueltig: ${result.errors.join('; ')}`
      );
    }

    this.registry.registerProducer(eventName, options.sourceComponent);

    // Zustellung erfolgt asynchron (fire-and-forget aus Sicht des Publishers), der
    // Publisher wartet nicht auf Consumer - Chapter 8 fordert lose Kopplung.
    void this.dispatcher.route(event).then((routing) => {
      this.deliveryLog.push({
        eventId: event.metadata.eventId,
        eventName,
        version: `${event.version.major}.${event.version.minor}.${event.version.patch}`,
        correlationId: event.metadata.correlationId,
        sourceComponent: options.sourceComponent,
        timestamp: event.metadata.timestamp,
        status: routing.failed.length > 0
          ? 'failed'
          : routing.delivered.length === 0
          ? 'no_consumers'
          : 'delivered',
        deliveredTo: routing.delivered,
        failures: routing.failed,
      });
    });

    return event;
  }

  getDeliveryLog(): EventDeliveryRecord[] {
    return [...this.deliveryLog];
  }
}

function parseCatalogVersion(version: string) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major: major || 1, minor: minor || 0, patch: patch || 0 };
}
