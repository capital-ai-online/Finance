# WP-SEO-TECH-GATE + WP-SEO-SCHEMA — FE/OPS Handoff — 2026-09-11

**Project:** `CAPITAL-AI-SEO`  
**Roadmap:** `SEO-GM-ROADMAP-0002.16`  
**Repository baseline:** `main@eab5750a481fd68e93a41c409b561dabc4dcbf13`  
**Working branch:** `agent/seo-metrics-tech-gates-20260911`  
**SEO role:** requirement/evidence owner  
**Productive implementation owners:** `CAPITAL-AI-FE` and `CAPITAL-AI-OPS` according to affected surface  
**Mutation scope of this handoff:** none outside SEO documentation

## 1. Current repository findings

The current public SEO route set is duplicated across multiple implementation surfaces:

1. `src/lib/routeSeo.ts` — `ROUTES` / `listPublicRouteSeoPaths()`;
2. `public/sitemap.xml` — canonical public URLs;
3. `scripts/seo/prerender-public-routes.mjs` — independent `ROUTES` array;
4. `server/middleware/seoUrlNormalize.ts` — independent `PUBLIC_SPA_PATHS` set;
5. `server/runtime/spaFallback.ts` — independent public HTML file map and route switch.

All currently represent the same five public routes:

```text
/
/learning-platform
/impressum
/agb
/datenschutz
```

The existing `tests/unit/seoPublicRouteSitemap.test.ts` already proves exact equality between `routeSeo` and `sitemap.xml`, plus canonical-origin/query/hash/trailing-slash invariants. It does **not** prove equality with prerender or server public-route allowlists.

ADR-0084 already records the duplicated prerender route map and explicitly names a future single-shared-module follow-up. This handoff does not create a parallel route authority.

## 2. WP-SEO-TECH-GATE — bounded target

### Required invariant

For every indexable public route, the following sets must be deterministically equivalent:

```text
routeSeo public routes
= sitemap canonical paths
= prerender public routes
= server PUBLIC_SPA_PATHS
= public path branches with route-specific HTML fallback
```

Application-only routes such as `/login`, `/dashboard` and `/media-studio` remain outside this indexable set.

### Minimum automated regression

Owner implementation must fail when any of these conditions occurs:

1. a public canonical route is missing from the sitemap;
2. the sitemap contains a route not present in the canonical public SEO route inventory;
3. a public route is missing from prerender output planning;
4. `PUBLIC_SPA_PATHS` differs from the canonical public route inventory;
5. a private/application route leaks into sitemap or public prerender inventory;
6. a non-root canonical URL contains a trailing slash, query or fragment;
7. a route-specific canonical differs between client metadata and prerendered HTML;
8. an unknown path stops returning real HTTP 404;
9. an indexable page gains initial `noindex` without an explicit owner-scoped SEO decision.

### Smallest owner-correct implementation slice

**Preferred first slice:** extend the existing repository regression so it consumes/export-compares the authoritative public-route sets without changing public behavior. If direct importing of the `.mjs` prerender script is impractical because it performs filesystem side effects at module load, first extract only the static route manifest/data into a neutral shared module and keep all existing consumers behaviorally equivalent.

Do not introduce a second SEO routing system. Any shared-manifest extraction must preserve ADR-0084's finite allowlist and `spaFallback` path-traversal protections.

### Owner routing

| Surface | Primary implementation owner | Expected change |
|---|---|---|
| `src/lib/routeSeo.ts` / shared public-route metadata | `CAPITAL-AI-FE` | expose or consume canonical route manifest without behavior change |
| `tests/unit/seoPublicRouteSitemap.test.ts` and related route tests | `CAPITAL-AI-FE` with SEO acceptance criteria | set-equivalence/canonical regression |
| `scripts/seo/prerender-public-routes.mjs` | `CAPITAL-AI-OPS` if build/runtime pipeline ownership applies | consume the same bounded public-route manifest or expose a side-effect-free route descriptor |
| `server/middleware/seoUrlNormalize.ts` | `CAPITAL-AI-OPS` | preserve exact finite public allowlist and app/public separation |
| `server/runtime/spaFallback.ts` | `CAPITAL-AI-OPS` | preserve trusted literal/precomputed sendFile candidates and 404 behavior |

No ownership transfer is implied by this table.

## 3. WP-SEO-SCHEMA — bounded target

Current `index.html` contains one JSON-LD graph with:

- `Organization`;
- `WebSite`;
- `SoftwareApplication`;
- stable `@id` references under `https://capital-ai.online/#...`;
- `SoftwareApplication.softwareVersion`;
- `publisher` references;
- an `Offer` declaration.

An existing test indirectly checks that `SoftwareApplication.softwareVersion` matches `package.json`, but no dedicated lifecycle regression was found that parses and validates the full intended graph.

### Minimum repository regression

A dedicated structured-data regression should parse the JSON-LD rather than rely only on substring checks and fail when:

1. the JSON-LD block is invalid JSON;
2. intended entity IDs are duplicated or missing;
3. `WebSite.publisher` or `SoftwareApplication.publisher` points to a missing graph entity;
4. canonical entity URLs drift away from `https://capital-ai.online/`;
5. `SoftwareApplication.softwareVersion` differs from `package.json#version`;
6. an `Offer` is declared with incomplete price/currency semantics;
7. a schema type is added that is not represented by the visible page/product surface;
8. deprecated/non-target schema such as `FAQPage` is reintroduced as a Google rich-result objective without a new explicit decision;
9. generated/prerendered output drops or corrupts the intended structured data.

### Post-deploy evidence

Repository validation is necessary but not sufficient. After owner implementation and deploy:

- validate representative public URLs with Google's current Rich Results / structured-data tooling where the declared type is eligible;
- use Search Console URL Inspection / enhancement reporting where available;
- record provider warnings/errors separately from repository parse/schema invariants;
- do not claim rich-result eligibility or appearance solely because JSON-LD parses successfully.

### Owner routing

- `CAPITAL-AI-FE`: structured-data source/template and repository tests.
- `CAPITAL-AI-OPS`: build/prerender/deploy evidence where the generated production artifact must be inspected.
- `CAPITAL-AI-SEO`: acceptance criteria, Search Console evidence interpretation and roadmap state.

## 4. Security / integrity constraints

1. Preserve `server/runtime/spaFallback.ts` finite trusted route selection; never derive `sendFile` filesystem paths from arbitrary request input.
2. Do not alter CookieHub, Consent Mode, GA4/AdSense loaders, CSP, credentials or provider configuration in this work package.
3. No external provider write is required for repository regressions.
4. No synthetic Search Console, GA4 or rich-result evidence.
5. `NOT RUN`, `NOT_CONNECTED` and provider errors remain distinct from `PASS`.

## 5. Exit gates

### `WP-SEO-TECH-GATE`

Exit only when owner-implemented automated tests prove deterministic public-route equality across canonical route inventory, sitemap, prerender and server public allowlist; canonical/404/private-route invariants remain intact; required hosted checks pass on the final implementation head.

### `WP-SEO-SCHEMA`

Exit only when a dedicated JSON-LD lifecycle regression parses and verifies the intended graph/invariants, generated production output preserves it, and post-deploy provider validation is recorded without unsupported rich-result claims.

## 6. Current handoff status

- `WP-SEO-TECH-GATE`: `HANDOFF_READY / STARTED_AT_BOUNDARY`.
- `WP-SEO-SCHEMA`: `HANDOFF_READY / STARTED_AT_BOUNDARY`.
- Productive FE/OPS implementation: `NOT STARTED IN SEO BRANCH`.
- SEO ownership boundary: `PASS`.
