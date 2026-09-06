# CAPITAL-AI Enterprise DevelopmentChain — Current-State Index

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Version:** `2.8.2`  
**Status date:** `2026-09-07`  
**Current repository baseline for this synchronization:** `main@12b5ec1886984fb6815ba111108f7f353496de7d`  
**Open PR correlation at this synchronization:** zero open Pull Requests against `main`  
**Platform version authority:** `package.json#version`  
**Repository Agent Trust Root:** `/AGENTS.md`  
**Execution policy:** `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`

## Canonical role

This file is the repository-wide **current-state index**. Project-specific work belongs in the affected `docs/projects/<project>/ROADMAP.md`; architecture decisions belong in ADRs; component/capability contracts belong in ESS; implementation truth is established by code, tests and evidence.

Historical implementation detail remains in ADR, ESS, runbooks, merged Pull Requests and `docs/evidence/**`. Exact repository SHAs are observations, not an independent platform-version authority.

`docs/architecture/DEVELOPMENT_CHAIN_ROADMAP.md` and older integrated DevelopmentChain/Systemadmin roadmap snapshots are historical/non-authorizing where they conflict with this current state.

## Human-readable development model

```text
PROJECT VALUE CHAIN / PVC
→ PROJECT ROADMAP
→ APPLICABLE ADR
→ APPLICABLE ESS
→ CODE / TESTS / EVIDENCE
```

Repository execution then follows:

```text
CURRENT MAIN + OPEN PRS
→ RESOLVE PVC / PRIMARY OWNER
→ READ PROJECT ROADMAP
→ READ APPLICABLE ADR / ESS
→ SECURITY / COMPLIANCE / REUSE PRE-CHECK
→ FRESH SCOPED BRANCH
→ IMPLEMENTATION
→ AVAILABLE LOW-COST PRE-PR VALIDATION
→ FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ HUMAN/OWNER PR-CREATION APPROVAL FOR MAIN SHA + BRANCH-HEAD SHA
→ PULL REQUEST
→ HOSTED GOVERNANCE / TECHNICAL CHECKS
→ HUMAN/CODEOWNER MERGE DECISION
→ HUMAN MERGE
→ OPTIONAL PRODUCTION-MUTATION CONTROLS
→ EVIDENCE + ROADMAP SYNC
```

Current Git identity terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Candidate-Head/Candidate-Snapshot lifecycle terminology is retired from current work.

## Project Value Chain ownership

The canonical organizational ownership map is:

- `docs/projects/README.md`
- `docs/projects/PROJECT_VALUE_CHAIN.md`

Primary productive ownership remains:

| PVC | Project |
|---|---|
| `PVC-01` | `CAPITAL-AI-CLIENT` |
| `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18` | `CAPITAL-AI-OPS` |
| `PVC-03` | `CAPITAL-AI-DOC` |
| `PVC-05` | `CAPITAL-AI-GOV` |
| `PVC-09`, `PVC-10`, `PVC-11` | `CAPITAL-AI-DATA` |
| `PVC-12`..`PVC-17` | `CAPITAL-AI-FINTECH` |

Cross-cutting Security, Compliance, Quality, Frontend, SEO and Social projects validate, constrain or present work but do not acquire productive PVC ownership merely through that role.

## Governance / ESS current state

| Area | Current state |
|---|---|
| Agent Trust Root | `/AGENTS.md` is the sole repository-wide agent instruction surface |
| DevelopmentChain | `DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` active; Human-readable PVC/Roadmap/ADR/ESS model current |
| Human PR creation | explicit approval bound to current `main SHA` + `branch head SHA`, unless a valid current scoped delegation applies |
| Human merge | Human/CODEOWNER-only; never delegated to the agent |
| ESS-0012 | Documentation Governance; documentation-only scope |
| ESS-0019 | **v1.2.0 ACCEPTED**; provider-neutral capability/risk/audit + Research Evidence Contract |
| GOV-07 Evolution Policy | **DONE_MAIN / MAINTAINED** via PR #790; baseline-not-ceiling semantics in `CTRL-AIMS-PDCA-001` |
| M10 Passkey PR-CI runtime | `RETIRED / OFF`; no current implementation is expected |
| Render native Auto Deploy | OFF; production promotion remains through verified `main` pipeline |
| Platform version | `package.json#version` remains sole platform-version authority |

No productive M10 implementation is expected in current state. Current-state discovery, architecture scans, roadmaps and gap analyses must not treat the absence of productive M10 implementation as a missing implementation or reactivation backlog.

## Deep Research integration

### Completed at Governance boundary

- **DR-01** — provider-neutral Deep Research skill/evidence pipeline merged.
- **DR-02A** — ESS-0019 v1.2.0 Research Evidence Contract merged and accepted.
- **DR-02B** — ADR-0060 Supply-Chain Authority Drift Reconciliation **DONE_MAIN / TERMINAL** through Human-merged PR #743. ADR-0060 v1.1.0 is accepted and registered; the existing M6 supply-chain implementation is reused rather than duplicated.

### Current productive continuation — DR-03

Productive provider-adapter/execution work is **not a Governance backlog item**. Ownership is `CAPITAL-AI-OPS` under its applicable PVC stages and current OPS Roadmap.

Current OPS correlation records DR-03 as queued behind higher-priority OPS gates. When it becomes executable it must reuse the existing provider-neutral control plane, request/orchestration boundaries, ESS-0019 and applicable IAM/security/observability contracts. It must not create a direct provider-SDK bypass, second agent architecture, remote-skill activation path, M10 reconstruction or implicit deployment authority.

Remote-skill distribution remains a separate later architecture/security decision.

## Current project-state notes

- `CAPITAL-AI-GOV`: GOV-CHAT-070 is merged/terminal; broader GOV-07 User-Lifecycle closeout remains `PARTIAL / OWNER RETURNS PENDING`; GOV-08 Admin Panel graph remains foreign-owned CLIENT/FE/OPS implementation scope.
- `CAPITAL-AI-DOC`: D8 read-only Migration Planning is on current main through PR #792; physical/semantic migration execution remains separate.
- `CAPITAL-AI-OPS`: Recovery/RPO/RTO repository harness is implemented on main; operational evidence and independent Security verification remain separate gates.
- `CAPITAL-AI-CLIENT`: contract baseline is complete; physical runtime remains condition-gated; CLIENT-08 Project Skill / Plugin Invocation Contract remains open.

These summaries do not replace the affected project Roadmaps and must be re-correlated when those projects change.

## Protected current invariants

- no direct agent edits to `main`;
- one scoped branch/work item;
- PVC/Primary Owner resolved before implementation;
- project Roadmap is the normal planning/status surface;
- ADR used for material architecture decisions;
- ESS used for component/capability contracts;
- no fabricated evidence, market data, citations or compliance claims;
- Human/Owner-only merge;
- no reusable credentials in model-visible evidence;
- external production mutation remains separately governed;
- machine-readable registries support integrity and traceability but do not replace the Human-readable development chain;
- historical work claims/handoffs/evidence cannot silently regain authority;
- M10 remains retired unless a future explicit Human decision creates a new separately scoped mechanism.

## Current next actions

1. Resolve next work from the affected project's current Roadmap rather than reopening terminal Governance work; DR-02B requires no further Governance implementation.
2. Productive DR-03 continuation remains OPS-owned and proceeds only when the current OPS Roadmap promotes it after higher-priority gates.
