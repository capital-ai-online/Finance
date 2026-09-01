# CAPITAL-AI-SEC — Project Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting Security requirements, findings, testing and verification  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Detailed roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This roadmap is the thin owner-side project execution surface required by the canonical `docs/projects/` model. It does not duplicate the detailed Security roadmap, work packages, traceability matrix or evidence set.

Detailed Security scope and current finding states remain canonical in:

- `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`;
- `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`;
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`;
- `docs/evidence/security/**`.

## Current workstream

| Step | Work item | State | Exit gate |
|---|---|---|---|
| `SEC-PROJ-01` | Materialize canonical `docs/projects/security/` navigation | `IN_CANDIDATE` | `README.md` + `ROADMAP.md` exist and reference, rather than duplicate, canonical Security sources |
| `SEC-PROJ-02` | Terminalize stale merged PR #631 work claim | `IN_CANDIDATE` | claim is `released`, `exclusive=false`, PR/merge/current-main evidence retained |
| `SEC-PROJ-03` | Preserve no-productive-PVC ownership invariant | `CONTINUOUS` | no Security project artifact allocates a productive `PVC-*` stage |
| `SEC-PROJ-04` | Maintain routed Security finding/evidence lifecycle | `ONGOING` | each active finding retains target owner, `PVC-*` routing, required evidence and independent Security verification gate |
| `SEC-PROJ-05` | Maintain Security authority/runtime separation | `CONTINUOUS` | no duplicate Governance/IAM/EventMesh/Data/Scoring/Release/Production architecture introduced |

## Current owner dependencies

Security remains verification/requirement owner while foreign productive work stays routed:

| Target | PVC context | Current dependency |
|---|---|---|
| `CAPITAL-AI-OPS` | `PVC-02`, `PVC-04`, `PVC-06`, `PVC-08` | productive remediation, runtime/recovery/CSP/billing-isolation evidence |
| `CAPITAL-AI-DATA` | `PVC-10` | evidence identity/freshness semantics and evidence return |
| `CAPITAL-AI-GOV` | `PVC-05` | MFA/AAL authority-lifecycle reconciliation |
| `CAPITAL-AI-CLIENT` / `CAPITAL-AI-FINTECH` | applicable owner stages only | child remediation when entitlement/capability inventory identifies target-owned productive code |

The detailed finding set and state transitions remain in the canonical Security Work Packages and Traceability Matrix; this project roadmap does not create a second finding register.

## Security execution invariants

- Missing or stale required evidence is never PASS.
- Security may define, test, reject and independently verify but does not silently implement foreign productive code.
- `ACCEPTED_RISK` remains Human/Owner-authorized where applicable.
- Security project-folder navigation never creates Authority.
- `src/platform/Security` remains the reusable technical Security component, not a destination for unrelated foreign remediation.
- Technical `VC-*` identifiers and organizational `PVC-*` routing remain explicitly separate namespaces.
- Merge, deployment and protected external mutations retain their existing Human/Owner and repository gates.

## Validation

For project-surface changes, the smallest sufficient validation is:

1. current `/AGENTS.md` and current `main` correlated;
2. open PR / writer / work-claim overlap checked;
3. project folder and branch slug match `docs/projects/README.md`;
4. no second Security authority or duplicate current-state roadmap is introduced;
5. all links target existing canonical Security/project artifacts;
6. branch is synchronized with current `main` before PR readiness;
7. PR creation is separately approved for the exact main/head snapshot.

Documentation-only project-surface work does not by itself require a pre-PR Runtime build; hosted repository checks after PR creation remain authoritative for merge readiness.

## Completion condition

This project-folder migration is complete after Human merge when:

- the Security project surface is present on current `main`;
- the stale PR #631 claim is released on current `main`;
- the repository project registry reports the Security surface as present;
- no productive PVC ownership or foreign implementation authority has moved to Security;
- required hosted checks for the exact PR candidate have passed.
