// ESS-0013, Registry "EventRegistry" — zentrale Registrierung aller bekannten
// Event-Typen. Implementiert IEventRegistry, komponiert EventCatalog und
// ProducerRegistry. ESS-0013-CONTRACTS Abschnitt 3: ausschliesslich generiert.

import type { EventCatalogEntry, IEventRegistry } from '../Interfaces/IEventRegistry';
import { EventCatalog } from './EventCatalog';
import { ProducerRegistry } from './ProducerRegistry';

export class EventRegistry implements IEventRegistry {
  private readonly catalog = new EventCatalog();
  private readonly producers = new ProducerRegistry();
  private readonly declaredConsumers = new Map<string, Set<string>>();

  registerEvent(entry: Omit<EventCatalogEntry, 'status'>): EventCatalogEntry {
    const existing = this.catalog.get(entry.name);
    if (existing) {
      // ESS-0013-CONTRACTS Abschnitt 1: kein Event wird unter neuem Sinn doppelt
      // registriert - eine erneute Registrierung desselben Namens aktualisiert nur
      // Producer/Consumer/Referenzen, niemals Kategorie oder Version stillschweigend.
      const merged: EventCatalogEntry = {
        ...existing,
        producers: Array.from(new Set([...existing.producers, ...entry.producers])),
        consumers: Array.from(new Set([...existing.consumers, ...entry.consumers])),
        essReferences: Array.from(new Set([...existing.essReferences, ...entry.essReferences])),
        adrReferences: Array.from(new Set([...existing.adrReferences, ...entry.adrReferences])),
      };
      this.catalog.upsert(merged);
      return merged;
    }

    const status = entry.producers.length > 0 ? 'registered' : 'proposed';
    const created: EventCatalogEntry = { ...entry, status };
    this.catalog.upsert(created);
    for (const producer of entry.producers) this.producers.register(entry.name, producer);
    for (const consumer of entry.consumers) this.registerConsumer(entry.name, consumer);
    return created;
  }

  registerProducer(eventName: string, component: string): void {
    this.producers.register(eventName, component);
    // ESS-0013-CONTRACTS Abschnitt 3: "Jedes Event wird bei Veroeffentlichung
    // automatisch registriert" - ein Producer muss nicht zwingend zuerst per
    // registerEvent() (z. B. aus STANDARD_EVENT_CATALOG) geseedet worden sein.
    const entry = this.catalog.get(eventName) ?? this.createMinimalEntry(eventName);
    if (!entry.producers.includes(component)) {
      entry.producers.push(component);
    }
    if (entry.status === 'proposed') entry.status = 'registered';
    this.catalog.upsert(entry);
  }

  registerConsumer(eventName: string, component: string): void {
    const set = this.declaredConsumers.get(eventName) ?? new Set<string>();
    set.add(component);
    this.declaredConsumers.set(eventName, set);
    const entry = this.catalog.get(eventName) ?? this.createMinimalEntry(eventName);
    if (!entry.consumers.includes(component)) {
      entry.consumers.push(component);
    }
    this.catalog.upsert(entry);
  }

  private createMinimalEntry(eventName: string): EventCatalogEntry {
    return {
      name: eventName,
      category: 'System Events',
      version: '1.0.0',
      producers: [],
      consumers: [],
      essReferences: [],
      adrReferences: [],
      status: 'proposed',
    };
  }

  getCatalogEntry(eventName: string): EventCatalogEntry | undefined {
    return this.catalog.get(eventName);
  }

  getFullCatalog(): EventCatalogEntry[] {
    return this.catalog.all();
  }

  isAuthorizedProducer(eventName: string, component: string): boolean {
    return this.producers.isAuthorized(eventName, component);
  }

  declaredConsumersOf(eventName: string): string[] {
    return Array.from(this.declaredConsumers.get(eventName) ?? []);
  }
}
