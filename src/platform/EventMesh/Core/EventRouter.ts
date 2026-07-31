// ESS-0013, Core "EventRouter" — einzige Instanz, die ueber Zustellwege (WELCHE
// Consumer ein Event erhalten) entscheidet (ESS-0013-CONTRACTS Abschnitt 5). Producer
// bestimmen niemals selbst ihre Consumer. Die tatsaechliche Zustellung uebernimmt
// EventDispatcher - EventRouter trifft ausschliesslich die Adressierungsentscheidung.

import type { EventContract } from '../Contracts/EventContract';
import type { EventPayload } from '../Contracts/EventPayload';
import { ConsumerRegistry, type Subscription } from '../Registry/ConsumerRegistry';

export class EventRouter {
  constructor(private readonly consumerRegistry: ConsumerRegistry) {}

  resolveTargets<TPayload extends EventPayload>(event: EventContract<TPayload>): Subscription[] {
    return this.consumerRegistry.subscribersOf(event.metadata.name);
  }
}
