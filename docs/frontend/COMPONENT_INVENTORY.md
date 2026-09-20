# CAPITAL-AI Frontend – Component Inventory

**Stand:** 7. September 2026  
**Version:** 1.9.0  
**Korrelationsbasis:** `main@fb3fff1f3959d1c6f87d20228036366848600487`  
**Current Project:** `CAPITAL-AI-FE`  
**Current Project Folder:** `docs/projects/frontend/`  
**Primary Productive PVC:** `N/A` (`[]`)  
**Primary Owner:** `CAPITAL-AI-FE`  
**Dokumentrolle:** Ist-Bestand, Visual-Recovery-/Contract-Status und Migrationsvoraussetzungen  
**Normative Frontend-Authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Migrations-/Prioritätsauthority:** `docs/frontend/FRONTEND_ROADMAP.md`

Dieses Dokument ist das bestehende kanonische Frontend-Komponenten-Inventar. Version 1.9.0 erweitert die vorhandene Visual-Recovery-Matrix um die Owner-gerichtete Class-A-Einstufung von Buffett Value Check, Sentiment Dashboard und Momentum Dashboard sowie um Asset-Universe-/FINTECH-Modellprojektionen, Crypto-Kategorie-/Unterklassen-Navigation und die wiederverwendbare Social-Render-Projektion. Es definiert keine zweite Roadmap oder Source-Tree-, Market-Data-, Scoring-, Ranking-, Evidence-, Freshness-, Entitlement-, Social-Publishing-, IAM- oder Governance-Authority.

Zielpfade bestimmt `FRONTEND_ARCH.md`; Reihenfolge bestimmt `FRONTEND_ROADMAP.md`; fachliche Contracts bleiben bei ihren then-current Primary Owners. `src/components/` ist Legacy-/Compatibility-Zone. `CAPITAL-AI-SOCIAL` behält MediaProject-/Rendering-/Publishing-Integration; Frontend inventarisiert nur die wiederverwendbare Präsentationsprojektion.

---

## 1. Statusmodell

**Consumer state:** `CANONICAL_CONNECTED`, `COMPATIBILITY_ONLY`, `PRODUCTIVE_LEGACY`, `NOT_PRODUCTIVELY_RENDERED`, `DISABLED_ARCHIVED`, `BLOCKED_INVALID_OR_MISSING_CONTRACT`.

**Visual Recovery:**

- **A — CANONICALIZE_NOW:** Owner-approved visual whose current or target consumer can project a valid current contract without inventing domain truth.
- **B — CONTRACT_REMEDIATION_REQUIRED:** useful visual, but current Data/Evidence/Authority contract is not production-valid; no synthetic/fallback activation.
- **C — EXPLICITLY_DISABLED_OR_ARCHIVED:** no reactivation without explicit current Owner decision and required contracts/architecture.

**Quality state:** `BASELINE`, `PARTIAL`, `REQUIRED`, `BLOCKED`. No PASS without actual evidence.

A target may be Class A while `NOT_PRODUCTIVELY_RENDERED`: this means canonicalization is approved when implemented against the named contract; it is not a claim that implementation or runtime evidence already exists.

---

## 2. Application Composition

| Surface | Current physical path | Canonical target | Consumer state | Class | Contract boundary | Legacy removal prerequisite | A11y | Perf |
|---|---|---|---|---|---|---|---|---|
| Application Root | `src/app/App.tsx` | same | CANONICAL_CONNECTED | A | FE composition only | root compatibility consumers = 0 | BASELINE | PARTIAL |
| Session/Auth | `src/app/auth/SessionComposition.tsx` | same | CANONICAL_CONNECTED | A | IAM/Auth foreign-authoritative | no Root compatibility dependency | PARTIAL | BASELINE |
| Routes | `src/app/routing/AppRoutes.tsx` | same | CANONICAL_CONNECTED | A | presentation/routing only | old route composition = 0 | PARTIAL | PARTIAL |
| Dashboard | `src/app/dashboard/Dashboard.tsx` -> `src/components/Dashboard.tsx` | `src/app/dashboard/*` | PRODUCTIVE_LEGACY | A for approved functions | per-domain feature contracts | BB-2E + BB-2F + BB-2G parity; 0 Legacy Dashboard composition | REQUIRED | REQUIRED |
| DashboardViewRouter | `src/app/dashboard/DashboardViewRouter.tsx` | same | CANONICAL_CONNECTED | A | app-owned presentation | Legacy view switches = 0 | BASELINE | BASELINE |
| Public Analysis Workbench | `src/app/public/PublicAnalysisWorkbench.tsx` | same | CANONICAL_CONNECTED | A | preserves public/server-gated/login/disabled states | no Legacy Dashboard public fallback | PARTIAL | PARTIAL |

Public Enterprise Scorer PR #820 and Public Analysis Sideboard PR #825 are merged Current-Main state.

---

## 3. Shared Visualization / Social Projection Inventory

### Existing shared presentation primitives

`StatusBadge`, `AuthorityBadge`, `FreshnessBadge`, `EvidenceStateIndicator`, `ResearchOnlyBanner`, shared Button/Card/Input/Modal/Tooltip/Skeleton/EmptyState and `CapitalAiLogo` are current canonical shared Presentation primitives. They project supplied state; they do not create Score, Ranking, Freshness, Evidence or Authority.

### Planned shared visualization primitives

Not current implementation claims:

- `ChartFrame`
- `ResponsiveChartContainer`
- `VisualizationToolbar`
- `TimeRangeControl`
- `VisualizationLegend`
- `DataStateOverlay`
- `VisualizationSkeleton`
- `AccessibleDataSummary`
- bounded Crosshair/Tooltip primitives
- serializable `VisualizationSnapshot` or equivalent presentation projection for browser/Social reuse; exact name/path remains implementation-scoped.

The serializable projection may contain deterministic chart kind, labels, display-ready series, state, model/version/source/evidence refs, timestamps and brand-token references. It must not become a second Data/Scoring contract or recompute financial semantics.

### Renderer best-fit inventory

| Renderer / projection | Best fit | Inventory state | Authority boundary |
|---|---|---|---|
| Recharts | standard financial charts, score breakdowns, Buffett/Sentiment/Momentum series, bars/areas/gauges | repository dependency present | presentation only |
| D3 | bounded custom geometry, dense category maps, advanced heatmap interaction | repository dependency present | contract-valid input only; no analytical invention |
| React Flow / XYFlow | Registry -> Dispatcher -> Executor -> Result and true node-edge orchestration/lineage graphs | EVALUATE / not current dependency | no second routing/registry authority; installation separate |
| `MediaProjectV2` chart/scene layers + ADR-0094 renderer | deterministic Social cards, frames, 1:1/16:9/9:16 and short video | current Social/media contract exists | `CAPITAL-AI-SOCIAL` owns media integration/publishing; `publishReady=false` preserved |

---

## 4. Priority Visual Recovery / Contract Matrix

| Surface | Current physical path | Canonical target | Consumer state | Class | Contract status | Supersession | Foreign owner | Legacy removal prerequisite | A11y | Perf |
|---|---|---|---|---|---|---|---|---|---|---|
| Enterprise Scorer | `src/features/crypto/ui/CryptoScoringEnterprise.tsx` + workspace/public wrapper; Legacy bridge | `src/features/crypto/ui` | CANONICAL_CONNECTED | **A** | canonical score/evidence consumer; presentation adds no authority | No | parent FINTECH/DATA contracts unchanged | Legacy bridge = 0 consumers | PARTIAL | PARTIAL |
| RankingBoard | `src/features/screening/ui/RankingBoard.tsx`; `UniverseBestWorst` aliases | same | CANONICAL_CONNECTED | **A** | canonical score consumer; FIN-17 backend rank/order closure remains | owner-side local/old ordering exit | `CAPITAL-AI-FINTECH / PVC-17` | backend rank/order consumed; FE local ordering eliminated; aliases = 0 | PARTIAL | BASELINE |
| Realtime AI Newsfeed | `src/components/RealtimeAiNewsfeed.tsx` via facade | `src/features/news/ui` | COMPATIBILITY_ONLY | **A** | evidence-only news; no fabricated headline/score mutation | No | current upstream news/data owner as applicable | physical migration + Legacy imports = 0 | PARTIAL | BASELINE |
| **Buffett Value Check** | `src/components/BuffetValueCheck.tsx` via stocks facade | `src/features/stocks/ui` | COMPATIBILITY_ONLY | **A** | server entitlement, stock-only verified asset display, evidence/provider/timestamp state; manual/model assumptions are labelable rather than hidden evidence | FE physical consumer supersession allowed; foreign contract only owner-side if needed | FINTECH entitlement/financial-analysis + DATA evidence as applicable | physical migration; preserve verified/manual provenance; Legacy consumers = 0 | REQUIRED | REQUIRED |
| **Sentiment Dashboard** | no canonical dedicated dashboard yet; research values may appear in Crypto score context | `src/features/crypto/ui` + shared visualization | NOT_PRODUCTIVELY_RENDERED | **A** | target projection over `crypto-sentiment-research/0.1.0`; `READY/NOT_COMPUTABLE`, evidence refs; `scoreEligible=false`, `executionEligible=false` | **Yes:** supersede Legacy neutral-default consumer semantics | FINTECH research/model semantics + DATA/evidence upstream | implement against current research contract; do not reuse fallback `50/Neutral`; accessible/text alternative | REQUIRED | REQUIRED |
| **Momentum Dashboard** | no canonical dedicated dashboard yet; research context available in Crypto scoring stack | `src/features/crypto/ui` + shared visualization | NOT_PRODUCTIVELY_RENDERED | **A** | target projection over `crypto-momentum-research/0.1.0`; missing fields/effective weights/coverage explicit; research-only | old/local momentum visual semantics may be superseded at consumer boundary | FINTECH research/model semantics + DATA/evidence upstream | implement current model/version/state; no zero/default substitution | REQUIRED | REQUIRED |
| **Asset Universe Models & Orchestration** | no common Asset-Universe model graph yet | `src/features/screening/ui` or bounded shared read-only visualization consumed per universe | NOT_PRODUCTIVELY_RENDERED | **A** | read-only projection of FINTECH Registry/Dispatcher/Executor/CanonicalScoreResult and supplied research/workflow metadata | **Yes:** hardcoded UI model maps superseded by registry-driven projection | `CAPITAL-AI-FINTECH / PVC-13..17`; DATA upstream; OPS trace where applicable | no second registry/dispatcher; lifecycle/evidence/scoreEligible clearly shown; text/table lineage alternative | REQUIRED | REQUIRED |
| **Crypto Category / Subclass Workspace** | canonical classification exists; no full category-tab workspace | `src/features/crypto/ui` | NOT_PRODUCTIVELY_RENDERED | **A** | project canonical 25 categories + category_sub/asset_type/tier/confidence; formulas/models only from FINTECH contracts | **Yes:** obsolete/hardcoded taxonomies may be retired after consumer cutover | FINTECH classification/model semantics | category tabs derive from canonical contract; no category formula invention; 0 obsolete taxonomy consumers | REQUIRED | REQUIRED |
| **Social Visualization Projection** | `MediaProjectV2`/renderer exist under Social; FE has no common snapshot handoff yet | shared FE presentation projection -> `CAPITAL-AI-SOCIAL` consumer | NOT_PRODUCTIVELY_RENDERED | **A** | same authoritative visual data/labels/model/evidence/disclaimer serialized for browser and Social chart/scene layers | duplicate screenshot/recalculation paths may be superseded once canonical handoff exists | `CAPITAL-AI-SOCIAL` for media/render/publish integration | exact web/social numeric-semantic parity; `publishReady=false`; no FE OAuth/publish authority | REQUIRED | REQUIRED |
| Legacy Market Sentiment | `src/components/MarketSentiment.tsx` | superseded by canonical Sentiment Dashboard or remediated consumer | BLOCKED_INVALID_OR_MISSING_CONTRACT | **B** | missing score -> `50`, label -> `Neutral`; not fail-closed | **Yes:** consumer semantics targeted for supersession | exact then-current sentiment owner if upstream contract change required | remove defaults; explicit unavailable/partial/stale/not-computable; Legacy imports = 0 | REQUIRED | BASELINE |
| Watchlist | `src/components/Watchlist.tsx` via facade | `src/features/portfolio/ui` | COMPATIBILITY_ONLY | **B** | local persistence + fallback/default financial values | possibly | resolve exact owner per displayed field | each value contract-valid; fallback fabrication removed; Legacy imports = 0 | REQUIRED | REQUIRED |
| MarketScreener | `src/components/MarketScreener.tsx` via facade | `src/features/screening/ui` | COMPATIBILITY_ONLY | **A/B** | verified screening exists; physical/auxiliary paths need validation | possibly | resolve exact FINTECH/DATA blocker if any | contract validation + physical migration | REQUIRED | REQUIRED |
| Screener | `src/components/Screener.tsx` | `src/features/screening/ui` | PRODUCTIVE_LEGACY/compatibility | **A/B** | current screening/data contract audit required | possibly | resolve exact owner if blocker | canonical contract + migration + Legacy consumers = 0 | REQUIRED | REQUIRED |
| Charts | `src/components/Charts.tsx` | `src/features/analytics/ui` + shared chart primitives | BLOCKED_INVALID_OR_MISSING_CONTRACT | **B** | `/api/charts-scoring` = `NON_PRODUCTION_SIMULATION`; `/api/backtest-history` compatibility history | **Yes** | FINTECH for chart-scoring; DATA for canonical history/evidence | verified history/OHLCV; no simulation-only score consumer; Legacy imports = 0 | REQUIRED | REQUIRED |
| Heatmap | `src/components/HeatmapCreator.tsx` | `src/features/analytics/ui` | BLOCKED_INVALID_OR_MISSING_CONTRACT | **B** | preset/local bullish, volume, pattern and analysis semantics | **Yes / owner decision** | **REQUIRES_CORRELATION** | authoritative contract or explicit research/unavailable; no preset Finance evidence | REQUIRED | REQUIRED |
| RawMaterialsDashboard | `src/features/commodities/ui/RawMaterialsDashboard.tsx`; Legacy bridge | same | CANONICAL_CONNECTED | **A** | verified commodity score separated from research; unavailable explicit | No | parent FINTECH/DATA contracts | Legacy bridge = 0 consumers | PARTIAL | PARTIAL |
| Portfolio Performance | `src/components/PortfolioPerformance.tsx` via facade | `src/features/portfolio/ui` | BLOCKED_INVALID_OR_MISSING_CONTRACT | **B** | deterministic synthetic performance + fixed Sharpe/Drawdown/Vol/VaR; no verified NAV contract | **Yes / contract required** | **REQUIRES_CORRELATION — exact Primary Owner must be resolved from then-current PVC/project/contract authority; FE does not guess** | verified NAV/performance series + provenance/asOf/freshness/unavailable + owner-authoritative derived metrics; synthetic generator removed | BLOCKED | BLOCKED |
| Backtest Engine | `src/components/BacktestEngine.tsx` via facade | `src/features/portfolio/ui` | COMPATIBILITY_ONLY | **B** | protected execution + canonical history boundary incomplete | possibly | FINTECH protected execution; DATA canonical history | owner-side entitlement/history valid; compatibility history exit | REQUIRED | REQUIRED |
| PortfolioBacktester | `src/components/PortfolioBacktester.tsx` | `src/features/portfolio/ui` | PRODUCTIVE_LEGACY/compatibility | **B** | full dependency audit required | possibly | resolve current FINTECH/DATA contracts | valid execution/history + Legacy imports = 0 | REQUIRED | REQUIRED |
| MonteCarloDetailed | `src/components/MonteCarloDetailed.tsx` | `src/features/portfolio/ui` | BLOCKED_INVALID_OR_MISSING_CONTRACT | **B** | protected execution authority incomplete | possibly | `CAPITAL-AI-FINTECH` | owner-authoritative execution/entitlement; no client bypass | REQUIRED | REQUIRED |
| RealTimeRiskAssessment / VaR | `src/components/RealTimeRiskAssessment.tsx` | unresolved while disabled | DISABLED_ARCHIVED | **C** | archived null stub | only after explicit decision | resolve then-current risk owner if reactivated | explicit Owner + verified risk contract | BLOCKED | BLOCKED |
| FavoriteAssetPatternSlots | `src/components/FavoriteAssetPatternSlots.tsx` | portfolio/analytics after audit | PRODUCTIVE_LEGACY | **A/B** | real read-only Binance Klines but browser-direct provider/pattern ownership audit open | possibly | resolve current provider/pattern authority | accepted data/evidence boundary + physical migration | REQUIRED | REQUIRED |
| ComplianceExporter | `src/components/ComplianceExporter.tsx` via reporting facade | `src/features/reporting/ui` | COMPATIBILITY_ONLY | **B** | canonical PDF/server grant, but fixed unsupported portfolio/risk KPIs | owner-side financial metric replacement | exact then-current financial authority per metric | fixed KPIs -> verified/unavailable; physical migration | REQUIRED | REQUIRED |
| AdminPortal | `src/components/AdminPortal.tsx` via governance facade | `src/features/governance/ui` | COMPATIBILITY_ONLY | **A/B** | IAM-gated presentation; browser checks non-authorizing; subcomponents Legacy | no FE authority supersession | `CAPITAL-AI-GOV` / applicable IAM owners | approved physical migration + Legacy imports = 0 | REQUIRED | REQUIRED |
| Admin Process Graph | `src/features/governance/ui/process-graph/AdminProcessGraph.tsx` | same | CANONICAL_CONNECTED | **A** | read-only PVC/dependency projection | No | GOV remains parent authority | maintain projection-only boundary | PARTIAL | BASELINE |
| PerformanceDashboard | `src/components/PerformanceDashboard.tsx` | analytics/governance after audit | PRODUCTIVE_LEGACY | **A/B** | operational telemetry must remain OPS-owned | if blocker found | OPS | authority/dependency audit + migration | REQUIRED | REQUIRED |
| InteractModule | `src/components/InteractModule.tsx` | none while archived | DISABLED_ARCHIVED | **C** | archived | No | future Owner decision only | remains archived | BLOCKED | BLOCKED |

`A/B` is not activation approval. It means approved visual functionality is recoverable, while precise dependency/authority validation is still required.

---

## 5. Asset Universe Model Attachment Matrix

This inventory records the current FINTECH models that the future read-only Asset Universe model graph must project. It does not promote challengers or establish routing.

| Universe | Productive canonical model | Additional current nodes | Required visual distinction |
|---|---|---|---|
| Crypto | `crypto-technical-provenance@0.7.0` | `crypto-meme-integrity@0.3.0`; `crypto-defi-fundamental@0.3.0`; Sentiment/Momentum/Regime/Pattern/Signal-Fusion/Kill-Switch research; CryptoOrchestrator research enrichment | champion vs challenger vs research; score/execution eligibility; evidence status |
| Stocks | `traditional-scoring@2.1.0` | Buffett Value Check stock valuation analysis; FINTECH workflow lineage when supplied | scoring vs valuation analysis; entitlement/evidence provenance |
| Forex | `traditional-scoring@2.1.0` | Registry/Dispatcher/Executor/result lineage | no invented specialized model |
| Index | `traditional-scoring@2.1.0` | Registry/Dispatcher/Executor/result lineage | no invented specialized model |
| Commodity | `commodity-evidence-scoring@1.0.0` | energy/industrial-metals/precious-metals/agriculture challengers `@0.1.0` | canonical vs research/non-executable challenger |
| Bond | `sovereign-benchmark-yield-scoring@1.0.0` for supported government benchmark yields | Registry/Dispatcher/Executor/result lineage | unsupported individual bonds remain unavailable |

Graph metadata should be obtained from FINTECH-owned descriptors/contracts wherever available: model ID/version, alias/lifecycle, asset/instrument scope, feature/result contract, evidence policy, executor key, score eligibility and downstream result/ranking relationship.

---

## 6. Crypto Category / Model Inventory

Canonical category tabs to project from the current classification contract:

`Layer 1`, `Layer 2`, `DeFi`, `Smart Contract Platform`, `Infrastructure`, `Oracle`, `Gaming`, `AI / Data`, `Payments`, `Privacy`, `Meme`, `Stablecoin`, `Exchange Token`, `Governance`, `Real World Assets`, `Storage / Compute`, `Interoperability`, `Liquid Staking`, `Restaking`, `Bridging`, `NFT / Creator`, `Derivatives`, `DAO / Community`, `Index / Basket`, `Utility Token`, `Unknown`.

Canonical subcategory fields include `Chain-native Asset`, `Ecosystem Token`, `Protocol Token`, `Exchange-Backed Asset`, `Governance Asset`, `Synthetic Asset`, `Wrapped Asset`, `Yield Asset`, `Unknown`, plus supplied `asset_type`, tier and confidence.

Model rule:

- Meme may show `crypto-meme-integrity@0.3.0` as current **challenger / research-only / non-executable** beside the canonical Crypto champion.
- DeFi may show `crypto-defi-fundamental@0.3.0` with the same explicit challenger/research status.
- Other category tabs show the canonical Crypto champion and only applicable supplied research context until FINTECH publishes/promotes a dedicated governed model.
- Formula/weight details may only render from then-current FINTECH-owned model/research contracts. A category tab never authorizes FE to invent category-specific weights or scoring formulas.

---

## 7. Social Rendering Handoff Inventory

Target consumer flow:

```text
FINTECH/DATA authoritative result
  -> FE visualization ViewModel / serializable snapshot
     -> browser renderer
     -> CAPITAL-AI-SOCIAL MediaProjectV2 chart/scene layer
        -> ADR-0094 deterministic renderer
        -> existing Social validation/approval/publishing boundary
```

Inventory constraints:

1. browser and Social use the same deterministic numeric labels, model/version, evidence/data status and required disclaimer for one source snapshot;
2. no DOM scraping or screenshot-derived financial truth is required;
3. Social may compose animation/timing/layout, but not change financial semantics;
4. `MediaProjectV2.renderRecipe.publishReady` remains `false` at render-project level;
5. FE acquires no OAuth, publication, provider credential or Social approval authority;
6. exact Social runtime changes belong to `CAPITAL-AI-SOCIAL` after owner-side correlation.

---

## 8. Compatibility / Feature Summary

- **Screening / Asset Universes:** RankingBoard canonical; UniverseBestWorst alias only; Screener/MarketScreener/AssetUniverse physical migration remains; Models & Orchestration panel is planned Class A as registry-driven projection.
- **Crypto/Analytics:** Crypto Scorer/Public wrapper/Visualization ViewModel are canonical projections; Sentiment Dashboard and Momentum Dashboard are planned Class A over current research contracts; Crypto category/subclass workspace planned Class A; legacy Charts/Heatmap remain B.
- **Commodities:** RawMaterialsDashboard is Class A canonical with Legacy bridge; category-specific commodity challengers remain visually research/non-executable until FINTECH promotion.
- **Stocks/Buffett:** Buffett Value Check is Class A recovery; server entitlement/evidence boundary retained; physical migration remains.
- **Portfolio/Risk:** Watchlist/Backtest/PortfolioPerformance/MonteCarlo require remediation/audit; Risk Assessment is Class C.
- **News/Sentiment:** RealtimeAiNewsfeed is Class A visual with physical migration open; legacy MarketSentiment remains Class B and is a supersession target rather than the source of the new Sentiment Dashboard.
- **Social:** MediaProjectV2/ADR-0094 remain Social-owned rendering/publishing boundaries; reusable FE visualization projection is a planned Class-A handoff.
- **Reporting/Governance:** ComplianceExporter is Class B; Admin surfaces remain consumers of Governance/IAM authorities; AdminProcessGraph is canonical read-only.
- **Public/Auth/Billing/Legal:** Landing/Login canonical; remaining physical Legacy migration must preserve server IAM/Billing authority.

---

## 9. Parent Authority Reference

Inventory references, but does not silently supersede:

- `/AGENTS.md` current authority/supersession rules;
- `FRONTEND_ARCH.md` / `FRONTEND_ROADMAP.md`;
- `design-tokens.json` + `brandmark.json`;
- ADR-0032;
- ADR-0041 + ESS-0016;
- `SC-MD-SPT-0001` + ADR-0087;
- current FINTECH Registry/Dispatcher/model/orchestration contracts;
- ADR-0094 + current SocialMediaEngine/MediaProject contracts;
- CAPITAL-AI-FINTECH / PVC-09..11;
- CAPITAL-AI-FINTECH / PVC-12..17;
- `CAPITAL-AI-SOCIAL` cross-cutting media/publishing ownership;
- current Governance/IAM authorities;
- CAPITAL-AI-OPS runtime/telemetry/deployment boundaries.

DATA current main composes provider input validation, freshness, provenance and DQ in validated history/snapshot exits. FE must preserve supplied states.

---

## 10. Portfolio Performance Integrity Gate

`PortfolioPerformance.tsx` is blocked while it generates deterministic performance and fixed risk statistics. Future activation requires verified NAV/performance time series with `observedAt/asOf`, provenance/source identity, freshness, unavailable/stale/error states and owner-authoritative derived risk methodology.

**Primary Owner: `REQUIRES_CORRELATION`. No FE owner guess is authorizing.**

---

## 11. Legacy API / Compatibility / Supersession Exit

User direction explicitly permits supersessions during execution. Frontend may perform presentation/consumer supersession inside its scope and consume owner-approved foreign replacements; it does not self-supersede foreign scoring/data/media authority.

| Compatibility / obsolete consumer | Problem | Removal / supersession gate |
|---|---|---|
| `/api/charts-scoring` | simulation-only | FE cutover + FINTECH owner-side removal + 0 consumers |
| `/api/backtest-history` | compatibility history / possible labelled simulation | canonical DATA history + protected-execution correlation + 0 consumers |
| `UniverseBestWorst` | superseded UI name | all consumers use RankingBoard |
| legacy `MarketSentiment` neutral defaults | missing evidence appears as 50/Neutral | canonical Sentiment Dashboard/remediated consumer active; 0 neutral-default consumers |
| hardcoded FE asset->model maps | drift against FINTECH registry/model lifecycle | registry-driven read-only projection active; 0 hardcoded productive consumers |
| obsolete/hardcoded Crypto taxonomy | diverges from canonical classification | all consumers derive from current classification contract |
| duplicate Social screenshot/recomputed chart paths | possible semantic drift across web/video | canonical reusable presentation snapshot consumed by Social; old path 0 consumers |
| feature facades re-exporting `src/components/*` | not physical migration | move implementation + 0 Legacy inbound consumers |
| `src/components/Dashboard.tsx` | composition monolith | BB-2E + BB-2F + BB-2G parity + 0 productive Legacy composition |

Historical/audit evidence is retained. Foreign authority supersession follows `/AGENTS.md` explicit scope/impact/owner rules.

---

## 12. Accessibility / Performance Evidence

Accessibility closure requires keyboard-only journeys, focus order, dialog/drawer focus management, landmarks/names, chart text/table alternatives, non-color-only status, reduced motion, zoom/reflow, touch targets, mobile navigation, accessible loading/error/empty states, automated axe plus manual keyboard/screenreader evidence.

Additional graph/category gates:

- model/orchestration graph has keyboard-accessible traversal and equivalent structured text/table lineage;
- Crypto categories use proper tab semantics and preserve category/model/lifecycle meaning without color-only coding;
- animated Social variants have readable deterministic captions/disclaimers and must not change source semantics.

Performance closure targets p75 LCP <=2.5s, INP <=200ms, CLS <=0.1, Lighthouse Performance >=90, Lighthouse Accessibility >=95, route/workspace bundle budgets, heavy visualization lazy loading, request dedup/cancellation and long-task evidence. Node-edge renderer, if adopted, is lazy/bounded and not included in unrelated routes.

`NOT RUN` is never PASS.

---

## 13. Maintenance / Legacy Exit Rules

1. No new productive implementation under `src/components/`.
2. Feature facade re-exporting Legacy code remains `COMPATIBILITY_ONLY`.
3. Class A target implementations must consume the named current contract; Class A is not permission to fabricate missing domain data.
4. Class B remains blocked until exact invalid/missing contract is resolved.
5. Class C is not reactivated solely because code exists.
6. `NOT_AVAILABLE`, `STALE`, `PARTIAL`, `INVALID`, `NOT_COMPUTABLE` are never converted to local neutral/default Finance values.
7. User-approved supersession may remove obsolete FE consumer/presentation paths; foreign contract/model/data/media supersession remains owner-side and scope-explicit per `/AGENTS.md`.
8. Compatibility removal requires zero productive consumers.
9. Crypto formulas/models come from FINTECH contracts/registry/research descriptors only; category UI creates no formula authority.
10. Social rendering reuses deterministic FE visual projections but remains `CAPITAL-AI-SOCIAL`-owned for MediaProject/render/publishing integration.
11. Design tokens/brandmark remain singular authorities; `brand-cyan` compatibility-only.
12. Quality status is evidence-backed; NOT RUN remains NOT RUN.
13. BB-10 reaches 10/10 only with zero productive Legacy implementations and zero required compatibility re-exports.

---

*Version 1.9.0 re-correlates the existing Component Inventory to `main@fb3fff1f3959d1c6f87d20228036366848600487`, classifies Buffett Value Check, canonical Sentiment Dashboard and Momentum Dashboard as Class A, inventories registry-driven Asset-Universe model/orchestration visualization and Crypto taxonomy/model tabs, records bounded supersession opportunities, and defines a Social-owned deterministic chart/video handoff without creating parallel Frontend, scoring, data or publishing authority.*