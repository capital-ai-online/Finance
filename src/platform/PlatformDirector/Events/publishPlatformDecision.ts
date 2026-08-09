import type { IEventBus } from '../../EventMesh/Interfaces/IEventBus';
import type { PlatformDecisionRecord } from '../Contracts/PlatformDecision';

export interface PlatformDecisionEventPayload {
  decisionId: string;
  type: PlatformDecisionRecord['type'];
  subject: string;
  status: PlatformDecisionRecord['status'];
  affectedComponents: string[];
  affectedContracts: string[];
  version: string;
  decidedAt: string;
  decidedBy: PlatformDecisionRecord['decidedBy'];
  reasons: string[];
  immutableSequence: number;
}

/**
 * Publishes the canonical PlatformDecisionEvent only for an explicitly approved,
 * immutable Platform Director decision record. This bridge never creates or
 * auto-approves a decision; it only propagates an existing approval through the
 * Enterprise Event Mesh.
 */
export function publishApprovedPlatformDecision(
  bus: IEventBus,
  decision: PlatformDecisionRecord,
): void {
  if (decision.status !== 'APPROVED') {
    throw new Error(`Platform decision ${decision.decisionId} is not approved.`);
  }

  if (!decision.correlationId.trim()) {
    throw new Error(`Platform decision ${decision.decisionId} requires a correlationId.`);
  }

  bus.publish<PlatformDecisionEventPayload>(
    'PlatformDecisionEvent',
    {
      decisionId: decision.decisionId,
      type: decision.type,
      subject: decision.subject,
      status: decision.status,
      affectedComponents: [...decision.affectedComponents],
      affectedContracts: [...decision.affectedContracts],
      version: decision.version,
      decidedAt: decision.decidedAt,
      decidedBy: decision.decidedBy,
      reasons: [...decision.reasons],
      immutableSequence: decision.immutableSequence,
    },
    {
      sourceComponent: 'PlatformDirector',
      correlationId: decision.correlationId,
      essReferences: ['ESS-0003', 'ESS-0013', 'ESS-0017'],
      adrReferences: ['ADR-0018'],
    },
  );
}
