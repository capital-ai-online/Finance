# CAPITAL-AI Enterprise DevelopmentChain — Current-State Index

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Version:** `2.3.0`  
**Status date:** `2026-08-30`  
**Current repository baseline:** `main@4e3de6f489989e64962225874dd7dd69400fcd95`  
**Open PR correlation:** current-state synchronization after merged PR #611/#612  
**Platform version authority:** `package.json#version`  
**Repository Agent Trust Root:** `/AGENTS.md`  
**Execution policy:** `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`

## Canonical role

This file is the **current-state DevelopmentChain status index**. Historical implementation detail remains in ADR, ESS, runbook and `docs/evidence/**` records. Exact repository SHAs are observations for this status snapshot, not an independent platform-version authority.

`docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` remains an older implementation-roadmap snapshot and is **historical/non-authorizing for current execution state**. `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` is likewise a non-authorizing integrated projection and cannot supersede this status authority or ADR-0096.

## Current governance operating state

```text
CURRENT MAIN + OPEN-PR BASELINE
→ AUTHORITY / RISK / SECURITY / COMPLIANCE / REUSE PRE-CHECK
→ FRESH SCOPED BRANCH FROM CURRENT MAIN
→ SCOPED IMPLEMENTATION
→ AVAILABLE LOW-COST / EXACT-SNAPSHOT PRE-PR VALIDATION
→ FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ EXACT-SNAPSHOT HUMAN/OWNER PR-CREATION APPROVAL
→ PULL REQUEST
→ INDEPENDENT GOVERNANCE / TECHNICAL CI
→ HUMAN/CODEOWNER MERGE DECISION
→ HUMAN MERGE
→ SEPARATE PRODUCTION-MUTATION / DEPLOYMENT CONTROLS WHERE APPLICABLE
→ POST-CHANGE EVIDENCE / TRACEABILITY / DOCUMENTARY SYNCHRONIZATION
```

Current policy resolves through `/AGENTS.md`, stable Governance/ADR/ESS registries, the Control Catalog, DevelopmentChain Execution Policy, Human Owner PR Approval Policy and effective domain authorities.

## S1-R2 security-governance state

- `S1-R2-01` workflow startup-failure classification is resolved as historical/obsolete phantom-control evidence; active workflow YAML was not changed.
- `S1-R2-02` GitHub default-branch enforcement is **IMPLEMENTED / POST-MUTATION VERIFICATION PENDING**.
- GitHub Pro capability is active for the private repository and the repository ruleset `main-production-protection` is readable and enforced.
- Current provider readback dated 2026-08-30 includes `non_fast_forward`, `pull_request`, strict `required_status_checks`, `required_linear_history`, `code_quality` and an empty bypass actor set.
- `required_signatures` is intentionally not active after the explicit Owner decision dated 2026-08-30. Commit signing is optional and is not a merge-readiness, CI, PR-creation or protected-main prerequisite.
- Required checks are `build-and-test`, `PR Governance (Kosten / Workflow / Vorlage)`, `Hardened image / HIGH+CRITICAL CVE gate` and `GitGuardian Security Checks`.
- `Supabase Preview` and `Deployment verifiziert / Render-Produktion` remain intentionally outside the pre-merge required-check set because they can be skipped on PR validation.
- Remaining live drift against the canonical expected policy: `deletion` is not yet present and `required_review_thread_resolution` is still `false`; both remain prepared for reconciliation through the existing Owner-gated `ruleset-sync` workflow after script-safety verification.

## ESS current-state correlation

| ESS reference | Current repository resolution | Current-state classification |
|---|---|---|
| `ESS-0012` | `.ai/skills/ESS-0012-Documentation-Governance.md`; registered as `AUTH-ESS-DOCUMENTATION-GOVERNANCE` v1.0.0 | **RESOLVED / ENTERPRISE-APPROVED**; documentation-only governance, non-authorizing for repository-wide execution |
| `ESS-0019` | `.ai/skills/ESS-0019-Universal-AI-Agent-Control-Plane.md`; registered as `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE` v1.1.0 | **RESOLVED / ACCEPTED**; provider-neutral capability/risk/audit plane subordinate to `/AGENTS.md` |
| `ESS-0011` | referenced by ESS-0012 and ESS-0001 contracts as Enterprise Traceability, but no current `.ai/skills/ESS-0011-Enterprise-Traceability.md`, `ESS-0011-Contracts.md`, or Authority Registry entry resolves on current main | **UNRESOLVED REFERENCE / GOVERNANCE DRIFT**; must not be treated as a current executable authority until namespace/path authority is reconciled |
| `ESS-0001` | `.ai/skills/ESS-0001-Documentary-Architect.md` and `.ai/skills/ESS-0001-Contracts.md` both exist; the latter identifies itself as `ESS-0001-CONTRACTS` while the former owns display ID `ESS-0001`; neither is represented by a stable Authority Registry entry | **AMBIGUOUS LEGACY NAMESPACE / M10 BLOCKER**; retain files unchanged until dedicated ESS namespace reconciliation resolves stable authority identities |

The index does not silently rename, delete or re-authorize these ESS artifacts. Missing or ambiguous authority resolution remains fail-closed and is an explicit blocker for any future M10 reactivation.

## M10 — historical verification versus current enforcement

M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` has historical `COMPLETE / VERIFIED PASS` evidence. Those records remain valid historical evidence but **do not represent current enforcement**.

**M10 PR-CI passkey enforcement is currently `SUSPENDED / OFF`.** Human/CODEOWNER merge remains required. Historical M10 evidence cannot reactivate the gate.

### Mandatory blockers before M10 reactivation

M10 MUST remain off until all then-current prerequisites are resolved and evidenced, including:

1. no duplicate or ambiguous ADR, ESS, Authority or current-state references remain in the correlated architecture; current explicit blockers include unresolved `ESS-0011` references and the legacy `ESS-0001` namespace split;
2. `src/platform/Governance` and `src/platform/Documentary/Governance` retain an explicit non-overlapping responsibility model;
3. README/runtime/documentary/version contracts resolve to canonical version sources rather than duplicated status authorities;
4. structural Governance validation and independent hosted CI pass on the exact final candidate head;
5. native default-branch enforcement remains active and post-mutation readback is evidence-bound;
6. a new explicit Human/Owner decision approves controlled M10 reactivation.

## Deployment authority — current state

Render native Auto Deploy remains off. Current production promotion authority resolves through verified `main` CI and the existing deployment control plane. A second automatic deployment authority requires a separate architecture/security decision.

## DevelopmentChain / Governance status

| Area | Current state |
|---|---|
| Agent Trust Root | `/AGENTS.md` remains the repository-wide instruction and governance entrypoint |
| DevelopmentChain Execution | `DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` active |
| Current-State Index | this document; synchronized to `main@4e3de6f489989e64962225874dd7dd69400fcd95` plus provider-side Ruleset readback dated 2026-08-30 |
| Open Pull Requests at this synchronization | bounded current workstreams only; semantic authority overlap must remain fail-closed |
| S1-R2-01 Workflow phantom-control evidence | **RESOLVED / OBSOLETE HISTORICAL STARTUP-FAILURE EVIDENCE** |
| S1-R2-02 GitHub main enforcement | **IMPLEMENTED / POST-MUTATION VERIFICATION PENDING**; active Ruleset confirmed; deletion/review-thread reconciliation pending; commit signing intentionally optional |
| M10 Passkey PR-CI enforcement | **SUSPENDED / OFF** |
| Human/Owner PR creation | **REQUIRED** after final main/open-PR correlation and bound to exact main/head SHAs |
| Human/CODEOWNER Merge | **REQUIRED** as a separate decision |
| GitHub hosted validation | scope-/cost-controlled; Required Checks are `build-and-test`, PR Governance, hardened-image CVE gate and GitGuardian |
| Commit authenticity | Signing is optional under the Owner decision dated 2026-08-30; unsigned commits are not rejected solely for lacking a verified signature. Human/Owner merge authority and required checks remain mandatory. |
| ESS-0012 | **RESOLVED** through Authority Registry |
| ESS-0019 | **RESOLVED** through Authority Registry |
| ESS-0011 | **UNRESOLVED REFERENCE** on current main |
| ESS-0001 | **LEGACY NAMESPACE AMBIGUITY**; two related physical artifacts, no stable Authority Registry identity |
| Social Media OAuth / Auth Code | ADR-0026/ADR-0027 path; single-use/expiry-bound state, strict environment-aware callback allowlist, X PKCE S256, verified provider identity before `connected`, Bearer transport across Meta resource/publish APIs and dedicated negative-test/threat-model evidence |
| FinTech value-chain quality projection | `fintech-value-chain-quality/1.0.0`, **18 stages**, read-only/non-authorizing |
| Vocabulary | `src/platform/Vocabulary` v1.8.0; 18-stage wording projection and Documentary handoff implemented |
| FinTechCore Crypto Module | v0.6.2; FT-0 through FT-6B merged; FT-7/live execution remains blocked |
| Meme/DeFi research scoring | research/challenger only; productive score authority remains ADR-0087 / ScoringDispatcher |
| DeFiLlama | ADR-0100 evidence-only; no scoring bypass |
| Documentary | read-only Evidence sidecar; machine-readable bindings remain non-authorizing projections of current authorities |

## Agent capability architecture

ESS-0019 remains the accepted provider-neutral capability/risk/audit/execution plane and is subordinate to `/AGENTS.md`. Repository-level provider instruction files are intentionally absent.

## Protected current invariants

- no direct agent changes on `main`;
- one scoped branch/work claim per bounded work package where required by the active workflow;
- final main synchronization and open-PR semantic/namespace correlation before requesting PR-creation approval and again before merge readiness;
- explicit Human/Owner approval bound to the exact reported main/head SHAs before each PR or Draft-PR creation; any pre-creation drift invalidates approval;
- no fabricated evidence, market data, citations or compliance assertions;
- Human/Owner-only merge;
- M10 remains off until a new explicit reactivation decision;
- fail-closed treatment of security-critical ambiguity;
- no reusable credentials in model-visible evidence;
- external production mutations remain separately authorized;
- package version remains the platform-version authority;
- Vocabulary, Documentary, Quality and Skill Engine remain projections/control surfaces and cannot create a second financial runtime authority;
- `ScoringModelRegistry -> ScoringDispatcher -> Domain Executor -> CanonicalScoreResult` remains the productive scoring path;
- historical evidence cannot silently regain current authority;
- missing ESS files or ambiguous ESS display IDs do not acquire authority by reference alone;
- native GitHub protection must not be simulated by a workflow-only substitute;
- skipped checks must not be made Required without a proven event/applicability contract;
- commit signing may be used voluntarily but must not be elevated to a mandatory protected-main or merge-readiness control without a new explicit Human/Owner decision;
- Social Media OAuth production callbacks remain bound to explicit CAPITAL-AI HTTPS origins and the canonical callback path before state persistence;
- loopback OAuth callbacks require exact `development` or `test`; missing/unknown environment labels remain strict;
- OAuth state remains server-generated, expiry-bound and single-use, with the provider derived from persisted state rather than callback-controlled input;
- connected Social Media accounts require a successfully verified provider identity before persistence;
- reusable OAuth client secrets remain server-side under the canonical secret-file inventory;
- provider resource access tokens are transported as Bearer credentials and are not placed into resource URL query strings.

## Current next action

1. complete S1-R2-02 through the canonical `ruleset-sync` path only after `rulesetSync.mjs` is verified to preserve/own the intended live controls: reconcile `deletion=true` and `required_review_thread_resolution=true`, then capture provider readback;
2. keep `required_signatures` disabled as an intentional Owner decision; signing remains optional provenance and must not block AI-assisted branch/PR workflows;
3. reconcile `ESS-0011` missing-path references and the `ESS-0001` legacy namespace split in a dedicated ESS authority/namespace work package before any M10 reactivation;
4. keep M10 `AUTHORIZE_PR_CI` enforcement `SUSPENDED / OFF` until all current reactivation prerequisites and a new explicit Human/Owner decision are satisfied;
5. treat repository merge, roadmap status and historical evidence as non-authorizing for Render, Supabase, Stripe, provider-console, secret or production mutations.
