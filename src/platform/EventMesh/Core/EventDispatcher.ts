// ESS-0013, Core "EventDispatcher" — verteilt validierte Events an die von
// EventRouter adressierten Consumer. Implementiert IEventRouter, da dies aus Sicht
// des aufrufenden EventBus die vollstaendige Zustellung (Adressierung + Ausfuehrung)
// ist.

import type { IEventRouter, RoutingResult } from '../Interfaces/IEventRouter';
import type { EventContract } from '../Contracts/EventContract';
import type { EventPayload } from '../Contracts/EventPayload';
import { EventRouter } from './EventRouter';

export class EventDispatcher implements IEventRouter {
  constructor(private readonly router: EventRouter) {}

  async route<TPayload extends EventPayload>(event: EventContract<TPayload>): Promise<RoutingResult> {
    const targets = this.router.resolveTargets(event);
    const delivered: string[] = [];
    const failed: { consumer: string; reason: string }[] = [];

    for (const { component, handler } of targets) {
      try {
        await handler(event);
        delivered.push(component);
      } catch (err) {
        // ESS-0013-CONTRACTS Abschnitt 5: ein Zustellfehler wird gemeldet, niemals
        // stillschweigend verworfen. Ein fehlschlagender Consumer blockiert nicht die
        // Zustellung an die uebrigen Consumer.
        failed.push({ consumer: component, reason: err instanceof Error ? err.message : String(err) });
      }
    }

    return { delivered, failed };
  }
}
