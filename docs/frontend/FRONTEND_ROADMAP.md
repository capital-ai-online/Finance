# CAPITAL-AI Frontend Roadmap

**Projekt:** capital-ai.online  
**Repository:** SvenKulessa/Finance  
**Version:** 1.9.0  
**Stand:** 7. September 2026  
**Korrelationsbasis:** `main@fb3fff1f3959d1c6f87d20228036366848600487`  
**Current Project:** `CAPITAL-AI-FE`  
**Current Project Folder:** `docs/projects/frontend/`  
**Primary Productive PVC:** `N/A` (`[]`)  
**Primary Owner:** `CAPITAL-AI-FE`  
**Normative Frontend-Authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Bestandsnachweis:** `docs/frontend/COMPONENT_INVENTORY.md`

Dieses Dokument ist die **bestehende kanonische Frontend-Migrations-, Visual-Recovery- und UX-Roadmap**. Version 1.9.0 erweitert diese Roadmap um die Owner-gerichtete Visual-Klassifikation für Buffett Value Check, Sentiment und Momentum, die grafische Anbindung der bestehenden FINTECH-Orchestrierungs-/Scoring-Kette an die Asset-Universen, Crypto-Kategorie-/Unterklassen-Navigation sowie die Wiederverwendung derselben Visual-Projektionen durch die Social-Media-Rendering-Pipeline. Es entsteht weder eine zweite Roadmap noch eine parallele Frontend-, Visualization-, Server-State-, Scoring-, Data-, Evidence-, IAM-, Social-Publishing- oder Governance-Architektur.

- `FRONTEND_ARCH.md` bestimmt **wie** das Frontend strukturiert sein muss.
- `COMPONENT_INVENTORY.md` beschreibt **was** aktuell existiert und welche Recovery-/Contract-Gates gelten.
- `FRONTEND_ROADMAP.md` bestimmt **wann/in welcher Reihenfolge** migriert und modernisiert wird.
- `design-tokens.json` und `brandmark.json` bleiben die kanonischen Brand-Verträge.
- Primary-Owner-Roadmaps, `SC-MD-SPT-0001` und anwendbare ADR-/ESS-/API-/Data-Contracts bestimmen fachliche Runtime-/Evidence-/Scoring-/Governance-Semantik.
- `CAPITAL-AI-SOCIAL` bleibt Owner der SocialMediaEngine-/Publishing-Flächen; Frontend liefert nur wiederverwendbare, deterministische Visual-Projektionen/Renderdaten.

Prinzip: **Projection, not Redefinition. One Frontend architecture, one roadmap, no parallel authority.**

---

## 1. Zielbild und harte Qualitätsgates

Zielarchitektur:

```text
src/app
  -> src/features/<domain>/ui
  -> src/shared
```

Nicht zulässig sind ein zweiter Frontend-Root, eine parallele Visualization-Architektur, neue produktive Domain-Implementierungen unter `src/components/`, Frontend-lokale Scoring-/Ranking-/Evidence-/Freshness-/Entitlement-/IAM-/Governance-Authority oder synthetische Finanzwerte als Ersatz für explicit unavailable/stale/invalid/partial/not-computable states.

| Dimension | Current planning score | Target | Exit Gate |
|---|---:|---:|---|
| Visualization | **6.5/10** | **>= 8.5/10** | gemeinsame Visual-Primitives, Data States, Accessibility-Alternative, keine synthetic Finance-Werte |
| Server-/Data-Contract Architecture | **6.0/10** | **>= 8.5/10** | UI-/Server-State getrennt, Boundary Validation, cancellation/dedup/invalidation, canonical contracts |
| Accessibility | **6.5/10** | **>= 8.0/10** | WCAG-2.2-AA-Scope, keyboard/focus/screenreader evidence, chart alternatives, axe + manual evidence |
| Performance | **7.0/10** | **>= 8.5/10** | p75 LCP <=2.5s, INP <=200ms, CLS <=0.1, Lighthouse Performance >=90, bundle budgets |
| Productive Legacy Exit | **4.0/10** | **10.0/10** | 0 productive `src/components` implementations, 0 required compatibility exports, 0 superseded UI/API consumers, 0 Legacy Dashboard composition |

Current scores are planning assessments, not PASS evidence.

---

## 2. Verifizierter Current-Main-Stand

### Abgeschlossen

- [x] BB-0 Foundation / PR #459.
- [x] BB-1 Application Composition / PR #462.
- [x] BB-2 View Contract / PR #546 and Composition Boundary / PR #548.
- [x] BB-2D View Router / PR #763.
- [x] Browser/Public Root Recovery / PR #782 + #788.
- [x] Public Enterprise Scorer / PR #820 as projection of the same canonical Crypto scorer.
- [x] Public Analysis Sideboard / PR #825 without restoring Legacy Dashboard as Public Root.
- [x] Branding v6.2 / PR #791.
- [x] CV-0 read-only Authority/Freshness/Evidence presentation primitives.
- [x] RankingBoard canonical; UniverseBestWorst compatibility-only.
- [x] RawMaterialsDashboard canonical; Legacy path bridge-only.
- [x] Buffett Value Check current implementation consumes server entitlement plus verified asset-display evidence and represents unavailable inputs explicitly.
- [x] FINTECH current main exposes one `ScoringModelRegistry`, one `ScoringDispatcher`, canonical champions plus bounded research/challenger models.
- [x] Crypto classification currently exposes 25 canonical categories plus canonical subcategory/tier metadata.
- [x] SocialMediaEngine `MediaProjectV2` supports deterministic chart layers; ADR-0094 retains deterministic image/short-video rendering and publishing separation.

### Current Restschuld

- `src/components/Dashboard.tsx` remains the largest authenticated composition monolith.
- Navigation, Drawer, Header and Home/MyWorkspace composition remain incomplete.
- Many feature facades still re-export implementations from `src/components/`.
- `PortfolioPerformance.tsx` generates synthetic performance/risk values.
- `HeatmapCreator.tsx` seeds/derives local financial analytics semantics.
- Legacy `MarketSentiment.tsx` defaults missing score/label to `50` / `Neutral` and remains Class B; the new canonical Sentiment Dashboard must not reuse that fallback behavior.
- `Charts.tsx` consumes `/api/charts-scoring` (`NON_PRODUCTION_SIMULATION`) and `/api/backtest-history` compatibility history.
- `ComplianceExporter.tsx` contains fixed portfolio/risk KPIs without verified financial evidence.
- `RealTimeRiskAssessment.tsx` is archived/disabled and must not be silently reactivated.

DATA PR #827 is included in the baseline: provider input validation, freshness, provenance lineage and DQ are composed into current `ValidatedDataInput`; FE must project these states and must not redefine them via cache age or UI defaults.

---

## 3. BB-2 remains highest Frontend priority

Order unless an explicit Owner decision changes it:

1. **BB-2E Navigation / Drawer completion**
2. **BB-2F Header / Application Shell extraction**
3. **BB-2G Dashboard Home / MyWorkspace visual-parity cutover and composition closure**

### BB-2E

Extract desktop navigation/mobile drawer, consume canonical `DashboardView`/section contracts, prove focus order/trap/return-focus/touch targets, no second routing authority.

### BB-2F

Extract Header/Profile/Logout/workspace chrome; Session/Auth remains `src/app/auth`-owned; no browser-side entitlement authority.

### BB-2G

Before Legacy Dashboard removal, prove visual/functional parity for every approved productive Home/MyWorkspace capability through app-owned composition:

```text
src/app/dashboard/DashboardHome.tsx      # or equivalent
src/app/dashboard/MyWorkspaceView.tsx    # or equivalent
  -> feature facades
  -> canonical feature implementations
  -> shared UI/visualization primitives
```

No cloned domain implementation, local score/data/evidence fabrication or entitlement/IAM boundary shift.

---

## 4. Visual Recovery

- **A — CANONICALIZE_NOW:** Owner-approved visual whose current or target consumer can project a valid current contract without inventing domain truth.
- **B — CONTRACT_REMEDIATION_REQUIRED:** useful visual but current Data/Evidence/Authority contract is not production-valid; no synthetic fallback activation.
- **C — EXPLICITLY_DISABLED_OR_ARCHIVED:** no reactivation without explicit current Owner decision and required contracts/architecture.

| Surface | Class | Current finding | Recovery Gate |
|---|---|---|---|
| Enterprise Scorer | A | canonical Crypto slice; public recovery merged | feature facade; Legacy bridge at 0 consumers |
| RankingBoard | A | canonical UI; FIN-17 backend rank/order closure remains | consume backend rank/order; remove FE-local ordering semantics and aliases |
| Realtime AI Newsfeed | A | evidence-only; no fabricated headlines/score mutation | physical migration to news feature + explicit data states |
| RawMaterialsDashboard | A | canonical fail-closed commodity surface | remove Legacy bridge at 0 consumers |
| **Buffett Value Check** | **A** | server entitlement + verified stock display; missing evidence shown as unavailable; user-approved recovery | physical migration to `src/features/stocks/ui`; keep manual assumptions explicitly labeled; Legacy consumers = 0 |
| **Sentiment Dashboard** | **A** | target projection over `crypto-sentiment-research/0.1.0`; research-only, fail-closed `NOT_COMPUTABLE` instead of neutral 50 | canonical feature implementation; evidence refs/status shown; no reuse of Legacy `MarketSentiment` defaults |
| **Momentum Dashboard** | **A** | target projection over `crypto-momentum-research/0.1.0`; explicit missing fields/effective weights; research-only | canonical feature implementation; model/version/coverage/state shown; no local score invention |
| **Asset Universe Model/Orchestration Graph** | **A** | target read-only projection of FINTECH registry/dispatcher/orchestration metadata | registry-driven model nodes; lifecycle/evidence/authority labels; no FE routing authority |
| **Crypto Category / Subclass Workspace** | **A** | target projection of canonical Crypto categories/subcategories/tier plus applicable FINTECH models | category tabs derive from canonical classification; model/formula details only from FINTECH-owned descriptors/contracts |
| MarketScreener / Screener | A/B boundary | productive but physical/contract audit incomplete | canonical contracts + physical migration |
| Watchlist | B | local persistence/fallback financial values | field-level contract audit; unavailable instead of fallback |
| Legacy Market Sentiment | B | missing score/label -> `50` / `Neutral` | replace consumer with canonical Sentiment Dashboard or remediate defaults; explicit nullable/state semantics |
| Charts | B | simulation/compatibility scoring/history | canonical DATA history/OHLCV + FINTECH compatibility exit |
| Heatmap | B | preset/local bullish/volume/pattern semantics | verified contract or explicit research/unavailable |
| Portfolio Performance | B | synthetic trend + fixed risk metrics | verified NAV/performance contract; Owner `REQUIRES_CORRELATION` |
| Backtest / PortfolioBacktester | B | protected execution/history boundaries open | FINTECH protected execution + DATA canonical history |
| Monte Carlo | B | protected execution authority incomplete | FINTECH owner-side contract first |
| Compliance / Reporting | B | fixed unsupported financial KPIs | verified metrics or explicit unavailable |
| Governance / Admin | A/B boundary | approved UI, much physical Legacy | feature migration without IAM/Governance authority takeover |
| Admin Process Graph | A | feature-owned read-only projection | preserve projection-only boundary |
| Risk Assessment / VaR | C | archived null stub | explicit Owner + verified risk contract required |
| InteractModule | C | archived/deactivated | remains archived without new Owner decision |

**Visual Recovery means preserve approved functionality, not Legacy code.** A Class-A target may be not yet productively rendered; Class A authorizes canonicalization planning, not fabricated runtime evidence or foreign-domain authority.

---

## 5. Visualization System — target >= 8.5/10

### Renderer selection by best-fit use case

| Candidate | Best-fit use cases | Explicit non-fit / boundary | Decision |
|---|---|---|---|
| **Recharts** | Buffett valuation curves/bars, Sentiment/Momentum time series, score breakdowns, rank/distribution charts, standard gauges/bars/areas | no node-edge orchestration topology; no custom business semantics | **DEFAULT** for standard financial/dashboard charts |
| **D3** | bounded custom geometry such as dense category maps, advanced heatmaps, bespoke interaction where Recharts cannot express the requirement | only after contract-valid data; no local analytical/scoring semantics | **BOUNDED SPECIALIST** |
| **React Flow / XYFlow** | FINTECH Registry -> Dispatcher -> Executor -> Result and orchestration/workflow topology; true node-edge dependency/lineage views | not for price/momentum/sentiment time series | **PREFERRED NODE-EDGE CANDIDATE**, dependency evaluation/installation remains separate |
| **MediaProjectV2 + ADR-0094 deterministic renderer** | Social cards, chart scenes, 1:1/16:9/9:16 frames and short-video sequences using the same normalized visualization data/labels/tokens | no OAuth/publishing authority; no screenshots as financial source-of-truth | **SOCIAL RENDER TARGET** |

Planned fachneutrale shared primitives:

- `ChartFrame`, `ResponsiveChartContainer`, `VisualizationToolbar`, `TimeRangeControl`, `VisualizationLegend`, `DataStateOverlay`, `VisualizationSkeleton`, `AccessibleDataSummary`, bounded Crosshair/Tooltip primitives.
- planned `VisualizationSnapshot` / equivalent serializable projection containing chart kind, deterministic labels, data series, status, source/model/version/evidence references, timestamps and brand-token references. Exact contract name/path is implementation-time scoped and must not become a second Data/Scoring contract.

Required states:

`loading | available | partial | stale | invalid | not-computable | unavailable | error`

Charts require accessible names/descriptions, text/table alternatives, keyboard-operable controls, non-color-only status, reduced-motion support and tooltips that are not the only information carrier.

### FE -> Social rendering handoff

The same normalized visual projection used by the browser must be reusable by `CAPITAL-AI-SOCIAL` without DOM scraping or recomputation of financial semantics:

```text
FINTECH/DATA authoritative result
  -> FE visualization ViewModel / serializable snapshot
     -> browser renderer (Recharts / D3 / node-edge renderer)
     -> Social MediaProjectV2 chart/scene layers
        -> ADR-0094 deterministic image/frame/video renderer
        -> existing Social validation/approval/publishing boundary
```

Requirements:

- identical numeric labels, model/version, data/evidence state and disclaimers across web/social outputs;
- `publishReady=false` and existing Social approval/publishing authority remain unchanged;
- social rendering may animate/order already-authoritative data but may not invent scores, price moves, sentiment, momentum, rankings or model conclusions;
- FE owns reusable presentation schema/visual semantics only; Social owns MediaProject/render/publishing integration.

---

## 6. Asset Universe + FINTECH Model/Orchestration Visualization

Every scoreable Asset Universe receives a read-only **Models & Orchestration** panel driven by current FINTECH descriptors/contracts rather than a hardcoded second registry.

### Current-main model attachment baseline

| Asset Universe | Canonical productive model | Current additional model/research nodes to visualize | FE rule |
|---|---|---|---|
| Crypto | `crypto-technical-provenance@0.7.0` | `crypto-meme-integrity@0.3.0` challenger; `crypto-defi-fundamental@0.3.0` challenger; Sentiment, Momentum, Regime, Pattern Confluence, Signal Fusion, Kill-Switch research telemetry; `CryptoOrchestrator` research enrichment | lifecycle/`scoreEligible`/authority must be visually explicit; challengers never look productive |
| Stocks | `traditional-scoring@2.1.0` | Buffett Value Check as stock-only valuation analysis consumer; FINTECH workflow/dispatcher lineage as applicable | Buffett is analysis/valuation presentation, not replacement scoring authority |
| Forex | `traditional-scoring@2.1.0` | dispatcher/executor/result lineage | no invented category model |
| Indices | `traditional-scoring@2.1.0` | dispatcher/executor/result lineage | no invented category model |
| Commodities | `commodity-evidence-scoring@1.0.0` | `commodity-energy-hybrid@0.1.0`, `commodity-industrial-metals-hybrid@0.1.0`, `commodity-precious-metals-hybrid@0.1.0`, `commodity-agriculture-hybrid@0.1.0` challengers | challengers remain research/non-executable until FINTECH promotion |
| Bonds | `sovereign-benchmark-yield-scoring@1.0.0` for supported government benchmark yields | dispatcher/executor/result lineage | individual bond scoring stays unavailable unless FINTECH authority changes |

The graph must show, where supplied by FINTECH: model ID/version, alias/lifecycle, feature contract, result contract, evidence policy, executor key, score eligibility, asset/instrument scope, upstream DQ state and downstream rank/result relationship.

### Orchestration topology

At minimum the visual topology represents the current authority chain:

```text
Validated DATA / UAI
  -> Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor Adapter
  -> CanonicalScoreResult
  -> Ranking / Decision Support
  -> Traceability
```

`CryptoOrchestrator` is rendered separately as **Research / Enrichment only**; `FinTechCore` is rendered separately as **Financial Workflow Composition** and must not visually appear as a second scorer/dispatcher.

---

## 7. Crypto Categories / Subclasses / Model Tabs

Crypto receives an own hierarchical workspace beneath the Crypto Asset-Universe tab.

### Navigation model

```text
Crypto
  -> Overview
  -> Categories
     -> Layer 1
     -> Layer 2
     -> DeFi
     -> Smart Contract Platform
     -> Infrastructure
     -> Oracle
     -> Gaming
     -> AI / Data
     -> Payments
     -> Privacy
     -> Meme
     -> Stablecoin
     -> Exchange Token
     -> Governance
     -> Real World Assets
     -> Storage / Compute
     -> Interoperability
     -> Liquid Staking
     -> Restaking
     -> Bridging
     -> NFT / Creator
     -> Derivatives
     -> DAO / Community
     -> Index / Basket
     -> Utility Token
     -> Unknown
  -> Models & Orchestration
```

Within each category, the UI may further expose the canonical `category_sub`, `asset_type`, tier/confidence and member assets supplied by the classification contract.

### Formula/model presentation contract

Each Crypto category tab must show the **actual applicable FINTECH model binding**:

1. canonical champion model and version;
2. dedicated category challenger/research model where one exists;
3. formula/weight breakdown only when it is supplied by a current FINTECH-owned model/research contract;
4. evidence/data requirements and missing/not-computable semantics;
5. lifecycle badge: `canonical`, `challenger`, `research-only` or other exact supplied state;
6. `scoreEligible` / `executionEligible` state;
7. explicit distinction between canonical score, research score/context and workflow telemetry.

Current dedicated category models are Meme and DeFi research challengers. Other categories continue to show the canonical Crypto champion plus applicable research enrichment until FINTECH provides a dedicated governed model. **Frontend must not invent a unique scoring formula merely because a category tab exists.**

If FINTECH later promotes a category-specific model, a scoped owner-side supersession may replace the old binding; FE then cuts over via registry/contract metadata and removes compatibility presentation only at zero consumers.

---

## 8. Server-State / Data-Contract Architecture — target >= 8.5/10

Evaluate **TanStack Query** for central query keys, AbortSignal/cancellation, request deduplication, explicit invalidation, bounded retries and separation of local UI state from server state. Cache state never redefines evidence freshness.

Contract tooling evaluation:

- **Zod** runtime validation at API/Data boundaries where no equivalent repo-native validation exists.
- **openapi-typescript** only when canonical current OpenAPI exists.
- **MSW** deterministic contract/failure/stale/partial/error tests.
- **OpenTelemetry JS** only conditionally with OPS/privacy correlation; no parallel telemetry authority.

No dependencies are installed by this documentation slice.

---

## 9. Contract Supersession Lane

**Owner direction for this roadmap:** Supersessions are expressly permitted during execution when they improve the canonical implementation, including visual/consumer compatibility exits and owner-approved FINTECH/Data contract replacements. This does not transfer foreign Primary-Owner authority to Frontend.

Every supersession still follows `/AGENTS.md`: exact target, replacement scope, exclusions, semantic/impact package, equal-or-higher applicable authority, owner-side decision where foreign-owned, consumer cutover, zero productive consumers for compatibility removal, retained historical/audit evidence.

Workflow: exact blocker -> current Primary Owner resolution -> exact replacement scope/exclusions/impact -> owner-side decision -> consumer cutover -> zero productive consumers -> compatibility removal -> retain historical/audit evidence.

| Blocker / supersession opportunity | FE impact | Owner route |
|---|---|---|
| `/api/charts-scoring` | `NON_PRODUCTION_SIMULATION` consumer | `CAPITAL-AI-FINTECH`; FE cutover then owner-side removal at 0 consumers |
| `/api/backtest-history` | compatibility/simulated history | DATA canonical history/evidence + FINTECH protected Backtest execution |
| FIN-17 rank/order | RankingBoard must not own rank/order semantics | `CAPITAL-AI-FINTECH / PVC-17` |
| Legacy `MarketSentiment` neutral-default semantics | blocks canonical Sentiment Dashboard | FE consumer supersession; contract changes only through exact sentiment/data owner |
| hardcoded asset->model UI mappings | drift risk vs. FINTECH registry | supersede with registry-driven visual projection; FINTECH registry remains authority |
| category-model visual binding | needs future FINTECH category model promotion | FINTECH owner-side model supersession; FE projection follows new registry binding |
| Portfolio NAV/performance series | PortfolioPerformance cannot be evidence-valid | **REQUIRES_CORRELATION — resolve exact Primary Owner from then-current PVC/project/contract authority; FE does not guess** |
| Heatmap analysis semantics | current UI fabricates/derives analytical values | **REQUIRES_CORRELATION** before creating/changing a domain contract |
| Compliance financial KPIs | fixed metrics are not audit evidence | resolve exact then-current financial contract authority per metric |

---

## 10. Portfolio Performance Integrity Gate

`src/components/PortfolioPerformance.tsx` remains **Class B**. Its deterministic generated performance series and fixed Sharpe/Drawdown/Volatility/VaR values are not productive Financial Evidence.

Future activation requires:

- portfolio NAV/performance time series;
- `observedAt` / `asOf`;
- provenance/source identity;
- freshness state;
- explicit unavailable/stale/error states;
- owner-authoritative methodology/result semantics for derived risk metrics.

**Primary Owner: `REQUIRES_CORRELATION`. No FE-side owner assumption is authorizing.**

---

## 11. Accessibility — target >= 8.0/10

Target: WCAG 2.2 AA; BFSG / EN 301 549 where applicable to then-current product/legal scope.

Evaluate/reuse Vitest, Storybook + accessibility addon, axe-core and Playwright.

Evidence gates: keyboard-only critical journeys, logical focus order, dialog/drawer focus management and return focus, landmarks/accessible names, chart text/table alternatives, non-color-only status, reduced motion, zoom/reflow, touch targets, mobile navigation and accessible loading/error/empty states. Automated axe checks complement but do not replace manual keyboard/screenreader evidence.

Asset Universe model graphs additionally require keyboard traversable node order and an equivalent structured text/table lineage. Crypto category tabs require proper tab semantics and non-color-only model lifecycle/status labels.

---

## 12. Performance — target >= 8.5/10

Evaluate/reuse Vite, Lighthouse CI, `web-vitals`, `rollup-plugin-visualizer`, Browser Performance APIs.

p75 targets: LCP <=2.5s, INP <=200ms, CLS <=0.1. Additional targets: Lighthouse Performance >=90, Lighthouse Accessibility >=95.

Actions: route/workspace lazy loading, lazy heavy chart/D3/node-edge modules, no unnecessary authenticated bundles in Public bootstrap, eliminate request waterfalls, deduplicate server-state requests, bundle budgets, long-task/main-thread observation, reduced motion. Asset-category/model metadata should be fetched/deduplicated once per compatible contract version rather than per visible chart. Performance must never weaken security/data-integrity/provenance/evidence/authorization gates.

---

## 13. OSS / Free Tooling Evaluation

| Candidate | Role | Availability | Decision |
|---|---|---|---|
| Recharts | standard charts | OSS/MIT, present | REUSE / DEFAULT |
| D3 | custom geometry | OSS/ISC, present | REUSE BOUNDED |
| React Flow / XYFlow | node-edge graphs | OSS | EVALUATE / BEST FIT FOR ORCHESTRATION GRAPH; installation separate |
| TanStack Query | server state | OSS/MIT | EVALUATE / HIGH FIT |
| Zod | runtime validation | OSS/MIT | EVALUATE / HIGH FIT |
| openapi-typescript | typed OpenAPI | OSS/MIT | CONDITIONAL on canonical OpenAPI |
| MSW | API virtualization/tests | OSS/MIT | EVALUATE / HIGH FIT |
| Storybook + a11y addon | component lab/a11y | OSS | EVALUATE, no BB-2 bypass |
| axe-core | automated a11y | OSS/MPL-2.0 | EVALUATE / HIGH FIT |
| Playwright | browser/E2E | OSS/Apache-2.0 | EVALUATE / HIGH FIT |
| Lighthouse CI | performance/a11y budgets | OSS/Apache-2.0 | EVALUATE / HIGH FIT |
| web-vitals | field metrics | OSS/Apache-2.0 | EVALUATE with OPS/privacy |
| rollup-plugin-visualizer | bundle analysis | OSS/MIT | EVALUATE / LOW-RISK DEV TOOL |
| OpenTelemetry JS | telemetry | OSS/Apache-2.0 | CONDITIONAL on OPS/privacy integration |
| MediaProjectV2 + ADR-0094 renderer | deterministic social chart/frame/video projection | repository-native current contract/renderer boundary | REUSE via CAPITAL-AI-SOCIAL handoff |

No paid-only proprietary dependency is required.

---

## 14. Domain Waves / DoD

- **BB-3 Public/Users/Settings/Billing:** Public landing/sideboard canonical; remaining surfaces migrate without IAM/Billing authority shift.
- **BB-4 Screening/Discovery/Asset Universes:** RankingBoard canonical; Screener/MarketScreener/AssetUniverse physical migration + FIN-17 boundary; add Models & Orchestration panels and Crypto category/subclass tabs as read-only projections.
- **BB-5 News/Sentiment/Social/Reporting:** Newsfeed canonicalize; new Sentiment Dashboard is Class A over current research contract; legacy MarketSentiment neutral fallback is superseded/removed; visualization snapshots are made consumable by Social without publishing-authority transfer.
- **BB-6 Analytics/Crypto/Commodities/Visualization:** Momentum Dashboard Class A; Crypto research panels; Charts/Heatmap remain Class B until remediation; shared visualization system introduced incrementally.
- **BB-7 Portfolio/Risk/Backtesting:** PortfolioPerformance blocked until verified contract; Risk Assessment remains Class C.
- **BB-8 Governance/Admin/Compliance:** feature-owned UI without control-plane duplication.
- **BB-9 Stocks/Buffett:** Buffett Value Check Class A; physical migration with existing entitlement/evidence authorities and reusable web/social visual projection.

Every BB-3..BB-9 migrated surface requires zero productive Legacy consumer, reviewed Server/Data contract, appropriate shared Visualization/Accessibility primitives, performance budget, approved visual functionality preserved and no new FE authority.

---

## 15. BB-10 Absolute Productive Legacy Exit — 10/10

End state:

- `0` productive implementations under `src/components/`;
- `0` required Compatibility re-exports;
- `0` productive superseded UI alias consumers;
- `0` Frontend consumers of superseded API contracts;
- `0` productive Legacy Dashboard composition;
- `0` productive obsolete branding aliases/local governed color literals.

Compatibility removal only after consumer count `0` and applicable owner-side supersession. Historical/audit evidence remains.

---

## 16. BB-11 Closure

Required: Visualization >=8.5, Server/Data Contract >=8.5, Accessibility >=8.0, Performance >=8.5, Legacy Exit 10/10, TypeScript PASS, Unit/Contract Tests PASS, Architecture Tests PASS, Production Build PASS, Accessibility Evidence PASS, Performance Budget PASS, Authority/Data Contract Correlation PASS, Duplicate Authority NONE.

Additional closure evidence for this extension:

- Buffett, Sentiment and Momentum Class-A surfaces render canonical/research contracts without local financial fabrication;
- every Asset Universe exposes current FINTECH model/orchestration metadata without a second registry/dispatcher;
- Crypto categories/subclasses map to canonical classification and only display FINTECH-owned formulas/models;
- web and Social visual projections are numerically/semantically consistent for the same source snapshot;
- Social render integration preserves `publishReady=false` and existing approval/publishing authority.

`NOT RUN` is never PASS.

---

## 17. Governance per Wave

Before every Frontend PR: current main + `/AGENTS.md`; open PR/writers; changed-file/semantic/namespace/authority overlap; Current Project/PVC/Owner; Roadmap/Inventory; applicable ADR/ESS/API/Data contracts; consumer/compatibility exits; design/a11y/perf drift; required low-cost validators; final sync/correlation before exact PR-creation approval.

Foreign supersession remains with the owning Primary Owner. Cross-project Social implementation is handed off to `CAPITAL-AI-SOCIAL`; this Frontend slice may define/consume presentation projections but does not modify Social publishing authority.

---

## 18. Immediate Roadmap Order

1. **BB-2E Navigation / Drawer completion**.
2. Re-correlate, then **BB-2F Header / Application Shell extraction**.
3. Then **BB-2G Visual-Parity / Composition Closure** before Legacy Dashboard removal.

After BB-2 composition closure, BB-4/5/6/9 execute the Asset-Universe model graph, Crypto categories, Sentiment/Momentum and Buffett Class-A recovery according to the domain waves above. Visualization/Server-State/Accessibility/Performance/Social-render reuse is applied inside these waves, not as a parallel roadmap.

---

*Version 1.9.0 re-correlates the existing canonical roadmap to `main@fb3fff1f3959d1c6f87d20228036366848600487`, promotes Buffett Value Check plus canonical Sentiment/Momentum dashboards to Visual-Recovery Class A, attaches current FINTECH registry/orchestration/model metadata to Asset Universes, adds Crypto category/subclass/model tabs, allows owner-bounded supersessions, and defines reuse of the same deterministic visual projections by the SocialMediaEngine rendering pipeline without creating a second scoring, data, media or publishing authority.*