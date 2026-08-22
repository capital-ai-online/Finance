import type { Express } from 'express';
import {
  registerApplicationRoutes as registerBaseApplicationRoutes,
  type ApplicationRouteProviders,
} from './registerApplicationRoutesBase';
import { cryptoEvidenceRouter } from './cryptoEvidenceRoutes';

export type { ApplicationRouteProviders } from './registerApplicationRoutesBase';

/**
 * Canonical route composition extension for SC4 evidence delivery.
 * Existing route mounting stays unchanged in the base module; this wrapper adds one read-only
 * evidence projection and does not change scoring, execution or provider-construction authority.
 */
export function registerApplicationRoutes(
  app: Express,
  providers: ApplicationRouteProviders,
): void {
  registerBaseApplicationRoutes(app, providers);
  app.use('/api/crypto/evidence', cryptoEvidenceRouter);
}
