# Public Analysis Sideboard — Scope & Access Evidence

**Date:** 2026-09-07  
**Project:** CAPITAL-AI-FE  
**Primary Owner:** CAPITAL-AI-FE  
**Primary Productive PVC:** N/A — cross-cutting presentation project  
**Baseline:** `main@a7e15f83a7dcfbac386aff3f801000901b99634e`  
**Working branch:** `agent/frontend-public-analysis-sideboard-20260907`  
**Status:** IMPLEMENTED ON BRANCH / HOSTED VALIDATION NOT RUN

## Owner-directed product requirement

The public landing page shall again expose the established assessment-tool navigation and Sideboard instead of presenting only one Enterprise Scorer preview.

This requirement changes presentation and discoverability only. It does not authorize a second scoring/data architecture, an anonymous Supabase/IAM session, a client-side entitlement bypass, or reactivation of modules that current main explicitly disables.

## Canonical composition

```text
/
→ src/app/routing/AppRoutes.tsx
→ src/features/public/ui/LandingPage.tsx
→ src/app/public/PublicAnalysisWorkbench.tsx
→ existing canonical feature UI / compatibility facades
```

`src/components/Dashboard.tsx` is intentionally not restored as the public root. The public shell remains independent of the authenticated Dashboard monolith and the workbench lazy-loads the selected analysis module.

## Restored Sideboard inventory

| Tool | Public Sideboard | Direct public execution | Current boundary |
|---|---:|---:|---|
| Enterprise Scorer | yes | yes | canonical `PublicCryptoScoringPreview`; authenticated quick-analysis sub-surface remains omitted in `public-preview` mode |
| Universe TOP Rankings | yes | yes | canonical `RankingBoard`; consumes verified scoring boundaries |
| Buffett Value Check | yes | yes, server-gated | `POST /api/entitlements/warren-buffett/authorize` remains authoritative; guest denial remains fail-closed under ADR-0034 |
| Rohstoff-Bewertung | yes | yes | canonical commodities UI; missing/unverified values remain explicit |
| Profi Markt-Screener | yes | yes | existing verified screening/context boundaries; no local score fabrication |
| Multi-Asset Universum | yes | no | login-required until its public Evidence/contract surface is separately validated |
| Ad-Hoc Charts | yes | no | login-required; current legacy implementation contains simulated-history fallback semantics that are unsuitable as an unauthenticated authoritative market-data projection |
| Preis-Alarme | yes | no | login-required; current implementation keeps session-bound alert state and therefore is not assigned a fabricated public identity |
| AI Markt-Sentiment | yes | no | login-required; current legacy implementation contains preset/simulation datasets and is not promoted to public verified evidence |
| DeFi Orchestration | yes | no | login-required pending separate public Research/contract review |
| Backtest Engine | yes | no | login-required; ADR-0034 plan matrix restricts Backtest to Pro/Enterprise |
| Value-at-Risk Assessment | yes | no | current `DashboardViewRouter` explicitly marks the module disabled; the public Sideboard preserves that state |

## Security / data-integrity invariants

- No `PUBLIC_VISITOR_SESSION`, no `type: 'guest'` composition and no anonymous persisted Supabase/IAM session are introduced on `/`.
- Public tool visibility is never treated as backend authorization.
- Buffett access remains server-authorized; no browser-side tier claim can grant access.
- Login-required tools route users to `/login` rather than receiving fabricated guest identity.
- Disabled tools remain disabled.
- No simulated/preset value source is presented as verified public market/scoring evidence by this slice.
- `LandingPage` remains a feature-owned presentation component without a dependency back to `src/app/**`.
- The authenticated `/dashboard` composition remains separate and lazy.

## Validation status

Source-contract regression coverage is updated in `tests/unit/publicLandingRoute.test.ts` for:

- public root → lazy app-owned workbench composition;
- Sideboard tool inventory including Preis-Alarme;
- no legacy Dashboard on `/`;
- no guest/IAM session restoration;
- preserved Buffett server authorization;
- preserved current Risk Assessment disablement;
- no direct public execution of Backtest, Sentiment, Charts, PriceAlert or DeFi;
- preserved canonical Enterprise Scorer public-preview guard.

Runtime/TypeScript/Unit/Production Build/CSP/Predeploy checks for this branch are **NOT RUN** before PR creation because no local repository execution environment is available in this chat. They must be provided by the C-P hosted PR checks for the exact PR head before Human/CODEOWNER merge.

## Roadmap impact

This Owner-directed restoration is the active P0 Frontend slice ahead of BB-2E. After its merge/closeout, the Frontend roadmap should resume with BB-2E Navigation/Drawer extraction unless a newer Owner direction or current-main authority reprioritizes the queue.
