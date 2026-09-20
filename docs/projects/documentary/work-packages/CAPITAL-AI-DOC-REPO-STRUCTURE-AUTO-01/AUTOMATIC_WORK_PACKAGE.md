# CAPITAL-AI-DOC — Repository Structure Automatic Work Package

**Work package:** `CAPITAL-AI-DOC-REPO-STRUCTURE-AUTO-01`  
**Project:** `CAPITAL-AI-DOC`  
**PVC:** `PVC-03`  
**Baseline:** `main@c9980602f691b855fd6f8c66a49822e7a9611b4a`  
**Execution:** branch-only, fail-closed, workflow-autonomous; final merge Human Owner-controlled  
**Status:** ACTIVE

## Objective

Converge the repository documentation/project structure onto the canonical project/PVC model without creating a second governance, deployment, runtime, routing, or documentation authority.

## Current-main facts

- `docs/projects/data/` is already absent from current main.
- DATA productive ownership is already superseded by `CAPITAL-AI-FINTECH / PVC-09..17`.
- Historical DATA provenance is retained under `docs/archive/` and Git history.
- Canonical project routing is `docs/projects/README.md`.
- Existing work package `CAPITAL-AI-DOC-REPO-STRUCTURE-ARCHIVE-01` remains evidence/input; this work package does not create a competing task registry.

## Automatic execution graph

1. **DISCOVER** — inventory current-main project, archive, documentary, governance and reference surfaces.
2. **CLASSIFY** — classify each candidate as CURRENT_CANONICAL, ACTIVE_SUPPORTING, HISTORICAL_EVIDENCE, SUPERSEDED, DUPLICATE_CANDIDATE or REVIEW_ONLY.
3. **MAP** — resolve exactly one canonical project and PVC relationship from `docs/projects/README.md` + `PROJECT_VALUE_CHAIN.md`; ambiguous mappings BLOCK.
4. **PLAN** — produce deterministic move/reference/archive candidates; no mutation from heuristic ownership inference.
5. **APPLY_ON_BRANCH** — only deterministic, owner-resolved structural changes may be written to this isolated branch.
6. **REFERENCE_REPAIR** — current operational references may converge to canonical paths; historical evidence remains verbatim unless a provenance wrapper/index is required.
7. **VALIDATE** — use the smallest sufficient structural/documentary checks. Eligible hosted CI/build/test/security/review workflows may start, rerun and continue automatically when repository/provider triggers and scope controls allow; no separate per-run Owner approval is required.
8. **CORRELATE_CURRENT_MAIN** — before PR handoff, compare candidate with then-current main and fail closed on semantic/authority collision.
9. **DRAFT_PR_HANDOFF** — one PR only; no self-merge, auto-merge, deploy, provider, secret, IAM or database mutation.
10. **POST_MERGE_VERIFY** — after Human merge, read-only correlation of current main and Render production SHA.

## Structural invariants

- One canonical project-folder routing table.
- No `CAPITAL-AI-DATA` productive project surface.
- FINTECH owns PVC-09..17.
- Cross-cutting projects do not acquire productive PVC ownership by relocation.
- Archive material is non-authorizing.
- ADR/ESS/GOV/SEC/COMP/evidence semantics are REVIEW_ONLY unless separately Owner-authorized.
- Runtime/source paths are not moved merely to make documentation visually uniform.
- Existing Documentary auto-convergence components are reused; no second maintenance control plane.
- No parallel task/status registry: this file records execution contract only; canonical status derives from repository/PR evidence.

## Cost and CI policy

- Prefer tree/index analysis before file reads.
- Reuse current repository evidence and existing inventories.
- Use scope-aware triggers, path filtering, caching and the smallest sufficient validation set.
- Eligible hosted workflows may start, rerun and continue automatically under `/AGENTS.md@CURRENT_MAIN`; technical checks never create merge authority.
- Avoid unnecessary dependency/model/container downloads during structural planning; reuse existing caches and evidence where available.

## Exit gates

- project/PVC routing has no duplicate current authority;
- stale current DATA project-path references are zero or explicitly classified historical;
- archive provenance remains discoverable;
- current references resolve to existing canonical paths;
- no duplicate deployment/documentary/governance control plane introduced;
- candidate is 0-behind current main at PR handoff;
- compact before/after matrix attached to PR;
- final merge remains Human Owner-controlled; CODEOWNER approval is an additional gate only when the live GitHub ruleset actually requires it.


## Current-main convergence readback — 2026-09-20

- Baseline: `main@c9980602f691b855fd6f8c66a49822e7a9611b4a`.
- Canonical routing: `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md` both resolve `PVC-09..17` to `CAPITAL-AI-FINTECH`.
- FINTECH project surface: `docs/projects/fintech/README.md` confirms the same ownership and treats former DATA material as historical/compatibility provenance only.
- `docs/projects/data/` is absent from current main.
- Historical/archive evidence, dated assessment reports and released work claims retain their original DATA wording for provenance and are not rewritten by this work package.
- Current non-historical routing projections that still assign productive `PVC-09..11` ownership to DATA are eligible for bounded documentary reference repair only; runtime/provider/domain semantics remain unchanged.
- Final merge remains a Human Owner decision. Automated checks/reviews are validation evidence only.
