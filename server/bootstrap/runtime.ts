import { createServerRuntimeContext, type ServerRuntimeContext } from '../app/compositionRoot';
import { installProcessLifecycleHandlers } from './processLifecycle';

/**
 * Phase 2 bootstrap boundary.
 *
 * This is the single process-level entry point for runtime dependency creation.
 * It composes environment/runtime configuration, optional AI providers and the
 * process lifecycle safety net without leaking those concerns into Express route
 * registration.
 *
 * The function is intentionally explicit and side-effect free until invoked by
 * the process entry point. This keeps tests/imports deterministic and prevents
 * duplicate process listeners during module discovery.
 */
export function bootstrapServerRuntime(): ServerRuntimeContext {
  const runtime = createServerRuntimeContext();
  installProcessLifecycleHandlers(runtime.logger);
  return runtime;
}
