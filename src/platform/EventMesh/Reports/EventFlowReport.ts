// ESS-0013-CONTRACTS Abschnitt 8 — EventFlowReport: Zeitraum, Producer, Consumer,
// Event-Anzahl je Paar.

import type { EventDeliveryRecord } from '../Models/EventDeliveryRecord';

export interface EventFlowEntry {
  producer: string;
  consumer: string;
  eventName: string;
  count: number;
}

export interface EventFlowReport {
  periodStart: string;
  periodEnd: string;
  flows: EventFlowEntry[];
}

export function buildEventFlowReport(records: EventDeliveryRecord[]): EventFlowReport {
  if (records.length === 0) {
    const now = new Date().toISOString();
    return { periodStart: now, periodEnd: now, flows: [] };
  }

  const key = (producer: string, consumer: string, eventName: string) => `${producer}::${consumer}::${eventName}`;
  const counts = new Map<string, EventFlowEntry>();

  for (const record of records) {
    for (const consumer of record.deliveredTo) {
      const k = key(record.sourceComponent, consumer, record.eventName);
      const existing = counts.get(k);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(k, { producer: record.sourceComponent, consumer, eventName: record.eventName, count: 1 });
      }
    }
  }

  const timestamps = records.map((r) => r.timestamp).sort();
  return {
    periodStart: timestamps[0],
    periodEnd: timestamps[timestamps.length - 1],
    flows: Array.from(counts.values()).sort((a, b) => b.count - a.count),
  };
}
