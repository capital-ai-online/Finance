import type { Express } from 'express';
import { createRawMaterialsRouter } from '../../src/routes/rawMaterialsRoutes';
import { createCryptoRouter } from '../../src/routes/cryptoRoutes';
import { socialMediaRouter } from '../../src/routes/socialMediaRoutes';
import { stripeRouter } from '../stripe';
import { orchestratorRouter } from '../orchestrator';
import { hygieneRouter } from '../documentHygiene';
import { systemEventsRouter } from '../systemEvents';
import { versionManagerRouter } from '../../src/platform/VersionManager/versionManager';
import { stepUpRouter } from '../stepUp';
import { complianceRouter } from '../../src/platform/Compliance/router';
import { scoreValidationRouter } from '../scoreValidation';
import { alertsRouter } from '../alerts';
import { supervisorRouter } from '../supervisorRouter';
import { createAgentEvaluationRouter } from '../agentEvaluationRouter';
import { createScoreExplainabilityRouter } from '../scoreExplainability';
import { adminDiagnosticsRouter } from '../adminDiagnostics';
import { newsRouter } from '../../src/features/news/newsRoutes';
import { registryRouter } from '../../src/features/registry/registryRoutes';
import { aiRouter } from '../ai';
import { systemadminExecutionBrokerRouter } from '../systemadmin/systemadminExecutionBrokerRouter';
import { registerTrailingSlashNormalize } from '../middleware/seoUrlNormalize';
import { installProductionSoft404Intercept } from '../runtime/spaFallback';
import { seoEngineRouter } from './seoEngineRoutes';

export interface ApplicationRouteProviders {
  ai: any | null;
  anthropic: any | null;
  openai: any | null;
}

/**
 * Canonical route composition for the production Express application.
 *
 * SEO-ROADMAP-0001:
 * - Q2: trailing-slash 301 via registerTrailingSlashNormalize
 * - D3: installProductionSoft404Intercept wraps later app.get('*') in production
 * - S1: SeoEngine admin API under /api/seo
 */
export function registerApplicationRoutes(
  app: Express,
  providers: ApplicationRouteProviders,
): void {
  const { ai, anthropic, openai } = providers;

  registerTrailingSlashNormalize(app);
  installProductionSoft404Intercept();

  app.use('/api/raw-materials', createRawMaterialsRouter(ai, anthropic, openai));
  app.use('/api/crypto', createCryptoRouter(ai, anthropic, openai));

  app.use('/api/stripe', stripeRouter);
  app.use('/api/orchestrator', orchestratorRouter);
  app.use('/api/admin/hygiene', hygieneRouter);
  app.use('/api/admin', systemEventsRouter);
  app.use('/api/admin', versionManagerRouter);
  app.use('/api/auth', stepUpRouter);
  app.use('/api/compliance', complianceRouter);
  app.use('/api/scoring', scoreValidationRouter);
  app.use('/api/scoring/explain', createScoreExplainabilityRouter(ai, anthropic, openai));
  app.use('/api/admin/diagnostics', adminDiagnosticsRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/admin/supervisor', supervisorRouter);
  app.use('/api/admin/agent-evaluation', createAgentEvaluationRouter(ai, anthropic, openai));
  app.use('/api/internal/systemadmin-execution', systemadminExecutionBrokerRouter);
  app.use('/api/news', newsRouter);
  app.use('/api/registry', registryRouter);
  app.use('/api/social-media', socialMediaRouter);
  app.use('/api/seo', seoEngineRouter);
  app.use('/api', aiRouter);
}
