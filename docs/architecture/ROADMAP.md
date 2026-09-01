# CAPITAL-AI Enterprise DevelopmentChain — Current-State Index

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Version:** `2.6.0`  
**Status date:** `2026-09-01`  
**Current repository baseline for this synchronization:** `main@abdee9686825b39f34e5edbe6960e9c20f523618` — includes Human Merge of PR #691 and complete productive M10 retirement  
**Open PR correlation at this synchronization:** PR #697 is open and changes the governance owner-device-authorization contract/navigation; no overlap with this M10 current-state index mutation was identified.  
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
- `S1-R2-02` GitHub default-branch enforcement code/docs merged as PR #611 (`dc3dd333`). PR #615 was Human-merged at `main@f714eae6` after Exact-Head-PASS and supplies policy-owned `required_linear_history`, Squash/Rebase-only methods and fail-closed builder/normalizer/floor checks. Provider mutation/readback remains governed separately.
- `required_signatures` is intentionally absent after the explicit Owner decision dated 2026-08-30. Commit signing is optional and is not a merge-readiness, CI, PR-creation or protected-main prerequisite.
- The canonical required-check target retains `build-and-test`, `PR Governance (Kosten / Workflow / Vorlage)`, `Hardened image / HIGH+CRITICAL CVE gate` and `GitGuardian Security Checks` where applicable.
- `Supabase Preview` and `Deployment verifiziert / Render-Produktion` remain intentionally outside the pre-merge required-check set.

## ESS current-state correlation

| ESS reference | Current repository resolution | Current-state classification |
|---|---|---|
| `ESS-0012` | `.ai/skills/ESS-0012-Documentation-Governance.md`; registered as `AUTH-ESS-DOCUMENTATION-GOVERNANCE` v1.0.0 | **RESOLVED / ENTERPRISE-APPROVED**; documentation-only governance, non-authorizing for repository-wide execution |
| `ESS-0019` | `.ai/skills/ESS-0019-Universal-AI-Agent-Control-Plane.md`; registered as `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE` v1.1.0 | **RESOLVED / ACCEPTED**; provider-neutral capability/risk/audit plane subordinate to `/AGENTS.md` |
| `ESS-0011` | `.ai/skills/ESS-0011-Enterprise-Traceability.md` and `.ai/skills/ESS-0011-Contracts.md`; registered as `AUTH-ESS-ENTERPRISE-TRACEABILITY` | **PATH RESOLVED / AUTHORITY REGISTERED** |
| `ESS-0001` | `.ai/skills/ESS-0001-Documentary-Architect.md` and `.ai/skills/ESS-0001-Contracts.md` | **NAMESPACE RESOLVED**; distinct stable authority identities |

Reconciliation evidence remains in `docs/governance/ESS_NAMESPACE_RECONCILIATION_2026-08-30.md`.

## M10 — retired current-state boundary

M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` has historical verification/evidence. Human Merge of PR #691 subsequently removed the productive M10 runtime and authorization surfaces from the current application architecture.

**M10 PR-CI passkey runtime is `RETIRED / OFF`. No productive M10 implementation is expected in current state.**

Repository-wide and web-application-wide current-state discovery MUST NOT:

- search for or expect an M10 implementation;
- classify missing M10 runtime/router/UI/workflow components as an implementation gap;
- reconstruct or recommend restoration of M10 merely from historical documents, evidence or tests;
- create a reactivation backlog from historical M10 terminology.

Historical M10 artifacts may be inspected only for explicit audit, archaeology, incident-review or historical-traceability tasks. They are non-authorizing.

Any future PR-CI/passkey authorization mechanism is a **new separately scoped architecture and Human/Owner authority decision**. It is not inferred as M10 reactivation and is evaluated against then-current requirements without searching for a retired implementation.

Normal PR technical validation remains governed by current hosted-check controls. Human/CODEOWNER merge remains mandatory.

## Deployment authority — current state

Render native Auto Deploy remains off. Current production promotion authority resolves through verified `main` CI and the existing deployment control plane. A second automatic deployment authority requires a separate architecture/security decision. Repository merge, roadmap status and historical evidence remain non-authorizing for external production mutation.

## DevelopmentChain / Governance status

| Area | Current state |
|---|---|
| Agent Trust Root | `/AGENTS.md` remains the repository-wide instruction and governance entrypoint |
| DevelopmentChain Execution | `DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` active |
| Current-State Index | this document v2.6.0; M10 retirement synchronized to `main@abdee9686825b39f34e5edbe6960e9c20f523618` |
| Open Pull Requests at this synchronization | #697; no identified changed-path overlap with this M10 status update |
| S1-R2-01 Workflow phantom-control evidence | **RESOLVED / OBSOLETE HISTORICAL STARTUP-FAILURE EVIDENCE** |
| S1-R2-02 GitHub main enforcement | governed by current provider/readback controls; `required_signatures` intentionally absent |
| M10 Passkey PR-CI implementation | **RETIRED / HISTORICAL ONLY — NO CURRENT IMPLEMENTATION EXPECTED** |
| Human/Owner PR creation | **REQUIRED** after final main/open-PR correlation and bound to exact main/head SHAs unless a valid separately activated bounded authority explicitly replaces only that approval prompt |
| Human/CODEOWNER Merge | **REQUIRED** as a separate decision |
| GitHub hosted validation | scope-/cost-controlled under current required-check policy |
| Commit authenticity | Signing remains optional unless a later explicit Human/Owner decision changes it |
| ESS-0012 | **RESOLVED** through Authority Registry |
| ESS-0019 | **RESOLVED** through Authority Registry |
| ESS-0011 | **PATH RESOLVED / AUTHORITY REGISTERED** |
| ESS-0001 | **NAMESPACE RESOLVED** |
| Documentary | read-only evidence sidecar; machine-readable bindings remain non-authorizing projections of current authorities |

## Agent capability architecture

ESS-0019 remains the accepted provider-neutral capability/risk/audit/execution plane and is subordinate to `/AGENTS.md`. Repository-level provider instruction files are intentionally absent.

## Protected current invariants

- no direct agent changes on `main`;
- one scoped branch/work item per bounded work package where required by the active workflow;
- final main synchronization and open-PR semantic/namespace correlation before requesting PR-creation approval and again before merge readiness;
- explicit Human/Owner approval bound to the exact reported main/head SHAs before each PR or Draft-PR creation unless an effective explicitly scoped authority replaces only that approval surface;
- no fabricated evidence, market data, citations or compliance assertions;
- Human/Owner-only merge;
- M10 is retired/historical: current-state repository and web-application scans do not seek an M10 implementation or treat its absence as a gap;
- a future PR-CI/passkey authorization mechanism requires a new explicit Human/Owner architecture/authority decision and is not inferred from M10 history;
- fail-closed treatment of security-critical ambiguity;
- no reusable credentials in model-visible evidence;
- external production mutations remain separately governed;
- package version remains the platform-version authority;
- Vocabulary, Documentary, Quality and Skill Engine remain projections/control surfaces and cannot create a second financial runtime authority;
- historical evidence cannot silently regain current authority;
- native GitHub protection must not be simulated by a workflow-only substitute;
- skipped checks must not be made Required without a proven event/applicability contract.

## Current next action

1. correlate current main, open PR #697 and this governance candidate before any PR-creation approval request;
2. keep M10 historical-only and exclude productive M10 implementation discovery from repository/web-application gap analysis;
3. evaluate any future passkey/PR-CI authorization proposal as a new separately scoped architecture/security/governance work item rather than an M10 reconstruction;
4. retain Human/CODEOWNER-only merge and current hosted technical validation;
5. treat repository merge, roadmap status and historical evidence as non-authorizing for Render, Supabase, Stripe, provider-console, secret or production mutations.
