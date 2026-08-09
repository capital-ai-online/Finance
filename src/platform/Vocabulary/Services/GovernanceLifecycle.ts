import type { VocabularyConcept } from '../Domain/VocabularyConcept';

export type GovernanceLifecycleType = 'CONCEPT_REGISTERED' | 'CONCEPT_REJECTED';

export interface GovernanceLifecycleEvent {
  type: GovernanceLifecycleType;
  conceptId: string;
  canonicalCodeTerm: string;
  status: VocabularyConcept['status'];
  occurredAt: string;
  authorityReferences: string[];
  traceabilityReferences: string[];
  reason?: string;
}

export interface GovernanceLifecycleSink {
  publish(event: GovernanceLifecycleEvent): void;
}

export class InMemoryGovernanceLifecycleSink implements GovernanceLifecycleSink {
  private readonly events: GovernanceLifecycleEvent[] = [];

  publish(event: GovernanceLifecycleEvent): void {
    this.events.push(Object.freeze({
      ...event,
      authorityReferences: Object.freeze([...event.authorityReferences]) as unknown as string[],
      traceabilityReferences: Object.freeze([...event.traceabilityReferences]) as unknown as string[],
    }));
  }

  list(): GovernanceLifecycleEvent[] {
    return [...this.events];
  }
}
