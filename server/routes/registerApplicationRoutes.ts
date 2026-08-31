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
import { m10CredentialEnrollmentRouter } from '../m10/credentialEnrollmentRouter';
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

/**
 * Canonical route composition for the production Express application.
 *
 * This module intentionally owns only router mounting and prefixes. It does not
 * own Stripe raw-body ingress, global middleware ordering, provider construction,
 * scoring semantics or runtime lifecycle. Those remain separate architecture
 * boundaries under ADR-0014.
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

  // DATA-owned external market-data HTTP adapters are mounted here so the canonical
  // fail-closed provider boundary takes precedence over any later compatibility route
  // declarations that still remain in server.application.ts.
  registerMarketDataAdapters(app);

  // Operations readiness: `/healthz` remains the platform liveness contract owned by
  // server.application.ts. This router adds the full non-secret projection under
  // `/healthz/readiness` and a strict 200/503 business gate under `/readyz`.
  app.use(createBusinessReadinessRouter());

  // RFC 8461 policy endpoint. DNS discovery and the mta-sts custom domain remain
  // separately owner-managed; the application only serves the static policy body.
  app.use(createMtaStsRouter());

  // SC-2 Phase C3: intercept historical Crypto scoring endpoints before the legacy declarations
  // in server.application.ts. Standard- and Meme-Crypto terminate at the canonical dispatcher;
  // caller-indicator chart scoring remains explicitly simulation-only.
  app.use(createLegacyScoringCompatibilityRouter());

  app.use('/api/raw-materials', createRawMaterialsRouter(ai, anthropic, openai));
  // Specific read-only evidence projection is mounted before the general crypto router.
  app.use('/api/crypto/evidence', cryptoEvidenceRouter);
  app.use('/api/crypto', createCryptoRouter(ai, anthropic, openai));

  // Security boundary: client-supplied Stripe return targets are normalized and
  // validated against the existing ADR-0009/CORS origin authority before any
  // Checkout or Billing Portal session can be created.
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
  app.use('/api/m10/credential-enrollment', m10CredentialEnrollmentRouter);
  app.use('/api/news', newsRouter);
  app.use('/api/registry', verifiedAssetDisplayRouter);
  app.use('/api/registry', registryRouter);
  app.use('/api/social-media', socialMediaRouter);
  app.use('/api/seo', seoEngineRouter);
  app.use('/api', aiRouter);
  // Router-Anbindung (2026-08-25): bis dahin definiert, aber nirgends eingebunden (toter Code,
  // siehe docs/security/FULL_ARCHITECTURE_SECURITY_REVIEW_2026-08-25.md, "Nebenbefund"). Die
  // Frontend-Aufrufer (MarketSentiment.tsx, SentimentDashboard.tsx, PortfolioBacktester.tsx)
  // riefen diese Pfade bereits auf und erhielten dadurch immer 404 - keine neue Fläche, sondern
  // eine bereits im Frontend vorhandene, bisher nie erreichbare Funktion.
  app.use('/api', createMarketSentimentRouter({ ai, anthropic, openai, assetRegistry, fallbackAssets: [] }));
  app.use('/api', createPortfolioReviewRouter({ ai, anthropic, openai }));
}
