import { describe, expect, it } from 'vitest';
import { EventBus } from '../../src/platform/EventMesh/Core/EventBus';
import type { PlatformDecisionRecord } from '../../src/platform/PlatformDirector/Contracts/PlatformDecision';
import { publishApprovedPlatformDecision } from '../../src/platform/PlatformDirector/Events/publishPlatformDecision';

function createDecision(status: PlatformDecisionRecord['status'] = 'APPROVED'): PlatformDecisionRecord {
  return {
    decisionId: 'DEC-TEST-0001',
    title: 'Vocabulary lifecycle propagation',
    type: 'Governance Decision',
    subject: 'Phase 5 value chain',
    alternatives: ['defer'],
    rationale: 'Verified governance propagation test.',
    affectedComponents: ['Vocabulary', 'Documentary'],
    affectedContracts: ['ESS-0017-CONTRACTS'],
    version: '1.0.0',
    correlationId: 'corr-phase-5-test',
    requestedBy: 'Supervisor',
    prerequisites: {
      decisionBasis: [
        {
          evidenceId: 'EVIDENCE-TEST-0001',
          source: 'unit-test',
          observedAt: '2026-08-10T00:00:00.000Z',
        },
      ],
    },
    status,
    decidedAt: '2026-08-10T00:01:00.000Z',
    decidedBy: 'Platform Director',
    reasons: ['Approved for deterministic propagation.'],
    immutableSequence: 1,
  };
}

function createBus(): EventBus {
  const bus = new EventBus();
  bus.registry.registerEvent({
    name: 'PlatformDecisionEvent',
    category: 'Platform Director Events',
    version: '1.0.0',
    producers: ['PlatformDirector'],
    consumers: [],
    essReferences: ['ESS-0003', 'ESS-0013'],
    adrReferences: ['ADR-0018'],
  });
  return bus;
}

describe('publishApprovedPlatformDecision', () => {
  it('publishes an approved decision with the original correlation id', () => {
    const bus = createBus();
    let receivedCorrelationId: string | undefined;
    let receivedDecisionId: unknown;

    bus.subscribe('PlatformDecisionEvent', 'Phase5TestConsumer', (event) => {
      receivedCorrelationId = event.metadata.correlationId;
      receivedDecisionId = event.payload.decisionId;
    });

    publishApprovedPlatformDecision(bus, createDecision());

    expect(receivedCorrelationId).toBe('corr-phase-5-test');
    expect(receivedDecisionId).toBe('DEC-TEST-0001');
  });

  it('fails closed for a non-approved decision', () => {
    expect(() => publishApprovedPlatformDecision(createBus(), createDecision('REJECTED')))
      .toThrow('is not approved');
  });

  it('fails closed without a correlation id', () => {
    const decision = createDecision();
    decision.correlationId = '   ';

    expect(() => publishApprovedPlatformDecision(createBus(), decision))
      .toThrow('requires a correlationId');
  });
});
