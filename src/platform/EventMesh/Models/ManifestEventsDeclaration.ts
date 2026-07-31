// ESS-0013-CONTRACTS Abschnitt 6, Discovery Contract — Modell des `events`-Felds, wie
// es in jeder Komponenten-manifest.json gefuehrt wird (siehe z. B.
// src/platform/Traceability/manifest.json).

export interface ManifestEventsDeclaration {
  produces: string[];
  consumes: string[];
  note?: string;
  routes?: string[];
}

export interface DiscoveredComponent {
  component: string;
  manifestPath: string;
  events: ManifestEventsDeclaration;
}
