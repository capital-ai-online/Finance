# CAPITAL-AI Enterprise DevelopmentChain — Current-State Index

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Version:** `2.1.0`  
**Status date:** `2026-08-19`  
**Current repository baseline:** `main@59a2755de53297a934b062b380a313d68cd47492` — PR #445 merge  
**Platform version:** `0.6.0`  
**Repository Agent Trust Root:** `/AGENTS.md`  
**Current governance roadmap:** `docs/roadmaps/GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md`

## Canonical role

This file is the **current-state DevelopmentChain status index**. Historical implementation detail remains in ADR, ESS, runbook and `docs/evidence/**` records.

`docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` is an older implementation-roadmap snapshot and is **historical/non-authorizing for current execution state**.

## Current governance operating state

```text
READ-ONLY BASELINE
→ AUTHORITY / RISK / REUSE PRE-CHECK
→ FRESH SCOPED BRANCH FROM CURRENT MAIN
→ REPOSITORY IMPLEMENTATION
→ AVAILABLE LOW-COST / EXACT-SNAPSHOT PRE-PR VALIDATION
→ FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ PULL REQUEST
→ INDEPENDENT GOVERNANCE / TECHNICAL CI
→ HUMAN/OWNER MERGE DECISION
→ HUMAN MERGE
→ VERIFIED MAIN DEPLOYMENT PATH, WHEN APPLICABLE
```

Current policy resolves through `/AGENTS.md`, stable Governance/ADR/ESS registries, the Control Catalog, DevelopmentChain Execution Policy, Human Owner PR Approval Policy and effective domain authorities.

## M10 — historical verification versus current enforcement

M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` has historical `COMPLETE / VERIFIED PASS` evidence. Those records remain valid historical evidence but **do not represent current enforcement**.

**M10 PR-CI passkey enforcement is currently `SUSPENDED / OFF`.**

On current `main`, `.github/workflows/ci.yml` sets `M10_CI_GATE_ENABLED: 'false'`. Normal Pull Request technical CI therefore does not require M10 Passkey authorization; manual M10 `workflow_dispatch` is denied while the switch is off.

Current PR path:

```text
PR OPEN / UPDATE
→ governance / workflow-security checks
→ normal scope-appropriate build-and-test
→ Human/Owner merge decision
→ Human Merge
```

### Mandatory blockers before M10 reactivation

M10 MUST remain off until all of the following are resolved and evidenced on then-current `main`:

1. no duplicate or ambiguous ADR, ESS, Authority or current-state references remain in the correlated architecture;
2. `src/platform/Governance` and `src/platform/Documentary/Governance` have one explicit non-overlapping responsibility model;
3. README version projection/documentary hygiene and Version Manager/Release version contracts resolve to one current version source of truth;
4. router-related governance/version references identified during cleanup are reconciled and cannot act as a second current-state source;
5. structural Governance validation and independent hosted CI pass on the exact final candidate head;
6. a new explicit Human/Owner decision approves controlled M10 reactivation.

Historical M10 ADR/ESS/runbook/evidence cannot satisfy item 6 or reactivate the gate by citation.

## Deployment authority — current state

Render native Auto Deploy is off. Current production promotion authority is:

```text
Human Merge
→ main
→ build-and-test
→ supply-chain attestation
→ exact-SHA Render deploy hook
→ post-deployment identity verification
```

A second automatic deployment authority requires a separate architecture/security decision.

## DevelopmentChain / Governance status

| Area | Historical evidence | Current state |
|---|---|---|
| M0–M8 foundations | retained | preserved |
| M9 Assurance | retained | not a current PR-CI authorization mechanism |
| M10 Passkey Owner PR Authorization | historically COMPLETE / VERIFIED PASS | **SUSPENDED / OFF** |
| Human Merge | established | **REQUIRED** |
| GitHub hosted build-and-test | established | **REQUIRED according to check class** |
| Render native auto-deploy | historical/native option | **OFF** |
| exact-SHA Render deploy hook | established | **current production deploy authority** |
| Governance Control Plane | Owner-directed | **IN PROGRESS on governance branch** |
| #439 Documentary/README/versioning | reusable implementation | **parked pending Governance reconciliation** |
| #442 Ranking | feature implementation | **parked pending Governance reconciliation** |
| #446 Media ADR-0094 | parallel feature PR | **stable ADR reservation; new exact-head CI required before merge** |

## Agent capability architecture

ESS-0019 remains the accepted provider-neutral capability/risk/audit/execution plane and is subordinate to `/AGENTS.md`. Repository-level provider instruction files are intentionally absent.

## Protected current invariants

- no direct agent changes on `main`;
- one scoped branch per work package;
- final main synchronization and open-PR semantic/namespace correlation;
- no fabricated evidence;
- Human/Owner-only merge;
- M10 remains off until the explicit reactivation exit criteria above are satisfied;
- fail-closed treatment of security-critical ambiguity;
- no reusable credentials in model-visible evidence;
- external production mutations remain separately authorized;
- Render native auto-deploy remains off;
- exact deployed SHA remains independently verifiable;
- historical evidence cannot silently regain current authority.

## Current next action

Complete Governance Control Plane consolidation and then reconcile #439/#442 and the then-current #446 state against the merged Governance baseline. M10 reactivation is not an active roadmap step until the documented blockers are closed.
