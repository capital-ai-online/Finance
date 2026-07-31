// ESS-0013, Registry "ConsumerRegistry" — welche Komponente welches Event
// abonniert hat. EventRouter liest ausschliesslich hierueber (ESS-0013-CONTRACTS
// Abschnitt 5: kein Producer bestimmt selbst seine Consumer).

import type { EventHandler } from '../Interfaces/IEventSubscriber';

export interface Subscription {
  component: string;
  handler: EventHandler;
}

export class ConsumerRegistry {
  private readonly subscriptionsByEvent = new Map<string, Subscription[]>();

  subscribe(eventName: string, component: string, handler: EventHandler): () => void {
    const list = this.subscriptionsByEvent.get(eventName) ?? [];
    list.push({ component, handler });
    this.subscriptionsByEvent.set(eventName, list);
    return () => this.unsubscribe(eventName, component);
  }

  unsubscribe(eventName: string, component: string): void {
    const list = this.subscriptionsByEvent.get(eventName);
    if (!list) return;
    this.subscriptionsByEvent.set(
      eventName,
      list.filter((s) => s.component !== component)
    );
  }

  subscribersOf(eventName: string): Subscription[] {
    return this.subscriptionsByEvent.get(eventName) ?? [];
  }

  consumersOf(eventName: string): string[] {
    return this.subscribersOf(eventName).map((s) => s.component);
  }
}
