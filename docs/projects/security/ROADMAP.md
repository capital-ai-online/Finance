# CAPITAL-AI-SEC — Canonical Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Folder:** `docs/projects/security/`  
**Role:** cross-cutting Security requirements, findings, bounded remediation and independent verification  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 contents folded into this file  
**Baseline:** `main@7f06828841546aa07a9ddca63ec8a7eca77e92d6`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

### SEC-CARRY-01 — Existing non-terminal Security backlog
Carry forward every non-terminal SEC-SOTA, auth lifecycle, verification, finding/risk, supply-chain and provider-evidence item.

### SEC-PR900-01 — Security document consistency
Synchronize Security roadmap/detail/work-package/traceability projections against current authority and implementation evidence. Preserve historical evidence dates; do not rewrite old results as new verification.

**Exit:** no unexplained active projection/authority contradiction and no missing source decision.

### SEC-PR900-02 — SEC-SOTA-04 focused verification
Continue the existing materialized verification slice; do not duplicate it. Produce reproducible dispositions/routing for V3/V4/V6/V8/V16, with wider V5 file-handling and V10 OAuth/OIDC applicability explicitly open where unresolved. V17 N/A remains baseline-scoped only.

**Exit:** every reviewed requirement has evidence-backed status or concrete owner return; no full ASVS conformance is inferred.

### SEC-PR900-03 — SEC-AUTH-LIFECYCLE
Re-correlate ESS-0020/ADR-0064/registry, native MFA, Legacy-TOTP, purpose-bound step-up and recovery against then-current implementation/provider evidence. Historical provider counts are not current state.

**Exit:** every mismatch has exact evidence/time/identity and owner; normative lifecycle decisions remain GOV/Human-owned; provider/data mutation remains separately gated.

### SEC-PR900-04 — Independent owner-return verification
Verify returned evidence for CORS composition, CSP/COOP, method gates, application MFA paths, AuthN/AuthZ audit coverage, route/object/field authorization, ULS entitlement lineage, supervisor behavior, recovery/RPO/RTO, strict CSP and demo billing isolation.

### SEC-PR900-05 — CodeQL/PostHog/security-provider boundaries
Verify roles, least privilege, data minimization, provider permissions and separation from authority. Repository evidence must not imply provider state that was not read back.

### SEC-PR900-06 — Prompt/MCP trust findings
Verify F01/F06 prompt/history provenance returns and F04 external MCP effective grants/session/read-only boundaries with live/effective evidence where applicable.

## Carried-forward baseline (pre-2026-09-13)

| Item | Disposition |
|---|---|
| SEC-SOTA-01 | DONE_MAIN |
| SEC-SOTA-02 inventory | historical routed findings; re-correlate before remediation |
| SEC-SOTA-03 aggregate | VERIFIED_MAIN / CLOSED |
| SEC-SOTA-04 ASVS 5.0 matrix | MATRIX_INVENTORIED / VERIFICATION_OPEN |
| SEC-VERIFY-R2-04 fatal-process | REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN |
| SEC-VERIFY-ULS-001 | PARTIAL / NOT VERIFIED |
| SEC-AUTH-LIFECYCLE | OPEN / CLARIFY; ESS-0020 PROPOSED |
| SEC-COMP-CRA-01 | COMP applicability first |
| S1-R2-03..11 residuals | mixed owner-routed; no blanket closure |

`EVIDENCE_READY != VERIFIED`. Implementation and verification remain separate steps. PR #905 (license identity) is Human-merged on current main. Open PR #907 binds PR-create to the Approval Envelope and has no ROADMAP-file overlap with this fold.

## Dependencies
Productive owners CLIENT/OPS/DATA/FINTECH; GOV normative decisions; COMP legal judgments; QM exact-snapshot evidence.

## Project exit gate
One active SEC roadmap; no unresolved critical readiness finding is silently closed; every assessed requirement is reproducible or explicitly routed.
