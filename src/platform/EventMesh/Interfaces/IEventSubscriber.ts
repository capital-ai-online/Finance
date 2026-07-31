// ESS-0013, Core "EventSubscriber" — einzige oeffentliche Schnittstelle fuer Consumer.

import type { EventContract } from '../Contracts/EventContract';
import type { EventPayload } from '../Contracts/EventPayload';

export type EventHandler<TPayload extends EventPayload = EventPayload> = (
  event: EventContract<TPayload>
) => void | Promise<void>;

export interface IEventSubscriber {
  subscribe(eventName: string, consumerComponent: string, handler: EventHandler): () => void;
  unsubscribe(eventName: string, consumerComponent: string): void;
}
