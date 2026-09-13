# CAPITAL-AI-SEC — Roadmap 2026-09-13

**Project:** `CAPITAL-AI-SEC`  
**Folder:** `docs/projects/security/`  
**Role:** cross-cutting Security requirements, findings, bounded remediation and independent verification  
**Status:** `ACTIVE — CANONICAL DATED ROADMAP`  
**Baseline:** `main@9634053b222725db69d557f61d44d77b9eb8cb04` (PR #900 merged)  
**Superseded baseline:** `archive/CAPITAL_AI_SECURITY_ROADMAP_SUPERSEDED_2026-09-13.md`

## Consolidation rule
All non-terminal SEC work from the superseded baseline remains active unless replaced below. Security verification remains independent; foreign productive ownership is not transferred.

## Active work packages

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

## Dependencies
Productive owners CLIENT/OPS/DATA/FINTECH; GOV normative decisions; COMP legal judgments; QM exact-snapshot evidence.

## Project exit gate
One active SEC roadmap; no unresolved critical readiness finding is silently closed; every assessed requirement is reproducible or explicitly routed.