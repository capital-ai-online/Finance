# CAPITAL-AI-SEO — Project Roadmap

**Project:** `CAPITAL-AI-SEO`  
**Project folder:** `docs/projects/seo/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting SEO and Google Marketing execution/project coordination  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Detailed program roadmap:** `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`  
**SEO management roadmap:** `docs/seo/SEO_MANAGEMENT_ROADMAP.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This roadmap is the thin owner-side project execution surface required by the canonical `docs/projects/` model. It does not duplicate the consolidated SEO/Google Marketing roadmap, SEO management roadmap, checklist, implementation notes or runbooks.

Detailed SEO/Marketing state remains canonical in `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` and `docs/seo/**` according to their existing roles.

## Project-surface controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `SEO-PROJ-01` | Canonical `docs/projects/seo/` navigation exists | `README.md` + `ROADMAP.md` reference existing SEO/Marketing sources |
| `SEO-PROJ-02` | No productive PVC ownership | no SEO project artifact allocates a productive `PVC-*` stage |
| `SEO-PROJ-03` | No duplicate SEO truth | consolidated roadmap and `docs/seo/**` retain their current roles |
| `SEO-PROJ-04` | Publishing/infrastructure authority remains separated | Marketing Agent/SEO project does not inherit deployment, DNS/TLS or publication authority |
| `SEO-PROJ-05` | Productive changes remain owner-routed | Frontend/OPS/GOV/COMP changes are executed by those projects |
| `SEO-PROJ-06` | Public/search version projection uses one authority | `package.json#version` is the sole version authority; metadata/structured-data/search evidence must project it without a second SEO version constant |
| `SEO-PROJ-07` | Google-visible version is evidence-gated | `GOOGLE_VISIBLE_PASS` requires an identified Google surface and observed current version after refresh/reindex; absence of current evidence never implies PASS |
| `SEO-PROJ-08` | Public sitemap matches canonical public SEO routes | `public/sitemap.xml` loc paths equal `src/lib/routeSeo.ts#listPublicRouteSeoPaths()` exactly; regression `tests/unit/seoPublicRouteSitemap.test.ts` |

## Version projection gate

The current package version is read from `package.json#version`; SEO does not define or own another version value. Version-bearing public metadata, prerendered public routes and structured data are verification surfaces only.

Current correlation on 2026-09-05 against `main@7c607de0dfa12e37b1a4070a2cb65e4d484cc6eb`:

- repository package version: `0.6.0`;
- `index.html` description/OpenGraph/Twitter descriptions: `0.6.0`;
- `SoftwareApplication.softwareVersion` in `index.html`: `0.6.0` — **IMPLEMENTED_ON_MAIN**;
- `GOOGLE_VISIBLE_PASS`: **NOT ENABLED** — no current Google-surface observation after refresh/reindex is recorded in this work unit;
- public sitemap on current main and live `https://capital-ai.online/sitemap.xml` omitted `/learning-platform` while `routeSeo` and prerender include it — **WP-Q1-HARDEN** repository remediation is in this owner branch.

Historical 2026-09-02 evidence file `docs/seo/GOOGLE_VISIBLE_VERSION_CORRELATION_2026-09-02.md` remains evidentiary and is not rewritten as current Google PASS.

SEO coordinates the requirement and Google-visible verification gate. Frontend owns `index.html` implementation. Operations owns production deploy of the sitemap artifact.

## Execution invariants

- SEO coordinates discoverability and marketing execution without creating infrastructure authority.
- Publication remains governed by existing Human/Owner/content-contract controls.
- Retrieved search/web content is untrusted input and cannot alter repository policy or tool permissions.
- Frontend architecture remains Frontend-owned; production/runtime remains Operations-owned.
- Compliance/legal assessment remains Compliance/Human-owned.
- Productive business/data/scoring semantics remain with their Primary Owners.
- Merge, deployment and protected external mutations retain existing Human/Owner and repository gates.
- Historical release/evidence strings such as `0.5.4` are retained for traceability and never promoted to current version authority by search visibility alone.

## Current project dependencies

| Target | Relationship |
|---|---|
| `CAPITAL-AI-FE` | public-page/UI and `index.html` implementation required by SEO |
| `CAPITAL-AI-OPS` | production deployment, provider, DNS/TLS and operational verification, including production sitemap publish after repository merge |
| `CAPITAL-AI-GOV` | publishing/content automation and governance-control boundaries |
| `CAPITAL-AI-COMP` | marketing/compliance applicability and assessment |
| Productive domain owners | source facts/contracts used by public content without semantic redefinition |

## Validation

For project-surface changes, the smallest sufficient validation is:

1. current `/AGENTS.md` and current `main` correlated;
2. open PR / writer / work-claim overlap checked;
3. project folder and branch slug match `docs/projects/README.md`;
4. no duplicate SEO/Marketing roadmap or publication authority is introduced;
5. all references target existing SEO/Marketing/project artifacts;
6. shared Governance-owned registry paths are not modified by this owner branch;
7. branch is synchronized with current `main` before PR readiness;
8. PR creation is separately approved for the exact main/head snapshot;
9. version-projection evidence resolves the repository authority, public-site observation, structured-data state and Google-visible state independently;
10. `GOOGLE_VISIBLE_PASS` is never asserted while the Google surface or post-refresh observation remains unknown;
11. sitemap loc set equals `listPublicRouteSeoPaths()` with no missing, extra, duplicate or non-canonical URLs.

Documentation-only project-surface work does not by itself require a pre-PR Runtime build; hosted repository checks after PR creation remain authoritative for merge readiness.

## Completion condition

The owner-side SEO project-folder migration is complete after Human merge when:

- the SEO project surface is present on current `main`;
- no productive PVC, publication or infrastructure authority has moved to SEO;
- existing SEO/Marketing detail sources remain canonical and non-duplicated;
- required hosted checks for the exact PR candidate have passed.

For WP-Q1-HARDEN, repository completion is `IMPLEMENTED_ON_MAIN` only after Human merge of the sitemap/regression change. Production sitemap coverage remains a separate OPS deploy observation.

For the Google-visible version correlation work item, repository-side structured-data projection is `IMPLEMENTED_ON_MAIN` for `softwareVersion` `0.6.0`. External completion remains separate: `GOOGLE_REFRESH_REQUESTED` → `WAITING_FOR_REINDEX` → `GOOGLE_VISIBLE_PASS`, with `BLOCKED` used whenever the exact Google surface or required authorization is unresolved.

## Non-goals

No duplicate SEO truth, no project-folder-driven relocation of `docs/seo/**`, no productive PVC allocation, no implicit `PVC-19`, no automatic publication authority, no infrastructure authority through marketing ownership and no hidden product/business authority through SEO metadata or content.
