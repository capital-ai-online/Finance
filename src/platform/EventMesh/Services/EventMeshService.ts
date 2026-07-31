// ESS-0013, Services — orchestriert Registrierung, Discovery und Bootstrap des
// EventBus als ausfuehrbare Abfolge (README.md, Struktur-Tabelle "Services").

import { eventMeshBus } from '../Core/EventBus';
import { STANDARD_EVENT_CATALOG } from '../Events/StandardEventCatalog';
import { discoverComponents } from '../Discovery/ManifestDiscovery';
import type { IEventBus } from '../Interfaces/IEventBus';

let bootstrapped = false;

/**
 * Seedet den Katalog aus STANDARD_EVENT_CATALOG und registriert anschliessend alle
 * ueber ManifestDiscovery gefundenen Producer/Consumer. Idempotent - ein
 * zweiter Aufruf wiederholt Discovery (Manifeste koennen sich geaendert haben),
 * seedet den Katalog aber nicht doppelt inkonsistent (registerEvent() merged).
 */
export function bootstrapEventMesh(bus: IEventBus = eventMeshBus): IEventBus {
  for (const definition of STANDARD_EVENT_CATALOG) {
    bus.registry.registerEvent({
      name: definition.name,
      category: definition.category,
      version: '1.0.0',
      producers: [],
      consumers: [],
      essReferences: definition.essReferences,
      adrReferences: definition.adrReferences,
    });
  }

  for (const component of discoverComponents()) {
    for (const eventName of component.events.produces) {
      bus.registry.registerProducer(eventName, component.component);
    }
    for (const eventName of component.events.consumes) {
      bus.registry.registerConsumer(eventName, component.component);
    }
  }

  bootstrapped = true;
  return bus;
}

export function isBootstrapped(): boolean {
  return bootstrapped;
}
