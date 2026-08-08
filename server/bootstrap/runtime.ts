import { createServerRuntimeContext, type ServerRuntimeContext } from '../app/compositionRoot';
import { installProcessLifecycleHandlers } from './processLifecycle';

/**
 * Single process-level bootstrap boundary introduced by ADR-0013 Phase 2.
 *
 * Responsibilities:
 * - create normalized runtime configuration
 * - initialize optional AI providers once through the composition root
 * - install process-level safety handlers
 *
 * Express middleware and route registration intentionally remain outside this
 * boundary until later migration phases so ordering-sensitive behavior stays
 * independently reviewable.
 */
export function bootstrapServerRuntime(): ServerRuntimeContext {
  const runtime = createServerRuntimeContext();
  installProcessLifecycleHandlers(runtime.logger);
  return runtime;
}
