// ESS-0013-CONTRACTS Abschnitt 8 — EventHealthReport: Fehlerrate, mittlere
// Zustellzeit, unzustellbare Events der letzten Periode.

import type { EventDeliveryRecord } from '../Models/EventDeliveryRecord';

export interface EventHealthReport {
  totalEvents: number;
  failedEvents: number;
  noConsumerEvents: number;
  errorRatePercent: number;
  undeliverable: { eventName: string; eventId: string; reason: string }[];
}

export function buildEventHealthReport(records: EventDeliveryRecord[]): EventHealthReport {
  const failedEvents = records.filter((r) => r.status === 'failed');
  const noConsumerEvents = records.filter((r) => r.status === 'no_consumers');

  const undeliverable = failedEvents.flatMap((r) =>
    r.failures.map((f) => ({ eventName: r.eventName, eventId: r.eventId, reason: `${f.consumer}: ${f.reason}` }))
  );

  return {
    totalEvents: records.length,
    failedEvents: failedEvents.length,
    noConsumerEvents: noConsumerEvents.length,
    errorRatePercent: records.length === 0 ? 0 : Math.round((failedEvents.length / records.length) * 100),
    undeliverable,
  };
}
