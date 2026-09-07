# CAPITAL-AI-FE — Project Roadmap

**Project:** `CAPITAL-AI-FE`  
**Project folder:** `docs/projects/frontend/`  
**Primary Productive PVC ownership:** `[]` (`N/A`)  
**Primary Owner:** `CAPITAL-AI-FE`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Current-main correlation:** `main@5490a3b1a8d6aa19e2cd955b79267dffa15e5282`  
**Detailed roadmap:** `docs/frontend/FRONTEND_ROADMAP.md`  
**Architecture authority:** `docs/frontend/FRONTEND_ARCH.md`  
**Component inventory:** `docs/frontend/COMPONENT_INVENTORY.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This file is the thin owner-side project execution projection required by the canonical `docs/projects/` model. It does **not** create a second Frontend roadmap, a parallel Visualization architecture, a second Server-State authority, or any Scoring/Data/Evidence/IAM/Governance authority.

Detailed Frontend migration state, visual recovery classification, quality targets and Legacy-exit planning remain canonical in `docs/frontend/FRONTEND_ROADMAP.md` and `docs/frontend/COMPONENT_INVENTORY.md`. `docs/frontend/FRONTEND_ARCH.md` remains the singular Frontend architecture authority.

## Project-surface controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `FE-PROJ-01` | Canonical `docs/projects/frontend/` navigation exists | `README.md` + this projection reference the existing Frontend sources |
| `FE-PROJ-02` | No productive PVC ownership | no Frontend project artifact allocates a productive `PVC-*` stage |
| `FE-PROJ-03` | Frontend architecture remains singular | `docs/frontend/FRONTEND_ARCH.md` remains the architecture authority |
| `FE-PROJ-04` | Domain semantics remain owner-controlled | UI consumes scoring/data/evidence/entitlement/Governance contracts without local redefinition |
| `FE-PROJ-05` | UX quality remains evidence-backed | detailed roadmap/inventory retain measurable Visualization, Contract, Accessibility and Performance gates |
| `FE-PROJ-06` | Branding Manifest v6.2 remains singular | `docs/frontend/design-tokens.json` owns color/type roles; `docs/frontend/brandmark.json` owns brandmark geometry |
| `FE-PROJ-07` | Productive Legacy exits completely | detailed roadmap reaches zero productive `src/components` implementations and zero required Legacy compatibility consumers before BB-11 closure |

## Current roadmap truth

### Completed current-day recovery

The former Owner-directed P0 **Public Analysis Sideboard restoration is complete on current main**. Human-merged PR #825 restored the public assessment-tool Sideboard as an `src/app` composition over existing feature-owned surfaces without restoring the heavy authenticated Legacy Dashboard as the public root.

Current public recovery preserves the required distinctions:

- public or server-gated tools may execute through their current contracts;
- login-required tools remain login-required;
- explicitly disabled tools remain disabled;
- synthetic/preset/fallback values are not promoted to verified public evidence;
- no anonymous/persisted Supabase or IAM visitor session is created;
- Scoring, Ranking, Market-Data, Evidence and Entitlement authority remains outside Frontend.

The earlier Public Enterprise Scorer recovery is likewise merged and current; it remains a presentation of the same canonical Crypto Scorer implementation, not a second scorer.

### Current execution order

Absent a newer explicit Owner priority, Frontend resumes the existing BB-2 composition sequence:

1. **BB-2E — Navigation / Drawer completion**;
2. **BB-2F — Header / Application Shell extraction**;
3. **BB-2G — Dashboard Home / MyWorkspace visual-parity cutover and composition closure**.

The state-of-the-art Visualization/Server-State/Accessibility/Performance program is integrated into the **existing** detailed roadmap and must not bypass unfinished higher-priority BB-2 composition work. Its domain-wave gates apply when the corresponding BB-3..BB-9 surfaces are executed.

## Detailed modernization targets

The detailed canonical roadmap carries the measurable target gates. They are targets, not achieved-state claims:

| Dimension | Minimum closure target |
|---|---:|
| Visualization | `>= 8.5/10` |
| Server-/Data-Contract Architecture | `>= 8.5/10` |
| Accessibility | `>= 8.0/10` |
| Performance | `>= 8.5/10` |
| Productive Legacy Exit | `10.0/10` |

No score may be marked achieved without current implementation/test/evidence. Productive Legacy Exit is absolute: `10/10` requires zero productive Legacy implementations and zero required Legacy compatibility consumers.

## Execution invariants

- Projection, not redefinition.
- Preserve the singular `src/app -> src/features -> src/shared` Frontend architecture.
- No new productive domain implementation under `src/components/`.
- Approved user-visible functionality is preserved through canonical app/feature consumers before Legacy removal.
- Frontend may compose and present domain outputs but cannot create local Scoring, Ranking, Market-Data, Evidence, Entitlement, IAM or Governance truth.
- Unavailable, stale, invalid, partial or not-computable financial evidence is rendered explicitly; it is never replaced by synthetic finance values, neutral/default scores, fake READY states or fabricated trend data.
- Branding values remain authoritative in `docs/frontend/design-tokens.json`; versioned brandmark geometry remains authoritative in `docs/frontend/brandmark.json`.
- Deprecated `brand-cyan` remains compatibility-only until productive consumers reach zero.
- Ranking/decision-support semantics remain with `CAPITAL-AI-FINTECH`; data/evidence/provenance/freshness semantics remain with `CAPITAL-AI-DATA`.
- Merge, deployment and protected external mutations retain Human/Owner and repository gates.

## Current cross-project dependencies

| Target | Relationship / current dependency |
|---|---|
| `CAPITAL-AI-FINTECH` | productive scoring/ranking/decision-support contracts; FIN-17 backend rank/order boundary; protected Backtest/Monte-Carlo execution and Legacy scoring compatibility retirement remain owner-side concerns |
| `CAPITAL-AI-DATA` | provider input, history/snapshot evidence, provenance, freshness and DQ; Frontend must consume current validated states rather than fabricate missing fields |
| `CAPITAL-AI-GOV` | Governance/IAM/control-plane contracts consumed by Admin/Governance UI; browser visibility remains non-authorizing |
| `CAPITAL-AI-OPS` | runtime/deployment/operational and telemetry boundaries; any production observability integration remains OPS/privacy-governed |
| `CAPITAL-AI-QM` | cross-cutting UX/quality evidence and improvement findings |
| `CAPITAL-AI-SOCIAL` | consumes canonical design-token/brandmark contracts; Social renderer/runtime ownership remains with Social |
| `CAPITAL-AI-DOC` | Documentary branding consumers remain Documentary-owned and are not migrated by a Frontend slice |

## Supersession boundary

Frontend may identify an obsolete ADR/ESS/API/Data compatibility contract as a modernization blocker and consume an owner-approved replacement. It may not silently supersede a foreign authority.

Every foreign-owner supersession must define the exact target, replacement scope, exclusions, migration impact and zero-productive-consumer removal gate where compatibility is involved. Required historical/audit evidence remains preserved.

## Validation

For this project projection and the detailed roadmap/inventory changes, the smallest sufficient pre-PR validation is:

1. current `/AGENTS.md` and then-current `main` correlated;
2. open PR / writer / work-claim overlap checked;
3. project folder and branch slug match `docs/projects/README.md`;
4. no second Frontend roadmap/architecture, Scoring authority or Data contract introduced;
5. detailed roadmap and inventory remain mutually consistent;
6. all referenced paths/contracts are verified against then-current repository state;
7. shared Governance-owned registries are not modified by the Frontend branch;
8. applicable documentation/architecture validators are run where locally available; unavailable checks remain truthfully `NOT RUN`;
9. branch is synchronized with current `main` before PR readiness;
10. PR creation is separately approved for the exact current main SHA and branch-head SHA.

Documentation-only project-surface work does not by itself make Runtime, browser, accessibility or performance checks PASS. Hosted repository checks after PR creation remain separate merge-readiness evidence.

## Completion condition

The Frontend modernization roadmap closes only when:

- the project projection remains thin and non-authorizing;
- the singular Frontend architecture remains `src/app -> src/features -> src/shared`;
- approved visual functionality has canonical consumers or an explicit current Owner decision to remain disabled/archived;
- foreign Scoring/Data/Evidence/IAM/Governance contracts remain owned by their Primary Owners;
- Visualization, Server/Data Contract, Accessibility and Performance exit gates have current evidence at or above their target thresholds;
- Productive Legacy Exit reaches `10/10` with zero productive `src/components` implementations, zero required Compatibility re-exports, zero productive superseded UI aliases, zero Frontend consumers of superseded API contracts and zero productive Legacy Dashboard composition;
- all final BB-11 checks required by then-current repository authority are PASS on the exact merge candidate.
