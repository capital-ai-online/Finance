# CAPITAL-AI Enterprise DevelopmentChain — Current-State Index

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Version:** `2.8.1`  
**Status date:** `2026-09-03`  
**Current repository baseline for this synchronization:** `main@adba446e8c17676d1064f9a687970c23cb9aa279`  
**Open PR correlation at this synchronization:** PR #725 (Security) and PR #726 (SEO); no changed-file overlap with this Governance repair  
**Platform version authority:** `package.json#version`  
**Repository Agent Trust Root:** `/AGENTS.md`  
**Execution policy:** `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`

## Canonical role

This file is the **repository-wide current-state index**. It is intentionally concise. Project-specific work belongs in the affected `docs/projects/<project>/ROADMAP.md`; architecture decisions belong in ADRs; component/capability contracts belong in ESS; implementation truth is established by code, tests and evidence.

Historical implementation detail remains in ADR, ESS, runbooks and `docs/evidence/**`. Exact repository SHAs are observations, not an independent platform-version authority.

`docs/architecture/DEVELOPMENT_CHAIN_ROADMAP.md` and older integrated DevelopmentChain/Systemadmin roadmap snapshots are **historical/non-authorizing** where they conflict with this current state.

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
| DevelopmentChain | `DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` active; Human-readable PVC/Roadmap/ADR/ESS model restored |
| Human PR creation | explicit approval bound to current `main SHA` + `branch head SHA`, unless a valid current scoped delegation applies |
| Human merge | Human/CODEOWNER-only; never delegated to the agent |
| ESS-0012 | Documentation Governance; documentation-only scope |
| ESS-0019 | **v1.2.0 ACCEPTED**; provider-neutral capability/risk/audit + Research Evidence Contract |
| M10 Passkey PR-CI runtime | M10 PR-CI passkey runtime is `RETIRED / OFF`; no current implementation is expected |
| Render native Auto Deploy | OFF; production promotion remains through verified `main` pipeline |
| Platform version | `package.json#version` remains sole platform-version authority |

No productive M10 implementation is expected in current state. Current-state discovery, architecture scans, roadmaps and gap analyses must not treat the absence of productive M10 implementation as a missing implementation or reactivation backlog.

## Deep Research integration

### Completed

- **DR-01** — provider-neutral Deep Research skill/evidence pipeline merged.
- **DR-02A** — ESS-0019 v1.2.0 Research Evidence Contract merged and accepted.

### Next Governance item — DR-02B

**Owner:** `CAPITAL-AI-GOV / PVC-05`  
**Roadmap intent:** reconcile ADR-0060 Supply-Chain Authority Drift before productive provider-adapter work.

DR-02B must use a fresh branch from then-current `main` and reconcile:

1. `docs/adr/ADR-0060-software-supply-chain-provenance-and-attestation.md`;
2. `docs/adr/registry.json`;
3. `docs/governance/authority-registry.json`;
4. bounded impact evidence.

Exit gate:

- ADR lifecycle and registry identity agree;
- existing M6 supply-chain implementation is not duplicated or rewritten unnecessarily;
- no new parallel Governance/Release/Supply-Chain architecture is created;
- required validation is bound to the resulting branch/PR head;
- Human/CODEOWNER merge remains separate.

### After DR-02B — DR-03

Productive provider-adapter work belongs to `CAPITAL-AI-OPS` and must start only after DR-02B reaches a terminal Governance state and current `main` is re-correlated.

DR-03 must reuse the existing provider-neutral control plane, request/orchestration boundaries, ESS-0019 and applicable security/observability contracts. It must not create a direct provider-SDK bypass or second agent architecture.

Remote-skill distribution remains a separate later architecture/security item.

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

1. Complete this Governance simplification: remove remaining current Candidate-Head terminology and correlate Trust Root / policies / registries / ADR / ESS / Roadmaps.
2. After Human Merge and fresh current-main correlation, execute **DR-02B — ADR-0060 Supply-Chain Authority Drift Reconciliation**.
