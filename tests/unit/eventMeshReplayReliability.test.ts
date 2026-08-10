import { describe, expect, it } from 'vitest';
import type { EventContract } from '../../src/platform/EventMesh/Contracts/EventContract';
import { EventReplayGuard } from '../../src/platform/EventMesh/Policies/EventReplayGuard';
import { buildEventReliabilityReport } from '../../src/platform/EventMesh/Reports/EventReliabilityReport';
import type { EventDeliveryRecord } from '../../src/platform/EventMesh/Models/EventDeliveryRecord';

function event(eventId: string, correlationId: string, timestamp: string): EventContract {
  return {
    metadata: {
      eventId,
      name: 'DocumentationGeneratedEvent',
      timestamp,
      sourceComponent: 'Documentary',
      correlationId,
      essReferences: ['ESS-0013'],
      adrReferences: ['ADR-0018'],
    },
    version: { major: 1, minor: 0, patch: 0 },
    payload: {},
  };
}

function delivery(overrides: Partial<EventDeliveryRecord> = {}): EventDeliveryRecord {
  return {
    eventId: 'evt-1',
    eventName: 'DocumentationGeneratedEvent',
    version: '1.0.0',
    correlationId: 'corr-1',
    sourceComponent: 'Documentary',
    timestamp: '2026-08-10T07:00:00.000Z',
    status: 'delivered',
    deliveredTo: ['Traceability'],
    failures: [],
    ...overrides,
  };
}

describe('EventMesh E2 replay guard', () => {
  it('processes first delivery and deduplicates deliberate replay by eventId', () => {
    const guard = new EventReplayGuard();
    const original = event('evt-1', 'corr-1', '2026-08-10T07:00:00.000Z');
    expect(guard.evaluate(original).decision).toBe('process');
    const replay = guard.evaluate(original);
    expect(replay.decision).toBe('duplicate');
    expect(replay.idempotencyKey).toBe('evt-1');
  });

  it('rejects a late event only inside the same correlation ordering boundary', () => {
    const guard = new EventReplayGuard();
    expect(guard.evaluate(event('evt-new', 'corr-1', '2026-08-10T07:05:00.000Z')).decision).toBe('process');
    expect(guard.evaluate(event('evt-old', 'corr-1', '2026-08-10T07:01:00.000Z')).decision).toBe('stale');
    expect(guard.evaluate(event('evt-other', 'corr-2', '2026-08-10T07:01:00.000Z')).decision).toBe('process');
  });
});

describe('EventMesh E5 reliability evidence', () => {
  it('reports failures, consumer health evidence and poison candidates deterministically', () => {
    const records: EventDeliveryRecord[] = [
      delivery(),
      delivery({ eventId: 'evt-2', status: 'failed', deliveredTo: [], failures: [{ consumer: 'Knowledge', reason: 'timeout' }] }),
      delivery({ eventId: 'evt-3', status: 'failed', deliveredTo: [], failures: [{ consumer: 'Knowledge', reason: 'timeout' }] }),
      delivery({ eventId: 'evt-4', status: 'failed', deliveredTo: [], failures: [{ consumer: 'Documentary', reason: 'validation' }] }),
      delivery({ eventId: 'evt-5', eventName: 'PlatformDecisionEvent', status: 'no_consumers', deliveredTo: [], failures: [] }),
    ];
    const report = buildEventReliabilityReport(records, 3);
    expect(report.total).toBe(5);
    expect(report.failed).toBe(3);
    expect(report.noConsumers).toBe(1);
    expect(report.failureRate).toBe(0.6);
    expect(report.failingConsumers).toEqual(['Documentary', 'Knowledge']);
    expect(report.poisonCandidates).toEqual(['DocumentationGeneratedEvent']);
    expect(report.failureEvidence).toHaveLength(3);
  });

  it('rejects invalid poison thresholds', () => {
    expect(() => buildEventReliabilityReport([], 0)).toThrow(/positive integer/);
  });
});
