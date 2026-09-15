import { describe, expect, it } from 'vitest';
import type { EventContract } from '../../src/platform/EventMesh/Contracts/EventContract';
import type { EventMetadata } from '../../src/platform/EventMesh/Contracts/EventMetadata';
import { EventBus } from '../../src/platform/EventMesh/Core/EventBus';
import { projectOperationalTraceStateRecord } from '../../src/platform/Traceability/Services/OperationalTraceStateProjection';
import {
  buildPublishedTraceabilityEventOperationalSource,
  classifyTraceabilityEventFreshness,
} from '../../src/platform/Traceability/Services/TraceabilityEventOperationalSource';

const RUN_ID = '2026-09-15T17:39:59.000Z';

function traceEvent(overrides: Partial<EventMetadata> = {}): EventContract {
  return {
    metadata: {
      eventId: 'event:traceability:1',
      name: 'TraceabilityBuildCompletedEvent',
      timestamp: '2026-09-15T17:40:00.000Z',
      sourceComponent: 'src/platform/Traceability',
      correlationId: RUN_ID,
      essReferences: ['ESS-0011'],
      adrReferences: ['ADR-0015', 'ADR-0018'],
      ...overrides,
    },
    version: { major: 1, minor: 0, patch: 0 },
    payload: { runId: RUN_ID },
  };
}

function publishTraceEvent(): EventContract {
  const bus = new EventBus();
  bus.registry.registerEvent({
    name: 'TraceabilityBuildCompletedEvent',
    category: 'Traceability Events',
    version: '1.0.0',
    producers: [],
    consumers: [],
    essReferences: ['ESS-0011'],
    adrReferences: ['ADR-0015', 'ADR-0018'],
  });
  return bus.publish(
    'TraceabilityBuildCompletedEvent',
    { runId: RUN_ID },
    {
      sourceComponent: 'src/platform/Traceability',
      correlationId: RUN_ID,
      essReferences: ['ESS-0011'],
      adrReferences: ['ADR-0015', 'ADR-0018'],
    },
  );
}

describe('Traceability EventMesh operational source binding', () => {
  it('binds the actual EventBus publisher return into one strict operational record', () => {
    const published = publishTraceEvent();
    const source = buildPublishedTraceabilityEventOperationalSource(
      published,
      published.metadata.timestamp,
    );
    const projected = projectOperationalTraceStateRecord(source);

    expect(source.identity).toEqual({
      projectId: 'CAPITAL-AI-OPS',
      pvcId: 'PVC-18',
      statusId: published.metadata.eventId,
    });
    expect(source.evidence).toEqual([{
      ref: published.metadata.eventId,
      kind: 'trace',
      label: 'TraceabilityBuildCompletedEvent',
      identityRef: published.metadata.eventId,
      correlationId: RUN_ID,
    }]);
    expect(source.trace?.correlationId).toBe(RUN_ID);
    expect(source.provenance.sourceTimestamp).toBe(published.metadata.timestamp);
    expect(source.provenance.freshness).toBe('FRESH');
    expect(projected.state).toBe('CURRENT');
    expect(projected.validation).toBe('PASS');
    expect(projected.failsClosed).toBe(false);
  });

  it('fails closed when the published event is stale at observation time', () => {
    const source = buildPublishedTraceabilityEventOperationalSource(
      traceEvent({ timestamp: '2026-09-15T17:38:00.000Z' }),
      '2026-09-15T17:40:01.000Z',
    );
    const projected = projectOperationalTraceStateRecord(source);

    expect(source.provenance.freshness).toBe('STALE');
    expect(projected.state).toBe('UNKNOWN');
    expect(projected.validation).toBe('UNKNOWN');
    expect(projected.failsClosed).toBe(true);
  });

  it('classifies invalid or future timestamps as UNKNOWN rather than fabricating freshness', () => {
    expect(classifyTraceabilityEventFreshness('invalid', '2026-09-15T17:40:01.000Z')).toBe('UNKNOWN');
    expect(classifyTraceabilityEventFreshness(
      '2026-09-15T17:41:00.000Z',
      '2026-09-15T17:40:01.000Z',
    )).toBe('UNKNOWN');
  });

  it('rejects foreign EventMesh source components instead of assigning OPS/PVC-18 identity', () => {
    expect(() => buildPublishedTraceabilityEventOperationalSource(
      traceEvent({ sourceComponent: 'src/platform/MarketData' }),
      '2026-09-15T17:40:01.000Z',
    )).toThrow('Unexpected trace source component');
  });
});
