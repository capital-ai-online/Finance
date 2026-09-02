import {
  getProcessHealthSnapshot,
  markProcessFatal,
  type FatalProcessSource,
} from '../runtime/processHealth';

export interface ProcessLifecycleLogger {
  error(message: string, meta?: Record<string, unknown>): void;
  info?(message: string, meta?: Record<string, unknown>): void;
}

export interface ProcessLifecycleHooks {
  onFatal?(source: FatalProcessSource, error: Error): void;
}

export interface ProcessLifecycleTarget {
  on(event: string, listener: (...args: any[]) => void): unknown;
  off(event: string, listener: (...args: any[]) => void): unknown;
}

let liveProcessDispose: (() => void) | null = null;

function normalizeFatalError(reason: unknown): Error {
  if (reason instanceof Error) return reason;
  return new Error(typeof reason === 'string' ? reason : String(reason));
}

function defaultFatalAction(logger: ProcessLifecycleLogger): void {
  process.exitCode = 1;
  try {
    process.kill(process.pid, 'SIGTERM');
  } catch (error) {
    logger.error('Fatal process shutdown signal failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

/**
 * Installs the process-level fatal safety net before the application module starts.
 *
 * An uncaught exception or unhandled rejection is never treated as recoverable. The
 * first fatal event latches process health to unhealthy, delegates bounded cleanup to
 * the existing SIGTERM shutdown path, and guarantees a non-zero final exit. Additional
 * fatal events are logged but cannot start a second shutdown sequence.
 */
export function installProcessLifecycleHandlers(
  logger: ProcessLifecycleLogger,
  hooks: ProcessLifecycleHooks = {},
  target: ProcessLifecycleTarget = process,
): () => void {
  if (target === process && liveProcessDispose) return liveProcessDispose;

  let fatalHandlingStarted = false;
  const triggerFatal = (source: FatalProcessSource, rawError: unknown) => {
    const error = normalizeFatalError(rawError);
    markProcessFatal(source);
    logger.error(source === 'uncaughtException' ? 'Uncaught exception' : 'Unhandled promise rejection', {
      fatalSource: source,
      error: error.message,
      stack: error.stack,
    });

    if (fatalHandlingStarted) return;
    fatalHandlingStarted = true;
    if (hooks.onFatal) hooks.onFatal(source, error);
    else defaultFatalAction(logger);
  };

  const onUnhandledRejection = (reason: unknown) => triggerFatal('unhandledRejection', reason);
  const onUncaughtException = (error: Error) => triggerFatal('uncaughtException', error);
  const onExit = (code: number) => {
    if (!getProcessHealthSnapshot().healthy && code === 0) process.exitCode = 1;
  };

  target.on('unhandledRejection', onUnhandledRejection);
  target.on('uncaughtException', onUncaughtException);
  if (target === process) target.on('exit', onExit);

  const dispose = () => {
    target.off('unhandledRejection', onUnhandledRejection);
    target.off('uncaughtException', onUncaughtException);
    if (target === process) target.off('exit', onExit);
    if (target === process && liveProcessDispose === dispose) liveProcessDispose = null;
  };

  if (target === process) liveProcessDispose = dispose;
  return dispose;
}
