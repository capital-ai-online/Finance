import type { Express } from 'express';
import { requestContext } from '../logger';
import { metricsMiddleware } from '../metrics';

/**
 * Registers request-scoped observability middleware in the same order currently
 * used by the legacy server.ts composition root.
 *
 * Ordering invariant:
 * 1. requestContext assigns the correlation/request id.
 * 2. metricsMiddleware observes all later middleware and route outcomes.
 */
export function registerObservabilityMiddleware(app: Express): void {
  app.use(requestContext);
  app.use(metricsMiddleware);
}
