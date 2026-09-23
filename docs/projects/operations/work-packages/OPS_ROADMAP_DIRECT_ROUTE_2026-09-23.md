# OPS-ROADMAP-DIRECT-ROUTE-01 — Production SPA Fallback for /roadmap

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Dependency:** `FE-ROADMAP-LIVE-01`  
**Baseline:** `main@7bcc6aee2700d6fa3f926ff8615b04cde136750c`  
**Status:** `OWNER-DIRECTED / ACTIVE / IMPLEMENTATION_IN_BRANCH`

## Objective

Allow direct production navigation to `/roadmap` through the existing SPA fallback after the FE client route lands, without promoting the Roadmap dashboard into the SEO sitemap/prerender/public-HTML contract.

## Boundary

This slice changes only the existing server route classification and finite SPA fallback selection:

- add `/roadmap` to `APPLICATION_SPA_PATHS`;
- serve the already trusted root `index.html` for direct `/roadmap` navigation;
- do not add `/roadmap` to `PUBLIC_SPA_PATHS`;
- do not add sitemap, prerender, canonical, JSON-LD or search-indexing semantics;
- do not change auth, IAM, scoring, data, deployment, provider or branding authority.

The FE component/router remains owned by `CAPITAL-AI-FE`. This OPS slice provides only the production server fallback.

## Exit evidence

1. focused regression proves `/roadmap` is application-SPA reachable;
2. focused regression proves `/roadmap` remains outside `PUBLIC_SPA_PATHS`;
3. exact-head ordinary checks pass;
4. final merge remains Human/CODEOWNER-only.
