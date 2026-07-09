import { HygieneState } from './documentHygiene';
import { orchestrator } from '../src/lib/requestOrchestrator';
import { logSystemEvent } from './systemEvents';

export interface StateTransitionEvent {
  from: HygieneState;
  to: HygieneState;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type TransitionCallback = (event: StateTransitionEvent) => void | Promise<void>;

/**
 * Valid state transitions table for the Document Hygiene and Orchestration Pipeline.
 * Enforces correct workflow integrity.
 */
const ALLOWED_TRANSITIONS: Record<HygieneState, HygieneState[]> = {
  IDLE: ['PARSING'],
  PARSING: ['CHECKING_DEPS', 'REVIEW_REQUIRED', 'IDLE'],
  CHECKING_DEPS: ['WAITING_AI', 'REVIEW_REQUIRED', 'IDLE'],
  WAITING_AI: ['EXECUTING', 'REVIEW_REQUIRED', 'IDLE'],
  EXECUTING: ['DONE', 'REVIEW_REQUIRED', 'IDLE'],
  REVIEW_REQUIRED: ['IDLE', 'PARSING'],
  DONE: ['IDLE'],
};

export class DocumentDecisionEngine {
  private state: HygieneState = 'IDLE';
  private listeners: Set<TransitionCallback> = new Set();
  private lastTransitionTime: number = Date.now();

  constructor() {
    this.state = 'IDLE';
    this.lastTransitionTime = Date.now();
  }

  /**
   * Gets the current state of the decision engine.
   */
  public getCurrentState(): HygieneState {
    return this.state;
  }

  /**
   * Registers a transition listener hook.
   */
  public registerHook(callback: TransitionCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Resets the state machine back to IDLE.
   */
  public reset(metadata?: Record<string, any>) {
    const oldState = this.state;
    this.state = 'IDLE';
    this.lastTransitionTime = Date.now();
    this.notifyListeners(oldState, 'IDLE', metadata);
  }

  /**
   * Transitions the state machine to a new state with strict validation checks.
   */
  public transitionTo(nextState: HygieneState, metadata?: Record<string, any>): boolean {
    const currentState = this.state;

    // Prevent transitioning to the same state
    if (currentState === nextState) {
      return true;
    }

    // Validate if transition is allowed
    const allowed = ALLOWED_TRANSITIONS[currentState] || [];
    if (!allowed.includes(nextState)) {
      const errorMessage = `Invalid state transition requested from ${currentState} to ${nextState}. Workflow protection triggered.`;
      console.warn(`[DocumentDecisionEngine] ${errorMessage}`);
      
      logSystemEvent(
        'SECURITY',
        'Invalid State Transition Blocked',
        metadata?.email || 'system',
        errorMessage,
        'FAILED'
      );
      return false;
    }

    // Execute KI-Orchestrator Hook Integration before entering the next state
    this.executeOrchestratorPreHooks(nextState, metadata);

    // Perform transition
    this.state = nextState;
    const transitionDuration = Date.now() - this.lastTransitionTime;
    this.lastTransitionTime = Date.now();

    console.log(`[DocumentDecisionEngine] Transitioned: ${currentState} -> ${nextState} (${transitionDuration}ms)`);

    // Notify registered hooks
    const transitionMetadata = {
      ...metadata,
      durationMs: transitionDuration,
    };
    this.notifyListeners(currentState, nextState, transitionMetadata);

    return true;
  }

  /**
   * Orchestrator specific pre-hooks.
   * Tracks active state actions in the global request orchestrator.
   */
  private executeOrchestratorPreHooks(nextState: HygieneState, metadata?: Record<string, any>) {
    // When entering an active phase, log info or check resource limits
    if (nextState === 'PARSING') {
      console.log('[DocumentDecisionEngine] Orchestrator: Session Parsing Started.');
    } else if (nextState === 'WAITING_AI') {
      console.log('[DocumentDecisionEngine] Orchestrator: Registering high-concurrency Gemini AI request.');
      // Keep tracking of concurrency stats using requestOrchestrator stats
      const stats = orchestrator.getStats();
      if (stats.activeRequests >= stats.concurrencyLimit) {
        console.warn(`[DocumentDecisionEngine] WARNING: Concurrency limit (${stats.concurrencyLimit}) reached in active request orchestrator.`);
      }
    } else if (nextState === 'EXECUTING') {
      console.log('[DocumentDecisionEngine] Orchestrator: Committing changes in transaction state.');
    }
  }

  /**
   * Helper to trigger all registered listeners.
   */
  private async notifyListeners(from: HygieneState, to: HygieneState, metadata?: Record<string, any>) {
    const event: StateTransitionEvent = {
      from,
      to,
      timestamp: new Date().toISOString(),
      metadata,
    };

    for (const listener of this.listeners) {
      try {
        await listener(event);
      } catch (err) {
        console.error('[DocumentDecisionEngine] Error in transition listener:', err);
      }
    }
  }
}

// Global Singleton Instance of the Document Decision Engine
export const decisionEngine = new DocumentDecisionEngine();

// Integrate default hooks for audit logs & system events
decisionEngine.registerHook((event) => {
  const durationText = event.metadata?.durationMs ? ` in ${event.metadata.durationMs}ms` : '';
  
  if (event.to === 'DONE') {
    logSystemEvent(
      'ORCHESTRATOR',
      'Document Pipeline Finished',
      event.metadata?.email || 'system',
      `Pipeline reached target state DONE${durationText}. File: ${event.metadata?.filePath || 'unknown'}`,
      'SUCCESS'
    );
  } else if (event.to === 'REVIEW_REQUIRED') {
    logSystemEvent(
      'SECURITY',
      'Document Pipeline Flagged',
      event.metadata?.email || 'system',
      `Pipeline entered REVIEW_REQUIRED state${durationText}. File: ${event.metadata?.filePath || 'unknown'}`,
      'WARNING'
    );
  }
});
