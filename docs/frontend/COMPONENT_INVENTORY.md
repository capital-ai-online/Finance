# CAPITAL-AI Frontend – Component Inventory

**Stand:** 7. September 2026  
**Version:** 1.8.1  
**Korrelationsbasis:** `main@fb3fff1f3959d1c6f87d20228036366848600487`  
**Current Project:** `CAPITAL-AI-FE`  
**Current Project Folder:** `docs/projects/frontend/`  
**Primary Productive PVC:** `N/A` (`[]`)  
**Primary Owner:** `CAPITAL-AI-FE`  
**Dokumentrolle:** Ist-Bestand, Visual-Recovery-/Contract-Status und Migrationsvoraussetzungen  
**Normative Frontend-Authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Migrations-/Prioritätsauthority:** `docs/frontend/FRONTEND_ROADMAP.md`

Dieses Dokument ist das bestehende kanonische Frontend-Komponenten-Inventar. Es definiert keine zweite Roadmap oder Source-Tree-, Market-Data-, Scoring-, Ranking-, Evidence-, Freshness-, Entitlement-, IAM- oder Governance-Authority.

Zielpfade bestimmt `FRONTEND_ARCH.md`; Reihenfolge bestimmt `FRONTEND_ROADMAP.md`; fachliche Contracts bleiben bei ihren then-current Primary Owners. `src/components/` ist Legacy-/Compatibility-Zone.

---

## 1. Statusmodell

**Consumer state:** `CANONICAL_CONNECTED`, `COMPATIBILITY_ONLY`, `PRODUCTIVE_LEGACY`, `NOT_PRODUCTIVELY_RENDERED`, `DISABLED_ARCHIVED`, `BLOCKED_INVALID_OR_MISSING_CONTRACT`.

**Visual Recovery:**

- **A — CANONICALIZE_NOW:** approved productive visual with valid current contract.
- **B — CONTRACT_REMEDIATION_REQUIRED:** useful visual, but current Data/Evidence/Authority contract is not production-valid; no synthetic/fallback activation.
- **C — EXPLICITLY_DISABLED_OR_ARCHIVED:** no reactivation without explicit current Owner decision and required contracts/architecture.

**Quality state:** `BASELINE`, `PARTIAL`, `REQUIRED`, `BLOCKED`. No PASS without actual evidence.

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

## 3. Existing Shared Primitives

`StatusBadge`, `AuthorityBadge`, `FreshnessBadge`, `EvidenceStateIndicator`, `ResearchOnlyBanner`, shared Button/Card/Input/Modal/Tooltip/Skeleton/EmptyState and `CapitalAiLogo` are current canonical shared Presentation primitives. They project supplied state; they do not create Score, Ranking, Freshness, Evidence or Authority.

Planned, not current implementation claims: `ChartFrame`, `ResponsiveChartContainer`, `VisualizationToolbar`, `TimeRangeControl`, `VisualizationLegend`, `DataStateOverlay`, `VisualizationSkeleton`, `AccessibleDataSummary`, bounded Crosshair/Tooltip primitives.

---

## 4. Priority Visual Recovery / Contract Matrix

| Surface | Current physical path | Canonical target | Consumer state | Class | Contract status | Supersession | Foreign owner | Legacy removal prerequisite | A11y | Perf |
|---|---|---|---|---|---|---|---|---|---|---|
| Enterprise Scorer | `src/features/crypto/ui/CryptoScoringEnterprise.tsx` + workspace/public wrapper; Legacy bridge | `src/features/crypto/ui` | CANONICAL_CONNECTED | **A** | canonical score/evidence consumer; presentation adds no authority | No | parent FINTECH/DATA contracts unchanged | Legacy bridge = 0 consumers | PARTIAL | PARTIAL |
| RankingBoard | `src/features/screening/ui/RankingBoard.tsx`; `UniverseBestWorst` aliases | same | CANONICAL_CONNECTED | **A** | canonical score consumer; FIN-17 backend rank/order closure remains | owner-side local/old ordering exit | `CAPITAL-AI-FINTECH / PVC-17` | backend rank/order consumed; FE local ordering eliminated; aliases = 0 | PARTIAL | BASELINE |
| Realtime AI Newsfeed | `src/components/RealtimeAiNewsfeed.tsx` via facade | `src/features/news/ui` | COMPATIBILITY_ONLY | **A** | evidence-only news; no fabricated headline/score mutation | No | current upstream news/data owner as applicable | physical migration + Legacy imports = 0 | PARTIAL | BASELINE |
| Market Sentiment | `src/components/MarketSentiment.tsx` | `src/features/news/ui` | BLOCKED_INVALID_OR_MISSING_CONTRACT | **B** | missing score -> `50`, label -> `Neutral`; not fail-closed | consumer remediation; contract change only if needed | exact then-current sentiment owner if contract change is required | remove defaults; explicit unavailable/partial/stale; Legacy imports = 0 | REQUIRED | BASELINE |
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
| BuffetValueCheck | Legacy implementation via stocks facade | `src/features/stocks/ui` | COMPATIBILITY_ONLY | **A/B** | server entitlement/research/evidence remains authoritative | owner-side only if blocker | resolve exact FINTECH/DATA contract | audit + physical migration + Legacy consumers = 0 | REQUIRED | REQUIRED |
| InteractModule | `src/components/InteractModule.tsx` | none while archived | DISABLED_ARCHIVED | **C** | archived | No | future Owner decision only | remains archived | BLOCKED | BLOCKED |

`A/B` is not activation approval. It means approved visual functionality is recoverable, while precise dependency/authority validation is still required.

---

## 5. Compatibility / Feature Summary

- **Screening:** RankingBoard canonical; UniverseBestWorst alias only; Screener/MarketScreener/AssetUniverse physical migration remains.
- **Crypto/Analytics:** Crypto Scorer/Public wrapper/Visualization ViewModel are canonical projections; Charts and Heatmap are Class B.
- **Commodities:** RawMaterialsDashboard is Class A canonical with Legacy bridge.
- **Portfolio/Risk:** Watchlist/Backtest/PortfolioPerformance/MonteCarlo require remediation/audit; Risk Assessment is Class C.
- **News/Sentiment:** RealtimeAiNewsfeed is Class A visual with physical migration open; MarketSentiment is Class B until fallback removal.
- **Reporting/Governance:** ComplianceExporter is Class B; Admin surfaces remain consumers of Governance/IAM authorities; AdminProcessGraph is canonical read-only.
- **Public/Auth/Billing/Legal:** Landing/Login canonical; remaining physical Legacy migration must preserve server IAM/Billing authority.

---

## 6. Parent Authority Reference

Inventory references, but does not supersede:

- `FRONTEND_ARCH.md` / `FRONTEND_ROADMAP.md`;
- `design-tokens.json` + `brandmark.json`;
- ADR-0032;
- ADR-0041 + ESS-0016;
- `SC-MD-SPT-0001` + ADR-0087;
- CAPITAL-AI-DATA / PVC-09..11;
- CAPITAL-AI-FINTECH / PVC-12..17;
- current Governance/IAM authorities;
- CAPITAL-AI-OPS runtime/telemetry/deployment boundaries.

DATA current main composes provider input validation, freshness, provenance and DQ in validated history/snapshot exits. FE must preserve supplied states.

---

## 7. Portfolio Performance Integrity Gate

`PortfolioPerformance.tsx` is blocked while it generates deterministic performance and fixed risk statistics. Future activation requires verified NAV/performance time series with `observedAt/asOf`, provenance/source identity, freshness, unavailable/stale/error states and owner-authoritative derived risk methodology.

**Primary Owner: `REQUIRES_CORRELATION`. No FE owner guess is authorizing.**

---

## 8. Legacy API / Compatibility Exit

| Compatibility | Problem | Removal gate |
|---|---|---|
| `/api/charts-scoring` | simulation-only | FE cutover + FINTECH owner-side removal + 0 consumers |
| `/api/backtest-history` | compatibility history / possible labelled simulation | canonical DATA history + protected-execution correlation + 0 consumers |
| `UniverseBestWorst` | superseded UI name | all consumers use RankingBoard |
| feature facades re-exporting `src/components/*` | not physical migration | move implementation + 0 Legacy inbound consumers |
| `src/components/Dashboard.tsx` | composition monolith | BB-2E + BB-2F + BB-2G parity + 0 productive Legacy composition |

Historical/audit evidence is retained.

---

## 9. Accessibility / Performance Evidence

Accessibility closure requires keyboard-only journeys, focus order, dialog/drawer focus management, landmarks/names, chart text/table alternatives, non-color-only status, reduced motion, zoom/reflow, touch targets, mobile navigation, accessible loading/error/empty states, automated axe plus manual keyboard/screenreader evidence.

Performance closure targets p75 LCP <=2.5s, INP <=200ms, CLS <=0.1, Lighthouse Performance >=90, Lighthouse Accessibility >=95, route/workspace bundle budgets, heavy visualization lazy loading, request dedup/cancellation and long-task evidence.

`NOT RUN` is never PASS.

---

## 10. Maintenance / Legacy Exit Rules

1. No new productive implementation under `src/components/`.
2. Feature facade re-exporting Legacy code remains `COMPATIBILITY_ONLY`.
3. Class B remains blocked until exact invalid/missing contract is resolved.
4. Class C is not reactivated solely because code exists.
5. `NOT_AVAILABLE`, `STALE`, `PARTIAL`, `INVALID`, `NOT_COMPUTABLE` are never converted to local neutral/default Finance values.
6. Foreign supersession is owner-side; FE only identifies/consumes replacement.
7. Compatibility removal requires zero productive consumers.
8. Design tokens/brandmark remain singular authorities; `brand-cyan` compatibility-only.
9. Quality status is evidence-backed; NOT RUN remains NOT RUN.
10. BB-10 reaches 10/10 only with zero productive Legacy implementations and zero required compatibility re-exports.

---

*Version 1.8.1 re-correlates the existing Component Inventory to `main@fb3fff1f3959d1c6f87d20228036366848600487`, records merged Public recovery, Visual-Recovery A/B/C, fail-closed Portfolio owner routing, contract/supersession gates and absolute Legacy-exit prerequisites. It creates no parallel roadmap, Frontend architecture or financial authority.*