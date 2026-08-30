# CAPITAL-AI Enterprise DevelopmentChain — Current-State Index

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Version:** `2.5.0`  
**Status date:** `2026-08-30`  
**Current repository baseline:** `main@460e8dd088a78f426cac392c20da104f5873ecad` — includes merged PRs #607, #610, #611, #612 and #614  
**Open PR correlation:** #615 is the prerequisite writer for S1 policy/ruleset safety and overlaps this branch on `ROADMAP.md` and the Authority Registry. This #617 snapshot must follow #615 and be rebased/revalidated after its Human merge.  
**Platform version authority:** `package.json#version` = `0.6.0`  
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
- `S1-R2-02` GitHub default-branch enforcement code/docs merged as PR #611 (`dc3dd333`). **OWNER DISPATCH PENDING**; PR #615 now implements policy-owned `required_linear_history`, Squash/Rebase-only methods and fail-closed builder/normalizer/floor checks, but must be Human-merged with Exact-Head-PASS before any apply.
- GitHub Pro capability is active for the private repository and the repository ruleset `main-production-protection` is readable.
- Provider readback on 2026-08-30 at 19:08 CEST contains only `non_fast_forward`, `pull_request` (without CODEOWNER or thread-resolution requirements) and advisory `code_quality`; the bypass actor set is empty and `current_user_can_bypass=never`.
- Live drift: `required_status_checks`, `required_linear_history` and `deletion` are absent; CODEOWNER review and required review-thread resolution are disabled.
- `required_signatures` is intentionally absent after the explicit Owner decision dated 2026-08-30. Commit signing is optional and is not a merge-readiness, CI, PR-creation or protected-main prerequisite. PR #613 remains discarded.
- The canonical target after #615 retains four required checks: `build-and-test`, `PR Governance (Kosten / Workflow / Vorlage)`, `Hardened image / HIGH+CRITICAL CVE gate` and `GitGuardian Security Checks`; it also restores linear history, deletion protection, CODEOWNER review and thread resolution.
- `Supabase Preview` and `Deployment verifiziert / Render-Produktion` remain intentionally outside the pre-merge required-check set.
- A live plan/full apply is a separate Owner-gated provider mutation and is not authorized by #615 or #617.
- Checklist: `docs/evidence/security/S1_R2_02_POST_MERGE_DISPATCH_CHECKLIST_2026-08-30.md`.

## ESS current-state correlation

| ESS reference | Current repository resolution | Current-state classification |
|---|---|---|
| `ESS-0012` | `.ai/skills/ESS-0012-Documentation-Governance.md`; registered as `AUTH-ESS-DOCUMENTATION-GOVERNANCE` v1.0.0 | **RESOLVED / ENTERPRISE-APPROVED**; documentation-only governance, non-authorizing for repository-wide execution |
| `ESS-0019` | `.ai/skills/ESS-0019-Universal-AI-Agent-Control-Plane.md`; registered as `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE` v1.1.0 | **RESOLVED / ACCEPTED**; provider-neutral capability/risk/audit plane subordinate to `/AGENTS.md` |
| `ESS-0011` | `.ai/skills/ESS-0011-Enterprise-Traceability.md` and `.ai/skills/ESS-0011-Contracts.md` exist on main; registered as `AUTH-ESS-ENTERPRISE-TRACEABILITY` | **PATH RESOLVED / AUTHORITY REGISTERED**; runtime ETM remains partial (`traceability:build`); not a missing-file blocker |
| `ESS-0001` | `.ai/skills/ESS-0001-Documentary-Architect.md` (`AUTH-ESS-DOCUMENTARY-ARCHITECT`) and `.ai/skills/ESS-0001-Contracts.md` (`AUTH-ESS-DOCUMENTARY-CONTRACTS`, no own ESS number) | **NAMESPACE RESOLVED**; two physical artifacts, two stable authorityIds; files unchanged |

Reconciliation evidence: `docs/governance/ESS_NAMESPACE_RECONCILIATION_2026-08-30.md`. The index does not rename, delete or re-number ESS artifacts.

## M10 — historical verification versus current enforcement

M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` has historical `COMPLETE / VERIFIED PASS` evidence. Those records remain valid historical evidence but **do not represent current enforcement**.

**M10 PR-CI passkey enforcement is currently `SUSPENDED / OFF`.** Human/CODEOWNER merge remains required. Historical M10 evidence cannot reactivate the gate. Removing the ESS-0011 missing-path classification does **not** clear the remaining M10 blockers.

### Mandatory blockers before M10 reactivation

M10 MUST remain off until all then-current prerequisites are resolved and evidenced, including:

1. no duplicate or ambiguous ADR, ESS, Authority or current-state references remain in the correlated architecture; the former missing-path `ESS-0011` and unregistered `ESS-0001` split are reconciled in this snapshot, but Governance/Documentary responsibility and version-contract work remain;
2. `src/platform/Governance` and `src/platform/Documentary/Governance` retain an explicit non-overlapping responsibility model;
3. README/runtime/documentary/version contracts resolve to canonical version sources rather than duplicated status authorities;
4. structural Governance validation and independent hosted CI pass on the exact final candidate head;
5. native default-branch enforcement remains active and post-mutation readback is evidence-bound;
6. a new explicit Human/Owner decision approves controlled M10 reactivation.

## Deployment authority — current state

Render native Auto Deploy remains off. Current production promotion authority resolves through verified `main` CI and the existing deployment control plane. A second automatic deployment authority requires a separate architecture/security decision. The production preflight baseline generated on 2026-08-30 binds production and `main` to `460e8dd088a78f426cac392c20da104f5873ecad` at platform version `0.6.0`.

## DevelopmentChain / Governance status

| Area | Current state |
|---|---|
| Agent Trust Root | `/AGENTS.md` remains the repository-wide instruction and governance entrypoint |
| DevelopmentChain Execution | `DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` active |
| Current-State Index | this document v2.5.0; synchronized to `main@460e8dd088a78f426cac392c20da104f5873ecad` |
| Open Pull Requests at this synchronization | #615 is prerequisite; OPEN-STEPS-BIND-2026-08-30 (#617) follows it and overlaps on current-state/authority files |
| S1-R2-01 Workflow phantom-control evidence | **RESOLVED / OBSOLETE HISTORICAL STARTUP-FAILURE EVIDENCE** |
| S1-R2-02 GitHub main enforcement | **IMPLEMENTED IN REPOSITORY / LIVE DRIFT OPEN** after #611; #615 remediation pending Human merge; `required_signatures` intentionally absent; `mode=full` blocked |
| Value-Chain Coverage | Coverage-Map + Inventar *-0 on main via #610; append-only registry payload + *-1 specification in OPEN-STEPS-BIND; physical registry insert not performed |
| M10 Passkey PR-CI enforcement | **SUSPENDED / OFF** |
| Human/Owner PR creation | **REQUIRED** after final main/open-PR correlation and bound to exact main/head SHAs |
| Human/CODEOWNER Merge | **REQUIRED** as a separate decision |
| GitHub hosted validation | scope-/cost-controlled; canonical Required Checks are `build-and-test`, PR Governance, hardened-image CVE gate and GitGuardian, but the live ruleset currently lacks their enforcement |
| Commit authenticity | Signing is optional under the Owner decision dated 2026-08-30; unsigned commits are not rejected solely for lacking a verified signature |
| ESS-0012 | **RESOLVED** through Authority Registry |
| ESS-0019 | **RESOLVED** through Authority Registry |
| ESS-0011 | **PATH RESOLVED / AUTHORITY REGISTERED** |
| ESS-0001 | **NAMESPACE RESOLVED** (Architect + CONTRACTS authorityIds) |
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
- Owner decisions on `required_signatures` must not be silently reversed by agent-authored expected-policy applies;
- commit signing may be used voluntarily but must not be elevated to a mandatory protected-main or merge-readiness control without a new explicit Human/Owner decision;
- Social Media OAuth production callbacks remain bound to explicit CAPITAL-AI HTTPS origins and the canonical callback path before state persistence;
- loopback OAuth callbacks require exact `development` or `test`; missing/unknown environment labels remain strict;
- OAuth state remains server-generated, expiry-bound and single-use, with the provider derived from persisted state rather than callback-controlled input;
- connected Social Media accounts require a successfully verified provider identity before persistence;
- reusable OAuth client secrets remain server-side under the canonical secret-file inventory;
- provider resource access tokens are transported as Bearer credentials and are not placed into resource URL query strings.

## Current next action

1. Human-review and merge #615 first; require its exact-head checks to pass;
2. rebase/synchronize #617 on the resulting `main`, resolve current-state/authority overlap, and rerun exact-head checks before Human review;
3. keep `required_signatures` disabled as an intentional Owner decision; do not merge #613;
4. only after #615 is merged: Owner-only S1-R2-02 `ruleset-sync` on `main` starts with `mode=plan`; `mode=full` requires separate Owner-ACCEPT and verified diff/readback;
5. keep the physical `document-registry.json` insert separate from this payload-only PR;
6. after the documentary bind, first runtime candidates are SUP-1 / VM-2 / DQ-1 as Klasse-C work on a fresh branch; PD-1 waits for Owner-ACCEPT;
7. keep M10 `AUTHORIZE_PR_CI` enforcement `SUSPENDED / OFF` until remaining blockers and a new explicit Human/Owner decision are satisfied;
8. treat repository merge, roadmap status and historical evidence as non-authorizing for Render, Supabase, Stripe, provider-console, secret or production mutations.
