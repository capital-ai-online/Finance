// ESS-0001-CONTRACTS Chapter 8, "Event Audit Trail" — Timestamp, Komponente, Event,
// Version, Correlation ID, Status, Ergebnis.

export type DeliveryStatus = 'delivered' | 'failed' | 'no_consumers';

export interface EventDeliveryRecord {
  eventId: string;
  eventName: string;
  version: string;
  correlationId: string;
  sourceComponent: string;
  timestamp: string;
  status: DeliveryStatus;
  deliveredTo: string[];
  failures: { consumer: string; reason: string }[];
}
