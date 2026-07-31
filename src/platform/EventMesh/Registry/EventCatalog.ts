// ESS-0013, Registry "EventCatalog" — konsolidierte, lesbare Sicht aus
// EventRegistry, ProducerRegistry und ConsumerRegistry.
// ESS-0013-CONTRACTS Abschnitt 3: wird ausschliesslich generiert, nie manuell gepflegt.

import type { EventCatalogEntry } from '../Interfaces/IEventRegistry';

export class EventCatalog {
  private readonly entries = new Map<string, EventCatalogEntry>();

  upsert(entry: EventCatalogEntry): void {
    this.entries.set(entry.name, entry);
  }

  get(name: string): EventCatalogEntry | undefined {
    return this.entries.get(name);
  }

  has(name: string): boolean {
    return this.entries.has(name);
  }

  all(): EventCatalogEntry[] {
    return Array.from(this.entries.values());
  }

  /** ESS-0013-CONTRACTS Abschnitt 1: bedeutungsgleiche Kollisionen verhindern. */
  findByCategory(category: string): EventCatalogEntry[] {
    return this.all().filter((entry) => entry.category === category);
  }
}
