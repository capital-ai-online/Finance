# CAPITAL-AI-FE — Branding Manifest v6.2 Projection Hardening Evidence

**Date:** 2026-09-06  
**Project:** `CAPITAL-AI-FE`  
**Project folder:** `docs/projects/frontend/`  
**Primary Productive PVC:** `N/A` — cross-cutting Frontend presentation owner, no productive `PVC-*` ownership  
**Baseline main SHA at fresh branch creation:** `255afed6adbfe44a49f06163f326cb86b1d6972d`  
**Branch:** `agent/frontend-branding-v62-consolidation-r3-20260906`

## Purpose

This bounded Frontend slice hardens Branding Manifest v6.2 as a single projection chain without moving Social Media or Documentary runtime ownership into Frontend.

The existing machine-readable design authority remains:

- `docs/frontend/design-tokens.json` — colors, typography, semantic roles and renderer token authority.

A versioned geometry-only companion contract is introduced:

- `docs/frontend/brandmark.json` — CAPITAL-AI network-node geometry plus semantic token references; it contains no independent palette or typography values.

## Implemented projection changes

- `src/shared/branding/CapitalAiLogo.tsx` consumes `brandmark.json` for nodes/edges and continues to resolve colors through CSS variables projected from `design-tokens.json`.
- `public/og-image.svg` is aligned to Manifest v6.2: Dark Black `#08080C`, AIF Gold `#F9BF21`, Purple `#8D26FF`, Inter/Poppins/JetBrains Mono declarations and no Cyan branding geometry.
- `public/favicon.svg` is aligned to the same v6.2 brand pair and brandmark geometry; legacy cyan/blue and historical gold/purple values are removed.
- `AuthorityBadge`, `FreshnessBadge` and `EvidenceStateIndicator` no longer use the deprecated `brand-cyan` compatibility alias for market/history information. They project `status-info` instead.
- `tests/unit/brandingV62Projection.test.ts` guards token/brandmark binding, public asset palette restrictions, typography declarations and the migrated semantic-info consumers.
- `docs/projects/frontend/ROADMAP.md` records `FE-PROJ-06`, making downstream Social/Documentary consumption explicit while retaining their project ownership.

## Ownership boundaries / deliberately not implemented in this Frontend slice

### CAPITAL-AI-SOCIAL

Social Media renderer implementation remains owned by `CAPITAL-AI-SOCIAL`. The renderer must consume the merged v6.2 token/brandmark contract rather than duplicate it on a parallel branch. Therefore Inter/Poppins/JetBrains Mono renderer binding, Python brandmark consumption and renderer visual-regression evidence are a downstream Social work item after this Frontend contract is present on current `main`.

### CAPITAL-AI-DOC / PVC-03

`server/documentSanitizer.ts` and Documentary-owned branding/generator surfaces remain `CAPITAL-AI-DOC` work. They are not mutated from the Frontend branch. A Documentary remediation must consume the same merged v6.2 contracts while staying within `PVC-03` ownership.

### Remaining `brand-cyan` consumers

The repository still contains compatibility consumers outside the three shared primitives migrated in this bounded slice, including domain presentation surfaces. They require semantic classification per use (`asset-*`, `factor-*`, `status-*`, `score-*`, or actual brand roles) before replacement. The compatibility alias remains until productive inbound usage reaches zero; this slice does not delete it prematurely.

### Documentation reference drift

Historical and active references to older manifest versions are not globally rewritten in this bounded slice. Current authority remains `PHASE0_DESIGN_TOKENS.md` / `design-tokens.json` at Manifest v6.2. Follow-up editing must distinguish active documentation drift from historical evidence that must remain immutable.

## Current-main re-correlation

Before this fresh branch was created, current `main` advanced beyond the previously approved FE snapshot. The earlier PR-creation approval was therefore invalidated exactly as required by `/AGENTS.md`.

Re-correlation against `255afed6adbfe44a49f06163f326cb86b1d6972d` established:

- current `/AGENTS.md` and project/PVC mapping were re-read;
- `CAPITAL-AI-FE` remains cross-cutting with no productive PVC ownership;
- the current-main changes since the original FE baseline affect Governance/Data roadmaps, public-route composition/tests and Governance control metadata, not this bounded FE branding file set;
- no changed-file overlap was identified with the eleven FE branding files in this branch;
- open-PR search returned no open Pull Request at the correlation checkpoint;
- the work was re-materialized on a fresh current-main branch rather than force-updating the stale branch.

## Validation evidence

Performed before PR-creation approval is requested:

- current `AGENTS.md` read fully from `main` SHA `255afed6adbfe44a49f06163f326cb86b1d6972d`;
- project/PVC ownership resolved through current `docs/projects/README.md`, `PROJECT_VALUE_CHAIN.md`, Frontend README and Roadmap;
- open-PR search showed no open PRs at the correlation checkpoint;
- branch created fresh from current main SHA `255afed6adbfe44a49f06163f326cb86b1d6972d`;
- changed-file overlap against main changes since the original implementation baseline is absent;
- source-level regression test remains part of the exact branch state.

## Not-run evidence

- Unit tests: **NOT RUN pre-PR** — no local repository execution environment is exposed through the connected GitHub surface in this chat.
- TypeScript build: **NOT RUN pre-PR** for the same reason.
- Hosted GitHub Actions: **NOT RUN pre-PR** by repository cost-control policy; hosted checks belong after PR creation.
- Browser visual regression / screenshot comparison: **NOT RUN pre-PR**; the source-level projection regression is present but rendered browser evidence still requires an execution environment.

`NOT RUN` is not treated as `PASS`.
