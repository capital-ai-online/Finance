export interface ProcessLifecycleLogger {
  error(message: string, meta?: Record<string, unknown>): void;
  info?(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Installs process-level safety handlers once at bootstrap time.
 *
 * Route-level error handling remains the primary boundary. These handlers are the
 * final process safety net and are intentionally kept outside the Express app
 * composition so lifecycle concerns do not leak into route registration.
 */
export function installProcessLifecycleHandlers(logger: ProcessLifecycleLogger): void {
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack,
    });
  });
}
