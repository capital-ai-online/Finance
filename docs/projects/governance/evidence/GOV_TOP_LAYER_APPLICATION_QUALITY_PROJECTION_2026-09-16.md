# GOV Top-Layer Application Quality Projection — Evidence

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary productive PVC:** `PVC-05 — Platform Director`  
**Role:** non-authorizing evidence  
**Date:** 2026-09-16  
**Baseline:** `main@5b93207cfa163ddd883870a11a422f96d0128d6c`  
**Branch:** `agent/governance-top-layer-quality-projection-20260916`

## Scope

Owner-directed materialization of the Top-Layer product-quality concept as a Governance project projection without creating a second Governance Control Plane, Frontend authority, PVC registry, cross-project handover layer or financial/scoring authority.

The work package combines two directly dependent steps:

1. harden the three Top-Layer YAML projections against `/AGENTS.md` and ADR-0096;
2. bind the resulting quality projection to the canonical `PVC-01..PVC-18` project chain while separating productive PVC stages from cross-cutting projects.

## Current-main correlation

At execution start, `main` resolved to `5b93207cfa163ddd883870a11a422f96d0128d6c`.

Canonical sources consumed:

- `/AGENTS.md` — repository trust root and authority/lifecycle boundary;
- `docs/projects/README.md` — canonical project-folder mapping and cross-cutting-project classification;
- `docs/projects/PROJECT_VALUE_CHAIN.md` — canonical productive `PVC-01..PVC-18` ownership;
- `docs/projects/governance/README.md` — `CAPITAL-AI-GOV / PVC-05` project scope;
- `docs/projects/governance/ROADMAP.md` — current GOV execution projection;
- `docs/adr/ADR-0096-governance-control-plane-authority-and-supersession.md` — single Governance Control Plane and projection-not-authority boundary;
- `docs/frontend/FRONTEND_ARCH.md` — Frontend Presentation/Interaction authority and Projection-not-Redefinition rule;
- `SC-MD-SPT-0001`, ADR-0087, ADR-0032, ADR-0041 and ESS-0016 — referenced parent financial/scoring/data authorities.

Open PR correlation at branch creation identified only:

- PR #1018 — `CAPITAL-AI-SEC`, bounded Security/Supabase remediation;
- PR #1019 — `CAPITAL-AI-FE`, AI-Newsfeed authenticated transport.

Neither open PR changes the new GOV projection/evidence paths. Their semantic scopes remain foreign to this owner-local Governance projection.

## Before → After

| Concern | Before | After |
|---|---|---|
| Repository baseline | `active_branch_or_highest_relevant_open_pr` could be read as a competing baseline | only `CURRENT_MAIN` is authoritative; open PRs/branches are correlation inputs only |
| Governance identity | `policy_id: GOV-TOP-LAYER-*` could look like a new policy plane | `projection_id` + `document_role: projection` + `authorizing: false` |
| Frontend role | `frontend_control_plane` risked implying domain/governance authority | `user_visible_integration_surface` is explicitly product-composition/evaluation only |
| PVC modeling | generic `supporting_pvc` could misclassify FE/SEC/QM/COMP/SEO/SOCIAL | productive PVC stages resolve only from `PROJECT_VALUE_CHAIN.md`; cross-cutting projects are separate overlays |
| Cross-project work | standalone handover contract could reconstruct a withdrawn routing overlay | owner-local dependency evidence only; canonical project/PVC mapping remains sole routing source |
| Scoring quality | local checklist could be mistaken for formula/methodology authority | quality checks must resolve and conform to parent scoring/data authorities; no new formula authority |
| Quality gates | names could be mistaken for new merge-blocking controls | `EVIDENCE_PROJECTION_ONLY`; merge blocking requires an existing or properly registered canonical `CTRL-*` |
| Security exception | immediate execution wording could imply lifecycle bypass | priority override only; ownership, branch, PR, merge and protected-mutation boundaries remain mandatory |

## Canonical value-chain binding

The projection does not duplicate the canonical PVC mapping. It resolves productive ownership dynamically from `docs/projects/PROJECT_VALUE_CHAIN.md` and uses the following domain relationships only as explanatory projection metadata:

- `CAPITAL-AI-CLIENT` → `PVC-01`;
- `CAPITAL-AI-OPS` → `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`;
- `CAPITAL-AI-DOC` → `PVC-03`;
- `CAPITAL-AI-GOV` → `PVC-05`;
- `CAPITAL-AI-DATA` → `PVC-09..PVC-11`;
- `CAPITAL-AI-FINTECH` → `PVC-12..PVC-17`.

Cross-cutting projects are kept outside productive PVC ownership:

- `CAPITAL-AI-FE` — Presentation and Interaction;
- `CAPITAL-AI-QM` — Quality Assurance;
- `CAPITAL-AI-SEC` — Security Assurance and bounded Security remediation where separately authorized;
- `CAPITAL-AI-COMP` — Compliance constraint/assurance;
- `CAPITAL-AI-SEO` — discovery/distribution;
- `CAPITAL-AI-SOCIAL` — social distribution.

A user-visible capability therefore resolves its productive PVC stages from the underlying domain capability, while Frontend and other cross-cutting projects are attached as presentation/assurance/distribution relationships rather than fabricated `PVC-*` stages.

## Authority and non-goals

The projection MUST NOT:

- create a new `AUTH-*` or `CTRL-*` identity;
- become a second project/PVC registry;
- redefine `SC-MD-SPT-0001`, ADR-0087 or another financial/scoring authority;
- define a second Frontend architecture or Design Token authority;
- reconstruct withdrawn post-PVC Handover/Execution/Roadmap registries;
- authorize merge, deployment or protected external mutation;
- infer productive PVC ownership for cross-cutting projects.

## Validation performed

Executed:

- current-main readback;
- `/AGENTS.md` trust-root correlation;
- GOV project/PVC/Owner resolution;
- canonical project mapping and `PVC-01..PVC-18` correlation;
- ADR-0096 single-control-plane boundary review;
- Frontend Projection-not-Redefinition boundary review;
- open-PR semantic/path correlation;
- repository search confirming no pre-existing `GOV-TOP-LAYER-APPLICATION-01` artifact on current main.

Not run:

- TypeScript, unit tests, production build and paid/heavy hosted checks — `NOT RUN`, because the branch currently contains documentation/projection artifacts only and cost-bearing checks remain post-PR according to repository lifecycle.

## Exit-gate assessment

### Step 1 — Top-Layer hardening

**PASS on branch.** The projection is current-main-only, non-authorizing, parent-authority-bound and contains no parallel Frontend/PVC/Handover control plane.

### Step 2 — PVC/cross-cutting binding

**PASS on branch.** Productive PVC stages are dynamically resolved from the canonical chain; FE/DATA/FINTECH and other project roles are separated correctly, with no invented PVC ownership and no duplicated scoring authority.

## Remaining gate

Final create-correlation must re-read current `main`, open PRs/writers, the canonical PR template and the branch diff immediately before Draft PR creation. Hosted checks and Human/CODEOWNER merge remain post-create boundaries.
