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
 * Phase 2 consumes this boundary through bootstrapServerRuntime(). Express
 * middleware, routers and domain services are intentionally composed in later
 * phases so ordering-sensitive behavior remains independently reviewable.
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
