// ESS-0013, Core "EventPublisher" — einzige oeffentliche Schnittstelle fuer Producer.
// Fachkomponenten duerfen ausschliesslich hierueber veroeffentlichen (component.yaml,
// Abhaengigkeitsregel: kein direkter Zugriff auf Core/).

import type { EventContract } from '../Contracts/EventContract';
import type { EventPayload } from '../Contracts/EventPayload';

export interface PublishOptions {
  sourceComponent: string;
  targetComponent?: string;
  correlationId?: string;
  essReferences: string[];
  adrReferences?: string[];
}

export interface IEventPublisher {
  publish<TPayload extends EventPayload>(
    eventName: string,
    payload: TPayload,
    options: PublishOptions
  ): EventContract<TPayload>;
}
