// ESS-0013-CONTRACTS Abschnitt 8 — EventCoverageReport: Komponenten ohne
// Producer-Eintrag, Komponenten ohne Consumer-Eintrag, Events ohne Consumer.

import type { EventCatalogEntry } from '../Interfaces/IEventRegistry';
import type { DiscoveredComponent } from '../Models/ManifestEventsDeclaration';

export interface EventCoverageReport {
  totalComponents: number;
  componentsWithoutProducer: string[];
  componentsWithoutConsumer: string[];
  eventsWithoutConsumer: string[];
  eventsWithoutProducer: string[];
  coveragePercent: number;
}

export function buildEventCoverageReport(
  components: DiscoveredComponent[],
  catalog: EventCatalogEntry[]
): EventCoverageReport {
  const componentsWithoutProducer = components
    .filter((c) => c.events.produces.length === 0)
    .map((c) => c.component);
  const componentsWithoutConsumer = components
    .filter((c) => c.events.consumes.length === 0)
    .map((c) => c.component);
  const eventsWithoutConsumer = catalog.filter((e) => e.consumers.length === 0).map((e) => e.name);
  const eventsWithoutProducer = catalog.filter((e) => e.producers.length === 0).map((e) => e.name);

  const covered = components.filter(
    (c) => c.events.produces.length > 0 || c.events.consumes.length > 0
  ).length;

  return {
    totalComponents: components.length,
    componentsWithoutProducer,
    componentsWithoutConsumer,
    eventsWithoutConsumer,
    eventsWithoutProducer,
    coveragePercent: components.length === 0 ? 0 : Math.round((covered / components.length) * 100),
  };
}
