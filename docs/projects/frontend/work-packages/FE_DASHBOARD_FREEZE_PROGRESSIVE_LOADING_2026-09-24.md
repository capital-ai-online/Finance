# FE-DASHBOARD-FREEZE-PROGRESSIVE-LOAD — Authenticated Dashboard First-Render Recovery

**Project:** `CAPITAL-AI-FE`  
**Owner:** `CAPITAL-AI-FE`  
**PVC relationship:** cross-cutting presentation/performance; no productive PVC ownership  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Base:** `main@c06a907ab42bb118133951a27e77f154c8c4cba0`  
**Status:** `IN_PROGRESS / OWNER_DIRECTED`

## Finding

The Human Owner confirmed that Google/Gmail registration and authentication now succeed, but the page freezes when the authenticated user opens `/dashboard`.

Fresh CURRENT_MAIN inspection shows that the protected route itself is already lazy. The next layer defeats that boundary:

1. `Dashboard.tsx` statically imports `DashboardHome`, `MyWorkspaceView`, `DashboardViewRouter` and broad feature facades.
2. `DashboardViewRouter.tsx` statically imports nearly all feature UI namespaces and is mounted even while `activeView === 'dashboard'`, where it returns `null`.
3. `DashboardHome.tsx` starts the crypto workspace, newsfeed, PDF/compliance exporter, market sentiment and image-analysis modules in one render.

This creates a large synchronous module-evaluation/render path immediately after the full-page `/dashboard` navigation.

## Bounded implementation

- preserve the backend-owned auth/session path unchanged;
- make Dashboard Home, MyWorkspace, detail router and guest modal explicit lazy boundaries;
- mount the detail router only for actual detail views;
- split default-home heavyweight widgets behind progressive lazy boundaries so first paint is not hostage to below-the-fold code;
- keep scoring/data/billing/IAM semantics unchanged;
- add a regression test that rejects reintroduction of the eager `../../features` barrel in the critical dashboard composition.

## Dependencies and overlap

- Current main at selection: `c06a907ab42bb118133951a27e77f154c8c4cba0`.
- Open PRs #1363, #1364 and #1365 do not touch the dashboard/auth frontend paths.
- Historical pricing claim `CAPITAL-AI-FE-PRICING-ARCHIVE-OPEN-VISIBILITY-20260923` is stale because PR #1325 is merged; it is released when this overlapping path is touched.
- Render log access is not required for the repository fix; the connector requires an explicit Human-selected workspace before log access.

## Exit evidence

1. Dashboard critical composition does not statically load the general feature barrel.
2. Detail-route feature graph is not mounted for Dashboard Home or MyWorkspace.
3. Heavy Dashboard Home widgets have isolated lazy/progressive fallbacks.
4. Focused regression test plus TypeScript/unit/build pass on exact head.
5. Fresh main/open-writer correlation is repeated before PR readiness.
6. Human/CODEOWNER merge remains required.
