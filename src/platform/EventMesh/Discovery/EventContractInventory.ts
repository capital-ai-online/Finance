import type { StandardEventDefinition } from '../Events/StandardEventCatalog';
import { STANDARD_EVENT_CATALOG } from '../Events/StandardEventCatalog';
import type { DiscoveredComponent } from '../Models/ManifestEventsDeclaration';
import { discoverComponents } from './ManifestDiscovery';

export type EventInventoryGap = 'NO_PRODUCER' | 'NO_CONSUMER' | 'NO_AUTHORITY' | 'UNREGISTERED_EVENT';

export interface EventContractInventoryEntry {
  name: string;
  category: string;
  essReferences: string[];
  adrReferences: string[];
  producers: string[];
  consumers: string[];
  gaps: EventInventoryGap[];
}

export interface EventContractInventoryReport {
  generatedFrom: 'STANDARD_EVENT_CATALOG_AND_PLATFORM_MANIFESTS';
  events: EventContractInventoryEntry[];
  gapCount: number;
}

export function buildEventContractInventory(
  definitions: StandardEventDefinition[] = STANDARD_EVENT_CATALOG,
  components: DiscoveredComponent[] = discoverComponents()
): EventContractInventoryReport {
  const catalog = new Map(definitions.map((definition) => [definition.name, definition]));
  const names = new Set(definitions.map((definition) => definition.name));

  for (const component of components) {
    for (const name of [...component.events.produces, ...component.events.consumes]) names.add(name);
  }

  const events = [...names].sort().map((name): EventContractInventoryEntry => {
    const definition = catalog.get(name);
    const producers = components.filter((component) => component.events.produces.includes(name)).map((component) => component.component).sort();
    const consumers = components.filter((component) => component.events.consumes.includes(name)).map((component) => component.component).sort();
    const gaps: EventInventoryGap[] = [];

    if (!definition) gaps.push('UNREGISTERED_EVENT');
    if (!definition?.essReferences.length) gaps.push('NO_AUTHORITY');
    if (producers.length === 0) gaps.push('NO_PRODUCER');
    if (consumers.length === 0) gaps.push('NO_CONSUMER');

    return {
      name,
      category: definition?.category ?? 'Unregistered',
      essReferences: [...(definition?.essReferences ?? [])],
      adrReferences: [...(definition?.adrReferences ?? [])],
      producers,
      consumers,
      gaps,
    };
  });

  return {
    generatedFrom: 'STANDARD_EVENT_CATALOG_AND_PLATFORM_MANIFESTS',
    events,
    gapCount: events.reduce((sum, event) => sum + event.gaps.length, 0),
  };
}
