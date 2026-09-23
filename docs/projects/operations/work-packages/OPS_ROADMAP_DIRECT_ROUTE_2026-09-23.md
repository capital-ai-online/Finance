# OPS-ROADMAP-DIRECT-ROUTE-01 — Production SPA Fallback for /roadmap

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Dependency:** `FE-ROADMAP-LIVE-01`  
**Original baseline:** `main@7bcc6aee2700d6fa3f926ff8615b04cde136750c`  
**Merged main:** `main@d370b579d7c9576af63f6b3d495c1778d697a9c4`  
**Merged PR:** `#1315`  
**Status:** `DONE_MAIN / TERMINAL_REPOSITORY_SLICE`

## Objective

Allow direct production navigation to `/roadmap` through the existing SPA fallback after the FE client route lands, without promoting the Roadmap dashboard into the SEO sitemap/prerender/public-HTML contract.

## Boundary

This slice changes only the existing server route classification and finite SPA fallback selection:

- `/roadmap` is in `APPLICATION_SPA_PATHS`;
- the existing SPA fallback serves the already trusted root `index.html` for direct `/roadmap` navigation;
- `/roadmap` is not added to `PUBLIC_SPA_PATHS`;
- no sitemap, prerender, canonical, JSON-LD or search-indexing semantics are added;
- no auth, IAM, scoring, data, deployment-provider or branding authority changes are introduced.

The FE component/router remains owned by `CAPITAL-AI-FE`. This OPS slice owns only the production server fallback.

## Exit evidence

1. focused regression proved `/roadmap` is application-SPA reachable on the exact PR head;
2. focused regression proved `/roadmap` remains outside `PUBLIC_SPA_PATHS`;
3. ordinary exact-head Required Checks passed before merge;
4. Human/CODEOWNER merged PR #1315 as `d370b579d7c9576af63f6b3d495c1778d697a9c4`;
5. the exclusive work claim is released in the post-merge reconciliation slice.

## Post-merge production correlation

Repository implementation is terminal. Production availability remains a separate evidence class and is not inferred from the merge itself.

At post-merge reconciliation time, the repository-native **Post-Merge Production Correlation** for `d370b579d7c9576af63f6b3d495c1778d697a9c4` was still running. A later Production readback must verify the deployed SHA and direct `/roadmap` request before any UI projection reports Production as aligned.

This pending runtime readback does not reopen the repository implementation package; any production drift or route failure becomes fresh owner-correct OPS evidence/remediation.
