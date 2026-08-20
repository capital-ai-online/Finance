import {
  FINTECH_CORE_CONTRACT_VERSION,
  type FinTechCoreWorkflowContext,
  type FinTechCoreWorkflowStatus,
} from '../CoreContracts';

export const FINTECH_CORE_WORKFLOW_STATE_MACHINE_VERSION =
  'fintech-core/workflow-state-machine/0.1.0' as const;

export interface FinTechCoreWorkflowState {
  readonly contractVersion: typeof FINTECH_CORE_CONTRACT_VERSION;
  readonly stateMachineVersion: typeof FINTECH_CORE_WORKFLOW_STATE_MACHINE_VERSION;
  readonly moduleId: string;
  readonly runId: string;
  readonly status: FinTechCoreWorkflowStatus;
  readonly sequence: number;
  readonly previousStatus?: FinTechCoreWorkflowStatus;
  readonly updatedAt: string;
}

export type FinTechCoreWorkflowTransitionResult =
  | {
      readonly status: 'TRANSITIONED';
      readonly state: FinTechCoreWorkflowState;
    }
  | {
      readonly status: 'TRANSITION_REJECTED';
      readonly state: FinTechCoreWorkflowState;
      readonly reason: string;
    };

const ALLOWED_TRANSITIONS: Readonly<Record<FinTechCoreWorkflowStatus, readonly FinTechCoreWorkflowStatus[]>> =
  Object.freeze({
    CREATED: Object.freeze(['RUNNING', 'REJECTED', 'FAILED', 'EMERGENCY_STOPPED']),
    RUNNING: Object.freeze(['WAITING_FOR_APPROVAL', 'COMPLETED', 'REJECTED', 'FAILED', 'EMERGENCY_STOPPED']),
    WAITING_FOR_APPROVAL: Object.freeze(['RUNNING', 'REJECTED', 'FAILED', 'EMERGENCY_STOPPED']),
    COMPLETED: Object.freeze([]),
    REJECTED: Object.freeze([]),
    FAILED: Object.freeze([]),
    EMERGENCY_STOPPED: Object.freeze([]),
  });

export function getAllowedFinTechCoreTransitions(
  from: FinTechCoreWorkflowStatus,
): readonly FinTechCoreWorkflowStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

export function createInitialFinTechCoreWorkflowState(
  context: FinTechCoreWorkflowContext,
): FinTechCoreWorkflowState {
  return Object.freeze({
    contractVersion: FINTECH_CORE_CONTRACT_VERSION,
    stateMachineVersion: FINTECH_CORE_WORKFLOW_STATE_MACHINE_VERSION,
    moduleId: context.moduleId,
    runId: context.runId,
    status: 'CREATED',
    sequence: 0,
    updatedAt: context.startedAt,
  });
}

/**
 * Deterministic transition function. The caller supplies the timestamp so replay does not depend
 * on wall-clock reads inside the state machine. Terminal states cannot be reopened; a retry/replay
 * after FAILED/REJECTED/EMERGENCY_STOPPED must start a new run with its own runId.
 */
export function transitionFinTechCoreWorkflow(
  state: FinTechCoreWorkflowState,
  target: FinTechCoreWorkflowStatus,
  occurredAt: string,
): FinTechCoreWorkflowTransitionResult {
  const allowed = ALLOWED_TRANSITIONS[state.status];
  if (!allowed.includes(target)) {
    return {
      status: 'TRANSITION_REJECTED',
      state,
      reason: `Transition ${state.status} -> ${target} is not permitted by ${FINTECH_CORE_WORKFLOW_STATE_MACHINE_VERSION}.`,
    };
  }

  if (!occurredAt.trim()) {
    return {
      status: 'TRANSITION_REJECTED',
      state,
      reason: 'Transition timestamp is required.',
    };
  }

  return {
    status: 'TRANSITIONED',
    state: Object.freeze({
      contractVersion: FINTECH_CORE_CONTRACT_VERSION,
      stateMachineVersion: FINTECH_CORE_WORKFLOW_STATE_MACHINE_VERSION,
      moduleId: state.moduleId,
      runId: state.runId,
      status: target,
      sequence: state.sequence + 1,
      previousStatus: state.status,
      updatedAt: occurredAt,
    }),
  };
}
