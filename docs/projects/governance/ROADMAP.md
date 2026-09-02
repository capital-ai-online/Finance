# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@5db8062d3062e93f004cf0b75f190a9c649821f8`  
**Trust root:** `/AGENTS.md`  
**Role:** Human-readable project roadmap / non-authorizing execution projection  
**Status:** ACTIVE

## How to use this roadmap

Governance work is read in this order:

```text
PVC-05 / Platform Director
→ this Roadmap
→ applicable ADR
→ applicable ESS
→ code / tests / evidence
```

Machine-readable `AUTH-*`, `CTRL-*`, registries, work claims and historical handoff records support integrity and audit. They do not replace this Roadmap as the normal Human-readable work surface.

Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Candidate-Head/Candidate-Snapshot lifecycle wording is retired from current work.

## GOV-01 — Project Value Chain architecture

**State:** `DONE / MAINTAINED`

Canonical project ownership is defined only through:

- `docs/projects/README.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`.

Governance owns `PVC-05`. It does not absorb OPS, DATA, FINTECH, Documentary, Security, Compliance, Quality, Frontend, SEO or Social productive ownership.

Exit invariant:

- one Primary Owner per productive PVC stage;
- project folders are organizational navigation, not new runtime architecture;
- no silent replacement of technical financial `VC-*` identifiers.

## GOV-02 — Human-readable DevelopmentChain simplification

**State:** `IN_PROGRESS`

Objective:

Return repository development to the Owner-preferred model:

```text
Value Chain
→ Roadmap
→ ADR
→ ESS
→ implementation / tests / evidence
```

Scope:

- retire current `Candidate Head`, `candidate snapshot`, `candidate SHA` and `accepted candidate` lifecycle wording;
- use normal Git/GitHub identities instead;
- keep stable registries for CI/integrity without making them the day-to-day planning surface;
- treat work claims/handoffs as coordination/audit metadata only;
- keep Human PR-create and Human-only merge boundaries unchanged;
- preserve security, compliance and production-mutation controls;
- remove active dependence on withdrawn post-PVC routing/device-cutover policy overlays.

Primary artifacts:

- `/AGENTS.md`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`;
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`;
- `docs/governance/control-catalog.json`;
- `docs/governance/authority-registry.json`;
- `docs/adr/registry.json`;
- `docs/adr/ADR-0104-timeboxed-human-owner-execution-session.md`;
- `.ai/skills/ESS-0019-Universal-AI-Agent-Control-Plane.md`;
- `.ai/registry/ess-registry.json`;
- `docs/architecture/ROADMAP.md`;
- affected current project Roadmaps / active evidence projections.

Exit gate:

- current normative Governance surfaces contain no Candidate-Head lifecycle terminology;
- accepted ADR/ESS files are labelled accepted, not candidate;
- registries correlate with the same versions/statuses;
- current project Roadmaps use PVC/Roadmap/ADR/ESS navigation;
- no runtime, billing, provider, database or production mutation is introduced;
- required checks pass on the final PR head;
- Human/CODEOWNER performs merge.

## GOV-03 — DR-02B: ADR-0060 Supply-Chain Authority Drift Reconciliation

**State:** `NEXT — BLOCKED UNTIL GOV-02 HUMAN MERGE + CURRENT-MAIN RECORRELATION`

Goal:

Reconcile the already implemented/verified software supply-chain provenance architecture with its canonical ADR/registry authority state.

Fresh branch required after GOV-02 reaches a terminal state.

Expected scope:

1. `docs/adr/ADR-0060-software-supply-chain-provenance-and-attestation.md`;
2. `docs/adr/registry.json`;
3. `docs/governance/authority-registry.json`;
4. bounded impact evidence.

Constraints:

- reuse the existing M6/SBOM/provenance/attestation implementation;
- do not create a second Supply-Chain, Governance, Release or registry architecture;
- remote-skill loading is not authorized by ADR-0060 reconciliation;
- Human merge remains separate.

Exit gate:

- ADR-0060 lifecycle, stable authority identity and both registries agree;
- existing implementation references resolve to an effective accepted authority;
- required validation is green on the PR head.

## GOV-04 — Deep Research governance boundary

**State:** `DR-01 + DR-02A DONE; DR-02B NEXT`

Completed:

- DR-01 provider-neutral Deep Research Evidence Pipeline;
- DR-02A ESS-0019 v1.2.0 Research Evidence Contract.

After GOV-03/DR-02B reaches a terminal state, productive provider-adapter work moves to `CAPITAL-AI-OPS` under its own Roadmap/PVC ownership. Governance does not implement that runtime locally.

Remote-skill distribution remains a separate later architecture/security decision.

## GOV-05 — Financial technical namespace decision

**State:** `OWNER DECISION REQUIRED / DEFERRED`

Current technical financial `VC-*` identifiers under `SC-MD-SPT-0001` remain active. Any coordinated migration to another technical namespace requires the affected owners and a separate architecture decision. `PVC-*` remains the organizational project ownership namespace.

Governance does not perform foreign DATA/FINTECH/OPS/DOC implementation as part of this Roadmap item.

## GOV-06 — Security and compliance governance findings

**State:** `CONTINUOUS`

Governance owns authority/control-plane remediation that maps to `PVC-05`. Security and Compliance retain their independent verification/assessment roles.

Rules:

- no Security self-verification by the implementing owner;
- no unsupported compliance/legal claim;
- fail closed on conflicting authority or missing evidence;
- route technical remediation to the owning project's Roadmap rather than creating a second handoff-policy architecture.

## GOV-07 — Historical project/workflow records

**State:** `HISTORICAL / AUDIT ONLY`

Detailed PVC consolidation, user-lifecycle orchestration, old work-claim cleanup, post-PVC handoff/cutover packages and prior branch-correlation records remain available in repository history/evidence where needed.

They are not the current planning surface and cannot override this Roadmap, the Project Value Chain, accepted ADR/ESS or `/AGENTS.md`.

## Current priority

1. **GOV-02** — complete Human-readable DevelopmentChain simplification and make it PR-ready.
2. After Human Merge and fresh current-main correlation: **GOV-03 / DR-02B** — ADR-0060 Supply-Chain Authority Drift Reconciliation.

## Definition of Done for current Governance cycle

- `PVC-05` ownership remains explicit;
- one readable Governance Roadmap represents current work;
- ADRs contain architecture decisions;
- ESS contains component/capability contracts;
- current Git terminology uses main/branch/PR/merge SHA language;
- no parallel Governance/control-plane/runtime architecture is introduced;
- no foreign productive implementation is claimed;
- Human PR-create and Human-only merge boundaries remain intact.
