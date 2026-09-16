# CAPITAL-AI Enterprise DevelopmentChain — Current-State Index

**Authority ID:** `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Version:** `2.9.0`  
**Status date:** `2026-09-16`  
**Current repository baseline for this synchronization:** `main@2c4aca31e097a72ed979037eb6ecb66fec1d8619`  
**Open PR correlation at this synchronization:** no open Pull Requests; relevant non-PR active writer `agent/operations-work-management-postmerge-20260916` is separately OPS-owned and updates only the OPS GitHub work-management Roadmap projection  
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

Current repository execution follows the Human-merged 2026-09-15 Governance lifecycle:

```text
CURRENT MAIN + OPEN PRS
→ RESOLVE PVC / PRIMARY OWNER
→ READ PROJECT ROADMAP
→ READ APPLICABLE ADR / ESS
→ SECURITY / COMPLIANCE / REUSE PRE-CHECK
→ FRESH SCOPED BRANCH
→ IMPLEMENTATION
→ AVAILABLE LOW-COST PRE-PR VALIDATION
→ FINAL MAIN RE-SYNC + OPEN-PR / SEMANTIC / AUTHORITY CORRELATION
→ FINAL CREATE-CORRELATION PASS OR BLOCKED
→ AUTOMATED DRAFT PULL REQUEST FOR PASS
→ POST-PR HUMAN/OWNER REVIEW BOUNDARY
→ HOSTED GOVERNANCE / TECHNICAL CHECKS
→ FINAL PR-HEAD / CURRENT-MAIN CORRELATION
→ HUMAN/CODEOWNER MERGE DECISION
→ HUMAN MERGE OR OTHER TERMINAL PR OUTCOME
→ ORDERED SUCCESSOR STARTS FROM THEN-CURRENT MAIN
→ OPTIONAL PRODUCTION-MUTATION CONTROLS
→ EVIDENCE + ROADMAP SYNC
```

Current Git identity terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Candidate-Head/Candidate-Snapshot lifecycle terminology is retired from current work.

Human-merged PR #952 activated the correlation-gated Draft-PR creation path. The pre-create v3.4 Approval Envelope remains historical bootstrap evidence for PR #952 itself and is not a current credential for successor PR creation.

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
| Agent Trust Root | `/AGENTS.md` v2.11.0 is the sole repository-wide agent instruction surface and is active on current main through Human-merged PR #952 |
| DevelopmentChain | `DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` v3.0.0 preserves the Human-readable PVC/Roadmap/ADR/ESS model and is active on current main |
| Pull Request creation | bounded agent-managed Draft PR creation requires final fail-closed create-correlation `PASS`; no separate pre-create Owner prompt |
| Ordered Roadmap PR lane | at most one not-yet-integrated automated PR; successor starts from resulting current main only after predecessor terminal outcome |
| Human merge | Human/CODEOWNER-only; never delegated to the agent; auto-merge prohibited |
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

- `CAPITAL-AI-GOV`: `GOV-CHAT-077` is `DONE_MAIN / TERMINAL` through Human-merged PR #952; `GOV-PR900-04` freshness/version validators are `DONE_MAIN / TERMINAL` through Human-merged PR #953. Broader GOV-07 User-Lifecycle closeout remains dependency-held.
- `CAPITAL-AI-DOC`: Documentary/PVC-03 remains separately owned; documentary preservation work does not authorize Governance runtime or PR lifecycle changes.
- `CAPITAL-AI-OPS`: productive provider/runtime, GitHub capability management and version/release work remain OPS-owned. `OPS-PR900-03` and `OPS-PR900-04` are the existing owner-correct GitHub capability and MCP/OAuth convergence Roadmap surfaces; Governance orchestration does not transfer deployment or production-mutation authority.
- `CAPITAL-AI-CLIENT`: provider-neutral agent capability contracts remain subordinate to `/AGENTS.md`; this change does not create a second client execution authority.

These summaries do not replace the affected project Roadmaps and must be re-correlated when those projects change.

## Protected current invariants

- no direct agent edits to `main`;
- one scoped branch/work item;
- PVC/Primary Owner resolved before implementation;
- project Roadmap is the normal planning/status surface;
- ADR used for material architecture decisions where applicable;
- ESS used for component/capability contracts;
- no fabricated evidence, market data, citations or compliance claims;
- create-correlation and validation state remain fail-closed; `NOT RUN` is never `PASS`;
- automated Roadmap successors do not assume unmerged predecessor payload;
- Human/CODEOWNER-only merge and no auto-merge;
- no reusable credentials in model-visible evidence;
- external production mutation remains separately governed;
- machine-readable registries support integrity and traceability but do not replace the Human-readable development chain;
- historical work claims/handoffs/evidence cannot silently regain authority;
- M10 remains retired unless a future explicit Human decision creates a new separately scoped mechanism.

## Current next actions

1. Complete `GOV-PR900-02` current-state projection synchronization for the Human-merged PR #952 lifecycle activation and preserve PR #953 freshness/version validation as terminal current-main evidence.
2. Re-correlate the existing OPS GitHub capability/MCP queue only after the current projection-sync predecessor reaches a terminal outcome; preserve the existing OPS/SEC ownership and provider-mutation boundaries.
