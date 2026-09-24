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
import { githubBillingAlertRouter } from './githubBillingAlertRoutes';
import { githubEnterpriseActionsPolicyRouter } from './githubEnterpriseActionsPolicyRoutes';
import { googleAnalyticsReadRouter } from './googleAnalyticsReadRoutes';
import { registerTrailingSlashNormalize } from '../middleware/seoUrlNormalize';
import { stripeReturnUrlGuard } from '../middleware/stripeReturnUrlGuard';
import { realtimeAiNewsfeedEntitlement } from '../middleware/realtimeAiNewsfeedEntitlement';
import { verifiedScreeningPathGate } from '../middleware/verifiedScreeningEntitlement';
import { installProductionSoft404Intercept } from '../runtime/spaFallback';
import { seoEngineRouter } from './seoEngineRoutes';
import { createLegacyScoringCompatibilityRouter } from './legacyScoringCompatibilityRoutes';
import { verifiedAssetDisplayRouter } from './verifiedAssetDisplayRoutes';
import { cryptoEvidenceRouter } from './cryptoEvidenceRoutes';
import { createMarketSentimentRouter } from './marketSentimentRoutes';
import { createPortfolioReviewRouter } from './portfolioReviewRoutes';
import { createMtaStsHostGuard, createMtaStsRouter } from './mtaStsRoutes';
import { createBusinessReadinessRouter } from './businessReadinessRoutes';
import { createHealthRouter } from './health';
import { passwordSecurityRouter } from './passwordSecurityRoutes';
import { backendAuthRootCallback, backendAuthRouter } from './backendAuthRoutes';
import { accountSecurityRouter } from './accountSecurityRoutes';
import { roadmapCadenceRouter } from './roadmapCadenceRoutes';
import { registerMarketDataAdapters } from './registerMarketDataAdapters';
import { assetRegistry } from '../../src/lib/assetRegistry';
import { rateLimitMiddleware } from '../../src/platform/Security/safeIo';

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

  // Render can use any verified custom domain as the HTTP health-check Host.
  // Keep process liveness available before the dedicated MTA-STS host guard.
  app.use(createHealthRouter());

  // The dedicated MTA-STS hostname shares this Render service but must not expose
  // the user-facing application, consent UI or unrelated runtime routes.
  app.use(createMtaStsHostGuard());

  registerTrailingSlashNormalize(app);

  // OPS-AUTH-BACKEND-01: the existing root URL remains the provider allow-listed OAuth return
  // target. Only the explicit auth_callback marker is intercepted; normal "/" requests continue
  // to the SPA. Backend auth APIs own login/session/logout from this point onward.
  app.get('/', backendAuthRootCallback);
  app.use('/api/auth', backendAuthRouter);
  app.use('/api/auth', accountSecurityRouter);

  installProductionSoft404Intercept();

  // FIN-SEC-02: shared verified_screening quota gate for canonical score/context/batch
  // paths. Installed before productive scoring routers so alternate mounts cannot skip it.
  // Legacy `/api/crypto-scoring/:symbol` keeps its inline enforceScreeningQuota() call.
  app.use(verifiedScreeningPathGate);

  // DATA-owned external market-data HTTP adapters are mounted here so the canonical
  // fail-closed provider boundary takes precedence over any later compatibility route
  // declarations that still remain in server.application.ts.
  registerMarketDataAdapters(app);

  // Diagnostic business-readiness routes remain separate from the early
  // process-liveness route. External providers do not gate Render's /healthz.
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
  app.use(
    '/api/admin/hygiene',
    rateLimitMiddleware({ name: 'document-hygiene', maxRequests: 60, windowMs: 60_000 }),
    hygieneRouter,
  );
  app.use('/api/admin', systemEventsRouter);
  app.use('/api/admin', versionManagerRouter);
  app.use('/api/auth', passwordSecurityRouter);
  app.use('/api/auth', stepUpRouter);
  app.use('/api/privacy', privacyRouter);
  app.use('/api/compliance', complianceRouter);
  app.use('/api/scoring', scoreValidationRouter);
  app.use('/api/scoring/explain', createScoreExplainabilityRouter(ai, anthropic, openai));
  app.use('/api/admin/diagnostics', adminDiagnosticsRouter);
  app.use('/api/admin/quality-center', qualityCenterRouter);
  app.use('/api/admin/github-enterprise', githubEnterpriseActionsPolicyRouter);
  app.use('/api/admin/google-analytics', googleAnalyticsReadRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/admin/supervisor', supervisorRouter);
  app.use('/api/admin/agent-evaluation', createAgentEvaluationRouter(ai, anthropic, openai));
  app.use('/api/internal/systemadmin-execution', systemadminExecutionBrokerRouter);
  app.use('/api/internal/github-billing-alert', githubBillingAlertRouter);
  app.use('/api/systemadmin/break-glass', breakGlassRouter);
  app.use('/api/owner-authorization', ownerAuthorizationRouter);
  app.use('/api/news', realtimeAiNewsfeedEntitlement, newsRouter);
  app.use('/api/registry', verifiedAssetDisplayRouter);
  app.use('/api/registry', registryRouter);
  app.use(
    '/api/social-media',
    rateLimitMiddleware({ name: 'social-media', maxRequests: 60, windowMs: 60_000 }),
    socialMediaRouter,
  );
  app.use('/api/seo', seoEngineRouter);
  app.use(
    '/api/roadmap',
    rateLimitMiddleware({ name: 'roadmap-cadence', maxRequests: 60, windowMs: 60_000 }),
    roadmapCadenceRouter,
  );
  app.use('/api', aiRouter);
  // Router-Anbindung (2026-08-25): bis dahin definiert, aber nirgends eingebunden (toter Code,
  // siehe docs/security/FULL_ARCHITECTURE_SECURITY_REVIEW_2026-08-25.md, "Nebenbefund"). Die
  // Frontend-Aufrufer (MarketSentiment.tsx, SentimentDashboard.tsx, PortfolioBacktester.tsx)
  // riefen diese Pfade bereits auf und erhielten dadurch immer 404 - keine neue Fläche, sondern
  // eine bereits im Frontend vorhandene, bisher nie erreichbare Funktion.
  app.use('/api', createMarketSentimentRouter({ ai, anthropic, openai, assetRegistry, fallbackAssets: [] }));
  app.use('/api', createPortfolioReviewRouter({ ai, anthropic, openai }));
}
