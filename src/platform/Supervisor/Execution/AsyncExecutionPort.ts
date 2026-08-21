export const ASYNC_EXECUTION_ENVELOPE_SCHEMA = 'capital-ai-async-execution/1.0.0' as const;

export type AsyncExecutionMode = 'inline' | 'external';

export interface AsyncExecutionPolicy {
  maxAttempts: number;
  timeoutMs: number;
}

export interface AsyncExecutionEnvelope<TPayload = unknown> {
  schemaVersion: typeof ASYNC_EXECUTION_ENVELOPE_SCHEMA;
  taskType: string;
  taskId: string;
  correlationId: string;
  createdAt: string;
  payload: TPayload;
  policy: AsyncExecutionPolicy;
}

export interface AsyncExecutionReceipt {
  accepted: boolean;
  mode: AsyncExecutionMode;
  taskType: string;
  taskId: string;
  correlationId: string;
  completedInline: boolean;
  providerExecutionId?: string;
}

/**
 * Provider-neutral execution boundary for ADR-0037 §3.3.
 *
 * This port owns only execution mechanics. It MUST NOT choose a domain orchestrator, scoring model,
 * business decision, policy outcome or mutation authority. Supervisor/domain code decides *what*
 * must run; an adapter decides only *where/how* the already selected task is executed.
 *
 * Render Workflows, a future worker queue, or another durable engine may implement this contract.
 * No external adapter is enabled by this module and no Render SDK dependency is introduced here.
 */
export interface AsyncExecutionPort {
  readonly mode: AsyncExecutionMode;
  dispatch<TPayload>(envelope: Readonly<AsyncExecutionEnvelope<TPayload>>): Promise<AsyncExecutionReceipt>;
}

export type InlineAsyncTaskHandler<TPayload = unknown> = (payload: Readonly<TPayload>) => Promise<void> | void;
export type InlineAsyncTaskHandlers = Readonly<Record<string, InlineAsyncTaskHandler<any>>>;

function requireText(name: string, value: string): string {
  const clean = value?.trim();
  if (!clean) throw new Error(`[AsyncExecution] ${name} is required.`);
  return clean;
}

export function validateAsyncExecutionEnvelope<TPayload>(
  envelope: Readonly<AsyncExecutionEnvelope<TPayload>>,
): void {
  if (envelope.schemaVersion !== ASYNC_EXECUTION_ENVELOPE_SCHEMA) {
    throw new Error(`[AsyncExecution] unsupported schemaVersion: ${String(envelope.schemaVersion)}`);
  }
  requireText('taskType', envelope.taskType);
  requireText('taskId', envelope.taskId);
  requireText('correlationId', envelope.correlationId);
  if (Number.isNaN(Date.parse(envelope.createdAt))) {
    throw new Error('[AsyncExecution] createdAt must be an ISO-8601 timestamp.');
  }
  if (!Number.isInteger(envelope.policy?.maxAttempts) || envelope.policy.maxAttempts < 1) {
    throw new Error('[AsyncExecution] policy.maxAttempts must be an integer >= 1.');
  }
  if (!Number.isFinite(envelope.policy?.timeoutMs) || envelope.policy.timeoutMs < 1) {
    throw new Error('[AsyncExecution] policy.timeoutMs must be >= 1.');
  }
}

/**
 * Current compatibility adapter. It preserves today's in-process behavior while making the
 * execution boundary explicit and testable. Handlers are registered by stable taskType; callers
 * cannot inject executable code through the task envelope itself.
 */
export class InlineAsyncExecutionPort implements AsyncExecutionPort {
  readonly mode = 'inline' as const;

  constructor(private readonly handlers: InlineAsyncTaskHandlers) {}

  async dispatch<TPayload>(
    envelope: Readonly<AsyncExecutionEnvelope<TPayload>>,
  ): Promise<AsyncExecutionReceipt> {
    validateAsyncExecutionEnvelope(envelope);
    const handler = this.handlers[envelope.taskType] as InlineAsyncTaskHandler<TPayload> | undefined;
    if (!handler) {
      throw new Error(`[AsyncExecution] no inline handler registered for taskType=${envelope.taskType}`);
    }
    await handler(envelope.payload);
    return {
      accepted: true,
      mode: this.mode,
      taskType: envelope.taskType,
      taskId: envelope.taskId,
      correlationId: envelope.correlationId,
      completedInline: true,
    };
  }
}

export function createInlineAsyncExecutionPort(handlers: InlineAsyncTaskHandlers): AsyncExecutionPort {
  return new InlineAsyncExecutionPort(handlers);
}
