import { createLogger } from '../logger';
import { getCleanEnv } from '../env';
import { resolveRuntimePort } from '../runtime/renderRuntimeSafety';
import { initializeAiProviders, type AiProviderSet } from '../bootstrap/providers';

export interface ServerRuntimeContext {
  isProduction: boolean;
  port: number;
  providers: AiProviderSet;
  logger: ReturnType<typeof createLogger>;
}

/**
 * Central composition root for process-scoped runtime dependencies.
 *
 * Phase 1 deliberately does not replace the existing server.ts bootstrap yet.
 * Follow-up phases will move middleware, route registration and lifecycle startup
 * behind this boundary in small, independently deployable steps.
 */
export function createServerRuntimeContext(): ServerRuntimeContext {
  const logger = createLogger('server');
  const isProduction = getCleanEnv('NODE_ENV') === 'production';
  const port = resolveRuntimePort(getCleanEnv('PORT'));
  const providers = initializeAiProviders(logger);

  return {
    isProduction,
    port,
    providers,
    logger,
  };
}
