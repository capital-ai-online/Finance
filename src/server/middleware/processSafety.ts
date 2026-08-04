export function installProcessSafetyHandlers(): void {
  process.on('unhandledRejection', (reason) => {
    console.error('[PROCESS][UNHANDLED REJECTION]', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[PROCESS][UNCAUGHT EXCEPTION]', err);
  });
}
