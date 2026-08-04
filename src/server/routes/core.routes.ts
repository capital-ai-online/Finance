import express from 'express';
import { createRawMaterialsRouter } from '../../routes/rawMaterialsRoutes';
import { createCryptoRouter } from '../../routes/cryptoRoutes';
import { socialMediaRouter } from '../../routes/socialMediaRoutes';
import { scoreValidationRouter } from '../../../server/scoreValidation';
import { alertsRouter } from '../../../server/alerts';
import { supervisorRouter } from '../../../server/supervisorRouter';
import { createAgentEvaluationRouter } from '../../../server/agentEvaluationRouter';
import { stripeRouter } from '../../../server/stripe';
import { orchestratorRouter } from '../../../server/orchestrator';
import { aiRouter } from '../../../server/ai';
import { systemEventsRouter } from '../../../server/systemEvents';
import { hygieneRouter } from '../../../server/documentHygiene';
import { versionManagerRouter } from '../../platform/VersionManager/versionManager';
import { stepUpRouter } from '../../../server/stepUp';
import { complianceRouter } from '../../platform/Compliance/router';
import { newsRouter } from '../../features/news/newsRoutes';
import { registryRouter } from '../../features/registry/registryRoutes';
import type { AiProviders } from '../integrations/ai/providers';

/**
 * Registers the existing production routers against the modular application scaffold.
 *
 * The route factories accept the real provider clients, not scoring services. Keeping the
 * constructor boundary identical to the production monolith prevents this scaffold from
 * silently diverging while it remains inactive until a separately reviewed bootstrap cutover.
 */
export function registerCoreRoutes(app: express.Express, providers: AiProviders): void {
  app.use('/api/stripe', stripeRouter);
  app.use('/api/orchestrator', orchestratorRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/system-events', systemEventsRouter);
  app.use('/api/hygiene', hygieneRouter);
  app.use('/api/version', versionManagerRouter);
  app.use('/api/step-up', stepUpRouter);
  app.use('/api/compliance', complianceRouter);
  app.use('/api/news', newsRouter);
  app.use('/api/registry', registryRouter);
  app.use('/api/social-media', socialMediaRouter);
  app.use(scoreValidationRouter);
  app.use(alertsRouter);
  app.use(supervisorRouter);
  app.use(createAgentEvaluationRouter(providers.ai));
  app.use('/api/raw-materials', createRawMaterialsRouter(providers.ai, providers.anthropic, providers.openai));
  app.use('/api/crypto', createCryptoRouter(providers.ai, providers.anthropic, providers.openai));
}
