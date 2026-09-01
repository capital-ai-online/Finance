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
import { privacyRouter } from '../privacy';
import { complianceRouter } from '../../src/platform/Compliance/router';
import { scoreValidationRouter } from '../scoreValidation';
import { alertsRouter } from '../alerts';
import { supervisorRouter } from '../supervisorRouter';
import { createAgentEvaluationRouter } from '../agentEvaluationRouter';
import { createScoreExplainabilityRouter } from '../scoreExplainability';
import { adminDiagnosticsRouter } from '../adminDiagnostics';
import { qualityCenterRouter } from '../qualityCenter';
import { newsRouter } from '../../src/features/news/newsRoutes';
import { registryRouter } from '../../src/features/registry/registryRoutes';
import { aiRouter } from '../ai';
import { systemadminExecutionBrokerRouter } from '../systemadmin/systemadminExecutionBrokerRouter';
import { breakGlassRouter } from '../systemadmin/breakGlassRouter';
import { ownerAuthorizationRouter } from '../ownerAuthorization/router';
import { registerTrailingSlashNormalize } from '../middleware/seoUrlNormalize';
import { stripeReturnUrlGuard } from '../middleware/stripeReturnUrlGuard';
import { installProductionSoft404Intercept } from '../runtime/spaFallback';
import { seoEngineRouter } from './seoEngineRoutes';
import { createLegacyScoringCompatibilityRouter } from './legacyScoringCompatibilityRoutes';
import { verifiedAssetDisplayRouter } from './verifiedAssetDisplayRoutes';
import { cryptoEvidenceRouter } from './cryptoEvidenceRoutes';
import { createMarketSentimentRouter } from './marketSentimentRoutes';
import { createPortfolioReviewRouter } from './portfolioReviewRoutes';
import { createMtaStsRouter } from './mtaStsRoutes';
import { createBusinessReadinessRouter } from './businessReadinessRoutes';
import { registerMarketDataAdapters } from './registerMarketDataAdapters';
import { assetRegistry } from '../../src/lib/assetRegistry';

export interface ApplicationRouteProviders {
  ai: any | null;
  anthropic: any | null;
  openai: any | null;
}

export function registerApplicationRoutes(
  app: Express,
  providers: ApplicationRouteProviders,
): void {
  const { ai, anthropic, openai } = providers;

  registerTrailingSlashNormalize(app);
  installProductionSoft404Intercept();
  registerMarketDataAdapters(app);
  app.use(createBusinessReadinessRouter());
  app.use(createMtaStsRouter());
  app.use(createLegacyScoringCompatibilityRouter());

  app.use('/api/raw-materials', createRawMaterialsRouter(ai, anthropic, openai));
  app.use('/api/crypto/evidence', cryptoEvidenceRouter);
  app.use('/api/crypto', createCryptoRouter(ai, anthropic, openai));
  app.use('/api/stripe', stripeReturnUrlGuard, stripeRouter);
  app.use('/api/orchestrator', orchestratorRouter);
  app.use('/api/admin/hygiene', hygieneRouter);
  app.use('/api/admin', systemEventsRouter);
  app.use('/api/admin', versionManagerRouter);
  app.use('/api/auth', stepUpRouter);
  app.use('/api/privacy', privacyRouter);
  app.use('/api/compliance', complianceRouter);
  app.use('/api/scoring', scoreValidationRouter);
  app.use('/api/scoring/explain', createScoreExplainabilityRouter(ai, anthropic, openai));
  app.use('/api/admin/diagnostics', adminDiagnosticsRouter);
  app.use('/api/admin/quality-center', qualityCenterRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/admin/supervisor', supervisorRouter);
  app.use('/api/admin/agent-evaluation', createAgentEvaluationRouter(ai, anthropic, openai));
  app.use('/api/internal/systemadmin-execution', systemadminExecutionBrokerRouter);
  app.use('/api/systemadmin/break-glass', breakGlassRouter);
  app.use('/api/owner-authorization', ownerAuthorizationRouter);
  app.use('/api/news', newsRouter);
  app.use('/api/registry', verifiedAssetDisplayRouter);
  app.use('/api/registry', registryRouter);
  app.use('/api/social-media', socialMediaRouter);
  app.use('/api/seo', seoEngineRouter);
  app.use('/api', aiRouter);
  app.use('/api', createMarketSentimentRouter({ ai, anthropic, openai, assetRegistry, fallbackAssets: [] }));
  app.use('/api', createPortfolioReviewRouter({ ai, anthropic, openai }));
}
