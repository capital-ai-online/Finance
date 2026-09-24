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
  executionGroup?: string;
  dependsOn?: string[];
}

export interface RoadmapQueuedItem {
  id: string;
  owner: string;
  state: RoadmapQueueState;
  stateLabel: string;
  source: string;
  gate: string;
  executionGroup?: string;
  dependsOn?: string[];
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
  schemaVersion: '1.4.0',
  role: 'NON_AUTHORIZING_DERIVED_UI_PROJECTION',
  correlatedDate: '2026-09-24',
  correlatedMainSha: 'fdc6c2f1ad831bbd7fe7f9078231b855a744adc7',
  currentMainSha: 'fdc6c2f1ad831bbd7fe7f9078231b855a744adc7',
  productionAudit: {
    observedCommitSha: '7c1d9293ee4c61e32791e447463fcaf263644c6d',
    deployId: 'dep-daq2vqou01pc73fjldv0',
    classification: 'LIVE_HEALTHZ_REQUIRED_FOR_CURRENT_MAIN',
    previousFailedDeployId: 'dep-daq378mk1f9s738adt70',
    latestFailedDeployId: 'dep-daq3dkmgekts73be39i0',
    note: 'Repository correlation advanced to current main after the previous production audit snapshot. Runtime identity is intentionally not inferred here and continues to be read live from /healthz.',
  },
  branding: {
    brandmark: 'docs/frontend/brandmark.json',
    designTokens: 'docs/frontend/design-tokens.json',
    logoProjection: 'src/features/public/ui/frontend-port/components/BrandLogo.tsx',
    pageTemplate: 'src/features/public/ui/LandingPageTemplate.tsx',
    landingAdapter: 'src/features/public/ui/frontend-port/frontend-port.css',
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
      executionGroup: 'FE-ROADMAP-LIVE',
      detail: 'Re-correlates the read-only /roadmap projection to CURRENT_MAIN, removes terminal provider writers and adds a production/SEO integration ledger without creating a second task authority.',
    },
    {
      id: 'SH-02.11',
      executionGroup: 'OPS-SH-02.11',
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
      executionGroup: 'GOV-SH-V3',
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
      executionGroup: 'OPS-02-CI-01E',
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
      executionGroup: 'SEC-WEB-HARDENING-01',
      title: 'Public Website & Secure Deployment Convergence',
      owner: 'CAPITAL-AI-SEC',
      relationship: 'cross-cutting Security; productive remediation stays with canonical owners',
      phase: 'Security & Compliance',
      state: 'active',
      stateLabel: 'ACTIVE · IMPLEMENTATION OPEN',
      source: 'docs/architecture/ROADMAP.md',
      sourceType: 'canonical-roadmap',
      detail: 'Fresh main correlation leaves SEC-WEB-HARDENING-01 as the only active SEC program. Former project-local roadmap/work-package queues are retired as current status sources; productive remediation remains owner-correct.',
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
      executionGroup: 'SEO-LAUNCH',
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
      executionGroup: 'SOCIAL-P1-P2',
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
      executionGroup: 'SOCIAL-P1-P2',
      dependsOn: ['SOCIAL-P1'],
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
  ] as RoadmapWorkPackage[],
  integrationLedger: [
    {
      id: 'SEC-AUTH-DIAG-AAL2-01',
      title: 'AAL2 Diagnostic Supersession',
      owner: 'CAPITAL-AI-SEC',
      state: 'repository-integrated',
      stateLabel: 'SUPERSEDED · NOT ACTIVE',
      source: 'PR #1257 · .ai/work-claims/CAPITAL-AI-SEC-AUTH-AAL2-DIAGNOSTIC-SUPERSESSION-20260922.json',
      detail: 'The diagnostic slice merged and its claim is released. Fresh Owner direction superseded the client-auth diagnostic work with the backend-first authentication rebuild; retained SEC documentation is evidence only.',
    },
    {
      id: 'DOC-ROADMAP-CORRELATION',
      title: 'Documentary Roadmap Correlation',
      owner: 'CAPITAL-AI-DOC',
      state: 'repository-integrated',
      stateLabel: 'KORRELIERT · KEINE AKTIVE AUSFÜHRUNG',
      source: 'docs/projects/documentary/ROADMAP.md · PRs #1310/#1154/#1131',
      detail: 'CAPITAL-AI-DOC / PVC-03 hat auf dieser CURRENT_MAIN-Generation kein ausführbares aktives Arbeitspaket: WP-DOC-14..16 sind terminal, WP-DOC-17 ist historisch/not-applicable, WP-06A..E ist terminal, AUTO-01 und die startup_failure-Remediation sind gemergt. Verbliebene active-Marker sind stale Coordination-Evidence und werden nicht als Live-Arbeit reaktiviert.',
      nextGate: 'Nur frische Failure-Evidence oder neue Human/Owner-Direction darf DOC-Arbeit aktivieren; die spätere Roadmap-Entfernung bleibt an den kanonischen Post-Social-Handoff gebunden.',
    },
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
      stateLabel: 'MERGED MAIN · PRODUCTION BLOCKED AFTER RECOVERY',
      source: 'PR #1331 + PR #1334 · Render dep-daq3dkmgekts73be39i0',
      detail: 'Auth/Profile und die bounded Render-Startup-Recovery #1334 sind auf CURRENT_MAIN. Der anschließende Exact-SHA Deploy 426a98d4… baute erfolgreich, scheiterte aber erneut beim Runtime-Start mit SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING; Production bleibt auf 7c1d9293….',
      nextGate: 'Owner-korrekte OPS-Konfigurationskorrelation: wirksame server-only Management-Credential-Bereitstellung verifizieren, ohne Secret-Werte in Evidence zu lesen; danach Exact-SHA erneut promoten.',
    },
    {
      id: 'OPS-DEPLOY-426A98',
      title: 'CURRENT_MAIN Production Promotion after Auth Recovery',
      owner: 'CAPITAL-AI-OPS',
      state: 'main-only',
      stateLabel: 'EXACT-MAIN DEPLOY FAILED · RUNTIME CONFIG',
      source: 'Render dep-daq3dkmgekts73be39i0 · main@426a98d4703271e438cbc6df4b1442fb3a9b032d',
      detail: 'Der post-recovery Deploy startete innerhalb der SLA, checkout/build/release-manifest/Quality waren PASS. Beim Runtime-Start löste keine der in #1334 akzeptierten server-only Credential-Variablen einen nutzbaren Management-Token auf; der fail-closed Guard beendete den Start mit SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING.',
      nextGate: 'CAPITAL-AI-OPS muss die tatsächliche Render-Service-Umgebungsbindung owner-korrekt verifizieren/reparieren; danach exact 426a98d4… oder den dann aktuellen Main deployen und /healthz korrelieren.',
    },
  ] satisfies RoadmapIntegrationItem[],
  queuedItems: [
    {
      id: 'SEC-WEB-00',
      executionGroup: 'SEC-WEB-HARDENING-01',
      owner: 'CAPITAL-AI-SEC',
      state: 'ready',
      stateLabel: 'READY · P0 BASELINE',
      source: 'docs/architecture/ROADMAP.md',
      gate: 'Correlate the exact current public attack surface, trust boundaries, controls, owner returns and verification gates before downstream remediation.',
    },
    {
      id: 'SEC-WEB-10',
      executionGroup: 'SEC-WEB-HARDENING-01',
      owner: 'CAPITAL-AI-SEC · CAPITAL-AI-OPS',
      state: 'ready',
      stateLabel: 'READY · P0 ARTIFACT CHAIN',
      source: 'docs/architecture/ROADMAP.md',
      gate: 'Converge registry digest, signature, attestation, SBOM, source SHA and deployed artifact identity without transferring OPS ownership to SEC.',
    },
    {
      id: 'SEC-WEB-20',
      executionGroup: 'SEC-WEB-HARDENING-01',
      dependsOn: ['SEC-WEB-00', 'SEC-WEB-10'],
      owner: 'CAPITAL-AI-SEC · CAPITAL-AI-FE · CAPITAL-AI-OPS',
      state: 'held',
      stateLabel: 'HELD · READY AFTER P0',
      source: 'docs/architecture/ROADMAP.md',
      gate: 'Depends on P0 baseline/artifact convergence before strict route-minimal browser isolation and CSP promotion evidence.',
    },
    {
      id: 'SEC-WEB-30',
      executionGroup: 'SEC-WEB-HARDENING-01',
      dependsOn: ['SEC-WEB-00', 'SEC-WEB-10'],
      owner: 'CAPITAL-AI-SEC · CAPITAL-AI-OPS',
      state: 'held',
      stateLabel: 'HELD · READY AFTER P0',
      source: 'docs/architecture/ROADMAP.md',
      gate: 'Depends on P0 convergence; requires route-specific AuthN/AuthZ, input, method, rate/budget and abuse negative evidence.',
    },
    {
      id: 'SEC-WEB-40',
      executionGroup: 'SEC-WEB-HARDENING-01',
      dependsOn: ['SEC-WEB-00', 'SEC-WEB-10'],
      owner: 'CAPITAL-AI-SEC · CAPITAL-AI-OPS',
      state: 'held',
      stateLabel: 'HELD · READY AFTER P0',
      source: 'docs/architecture/ROADMAP.md',
      gate: 'Depends on P0 convergence; readiness, rollback and runtime/deployment identity must be proven for the exact safe artifact.',
    },
    {
      id: 'SEC-WEB-50',
      executionGroup: 'SEC-WEB-HARDENING-01',
      dependsOn: ['SEC-WEB-20', 'SEC-WEB-30', 'SEC-WEB-40'],
      owner: 'CAPITAL-AI-SEC · CAPITAL-AI-QM',
      state: 'queued',
      stateLabel: 'QUEUED · IMPLEMENTATION RETURN',
      source: 'docs/architecture/ROADMAP.md',
      gate: 'Independent runtime/DAST/transport verification starts only after owner implementation returns; no unresolved CRITICAL/HIGH finding may be promoted as PASS.',
    },
    {
      id: 'QM-PR900-03',
      executionGroup: 'QM-ACTIONS-ASSURANCE',
      owner: 'CAPITAL-AI-QM',
      state: 'ready',
      stateLabel: 'READY · INDEPENDENT ASSURANCE',
      source: 'docs/architecture/ROADMAP.md',
      gate: 'Run read-only assurance of Actions/runner efficiency against current OPS evidence; workflow/provider mutation remains OPS-owned.',
    },
    {
      id: 'QM-PR900-04',
      executionGroup: 'QM-READINESS',
      dependsOn: ['QM-PR900-03'],
      owner: 'CAPITAL-AI-QM',
      state: 'held',
      stateLabel: 'HELD · DEPENDS ON QM-PR900-03',
      source: 'docs/architecture/ROADMAP.md',
      gate: 'Cross-project readiness/provenance evidence is meaningful only after QM-PR900-03 reaches a terminal outcome.',
    },
    {
      id: 'SH-02.12',
      executionGroup: 'OPS-SH-02.12',
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
