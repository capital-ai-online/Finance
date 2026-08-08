// @deprecated ADR-0014: inactive legacy scaffold. The production runtime is composed by
// server.ts -> server.application.ts using the canonical root-level server/ modules.
// Do not add new production dependencies on this file. Useful behavior must be reconciled
// into the canonical runtime tree before this scaffold is retired.
import express from 'express';
import { requestContext } from '../../server/logger';
import { metricsMiddleware } from '../../server/metrics';
import { installSecurityMiddleware } from './config/security';
import { registerStripeWebhookRoutes } from './integrations/stripe/webhook';
import { createAiProviders, type AiProviders } from './integrations/ai/providers';
import { installGlobalRateLimit } from './middleware/globalRateLimit';
import { createSystemRouter } from './routes/system.routes';
import { registerCoreRoutes } from './routes/core.routes';

export interface ApplicationContext {
  app: express.Express;
  providers: AiProviders;
}

/** @deprecated ADR-0014 — no production caller; retained temporarily for reconciliation. */
export function createApplication(): ApplicationContext {
  const app = express();
  app.use(requestContext);
  app.use(metricsMiddleware);
  installSecurityMiddleware(app);

  // Must remain before express.json(): Stripe validates the exact raw payload.
  registerStripeWebhookRoutes(app);

  installGlobalRateLimit(app);
  app.use(express.json());

  const providers = createAiProviders();
  app.use(createSystemRouter());
  registerCoreRoutes(app, providers);

  return { app, providers };
}
