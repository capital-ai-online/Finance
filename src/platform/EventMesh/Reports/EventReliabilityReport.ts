import type { EventDeliveryRecord } from '../Models/EventDeliveryRecord';

export interface EventFailureEvidence {
  eventId: string;
  eventName: string;
  correlationId: string;
  consumer: string;
  reason: string;
}

export interface EventReliabilityReport {
  total: number;
  delivered: number;
  failed: number;
  noConsumers: number;
  failureRate: number;
  failedEventNames: string[];
  failingConsumers: string[];
  poisonCandidates: string[];
  failureEvidence: EventFailureEvidence[];
}

export function buildEventReliabilityReport(
  records: readonly EventDeliveryRecord[],
  poisonFailureThreshold = 3,
): EventReliabilityReport {
  if (!Number.isInteger(poisonFailureThreshold) || poisonFailureThreshold < 1) {
    throw new Error('[EventReliabilityReport] poisonFailureThreshold must be a positive integer.');
  }

  const failureCountByEvent = new Map<string, number>();
  const failingConsumers = new Set<string>();
  const failureEvidence: EventFailureEvidence[] = [];
  let delivered = 0;
  let failed = 0;
  let noConsumers = 0;

  for (const record of records) {
    if (record.status === 'delivered') delivered += 1;
    if (record.status === 'no_consumers') noConsumers += 1;
    if (record.status === 'failed') {
      failed += 1;
      failureCountByEvent.set(record.eventName, (failureCountByEvent.get(record.eventName) ?? 0) + 1);
      for (const failure of record.failures) {
        failingConsumers.add(failure.consumer);
        failureEvidence.push({
          eventId: record.eventId,
          eventName: record.eventName,
          correlationId: record.correlationId,
          consumer: failure.consumer,
          reason: failure.reason,
        });
      }
    }
  }

  const failedEventNames = [...failureCountByEvent.keys()].sort();
  const poisonCandidates = [...failureCountByEvent.entries()]
    .filter(([, count]) => count >= poisonFailureThreshold)
    .map(([eventName]) => eventName)
    .sort();

  failureEvidence.sort((a, b) => `${a.eventName}|${a.eventId}|${a.consumer}`.localeCompare(`${b.eventName}|${b.eventId}|${b.consumer}`));

  return Object.freeze({
    total: records.length,
    delivered,
    failed,
    noConsumers,
    failureRate: records.length === 0 ? 0 : failed / records.length,
    failedEventNames,
    failingConsumers: [...failingConsumers].sort(),
    poisonCandidates,
    failureEvidence,
  });
}
