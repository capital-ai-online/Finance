// ESS-0013-CONTRACTS Abschnitt 8 — EventDependencyReport: aus Fluessen abgeleitete
// Komponentenpaare, absteigend nach Haeufigkeit.

import type { EventFlowEntry } from './EventFlowReport';

export interface ComponentDependency {
  from: string;
  to: string;
  eventCount: number;
  events: string[];
}

export function buildEventDependencyReport(flows: EventFlowEntry[]): ComponentDependency[] {
  const key = (from: string, to: string) => `${from}::${to}`;
  const dependencies = new Map<string, ComponentDependency>();

  for (const flow of flows) {
    const k = key(flow.producer, flow.consumer);
    const existing = dependencies.get(k);
    if (existing) {
      existing.eventCount += flow.count;
      if (!existing.events.includes(flow.eventName)) existing.events.push(flow.eventName);
    } else {
      dependencies.set(k, {
        from: flow.producer,
        to: flow.consumer,
        eventCount: flow.count,
        events: [flow.eventName],
      });
    }
  }

  return Array.from(dependencies.values()).sort((a, b) => b.eventCount - a.eventCount);
}
