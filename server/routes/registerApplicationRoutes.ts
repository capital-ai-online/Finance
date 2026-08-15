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

export interface ApplicationRouteProviders {
  ai: any | null;
  anthropic: any | null;
  openai: any | null;
}

/**
 * Canonical route composition for the production Express application.
 *
 * This module intentionally owns only router mounting and prefixes. It does not
 * own Stripe raw-body ingress, global middleware ordering, provider creation,
 * scoring semantics or runtime lifecycle. Those remain separate architecture
 * boundaries under ADR-0014.
 *
 * SEO-ROADMAP-0001 / Q2: trailing-slash 301 is registered here (after probe
 * protection and global middleware in server.application.ts, before domain routes).
 */
export function registerApplicationRoutes(
  app: Express,
  providers: ApplicationRouteProviders,
): void {
  const { ai, anthropic, openai } = providers;

  // SEO Q2: normalize /path/ → /path before domain routers handle the request.
  registerTrailingSlashNormalize(app);

  // Domain route factories keep the exact provider contract currently used by
  // server.application.ts. Missing AI providers remain fail-open where the
  // underlying route factories already define deterministic fallbacks.
  app.use('/api/raw-materials', createRawMaterialsRouter(ai, anthropic, openai));
  app.use('/api/crypto', createCryptoRouter(ai, anthropic, openai));

  // Existing production prefixes are intentionally preserved byte-for-byte at
  // the HTTP-contract level. No alias or compatibility route is introduced here.
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
  app.use('/api', aiRouter);
}
