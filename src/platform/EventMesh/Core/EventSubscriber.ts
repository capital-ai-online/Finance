// ESS-0013, Core "EventSubscriber" — Implementierung von IEventSubscriber.
// Fachkomponenten greifen ausschliesslich ueber Interfaces/IEventSubscriber.ts zu.

import type { EventHandler, IEventSubscriber } from '../Interfaces/IEventSubscriber';
import { ConsumerRegistry } from '../Registry/ConsumerRegistry';
import { EventRegistry } from '../Registry/EventRegistry';

export class EventSubscriber implements IEventSubscriber {
  constructor(
    private readonly consumerRegistry: ConsumerRegistry,
    private readonly eventRegistry: EventRegistry
  ) {}

  subscribe(eventName: string, consumerComponent: string, handler: EventHandler): () => void {
    this.eventRegistry.registerConsumer(eventName, consumerComponent);
    return this.consumerRegistry.subscribe(eventName, consumerComponent, handler);
  }

  unsubscribe(eventName: string, consumerComponent: string): void {
    this.consumerRegistry.unsubscribe(eventName, consumerComponent);
  }
}
