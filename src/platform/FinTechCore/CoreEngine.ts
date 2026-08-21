import type { FinTechCoreWorkflowContext } from './CoreContracts';
import {
  FinTechCoreModuleRegistry,
  type FinTechCoreModuleResolution,
} from './CoreModuleRegistry';
import {
  createInitialFinTechCoreWorkflowState,
  transitionFinTechCoreWorkflow,
  type FinTechCoreWorkflowState,
} from './Runtime/WorkflowStateMachine';

export const FINTECH_CORE_ENGINE_VERSION = 'fintech-core/engine/0.1.0' as const;

export type FinTechCoreWorkflowPreparation =
  | {
      readonly status: 'PREPARED';
      readonly engineVersion: typeof FINTECH_CORE_ENGINE_VERSION;
      readonly moduleResolution: Extract<FinTechCoreModuleResolution, { status: 'RESOLVED' }>;
      readonly state: FinTechCoreWorkflowState;
    }
  | {
      readonly status: 'WORKFLOW_NOT_AVAILABLE';
      readonly engineVersion: typeof FINTECH_CORE_ENGINE_VERSION;
      readonly reason: string;
    };

export type FinTechCoreWorkflowStart =
  | {
      readonly status: 'STARTED';
      readonly engineVersion: typeof FINTECH_CORE_ENGINE_VERSION;
      readonly state: FinTechCoreWorkflowState;
    }
  | {
      readonly status: 'WORKFLOW_NOT_AVAILABLE';
      readonly engineVersion: typeof FINTECH_CORE_ENGINE_VERSION;
      readonly reason: string;
    };

/**
 * FT-1 financial-workflow composition boundary.
 *
 * The engine currently performs module capability resolution and deterministic workflow-state
 * creation only. It has no data-provider, scoring-executor, Supabase, exchange or custody side
 * effects. Domain adapters are introduced incrementally by later roadmap phases behind explicit
 * contracts and authority gates.
 */
export class FinTechCoreEngine {
  constructor(private readonly registry: FinTechCoreModuleRegistry) {}

  prepareWorkflow(context: FinTechCoreWorkflowContext): FinTechCoreWorkflowPreparation {
    const moduleResolution = this.registry.resolve({
      moduleId: context.moduleId,
      assetClass: context.asset.assetClass,
      operatingMode: context.operatingMode,
    });

    if (moduleResolution.status !== 'RESOLVED') {
      return {
        status: 'WORKFLOW_NOT_AVAILABLE',
        engineVersion: FINTECH_CORE_ENGINE_VERSION,
        reason: moduleResolution.reason,
      };
    }

    return {
      status: 'PREPARED',
      engineVersion: FINTECH_CORE_ENGINE_VERSION,
      moduleResolution,
      state: createInitialFinTechCoreWorkflowState(context),
    };
  }

  startWorkflow(
    context: FinTechCoreWorkflowContext,
    occurredAt: string,
  ): FinTechCoreWorkflowStart {
    const prepared = this.prepareWorkflow(context);
    if (prepared.status !== 'PREPARED') return prepared;

    const transition = transitionFinTechCoreWorkflow(prepared.state, 'RUNNING', occurredAt);
    if (transition.status !== 'TRANSITIONED') {
      return {
        status: 'WORKFLOW_NOT_AVAILABLE',
        engineVersion: FINTECH_CORE_ENGINE_VERSION,
        reason: transition.reason,
      };
    }

    return {
      status: 'STARTED',
      engineVersion: FINTECH_CORE_ENGINE_VERSION,
      state: transition.state,
    };
  }
}
