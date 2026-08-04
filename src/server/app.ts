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
