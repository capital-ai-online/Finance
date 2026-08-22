import type {
  FinTechCoreDecisionRecord,
  FinTechCoreDomainEvent,
  FinTechCoreOrderIntent,
  FinTechCoreWorkflowContext,
} from '../CoreContracts';
import type { FinTechCoreReconciliationRecord } from '../Reconciliation/ReconciliationContracts';
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

/** Single persistence input for the single canonical FinTechCoreOrderIntent contract. */
export interface FinTechCoreOrderIntentPersistenceInput {
  readonly intent: FinTechCoreOrderIntent;
  readonly evidenceRefs?: readonly string[];
}

export interface FinTechCorePersistencePort {
  createWorkflowRun(input: FinTechCoreWorkflowRunPersistenceInput): Promise<void>;
  persistWorkflowTransition(input: FinTechCoreWorkflowTransitionPersistenceInput): Promise<void>;
  appendDomainEvent(event: FinTechCoreDomainEvent): Promise<void>;
  appendDecisionRecord(record: FinTechCoreDecisionRecord): Promise<void>;
  /**
   * Persists UNBOUND legacy evidence or a canonical FT-6 BOUND intent through the same port.
   * Concrete adapters select the versioned RPC but gain no execution capability.
   */
  appendOrderIntent(input: FinTechCoreOrderIntentPersistenceInput): Promise<void>;
  /** FT-6 append-only typed reconciliation evidence. */
  appendReconciliationRecord(record: FinTechCoreReconciliationRecord): Promise<void>;
}

/**
 * Read-only replay boundary introduced by FT-4. Implementations may return domain events from a
 * private durable journal, but this port grants no mutation, execution or browser-access authority.
 */
export interface FinTechCoreDomainEventReaderPort {
  listDomainEvents(runId: string): Promise<readonly FinTechCoreDomainEvent[]>;
}
