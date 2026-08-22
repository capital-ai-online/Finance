# CAPITAL-AI Enterprise DevelopmentChain — Current-State Index

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Version:** `2.1.0`  
**Status date:** `2026-08-22`  
**Current repository baseline:** `main@f01a615edfa4a87939fb07bdce08829a1b46a1e6` — PR #485 merge  
**Platform version authority:** `package.json#version`  
**Repository Agent Trust Root:** `/AGENTS.md`  
**Execution policy:** `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`

## Canonical role

This file is the **current-state DevelopmentChain status index**. Historical implementation detail remains in ADR, ESS, runbook and `docs/evidence/**` records. Exact repository SHAs are observations for this status snapshot, not an independent platform-version authority.

`docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` remains an older implementation-roadmap snapshot and is **historical/non-authorizing for current execution state**.

## Current governance operating state

```text
CURRENT MAIN + OPEN-PR BASELINE
→ AUTHORITY / RISK / SECURITY / COMPLIANCE / REUSE PRE-CHECK
→ FRESH SCOPED BRANCH FROM CURRENT MAIN
→ SCOPED IMPLEMENTATION
→ AVAILABLE LOW-COST / EXACT-SNAPSHOT PRE-PR VALIDATION
→ FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ PULL REQUEST
→ INDEPENDENT GOVERNANCE / TECHNICAL CI
→ HUMAN/CODEOWNER MERGE DECISION
→ HUMAN MERGE
→ SEPARATE PRODUCTION-MUTATION / DEPLOYMENT CONTROLS WHERE APPLICABLE
→ POST-CHANGE EVIDENCE / TRACEABILITY / DOCUMENTARY SYNCHRONIZATION
```

Current policy resolves through `/AGENTS.md`, stable Governance/ADR/ESS registries, the Control Catalog, DevelopmentChain Execution Policy, Human Owner PR Approval Policy and effective domain authorities.

## M10 — historical verification versus current enforcement

M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` has historical `COMPLETE / VERIFIED PASS` evidence. Those records remain valid historical evidence but **do not represent current enforcement**.

**M10 PR-CI passkey enforcement is currently `SUSPENDED / OFF`.** Human/CODEOWNER merge remains required. Historical M10 evidence cannot reactivate the gate.

### Mandatory blockers before M10 reactivation

M10 MUST remain off until all then-current prerequisites are resolved and evidenced, including:

1. no duplicate or ambiguous ADR, ESS, Authority or current-state references remain in the correlated architecture;
2. `src/platform/Governance` and `src/platform/Documentary/Governance` retain an explicit non-overlapping responsibility model;
3. README/runtime/documentary/version contracts resolve to canonical version sources rather than duplicated status authorities;
4. structural Governance validation and independent hosted CI pass on the exact final candidate head;
5. a new explicit Human/Owner decision approves controlled M10 reactivation.

## Deployment authority — current state

Render native Auto Deploy remains off. Current production promotion authority resolves through verified `main` CI and the existing deployment control plane. A second automatic deployment authority requires a separate architecture/security decision.

## DevelopmentChain / Governance status

| Area | Current state |
|---|---|
| Agent Trust Root | `/AGENTS.md` remains the repository-wide instruction and governance entrypoint |
| DevelopmentChain Execution | `DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` active |
| Current-State Index | this document; synchronized to `main@f01a615e…` |
| Open Pull Requests at this synchronization | `0` |
| M10 Passkey PR-CI enforcement | **SUSPENDED / OFF** |
| Human/CODEOWNER Merge | **REQUIRED** |
| GitHub hosted validation | scope-/cost-controlled according to current CI governance |
| FinTech value-chain quality projection | `fintech-value-chain-quality/1.0.0`, **18 stages**, read-only/non-authorizing |
| Vocabulary | `src/platform/Vocabulary` v1.8.0; 18-stage wording projection and Documentary handoff implemented |
| FinTechCore Crypto Module | v0.6.2; FT-0 through FT-6B merged; FT-7/live execution remains blocked |
| Meme/DeFi research scoring | research/challenger only; productive score authority remains ADR-0087 / ScoringDispatcher |
| DeFiLlama | ADR-0100 evidence-only; no scoring bypass |
| Documentary | read-only Evidence sidecar; current correction aligns its machine-readable binding to VC-17 of the 18-stage projection |

## Agent capability architecture

ESS-0019 remains the accepted provider-neutral capability/risk/audit/execution plane and is subordinate to `/AGENTS.md`. Repository-level provider instruction files are intentionally absent.

## Protected current invariants

- no direct agent changes on `main`;
- one scoped branch/work claim per bounded work package where required by the active workflow;
- final main synchronization and open-PR semantic/namespace correlation before PR creation;
- no fabricated evidence, market data, citations or compliance assertions;
- Human/Owner-only merge;
- M10 remains off until a new explicit reactivation decision;
- fail-closed treatment of security-critical ambiguity;
- no reusable credentials in model-visible evidence;
- external production mutations remain separately authorized;
- package version remains the platform-version authority;
- Vocabulary, Documentary, Quality and Skill Engine remain projections/control surfaces and cannot create a second financial runtime authority;
- `ScoringModelRegistry -> ScoringDispatcher -> Domain Executor -> CanonicalScoreResult` remains the productive scoring path;
- historical evidence cannot silently regain current authority.

## Current next action

1. close the remaining documentary/current-state drift around the 18-stage SC-MD-SPT projection without changing financial runtime authority;
2. keep FT-7 guarded-live/production execution blocked until its separate architecture/security decision and evidence gates exist;
3. maintain Meme/DeFi models as research-only until explicit governed promotion criteria are satisfied;
4. continue current-main/open-PR correlation before every new Draft PR or Pull Request.
