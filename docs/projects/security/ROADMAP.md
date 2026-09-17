# CAPITAL-AI-SEC — Canonical Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Folder:** `docs/projects/security/`  
**Role:** cross-cutting Security requirements, findings, bounded remediation and independent verification  
**Status:** `ACTIVE — TEMPORARY CANONICAL PROJECT ROADMAP`  
**Reconciliation:** `2026-09-17 — historical task activation removed`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

This Roadmap remains temporarily present until the separately requested Roadmap-removal Pull Request after completion of the Social Roadmap. Historical chats, branches, findings, old queues, archived Roadmap rows and non-terminal labels are evidence only. They do not preserve or reactivate work.

A Security work item is executable only when it is currently active under `/AGENTS.md@CURRENT_MAIN` with a canonical current identity or freshly defined/re-authorized by the Human/Owner in the current interaction. Security verification remains independent from implementation claims. `EVIDENCE_READY != VERIFIED` remains invariant.

## Current bounded Security state

### SEC-PR900-01 — Security projection consistency
Synchronize Security projections against current authority and implementation evidence. Preserve historical evidence dates and never rewrite an old result as a new verification.

Human-merged PR #922 synchronized the Security component projection and corrected `.github/CODEOWNERS` wording so repository text does not claim enforcement that provider readback did not prove.

### SEC-PR900-02 — Focused ASVS/security verification
Requirement-level verification remains evidence-bound. Missing provider/runtime evidence is reported as `NOT_VERIFIED`, `NOT_RUN`, `NOT_FULLY_PROVEN` or another truthful bounded state; it never becomes a project-wide PASS.

Known evidence boundaries include:

- file-processing path currently disabled/fail-closed where no approved replacement provider exists;
- productive Google OAuth is provider-managed and still requires exact provider-configuration evidence for complete verification;
- production transport/TLS/proxy/edge readback remains OPS-owned evidence followed by independent Security verification.

### SEC-PR900-03 — Authentication lifecycle
Any MFA, recovery, step-up, provider-configuration or authentication-lifecycle work requires then-current ESS/ADR/provider evidence. Historical provider counts and chat reports do not activate a mutation or prove provider configuration.

### SEC-PR900-04 — Independent owner-return verification
Security may verify current owner-return evidence for CORS/CSP/COOP, method gates, AuthN/AuthZ, route/object/field authorization, entitlement lineage, supervisor behavior, recovery/RPO/RTO, strict CSP and demo-billing isolation.

A foreign-owner `IMPLEMENTED` or `EVIDENCE_READY` state never self-promotes to Security `VERIFIED`. Later chat claims that differ from materialized current evidence remain unproven until reproduced independently.

### SEC-PR900-05 — CodeQL/PostHog/security-provider boundaries
Repository implementation evidence for selective CodeQL/Copilot controls exists from prior Human merges. Effective provider permissions, GitHub security settings not exposed by current readback, PostHog provider state and other external configuration remain separate evidence classes.

Provider availability or repository configuration never proves effective grant state. No PAT/SSO/audit-streaming/environment/provider permission mutation is authorized by a Roadmap row.

### SEC-PR900-06 — Prompt/MCP trust findings
Prompt/history provenance and external MCP grant/session/read-only boundaries require effective current evidence. Retrieved content and chat history remain untrusted inputs and cannot become instruction or task authority.

## Current evidence dispositions

- PR #923 / #931 Controlled CodeQL Autofix: repository implementation/observability evidence exists; provider-permission and successful safe-candidate execution remain separately evidenced.
- PR #956 S1-R2-11: `DONE_MAIN / VERIFIED_REPOSITORY_SCOPE` for the bounded repository contract verified there. The former DATA ownership label is historical; PVC-10 now resolves to `CAPITAL-AI-FINTECH`.
- PR #967 is merged; PR #969 is `CLOSED / NOT MERGED`; no #969 payload is assumed or revived.
- GitHub provider readback remains partial where the connected surface cannot expose effective state.
- `SEC-VERIFY-ULS-001` remains evidence-bound; a prior chat-reported improved lineage does not promote status without reproducible current provider evidence.
- FINTECH entitlement implementations are owner-return evidence only until independently verified by Security where verification remains applicable.

## Historical inventory boundary

Former `SEC-SOTA-*`, `S1-R2-*`, chat reconciliation tables, aggregate Security backlog rows and their old `ACTIVE`, `OPEN`, `PARTIAL`, `BLOCKED`, `CONDITIONAL` or other non-terminal labels remain available through Git history and evidence documents. They are **not an active backlog** and MUST NOT be reconstructed into one merely because they were not terminal.

When a current Security finding genuinely exists, it must be established from then-current repository/provider evidence and receive a current canonical identity or fresh Human/Owner direction before execution.

## DATA ownership supersession alignment

References that historically named `CAPITAL-AI-DATA / PVC-09..11` are ownership history only. Current routing for PVC-09, PVC-10 and PVC-11 resolves to `CAPITAL-AI-FINTECH` under the effective DATA ownership supersession. This does not transfer independent Security verification authority to FINTECH.

## Dependencies
Current owner-correct evidence from OPS, FINTECH, CLIENT, FE, DOC, COMP and other relevant owners; applicable Security ESS/ADR/contracts; independent provider/runtime readback where material.

## Project exit gate
No historical/non-terminal Security state self-activates; independent verification remains separate from owner implementation; provider state is never inferred from repository presence; no duplicate task queue or instruction plane exists; this Roadmap is removed only by the dedicated post-Social Roadmap-removal Pull Request.
