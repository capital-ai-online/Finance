// ESS-0013, Core "EventBus" — zentrale Zustellinstanz und einziger oeffentlicher
// Einstiegspunkt. Komponiert Registry, Router, Dispatcher, Publisher und Subscriber.
//
// Dies ist die erste ausfuehrbare Implementierung im gesamten src/platform-Baum
// (ADR-0018, Folgeentscheidung 1 / Stufe 1-4 aus REPOSITORY_STRUCTURE_ANALYSIS.md).
// In-Memory, ohne externe Abhaengigkeiten - konsistent mit der uebrigen
// Repository-Konvention (vgl. server/iam/rateLimiter.ts).

import type { IEventBus } from '../Interfaces/IEventBus';
import type { IEventRegistry } from '../Interfaces/IEventRegistry';
import type { EventHandler } from '../Interfaces/IEventSubscriber';
import type { PublishOptions } from '../Interfaces/IEventPublisher';
import type { EventPayload } from '../Contracts/EventPayload';
import type { EventContract } from '../Contracts/EventContract';

import { EventRegistry } from '../Registry/EventRegistry';
import { ConsumerRegistry } from '../Registry/ConsumerRegistry';
import { EventRouter } from './EventRouter';
import { EventDispatcher } from './EventDispatcher';
import { EventPublisher } from './EventPublisher';
import { EventSubscriber } from './EventSubscriber';

export class EventBus implements IEventBus {
  readonly registry: IEventRegistry;

  private readonly eventRegistry: EventRegistry;
  private readonly consumerRegistry: ConsumerRegistry;
  private readonly publisherImpl: EventPublisher;
  private readonly subscriberImpl: EventSubscriber;

  constructor() {
    this.eventRegistry = new EventRegistry();
    this.consumerRegistry = new ConsumerRegistry();
    const router = new EventRouter(this.consumerRegistry);
    const dispatcher = new EventDispatcher(router);
    this.publisherImpl = new EventPublisher(this.eventRegistry, dispatcher);
    this.subscriberImpl = new EventSubscriber(this.consumerRegistry, this.eventRegistry);
    this.registry = this.eventRegistry;
  }

  publish<TPayload extends EventPayload>(
    eventName: string,
    payload: TPayload,
    options: PublishOptions
  ): EventContract<TPayload> {
    return this.publisherImpl.publish(eventName, payload, options);
  }

  subscribe(eventName: string, consumerComponent: string, handler: EventHandler): () => void {
    return this.subscriberImpl.subscribe(eventName, consumerComponent, handler);
  }

  unsubscribe(eventName: string, consumerComponent: string): void {
    this.subscriberImpl.unsubscribe(eventName, consumerComponent);
  }

  getDeliveryLog() {
    return this.publisherImpl.getDeliveryLog();
  }
}

/**
 * Singleton-Instanz fuer den einfachen Anwendungsfall (ein Prozess, ein Event-Raum).
 * ESS-0013-CONTRACTS Abschnitt 5: es gibt keinen zweiten Zustellweg - ein einzelner,
 * geteilter Bus pro Prozess stellt das sicher. Mehrinstanz-Betrieb (mehrere Render-
 * Worker) teilt den Zustand NICHT, analog zur bereits dokumentierten Einschraenkung
 * von server/iam/rateLimiter.ts.
 */
export const eventMeshBus = new EventBus();
