import '../../server/bootstrap/installProcessLifecycle';

// Simulate the application's bounded shutdown completing successfully after the fatal
// handler delegates through SIGTERM. The lifecycle exit hook must still preserve a
// non-zero final process status for supervisor/restart semantics.
process.once('SIGTERM', () => process.exit(0));

setImmediate(() => {
  throw new Error('EXPECTED_FATAL_CHILD_PROCESS_ERROR');
});
