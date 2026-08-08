import type { Express } from 'express';
import { alphaVantageRouter } from './alphaVantageRoutes';

/**
 * Canonical HTTP adapter composition for external market-data providers.
 * Provider implementation/caching remains in dedicated provider modules.
 */
export function registerMarketDataAdapters(app: Express): void {
  app.use('/api', alphaVantageRouter);
}
