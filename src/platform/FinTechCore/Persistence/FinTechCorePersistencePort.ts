import type {
  FinTechCoreDecisionRecord,
  FinTechCoreDomainEvent,
  FinTechCoreOrderIntent,
  FinTechCoreWorkflowContext,
} from '../CoreContracts';
import type { FinTechCoreWorkflowState } from '../Runtime/WorkflowStateMachine';

/**
 * FT-3 storage-agnostic durability boundary.
 *
 * The FinTechCore domain owns the data contract, but not a concrete database client. Server-side
 * adapters implement this port and must preserve the authority boundaries from ADR-0099: durable
 * evidence is not a scoring, risk, compliance, IAM or execution authority.
 */
export interface FinTechCoreWorkflowRunPersistenceInput {
  readonly context: FinTechCoreWorkflowContext;
  readonly state: FinTechCoreWorkflowState;
  readonly evidenceRefs?: readonly string[];
}

export interface FinTechCoreWorkflowTransitionPersistenceInput {
  readonly previousState: FinTechCoreWorkflowState;
  readonly nextState: FinTechCoreWorkflowState;
}

export interface FinTechCoreOrderIntentPersistenceInput {
  readonly intent: FinTechCoreOrderIntent;
  readonly evidenceRefs?: readonly string[];
}

export interface FinTechCorePersistencePort {
  createWorkflowRun(input: FinTechCoreWorkflowRunPersistenceInput): Promise<void>;
  persistWorkflowTransition(input: FinTechCoreWorkflowTransitionPersistenceInput): Promise<void>;
  appendDomainEvent(event: FinTechCoreDomainEvent): Promise<void>;
  appendDecisionRecord(record: FinTechCoreDecisionRecord): Promise<void>;
  appendOrderIntent(input: FinTechCoreOrderIntentPersistenceInput): Promise<void>;
}

/**
 * Read-only replay boundary introduced by FT-4. Implementations may return domain events from a
 * private durable journal, but this port grants no mutation, execution or browser-access authority.
 */
export interface FinTechCoreDomainEventReaderPort {
  listDomainEvents(runId: string): Promise<readonly FinTechCoreDomainEvent[]>;
}
