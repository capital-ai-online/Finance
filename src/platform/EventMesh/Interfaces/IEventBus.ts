// ESS-0013, Core "EventBus" — zentrale Zustellinstanz. Kombiniert Publisher-,
// Subscriber- und Registry-Zugriff als der einzige Einstiegspunkt, den
// EventMeshService nach aussen reicht.

import type { IEventPublisher } from './IEventPublisher';
import type { IEventSubscriber } from './IEventSubscriber';
import type { IEventRegistry } from './IEventRegistry';

export interface IEventBus extends IEventPublisher, IEventSubscriber {
  readonly registry: IEventRegistry;
}
