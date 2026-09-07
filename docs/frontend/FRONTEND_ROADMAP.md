# CAPITAL-AI Frontend Roadmap

**Projekt:** capital-ai.online  
**Repository:** SvenKulessa/Finance  
**Version:** 1.8.1  
**Stand:** 7. September 2026  
**Korrelationsbasis:** `main@fb3fff1f3959d1c6f87d20228036366848600487`  
**Current Project:** `CAPITAL-AI-FE`  
**Current Project Folder:** `docs/projects/frontend/`  
**Primary Productive PVC:** `N/A` (`[]`)  
**Primary Owner:** `CAPITAL-AI-FE`  
**Normative Frontend-Authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Bestandsnachweis:** `docs/frontend/COMPONENT_INVENTORY.md`

Dieses Dokument ist die **bestehende kanonische Frontend-Migrations-, Visual-Recovery- und UX-Roadmap**. Version 1.8.1 aktualisiert und erweitert diese Roadmap; sie erzeugt weder eine zweite Roadmap noch eine parallele Frontend-, Visualization-, Server-State-, Scoring-, Data-, Evidence-, IAM- oder Governance-Architektur.

- `FRONTEND_ARCH.md` bestimmt **wie** das Frontend strukturiert sein muss.
- `COMPONENT_INVENTORY.md` beschreibt **was** aktuell existiert und welche Recovery-/Contract-Gates gelten.
- `FRONTEND_ROADMAP.md` bestimmt **wann/in welcher Reihenfolge** migriert und modernisiert wird.
- `design-tokens.json` und `brandmark.json` bleiben die kanonischen Brand-Verträge.
- Primary-Owner-Roadmaps, `SC-MD-SPT-0001` und anwendbare ADR-/ESS-/API-/Data-Contracts bestimmen fachliche Runtime-/Evidence-/Scoring-/Governance-Semantik.

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

### Current Restschuld

- `src/components/Dashboard.tsx` remains the largest authenticated composition monolith.
- Navigation, Drawer, Header and Home/MyWorkspace composition remain incomplete.
- Many feature facades still re-export implementations from `src/components/`.
- `PortfolioPerformance.tsx` generates synthetic performance/risk values.
- `HeatmapCreator.tsx` seeds/derives local financial analytics semantics.
- `MarketSentiment.tsx` defaults missing score/label to `50` / `Neutral`.
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

- **A — CANONICALIZE_NOW:** approved productive visual with valid current contract.
- **B — CONTRACT_REMEDIATION_REQUIRED:** useful visual but current Data/Evidence/Authority contract is not production-valid; no synthetic fallback activation.
- **C — EXPLICITLY_DISABLED_OR_ARCHIVED:** no reactivation without explicit current Owner decision and required contracts/architecture.

| Surface | Class | Current finding | Recovery Gate |
|---|---|---|---|
| Enterprise Scorer | A | canonical Crypto slice; public recovery merged | feature facade; Legacy bridge at 0 consumers |
| RankingBoard | A | canonical UI; FIN-17 backend rank/order closure remains | consume backend rank/order; remove FE-local ordering semantics and aliases |
| Realtime AI Newsfeed | A | evidence-only; no fabricated headlines/score mutation | physical migration to news feature + explicit data states |
| RawMaterialsDashboard | A | canonical fail-closed commodity surface | remove Legacy bridge at 0 consumers |
| MarketScreener / Screener | A/B boundary | productive but physical/contract audit incomplete | canonical contracts + physical migration |
| Watchlist | B | local persistence/fallback financial values | field-level contract audit; unavailable instead of fallback |
| Market Sentiment | B | missing score/label -> `50` / `Neutral` | remove defaults; explicit nullable/state semantics |
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

**Visual Recovery means preserve approved functionality, not Legacy code.**

---

## 5. Visualization System — target >= 8.5/10

Renderer strategy:

- **Recharts** default standard financial/dashboard renderer; already present.
- **D3** only justified custom geometry/interaction; already present.
- **React Flow / XYFlow** evaluate only for true node-edge graphs.

Planned fachneutrale shared primitives:

- `ChartFrame`, `ResponsiveChartContainer`, `VisualizationToolbar`, `TimeRangeControl`, `VisualizationLegend`, `DataStateOverlay`, `VisualizationSkeleton`, `AccessibleDataSummary`, bounded Crosshair/Tooltip primitives.

Required states:

`loading | available | partial | stale | invalid | not-computable | unavailable | error`

Charts require accessible names/descriptions, text/table alternatives, keyboard-operable controls, non-color-only status, reduced-motion support and tooltips that are not the only information carrier.

---

## 6. Server-State / Data-Contract Architecture — target >= 8.5/10

Evaluate **TanStack Query** for central query keys, AbortSignal/cancellation, request deduplication, explicit invalidation, bounded retries and separation of local UI state from server state. Cache state never redefines evidence freshness.

Contract tooling evaluation:

- **Zod** runtime validation at API/Data boundaries where no equivalent repo-native validation exists.
- **openapi-typescript** only when canonical current OpenAPI exists.
- **MSW** deterministic contract/failure/stale/partial/error tests.
- **OpenTelemetry JS** only conditionally with OPS/privacy correlation; no parallel telemetry authority.

No dependencies are installed by this documentation slice.

---

## 7. Contract Supersession Lane

Supersession is permitted only when a current ADR/ESS/API/Data compatibility contract materially blocks canonical architecture/data integrity. FE identifies blockers and consumes replacements; foreign Primary Owners own actual supersession.

Workflow: exact blocker -> current Primary Owner resolution -> exact replacement scope/exclusions/impact -> owner-side decision -> consumer cutover -> zero productive consumers -> compatibility removal -> retain historical/audit evidence.

| Blocker | FE impact | Owner route |
|---|---|---|
| `/api/charts-scoring` | `NON_PRODUCTION_SIMULATION` consumer | `CAPITAL-AI-FINTECH`; FE cutover then owner-side removal at 0 consumers |
| `/api/backtest-history` | compatibility/simulated history | DATA canonical history/evidence + FINTECH protected Backtest execution |
| FIN-17 rank/order | RankingBoard must not own rank/order semantics | `CAPITAL-AI-FINTECH / PVC-17` |
| Portfolio NAV/performance series | PortfolioPerformance cannot be evidence-valid | **REQUIRES_CORRELATION — resolve exact Primary Owner from then-current PVC/project/contract authority; FE does not guess** |
| Heatmap analysis semantics | current UI fabricates/derives analytical values | **REQUIRES_CORRELATION** before creating/changing a domain contract |
| Compliance financial KPIs | fixed metrics are not audit evidence | resolve exact then-current financial contract authority per metric |

---

## 8. Portfolio Performance Integrity Gate

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

## 9. Accessibility — target >= 8.0/10

Target: WCAG 2.2 AA; BFSG / EN 301 549 where applicable to then-current product/legal scope.

Evaluate/reuse Vitest, Storybook + accessibility addon, axe-core and Playwright.

Evidence gates: keyboard-only critical journeys, logical focus order, dialog/drawer focus management and return focus, landmarks/accessible names, chart text/table alternatives, non-color-only status, reduced motion, zoom/reflow, touch targets, mobile navigation and accessible loading/error/empty states. Automated axe checks complement but do not replace manual keyboard/screenreader evidence.

---

## 10. Performance — target >= 8.5/10

Evaluate/reuse Vite, Lighthouse CI, `web-vitals`, `rollup-plugin-visualizer`, Browser Performance APIs.

p75 targets: LCP <=2.5s, INP <=200ms, CLS <=0.1. Additional targets: Lighthouse Performance >=90, Lighthouse Accessibility >=95.

Actions: route/workspace lazy loading, lazy heavy chart/D3 modules, no unnecessary authenticated bundles in Public bootstrap, eliminate request waterfalls, deduplicate server-state requests, bundle budgets, long-task/main-thread observation, reduced motion. Performance must never weaken security/data-integrity/provenance/evidence/authorization gates.

---

## 11. OSS / Free Tooling Evaluation

| Candidate | Role | Availability | Decision |
|---|---|---|---|
| Recharts | standard charts | OSS/MIT, present | REUSE / DEFAULT |
| D3 | custom geometry | OSS/ISC, present | REUSE BOUNDED |
| React Flow / XYFlow | node-edge graphs | OSS | EVALUATE ONLY |
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

No paid-only proprietary dependency is required.

---

## 12. Domain Waves / DoD

- **BB-3 Public/Users/Settings/Billing:** Public landing/sideboard canonical; remaining surfaces migrate without IAM/Billing authority shift.
- **BB-4 Screening/Discovery:** RankingBoard canonical; Screener/MarketScreener/AssetUniverse physical migration + FIN-17 boundary.
- **BB-5 News/Sentiment/Social/Reporting:** Newsfeed canonicalize; sentiment only after fallback remediation; reporting only contract-valid metrics.
- **BB-6 Analytics/Crypto/Commodities/Visualization:** Charts/Heatmap remain Class B until remediation; shared visualization system introduced incrementally.
- **BB-7 Portfolio/Risk/Backtesting:** PortfolioPerformance blocked until verified contract; Risk Assessment remains Class C.
- **BB-8 Governance/Admin/Compliance:** feature-owned UI without control-plane duplication.
- **BB-9 Stocks/Buffett:** physical migration with existing entitlement/evidence authorities.

Every BB-3..BB-9 migrated surface requires zero productive Legacy consumer, reviewed Server/Data contract, appropriate shared Visualization/Accessibility primitives, performance budget, approved visual functionality preserved and no new FE authority.

---

## 13. BB-10 Absolute Productive Legacy Exit — 10/10

End state:

- `0` productive implementations under `src/components/`;
- `0` required Compatibility re-exports;
- `0` productive superseded UI alias consumers;
- `0` Frontend consumers of superseded API contracts;
- `0` productive Legacy Dashboard composition;
- `0` productive obsolete branding aliases/local governed color literals.

Compatibility removal only after consumer count `0` and applicable owner-side supersession. Historical/audit evidence remains.

---

## 14. BB-11 Closure

Required: Visualization >=8.5, Server/Data Contract >=8.5, Accessibility >=8.0, Performance >=8.5, Legacy Exit 10/10, TypeScript PASS, Unit/Contract Tests PASS, Architecture Tests PASS, Production Build PASS, Accessibility Evidence PASS, Performance Budget PASS, Authority/Data Contract Correlation PASS, Duplicate Authority NONE.

`NOT RUN` is never PASS.

---

## 15. Governance per Wave

Before every Frontend PR: current main + `/AGENTS.md`; open PR/writers; changed-file/semantic/namespace/authority overlap; Current Project/PVC/Owner; Roadmap/Inventory; applicable ADR/ESS/API/Data contracts; consumer/compatibility exits; design/a11y/perf drift; required low-cost validators; final sync/correlation before exact PR-creation approval.

Foreign supersession remains with the owning Primary Owner.

---

## 16. Immediate Roadmap Order

1. **BB-2E Navigation / Drawer completion**.
2. Re-correlate, then **BB-2F Header / Application Shell extraction**.
3. Then **BB-2G Visual-Parity / Composition Closure** before Legacy Dashboard removal.

Visualization/Server-State/Accessibility/Performance work is applied inside these and later waves, not as a parallel roadmap.

---

*Version 1.8.1 re-correlates the existing canonical roadmap to `main@fb3fff1f3959d1c6f87d20228036366848600487`, treats Public Enterprise Scorer and Public Analysis Sideboard as merged Current-Main recovery, makes Portfolio ownership fail-closed `REQUIRES_CORRELATION`, integrates A/B/C recovery, owner-bounded supersession and measurable quality/Legacy-exit gates, and creates no second roadmap or architecture.*