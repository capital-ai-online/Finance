// ESS-0001-CONTRACTS Chapter 8, "Event Contract" — Pflichtfelder Name, Event ID,
// Timestamp, Source Component, Target Component, Correlation ID, ESS-/ADR-Referenzen.
// Ergaenzt um die ETM-Referenz aus ESS-0013-CONTRACTS Abschnitt 9.

export interface EventMetadata {
  /** Eindeutige Event-ID je Veroeffentlichung (nicht der Event-Typname). */
  eventId: string;
  /** Event-Typname, endet verbindlich auf "Event" (Chapter 8, Event Naming). */
  name: string;
  timestamp: string;
  sourceComponent: string;
  targetComponent?: string;
  /** Verknuepft zusammengehoerige Events (Chapter 8, Correlation Contract). */
  correlationId: string;
  essReferences: string[];
  adrReferences: string[];
  /**
   * ETM-Referenz: mindestens ein Interface und eine Komponente (ESS-0011
   * Traceability-Achsen). Fehlt sie, bleibt das Event im Registry-Status "proposed".
   */
  etmReferences?: {
    interfaces: string[];
    components: string[];
  };
}

export function isEventMetadataComplete(metadata: Partial<EventMetadata>): metadata is EventMetadata {
  return Boolean(
    metadata.eventId &&
    metadata.name &&
    metadata.name.endsWith('Event') &&
    metadata.timestamp &&
    metadata.sourceComponent &&
    metadata.correlationId &&
    metadata.essReferences &&
    metadata.essReferences.length > 0 &&
    metadata.adrReferences
  );
}
