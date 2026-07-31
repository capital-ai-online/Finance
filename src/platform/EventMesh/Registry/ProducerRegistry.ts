// ESS-0013, Registry "ProducerRegistry" — welche Komponente welches Event
// veroeffentlichen darf.

export class ProducerRegistry {
  private readonly producersByEvent = new Map<string, Set<string>>();

  register(eventName: string, component: string): void {
    const set = this.producersByEvent.get(eventName) ?? new Set<string>();
    set.add(component);
    this.producersByEvent.set(eventName, set);
  }

  isAuthorized(eventName: string, component: string): boolean {
    return this.producersByEvent.get(eventName)?.has(component) ?? false;
  }

  producersOf(eventName: string): string[] {
    return Array.from(this.producersByEvent.get(eventName) ?? []);
  }

  eventsProducedBy(component: string): string[] {
    const events: string[] = [];
    for (const [eventName, producers] of this.producersByEvent.entries()) {
      if (producers.has(component)) events.push(eventName);
    }
    return events;
  }
}
