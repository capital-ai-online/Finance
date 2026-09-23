export type RoadmapWorkState = 'in-flight' | 'active' | 'in-progress' | 'evidence-gate';
export type RoadmapQueueState = 'ready' | 'held' | 'queued';
export type RoadmapIntegrationState =
  | 'production-covered'
  | 'repository-integrated'
  | 'main-only'
  | 'provider-gate'
  | 'legacy-drift';

export interface RoadmapWorkPackage {
  id: string;
  title: string;
  owner: string;
  relationship: string;
  phase: 'Automation' | 'Self-Healing Runtime' | 'Product & Market' | 'Security & Compliance';
  state: RoadmapWorkState;
  stateLabel: string;
  source: string;
  sourceType: 'canonical-roadmap' | 'provider-pr' | 'provider-branch' | 'human-directed';
  detail: string;
  prNumber?: number;
}

export interface RoadmapQueuedItem {
  id: string;
  owner: string;
  state: RoadmapQueueState;
  stateLabel: string;
  source: string;
  gate: string;
}

export interface RoadmapIntegrationItem {
  id: string;
  title: string;
  owner: string;
  state: RoadmapIntegrationState;
  stateLabel: string;
  source: string;
  detail: string;
  nextGate?: string;
}

export const ROADMAP_DASHBOARD_SNAPSHOT = {
  schemaVersion: '1.2.0',
  role: 'NON_AUTHORIZING_DERIVED_UI_PROJECTION',
  correlatedDate: '2026-09-23',
  correlatedMainSha: '98c8889ac5f34c8123470b9b5ac57648ccd38877',
  currentMainSha: '98c8889ac5f34c8123470b9b5ac57648ccd38877',
  productionAudit: {
    observedCommitSha: '7c1d9293ee4c61e32791e447463fcaf263644c6d',
    deployId: 'dep-daq2vqou01pc73fjldv0',
    classification: 'BEHIND_CORRELATED_MAIN',
    note: 'Production was live on the FIN-SENT-01 merge while the later Auth/Profile merge #1331 was already on CURRENT_MAIN. Runtime identity continues to be read live from /healthz.',
  },
  branding: {
    brandmark: 'docs/frontend/brandmark.json',
    designTokens: 'docs/frontend/design-tokens.json',
    logoProjection: 'src/shared/branding/CapitalAiLogo.tsx',
    panelPrimitive: 'src/shared/ui/Card.tsx',
    tokenProjection: 'src/index.css',
  },
  activeWorkPackages: [
    {
      id: 'FE-ROADMAP-LIVE-01',
      title: 'Branded Roadmap Live Dashboard',
      owner: 'CAPITAL-AI-FE',
      relationship: 'cross-cutting Frontend presentation; canonical task state remains in owner project Roadmaps',
      phase: 'Product & Market',
      state: 'in-progress',
      stateLabel: 'SEO + PRODUCTION CONVERGENCE',
      source: 'Fresh Human/Owner direction 2026-09-23',
      sourceType: 'human-directed',
      detail: 'Re-correlates the read-only /roadmap projection to CURRENT_MAIN, removes terminal provider writers and adds a production/SEO integration ledger without creating a second task authority.',
    },
    {
      id: 'SH-02.11',
      title: 'Retry-Safe Operation',
      owner: 'CAPITAL-AI-OPS',
      relationship: 'PVC-08 · Self-Healing runtime',
      phase: 'Self-Healing Runtime',
      state: 'active',
      stateLabel: 'ACTIVATED · RETRY_SAFE_OPERATION',
      source: 'docs/projects/operations/ROADMAP.md',
      sourceType: 'canonical-roadmap',
      detail: 'Independent Security/QM assurance converged and RETRY_SAFE_OPERATION is activated; broader SH-2/SH-3 actions remain held.',
    },
    {
      id: 'GOV-SH-V3',
      title: 'Self-Healing Convergence Program',
      owner: 'CAPITAL-AI-GOV',
      relationship: 'PVC-05',
      phase: 'Automation',
      state: 'active',
      stateLabel: 'ACTIVE · CONTINUOUS CONVERGENCE',
      source: 'docs/projects/governance/ROADMAP.md',
      sourceType: 'canonical-roadmap',
      detail: 'Merged convergence/autofix foundations remain the Governance-side continuous invariant without becoming a second control plane.',
    },
    {
      id: 'OPS-02-CI-01E',
      title: 'ChatGPT Preflight & Runner-Minute Convergence',
      owner: 'CAPITAL-AI-OPS',
      relationship: 'PVC-02 · QM assurance · SEC boundary',
      phase: 'Automation',
      state: 'active',
      stateLabel: 'ACTIVE · P0 FOUNDATION',
      source: 'docs/projects/operations/ROADMAP.md',
      sourceType: 'canonical-roadmap',
      detail: 'Machine-readable pre-PR evidence plus bounded lifecycle runner-minute telemetry remain active cost-control work.',
    },
    {
      id: 'SEC-WEB-HARDENING-01',
      title: 'Public Website & Secure Deployment Convergence',
      owner: 'CAPITAL-AI-SEC',
      relationship: 'cross-cutting Security; productive remediation stays with canonical owners',
      phase: 'Security & Compliance',
      state: 'active',
      stateLabel: 'ACTIVE · IMPLEMENTATION OPEN',
      source: 'docs/projects/security/ROADMAP.md',
      sourceType: 'canonical-roadmap',
      detail: 'Public website, artifact, identity and deployment controls remain evidence-driven and independently verified.',
    },
    {
      id: 'COMP-LF-01',
      title: 'Static Landing Compliance Evidence Gate',
      owner: 'CAPITAL-AI-COMP',
      relationship: 'cross-cutting Compliance',
      phase: 'Security & Compliance',
      state: 'evidence-gate',
      stateLabel: 'ACTIVE · EVIDENCE GATE',
      source: 'docs/projects/compliance/ROADMAP.md',
      sourceType: 'canonical-roadmap',
      detail: 'Truthful preview/live separation, consent/legal navigation and independent SEC/QM evidence remain explicit gates.',
    },
    {
      id: 'COMP-FINREG-01',
      title: 'Financial Regulatory Perimeter',
      owner: 'CAPITAL-AI-COMP',
      relationship: 'cross-cutting Compliance · Human/Legal decision boundary',
      phase: 'Security & Compliance',
      state: 'evidence-gate',
      stateLabel: 'ACTIVE · LEGAL REVIEW REQUIRED',
      source: 'docs/projects/compliance/ROADMAP.md',
      sourceType: 'canonical-roadmap',
      detail: 'Repository evidence informs the perimeter review; legal/licensing conclusions remain competent Human/Legal decisions.',
    },
    {
      id: 'WP-SEO-LAUNCH-01',
      title: 'Public Web & Social Launch Management',
      owner: 'CAPITAL-AI-SEO',
      relationship: 'cross-cutting SEO / launch coordination',
      phase: 'Product & Market',
      state: 'active',
      stateLabel: 'ACTIVE · PROVIDER EVIDENCE OPEN',
      source: 'docs/projects/seo/ROADMAP.md',
      sourceType: 'canonical-roadmap',
      detail: 'Former FAQ, Universe handoff, scoring-review and root-metadata issues are terminal. Remaining launch evidence is measurement/provider-bound plus the newly detected stale Universe SEO/server projection.',
    },
    {
      id: 'SOCIAL-P1',
      title: 'Real TTS Runtime Evidence',
      owner: 'CAPITAL-AI-SOCIAL',
      relationship: 'cross-cutting Social · OPS runtime return',
      phase: 'Product & Market',
      state: 'active',
      stateLabel: 'ACTIVE · HUMAN LISTENING GATE',
      source: 'docs/projects/social-media/ROADMAP.md',
      sourceType: 'canonical-roadmap',
      detail: 'Technical evidence remains separate from Human listening acceptance; rejected audio cannot be promoted as production-ready.',
    },
    {
      id: 'SOCIAL-P2',
      title: 'Short-Video + Voice-Over Integration',
      owner: 'CAPITAL-AI-SOCIAL',
      relationship: 'cross-cutting Social',
      phase: 'Product & Market',
      state: 'in-progress',
      stateLabel: 'IN PROGRESS · P1 GATE ENFORCED',
      source: 'docs/projects/social-media/ROADMAP.md',
      sourceType: 'canonical-roadmap',
      detail: 'Repository-side integration may advance, but only technically evidenced and Human-listening-PASS audio may be consumed.',
    },
  ] satisfies RoadmapWorkPackage[],
  integrationLedger: [
    {
      id: 'SEO-FAQ-PUBLIC-ROUTE',
      title: 'FAQ als indexierbare Public Route',
      owner: 'CAPITAL-AI-SEO · CAPITAL-AI-FE · CAPITAL-AI-OPS',
      state: 'production-covered',
      stateLabel: 'INTEGRIERT · TERMINAL',
      source: 'Issues #1233/#1252 · src/lib/routeSeo.ts · server/middleware/seoUrlNormalize.ts',
      detail: '/faq ist in Client-Routing, SEO-Metadaten, Public-Allowlist, Prerender und Sitemap integriert; die früheren Owner-Handoffs sind geschlossen.',
    },
    {
      id: 'SEO-GA4-CONSENT',
      title: 'GA4 Browser-Wiring hinter Consent',
      owner: 'CAPITAL-AI-FE · CAPITAL-AI-COMP · CAPITAL-AI-SEO',
      state: 'repository-integrated',
      stateLabel: 'RUNTIME-WIRING INTEGRIERT',
      source: 'index.html · public/google-analytics-consent.js',
      detail: 'GA4 wird nur bei gültiger Analytics-Einwilligung und gültiger Measurement-ID geladen; Werbesignale bleiben denied. Runtime-Wiring ist nicht gleich Data-API-/Measurement-PASS.',
      nextGate: 'Frische Provider-Messdaten über den read-only GSC/GA4-Pfad.',
    },
    {
      id: 'SEO-GSC-GA4-MEASUREMENT',
      title: 'Search Console / GA4 / GenAI Messbaseline',
      owner: 'CAPITAL-AI-SEO',
      state: 'provider-gate',
      stateLabel: 'PROVIDER READ OPEN',
      source: 'docs/projects/seo/ROADMAP.md · docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md',
      detail: 'Historische GSC Property- und fünf URL-Inspections existieren. Aktuelle Search-Analytics-, GA4-Data-API- und GenAI-Visibility-Reads sind nicht als aktueller PASS belegt.',
      nextGate: 'Least-privileged Provider-Readback; keine synthetischen KPIs.',
    },
    {
      id: 'SEO-UNIVERSE-LEGACY-RETIREMENT',
      title: 'Veraltete Universe-SEO-Anbindung entfernen',
      owner: 'CAPITAL-AI-SEO · CAPITAL-AI-FE · CAPITAL-AI-OPS',
      state: 'legacy-drift',
      stateLabel: 'LEGACY DRIFT · RETIRE',
      source: 'AppRoutes.tsx vs routeSeo.ts / sitemap.xml / prerender / PUBLIC_SPA_PATHS',
      detail: 'Der aktuelle Client-Router rendert /universe nicht mehr, während SEO-Metadata, Sitemap, Prerender und Public-Server-Allowlist die Route weiterhin publizieren. Die Route darf nicht still wieder aktiviert werden.',
      nextGate: 'Owner-korrekte Entfernung der veralteten SEO-/OPS-Projektionen bei erhaltener 404-/Canonical-Sicherheit.',
    },
    {
      id: 'OPS-ROADMAP-DIRECT-ROUTE',
      title: '/roadmap Direct Route',
      owner: 'CAPITAL-AI-OPS · CAPITAL-AI-FE',
      state: 'production-covered',
      stateLabel: 'PRODUCTION ROUTE INTEGRIERT',
      source: 'PR #1319 · server/middleware/seoUrlNormalize.ts',
      detail: '/roadmap ist als nicht indexierbare Application-SPA-Route im produktiven Serverpfad integriert; die Seite bleibt eine read-only Projektion.',
    },
    {
      id: 'SH-02.11-RETRY-SAFE',
      title: 'Retry-Safe Self-Healing Activation',
      owner: 'CAPITAL-AI-OPS',
      state: 'production-covered',
      stateLabel: 'AKTIVIERT · PRODUCTION COVERED',
      source: 'PR #1330 · docs/projects/operations/evidence/SH_02_11_RETRY_SAFE_ACTIVATION_2026-09-23.md',
      detail: 'RETRY_SAFE_OPERATION ist aktiviert und liegt vor dem produktiven Audit-Commit; generische Issue-Autofixes und weitere geschützte Aktionen bleiben held.',
    },
    {
      id: 'FIN-SENT-01',
      title: 'Attested Market Sentiment Projection',
      owner: 'CAPITAL-AI-FINTECH',
      state: 'production-covered',
      stateLabel: 'LIVE AUDIT BASELINE',
      source: 'PR #1332 · docs/projects/fintech/work-packages/FIN_SENT_01_ATTESTED_MARKET_SENTIMENT_2026-09-23.md',
      detail: 'Der aktuelle Production-Audit-Commit ist exakt der FIN-SENT-01 Merge. Das Frontend darf nur attestierte Projektionen konsumieren; fehlende Evidence bleibt NOT_COMPUTABLE.',
    },
    {
      id: 'PRICING-ARCHIVE-PUBLIC-VISIBILITY',
      title: 'Pricing archiviert / Public Visibility getrennt',
      owner: 'CAPITAL-AI-FE · CAPITAL-AI-OPS · CAPITAL-AI-COMP',
      state: 'production-covered',
      stateLabel: 'INTEGRIERT · PRODUCTION COVERED',
      source: 'PRs #1324/#1325/#1326/#1327',
      detail: 'Öffentliche Sichtbarkeit ist von Execution-Entitlements getrennt; archiviertes Pricing ist im Frontend, Checkout-Guard und Legal-Text konvergiert.',
    },
    {
      id: 'AUTH-REGISTRATION-PROFILE',
      title: 'Registrierung, Profil & Auth-Sicherheit',
      owner: 'CAPITAL-AI-OPS',
      state: 'main-only',
      stateLabel: 'MERGED MAIN · PRODUCTION PENDING',
      source: 'PR #1331 · docs/projects/operations/work-packages/OPS_AUTH_REGISTRATION_PROFILE_CONVERGENCE_2026-09-23.md',
      detail: 'Der Auth/Profile-Slice ist auf CURRENT_MAIN gemerged, lag beim Production-Audit aber noch einen Deploy hinter dem live Commit.',
      nextGate: 'Exact-SHA Production-Korrelation nach dem nächsten erfolgreichen Deploy.',
    },
  ] satisfies RoadmapIntegrationItem[],
  queuedItems: [
    {
      id: 'QM-PR900-02',
      owner: 'CAPITAL-AI-QM',
      state: 'ready',
      stateLabel: 'READY FOR EXECUTION',
      source: 'docs/projects/quality-management/ROADMAP.md',
      gate: 'Exact-snapshot Quality evidence remains the current QM successor; proposed QM-V2 coordination authority still depends on ADR-0103 acceptance/Human merge.',
    },
    {
      id: 'SH-02.12',
      owner: 'CAPITAL-AI-OPS',
      state: 'held',
      stateLabel: 'HELD · ROUTED ISSUE AUTO-FIX',
      source: 'docs/projects/operations/ROADMAP.md',
      gate: 'No generic Issue-derived code-remediation executor is authorized; any later activation requires fresh CURRENT_MAIN, bounded branch-only remediation and Human/CODEOWNER merge authority.',
    },
    {
      id: 'WP-SEO-METRICS',
      owner: 'CAPITAL-AI-SEO',
      state: 'held',
      stateLabel: 'PROVIDER READ GATE',
      source: 'docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md',
      gate: 'Requires a real least-privileged GSC + GA4 read snapshot. Repository wiring or historical provider evidence is not a current metrics PASS.',
    },
    {
      id: 'WP-SEO-AI-VIS',
      owner: 'CAPITAL-AI-SEO',
      state: 'held',
      stateLabel: 'GENAI VISIBILITY READ GATE',
      source: 'docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md',
      gate: 'Requires real Search Console GenAI performance evidence; missing data/read surface must not be converted into PASS.',
    },
    {
      id: 'FIN-LF-01',
      owner: 'CAPITAL-AI-FINTECH',
      state: 'held',
      stateLabel: 'HELD · LATER PHASE DEPENDENCY',
      source: 'docs/projects/fintech/ROADMAP.md',
      gate: 'Productive landing scorer consumption remains held behind later integration readiness plus Security/QM evidence.',
    },
    {
      id: 'SOCIAL-P3',
      owner: 'CAPITAL-AI-SOCIAL',
      state: 'held',
      stateLabel: 'DEPENDENCY HELD',
      source: 'docs/projects/social-media/ROADMAP.md',
      gate: 'Requires real provider publication identity plus real analytics evidence.',
    },
  ] satisfies RoadmapQueuedItem[],
} as const;
