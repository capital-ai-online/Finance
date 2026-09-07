# CAPITAL-AI Frontend – Component Inventory

**Stand:** 7. September 2026  
**Korrelationsbasis:** `main@fb3fff1f3959d1c6f87d20228036366848600487`  
**Current Project:** `CAPITAL-AI-FE`  
**Primary Productive PVC:** `N/A` (`[]`)  
**Primary Owner:** `CAPITAL-AI-FE`  
**Dokumentrolle:** Ist-Bestand, Visual-Recovery- und Migrationsstatus  
**Normative Frontend-Authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Migrations-/Prioritätsauthority:** `docs/frontend/FRONTEND_ROADMAP.md`

Dieses Dokument inventarisiert vorhandene UI-/Feature-Komponenten und ihren realen Migrations-/Contract-Status. Es definiert **keine** Source-Tree-, Dependency-, Market-Data-, Scoring-, Ranking-, Evidence-, Freshness-, Entitlement-, IAM- oder Governance-Authority und erzeugt keine zweite Frontend-Roadmap.

## Statusmodell

### Current consumer state

- **CANONICAL_CONNECTED** — produktiver Consumer nutzt einen kanonischen app-/feature-owned Pfad.
- **COMPATIBILITY_ONLY** — Ziel-Fassade existiert, Implementation oder Alias liegt aber noch in der Legacy-/Compatibility-Zone.
- **PRODUCTIVE_LEGACY** — produktiv gerendert/erreichbar und physisch weiterhin Legacy.
- **NOT_PRODUCTIVELY_RENDERED** — Code existiert, ist aber aktuell kein produktiver Consumer.
- **DISABLED_ARCHIVED** — explizit deaktiviert/archiviert.
- **BLOCKED_INVALID_OR_MISSING_CONTRACT** — visuelle Idee vorhanden, produktive Aktivierung durch ungültigen/fehlenden Contract blockiert.

### Visual Recovery class

- **A — CANONICALIZE_NOW:** genehmigte produktive Visual-Funktionalität mit production-valid aktuellem Contract.
- **B — CONTRACT_REMEDIATION_REQUIRED:** nützliche Visual-Funktionalität, aber aktueller Data/Evidence/Authority-Contract ist nicht production-valid. Keine Aktivierung mit synthetischen/fallback Finanzwerten.
- **C — EXPLICITLY_DISABLED_OR_ARCHIVED:** explizit deaktiviert/archiviert; Reaktivierung nur nach aktueller Owner-Entscheidung und notwendigen Contract-/Architecture-Gates.

### Accessibility / Performance status

- **BASELINE** — bekannte generelle Frontend-Baseline vorhanden, aber keine Surface-spezifische Closure-Evidence.
- **PARTIAL** — einzelne relevante Mechanismen vorhanden, Closure-Gate nicht vollständig belegt.
- **REQUIRED** — vor Legacy-Exit bzw. Aktivierung explizit zu validieren.
- **BLOCKED** — produktive Validierung erst nach Contract-/Activation-Gate sinnvoll.

---

## 1. Application Composition — BB-1 / BB-2

| Surface | Current physical path | Canonical target path | Current consumer state | Recovery class | Data/authority contract | Supersession | Foreign owner | Legacy removal prerequisite | A11y | Perf |
|---|---|---|---|---|---|---|---|---|---|---|
| Application Composition Root | `src/app/App.tsx` | same | CANONICAL_CONNECTED | A | FE composition only | No | N/A | root `src/App.tsx` consumers = 0 before compatibility removal | BASELINE | PARTIAL |
| Session/Auth Composition | `src/app/auth/SessionComposition.tsx` | same | CANONICAL_CONNECTED | A | consumes IAM/Auth; no FE auth authority | No | CAPITAL-AI-GOV / applicable IAM owner | no session consumer depends on Root compatibility type/path | PARTIAL | BASELINE |
| Route Composition | `src/app/routing/AppRoutes.tsx` | same | CANONICAL_CONNECTED | A | routing/presentation only | No | N/A | legacy route composition = 0 | PARTIAL | PARTIAL |
| Dashboard Composition | `src/components/Dashboard.tsx` behind `src/app/dashboard/Dashboard.tsx` | `src/app/dashboard/*` | PRODUCTIVE_LEGACY | A for approved visible functions | must consume feature/domain contracts | No domain supersession by FE | per rendered domain | BB-2E + BB-2F + BB-2G parity; 0 productive Legacy composition | REQUIRED | REQUIRED |
| DashboardViewRouter | `src/app/dashboard/DashboardViewRouter.tsx` | same | CANONICAL_CONNECTED | A | presentation composition | No | N/A | remaining dashboard switch consumers removed | BASELINE | BASELINE |
| Public Analysis Workbench | `src/app/public/PublicAnalysisWorkbench.tsx` | same | CANONICAL_CONNECTED | A | preserves public/server-gated/login/disabled states | No | applicable FINTECH/DATA/IAM owners | no fallback to Legacy Dashboard public root | PARTIAL | PARTIAL |

### BB-2G visual-parity inventory gate

Before `src/components/Dashboard.tsx` can be removed, every approved productive Home/MyWorkspace visual capability must be mapped to an app-owned composition consuming feature facades. Physical Legacy implementation is not preservation evidence; functional parity through canonical consumers is.

---

## 2. Shared Presentation / Visualization Primitives

### Existing canonical shared primitives

| Component | Current physical path | State | Contract role |
|---|---|---|---|
| StatusBadge | `src/shared/ui/StatusBadge.tsx` | CANONICAL_CONNECTED | presentation-only status role |
| AuthorityBadge | `src/shared/ui/AuthorityBadge.tsx` | CANONICAL_CONNECTED | projects authority labels; does not create authority |
| FreshnessBadge | `src/shared/ui/FreshnessBadge.tsx` | CANONICAL_CONNECTED | projects supplied status/timestamps; must not compute DATA freshness policy |
| EvidenceStateIndicator | `src/shared/ui/EvidenceStateIndicator.tsx` | CANONICAL_CONNECTED | explicit evidence/data state projection |
| ResearchOnlyBanner | `src/shared/ui/ResearchOnlyBanner.tsx` | CANONICAL_CONNECTED | explicit non-authorizing research state |
| Button / Card / Input / Modal / Tooltip / Skeleton / EmptyState | `src/shared/ui/*` | CANONICAL_CONNECTED | fachneutrale UI primitives |
| CapitalAiLogo | `src/shared/branding/CapitalAiLogo.tsx` | CANONICAL_CONNECTED | projects `brandmark.json`; no second geometry authority |

### Planned shared visualization primitives

These are **roadmap targets, not current implementations**: `ChartFrame`, `ResponsiveChartContainer`, `VisualizationToolbar`, `TimeRangeControl`, `VisualizationLegend`, `DataStateOverlay`, `VisualizationSkeleton`, `AccessibleDataSummary`, bounded Crosshair/Tooltip primitives.

They may project only supplied domain/data states. They must not calculate score eligibility, ranking, evidence provenance or freshness policy.

---

## 3. Priority Visual Recovery Inventory

| Surface | Current physical path | Canonical target path | Current consumer state | Class | Data/authority contract status | Supersession required | Owning project if foreign | Legacy removal prerequisite | A11y | Perf |
|---|---|---|---|---|---|---|---|---|---|---|
| Enterprise Scorer / CryptoScoringEnterprise | `src/features/crypto/ui/CryptoScoringEnterprise.tsx` + routed workspace/public wrapper; Legacy bridge under `src/components/` | `src/features/crypto/ui` | CANONICAL_CONNECTED | A | canonical Crypto score/evidence consumer; presentation mode adds no authority | No | CAPITAL-AI-FINTECH + CAPITAL-AI-DATA for parent contracts | legacy bridge consumers = 0; authenticated/public presentation parity retained | PARTIAL | PARTIAL |
| RankingBoard | `src/features/screening/ui/RankingBoard.tsx`; aliases `UniverseBestWorst` | same | CANONICAL_CONNECTED | A | canonical score consumer; backend rank/order authority still FIN-17 partial | Owner-side replacement boundary pending | CAPITAL-AI-FINTECH / PVC-17 | backend rank/order result consumed; FE local ordering semantics eliminated; aliases consumers = 0 | PARTIAL | BASELINE |
| Realtime AI Newsfeed | `src/components/RealtimeAiNewsfeed.tsx` -> feature facade | `src/features/news/ui/RealtimeAiNewsfeed.tsx` or equivalent | COMPATIBILITY_ONLY | A | evidence-only news API; no fabricated headline/score mutation | No | DATA/News provider contract owner as applicable | physical implementation moved; inbound Legacy imports = 0 | PARTIAL | BASELINE |
| Market Sentiment | `src/components/MarketSentiment.tsx` | `src/features/news/ui` | PRODUCTIVE_LEGACY / BLOCKED_INVALID_OR_MISSING_CONTRACT | B | missing score currently coerced to `50`, label to `Neutral`; not fail-closed | Consumer remediation; owner contract if nullable/state semantics insufficient | DATA/FINTECH as resolved from current sentiment contract | remove local defaults; consume explicit unavailable/partial/stale state; Legacy imports = 0 | REQUIRED | BASELINE |
| Watchlist | `src/components/Watchlist.tsx` -> portfolio facade | `src/features/portfolio/ui` | COMPATIBILITY_ONLY | B | local persistence plus registry/market fallback semantics need field-level contract audit | Possibly | DATA for verified market fields; FINTECH for financial semantics if applicable | each displayed financial field mapped to valid contract; fallback fabrication removed; Legacy imports = 0 | REQUIRED | REQUIRED |
| MarketScreener | `src/components/MarketScreener.tsx` -> screening facade | `src/features/screening/ui` | COMPATIBILITY_ONLY | A/B boundary | verified screening/current score context exists; physical consumer and auxiliary summary paths need contract validation | Possibly for any obsolete compatibility route | FINTECH / DATA | canonical contract validation; physical migration; no local score fabrication | REQUIRED | REQUIRED |
| Screener | `src/components/Screener.tsx` | `src/features/screening/ui` | PRODUCTIVE_LEGACY or compatibility consumer depending route | A/B boundary | requires current screening/data contract audit | Possibly | FINTECH / DATA | valid canonical contract + physical migration + consumers = 0 | REQUIRED | REQUIRED |
| Charts | `src/components/Charts.tsx` | `src/features/analytics/ui` + shared chart primitives | PRODUCTIVE_LEGACY / BLOCKED_INVALID_OR_MISSING_CONTRACT | B | uses Recharts but consumes `/api/backtest-history` compatibility and `/api/charts-scoring` NON_PRODUCTION_SIMULATION | **Yes** for simulation/compatibility exit | FINTECH for chart-scoring; DATA for canonical history/evidence | cut over to canonical verified history/OHLCV; remove simulation-only scoring consumer; Legacy imports = 0 | REQUIRED | REQUIRED |
| Heatmap | `src/components/HeatmapCreator.tsx` | `src/features/analytics/ui` | PRODUCTIVE_LEGACY / BLOCKED_INVALID_OR_MISSING_CONTRACT | B | preset bullish/bearish/volume/pattern values and locally derived analytical semantics | **Yes/owner decision** before productive analytical activation | DATA/FINTECH according to future evidence/analysis contract | verified heatmap inputs/semantics or explicit research/unavailable mode; no preset finance evidence; Legacy imports = 0 | REQUIRED | REQUIRED |
| RawMaterialsDashboard | `src/features/commodities/ui/RawMaterialsDashboard.tsx`; Legacy bridge | same | CANONICAL_CONNECTED | A | verified commodity score separated from research/sandbox; unavailable remains explicit | No | FINTECH/DATA parent contracts | Legacy bridge consumers = 0 | PARTIAL | PARTIAL |
| Portfolio Performance | `src/components/PortfolioPerformance.tsx` -> portfolio facade | `src/features/portfolio/ui` | BLOCKED_INVALID_OR_MISSING_CONTRACT | B | deterministic synthetic performance series + fixed Sharpe/Drawdown/Vol/VaR; no verified NAV contract | **Yes / contract creation or replacement required** | resolve from current PVC; DATA for verified time-series evidence, FINTECH for derived financial semantics where applicable | verified NAV/performance series with provenance/asOf/freshness/unavailable states; derived metrics owner-authoritative; synthetic generator removed | BLOCKED | BLOCKED |
| Backtest Engine | `src/components/BacktestEngine.tsx` -> portfolio facade | `src/features/portfolio/ui` | COMPATIBILITY_ONLY | B | protected execution + canonical history consumer boundary not fully closed | Possibly | FINTECH protected execution; DATA history/evidence | owner-side entitlement/history boundaries valid; compatibility history removed where applicable | REQUIRED | REQUIRED |
| PortfolioBacktester | `src/components/PortfolioBacktester.tsx` | `src/features/portfolio/ui` | PRODUCTIVE_LEGACY / compatibility | B | same family as Backtest; full dependency audit required | Possibly | FINTECH + DATA | valid protected execution/history contracts; Legacy imports = 0 | REQUIRED | REQUIRED |
| MonteCarloDetailed | `src/components/MonteCarloDetailed.tsx` | `src/features/portfolio/ui` | PRODUCTIVE_LEGACY / BLOCKED_INVALID_OR_MISSING_CONTRACT | B | authoritative protected-execution binding remains owner-side concern | Possibly | CAPITAL-AI-FINTECH | owner-authoritative execution/entitlement contract; no client-local protected execution bypass | REQUIRED | REQUIRED |
| RealTimeRiskAssessment / VaR | `src/components/RealTimeRiskAssessment.tsx` | future target unresolved until explicit reactivation | DISABLED_ARCHIVED | C | archived null stub; former implementation intentionally removed from runtime | Only after explicit Owner architecture/contract decision | resolve then-current financial risk owner | explicit current Owner decision + verified risk contract + canonical PDF brand if reporting | BLOCKED | BLOCKED |

---

## 4. Compliance / Reporting / Governance Visuals

| Surface | Current physical path | Canonical target | Consumer state | Class | Contract status / blocker | Supersession | Foreign owner | Legacy removal prerequisite | A11y | Perf |
|---|---|---|---|---|---|---|---|---|---|---|
| ComplianceExporter | `src/components/ComplianceExporter.tsx` -> reporting facade | `src/features/reporting/ui` | COMPATIBILITY_ONLY | B | canonical PDF branding/server grant, but report contains fixed portfolio/risk KPIs that are not verified financial evidence | owner-side financial metric replacement needed | DATA/FINTECH for financial values; IAM/billing owner for protected grant | fixed KPIs removed/replaced with verified values or explicit unavailable; physical migration | REQUIRED | REQUIRED |
| PdfExportModal | `src/components/PdfExportModal.tsx` | `src/features/reporting/ui` | PRODUCTIVE_LEGACY | A/B boundary | server-side credit/subscription grant must remain authoritative | No FE supersession | applicable IAM/Billing authority | physical migration without weakening server grant | REQUIRED | BASELINE |
| AdminPortal | `src/components/AdminPortal.tsx` -> governance facade | `src/features/governance/ui` | COMPATIBILITY_ONLY | A/B boundary | IAM-gated presentation; many subcomponents still Legacy | No FE authority supersession | CAPITAL-AI-GOV for Governance/IAM | physical migration of approved UI; no browser authority; Legacy imports = 0 | REQUIRED | REQUIRED |
| Admin Process Graph | `src/features/governance/ui/process-graph/AdminProcessGraph.tsx` | same | CANONICAL_CONNECTED | A | read-only PVC/dependency/evidence projection | No | CAPITAL-AI-GOV parent semantics | maintain projection-only boundary | PARTIAL | BASELINE |
| Audit / Security / Supervisor panels | `src/components/*` via AdminPortal | `src/features/governance/ui` | PRODUCTIVE_LEGACY / COMPATIBILITY_ONLY | A/B boundary | project current Governance/OPS contracts; UI must not become control authority | No FE supersession | GOV / OPS by capability | contract audit + physical migration + Legacy imports = 0 | REQUIRED | REQUIRED |

---

## 5. Public / User / Billing / Legal Surfaces

| Surface | Current path | Canonical target | Consumer state | Class | Notes / removal gate |
|---|---|---|---|---|---|
| LandingPage | `src/features/public/ui/LandingPage.tsx` | same | CANONICAL_CONNECTED | A | Legacy bridge only removable at 0 inbound consumers |
| LoginPage | `src/features/public/ui/LoginPage.tsx` | same | CANONICAL_CONNECTED | A | `/login` remains dedicated auth route; no Public session fabrication |
| Datenschutz / ImpressumAgb | Legacy components through public facade | `src/features/public/ui` | COMPATIBILITY_ONLY | A | physical migration after dependency audit |
| Profile / Passkey / TOTP | `src/components/*` | `src/features/settings/ui` | PRODUCTIVE_LEGACY | A/B boundary | IAM contracts remain foreign-authoritative; physical migration only |
| Subscription / Checkout | `src/components/*` | `src/features/billing/ui` | PRODUCTIVE_LEGACY | A/B boundary | browser tier is not entitlement authority; server/billing contract must remain authoritative |

---

## 6. Other Visual / Analytical Components

| Surface | Current path | Target | State | Class | Key gate |
|---|---|---|---|---|---|
| FavoriteAssetPatternSlots | `src/components/FavoriteAssetPatternSlots.tsx` | `src/features/portfolio/ui` | PRODUCTIVE_LEGACY | A/B boundary | Binance Kline evidence is real/read-only but browser-direct provider path and contract ownership require dependency audit before physical canonicalization |
| EnterpriseAsset4hChart | `src/features/crypto/ui/EnterpriseAsset4hChart.tsx` | same | CANONICAL_CONNECTED | A | maintain MARKET_DATA projection and fail-closed state semantics |
| EnterpriseBinanceQuickAnalysis | `src/features/crypto/ui/EnterpriseBinanceQuickAnalysis.tsx` + Legacy bridge | `src/features/crypto/ui` | CANONICAL_CONNECTED | A | authenticated context retained; Legacy bridge consumers = 0 before removal |
| BuffetValueCheck | Legacy implementation through stocks facade | `src/features/stocks/ui` | COMPATIBILITY_ONLY | A/B boundary | stock-only/server entitlement/evidence contracts remain authoritative |
| DeFiOrchestration | `src/components/DeFiOrchestration.tsx` | `src/features/crypto/ui` | PRODUCTIVE_LEGACY / research | B unless current productive contract proves otherwise | research/evidence boundary must remain non-score-authoritative |
| QuantumGraph | `src/components/QuantumGraph.tsx` | `src/features/analytics/ui` | PRODUCTIVE_LEGACY / audit required | B pending dependency audit | no graph framework adoption until true node-edge requirement and contracts verified |
| PerformanceDashboard | `src/components/PerformanceDashboard.tsx` | analytics/governance target after audit | PRODUCTIVE_LEGACY | A/B boundary | distinguish real operational telemetry from browser-generated metrics; OPS authority preserved |
| InteractModule | `src/components/InteractModule.tsx` | none while archived | DISABLED_ARCHIVED | C | no reactivation without explicit Owner decision |

---

## 7. Contract / Authority Reference Map

This Inventory only points to current parent authorities; it does not restate or supersede them.

| Concern | Current authority / project |
|---|---|
| Frontend structure | `docs/frontend/FRONTEND_ARCH.md` / CAPITAL-AI-FE |
| Frontend sequencing | `docs/frontend/FRONTEND_ROADMAP.md` / CAPITAL-AI-FE |
| Design roles / brand geometry | `docs/frontend/design-tokens.json`, `docs/frontend/brandmark.json` |
| Asset Catalog vs Market Evidence | ADR-0032 / DATA ownership |
| Provider Data Plane / Provenance / Freshness | ADR-0041 + ESS-0016 / CAPITAL-AI-DATA |
| Canonical Scoring | SC-MD-SPT-0001 + ADR-0087 / CAPITAL-AI-FINTECH technical chain |
| Ranking / Decision Support | CAPITAL-AI-FINTECH / PVC-17 |
| Protected financial execution / entitlement integration | current FINTECH + applicable IAM/entitlement authority |
| Governance / IAM control plane | current CAPITAL-AI-GOV authorities |
| Runtime / Traceability / Deployment | CAPITAL-AI-OPS where applicable |

Current DATA main now composes provider input validation, freshness and provenance into `ValidatedDataInput` history/snapshot exits. FE consumers must preserve those supplied states and must not substitute local cache age or UI defaults for DATA freshness/evidence status.

---

## 8. Legacy Removal Gates

A Legacy implementation, bridge or alias may be removed only when all applicable conditions are true:

1. approved user-visible behavior is available through canonical app/feature consumers, or an explicit current Owner decision disables/archives it;
2. productive inbound consumer count for the Legacy path is `0`;
3. any required owner-side API/Data/ADR/ESS supersession is effective;
4. no Frontend consumer depends on a superseded compatibility API contract;
5. Accessibility/Performance gates for the replacement are satisfied where required;
6. architecture/contract tests prove no parallel Frontend/domain authority was introduced;
7. immutable historical/audit evidence remains preserved.

`src/components/` reaches closure only when it contains `0` productive implementations. Compatibility files that remain temporarily must be demonstrably non-productive and have a zero-consumer removal plan; BB-10 target remains `0` required compatibility re-exports.

---

## 9. Inventory Maintenance Rules

1. No new productive UI/domain implementation is created under `src/components/`.
2. New domain UI belongs in `src/features/<domain>/ui`; app composition in `src/app`; fachneutrale primitives in `src/shared`.
3. A feature facade re-exporting `src/components/*` is **COMPATIBILITY_ONLY**, not physical migration.
4. Every priority financial visual records physical path, canonical target, consumer state, Recovery class, contract status, supersession need, foreign owner, Legacy removal prerequisite, Accessibility and Performance status.
5. `NOT_AVAILABLE`, `STALE`, `PARTIAL`, `INVALID` and `NOT_COMPUTABLE` are never converted to local neutral/default finance values.
6. Runtime/Data/Scoring/Ranking rules are referenced, not redefined here.
7. Public presentation modes may hide authenticated UI, but may not reinterpret or bypass server-side authorization.
8. Class C code is never reactivated solely because historical code exists.
9. After every relevant migration/contract supersession, Inventory and Roadmap are re-correlated against then-current main.
10. NOT RUN checks are never represented as PASS.

---

*Version 1.8.0 re-korreliert das bestehende Component Inventory gegen `main@fb3fff1f3959d1c6f87d20228036366848600487`. Die Public Enterprise Scorer-/Sideboard-Recovery wird als gemergter Current-Main-Zustand behandelt; Visual-Recovery A/B/C, Contract-/Supersession-Gates, Accessibility-/Performance-Status und absolute Legacy-Exit-Voraussetzungen sind nun explizit inventarisiert. Das Dokument bleibt Bestandsnachweis und erzeugt weder eine parallele Roadmap noch eine neue Frontend-/Financial-Authority.*