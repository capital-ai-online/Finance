# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@79f58f05c925583594f7d6f7d8888a4a85549e94`  
**Correlation date:** `2026-09-05`  
**Trust root:** `/AGENTS.md`  
**Role:** Human-readable project roadmap / non-authorizing execution projection  
**Status:** ACTIVE

## How to use this roadmap

```text
PVC-05 / Platform Director
→ this Roadmap
→ applicable ADR
→ applicable ESS
→ code / tests / evidence
```

Machine-readable `AUTH-*`, `CTRL-*`, registries and work claims support integrity and audit. Historical handoff/routing overlays are non-authorizing and do not replace the Project Value Chain plus project Roadmap model. Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`.

## Current-main / chat consolidation — 2026-09-05

Repository-visible implementation, merged PR evidence, current project roadmaps and the consolidated project-conversation backlog were re-correlated against `main@79f58f05c925583594f7d6f7d8888a4a85549e94` after Human merge of Compliance PR #735.

### Confirmed completed or superseded work

- canonical `docs/projects/` / `PVC-*` project ownership architecture is established and maintained;
- Human-readable DevelopmentChain simplification is implemented in current normative surfaces;
- post-PVC routing/handoff policy overlays were withdrawn through Human-merged PR #715;
- Deep Research DR-01 and ESS-0019 v1.2.0 / DR-02A are on current `main`;
- AI Development Chat & Execution Terminology exists in the Vocabulary runtime and tests;
- User-Lifecycle Governance decisions are merged and the OPS lifecycle harness/stable-user-ID repository/provider contract exists on current `main`;
- Compliance PR #735 completed bounded COMP-01 factual applicability work while preserving Legal/Evidence gates; it does not close GOV-owned ADR/ESS lifecycle findings;
- stale GOV claims tied to Human-merged PR #699 and #715 are terminalized in the current consolidation branch because their release conditions were already satisfied.

### Confirmed open or externally dependent work

- ADR-0060 remains `PROPOSED` while M6 implementation evidence is already `VERIFIED PASS`; lifecycle/registry/authority remain inconsistent and ADR-0060 still contains withdrawn NIST-binding wording;
- Compliance `COMP-GAP-002` (ADR-0007 lifecycle ambiguity) and `COMP-GAP-003` (ESS-0006 stale assumptions) remain GOV-relevant open dependencies; PR #735 did not mutate those owning authority surfaces;
- User-Lifecycle provider verification remains incomplete: isolated Supabase/Mailpit scenarios, Stripe sandbox/Test Clock evidence and independent Security verification are outside GOV ownership;
- Frontend, Security, Compliance and other foreign-owner lifecycle follow-up remains governed by those project Roadmaps;
- Admin Panel process/dependency graph has no current-main React Flow / `ProcessGraphProjection` implementation evidence and remains foreign CLIENT/FE/OPS implementation work;
- financial technical `VC-*` namespace migration remains an explicit deferred multi-owner decision.

## GOV-01 — Project Value Chain architecture

**State:** `DONE / MAINTAINED`

Canonical project ownership is defined only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Governance owns `PVC-05` and does not absorb foreign productive ownership.

## GOV-02 — Human-readable DevelopmentChain simplification

**State:** `DONE / MAINTAINED`

Current normative model:

```text
Project Value Chain
→ project Roadmap
→ ADR
→ ESS
→ implementation / tests / evidence
```

Current-main confirmation: normal Git SHA terminology is active, work claims are coordination/audit metadata only, post-PVC overlays are withdrawn, and Human PR-create / Human-only merge / separate production-mutation controls remain intact.

## GOV-03 — ADR-0060 Supply-Chain Authority Drift Reconciliation

**State:** `NEXT ACTIVE GOV WORK — REQUIRES FRESH BRANCH AFTER THIS CONSOLIDATION REACHES A TERMINAL STATE`

Goal: reconcile the already implemented/verified software supply-chain provenance architecture with its canonical ADR/registry authority state.

Observed drift:

- `docs/adr/ADR-0060-software-supply-chain-provenance-and-attestation.md` is still `PROPOSED`;
- M6 repository implementation evidence reports `VERIFIED PASS`;
- ADR-0060 still states a NIST SSDF mapping although current Governance withdrew NIST-derived repository bindings unless explicitly re-adopted;
- lifecycle, authority-registry and ADR-registry state must be resolved together instead of treating implementation evidence as architecture acceptance.

Expected scope:

1. `docs/adr/ADR-0060-software-supply-chain-provenance-and-attestation.md`;
2. `docs/adr/registry.json`;
3. `docs/governance/authority-registry.json`;
4. bounded impact/evidence references required by current Governance contracts.

Constraints: reuse existing M6/SBOM/provenance/attestation implementation; no second Supply-Chain/Governance/Release/registry architecture; remote-skill loading is not authorized; external standards are advisory unless explicitly adopted; Human merge remains separate.

Exit gate: ADR-0060 lifecycle, stable authority identity and registries agree; withdrawn NIST-derived authority wording is removed or explicitly bounded as historical/advisory; implementation references resolve without implying acceptance from implementation alone; required validation is green on the exact PR head.

## GOV-04 — Deep Research governance boundary

**State:** `DR-01 + DR-02A DONE; DR-02B = GOV-03 OPEN`

DR-01 provider-neutral Deep Research Evidence Pipeline and DR-02A ESS-0019 v1.2.0 are complete. Productive provider-adapter/runtime work remains OPS-owned after GOV-03. Remote-skill distribution remains a separate architecture/security decision.

## GOV-05 — Financial technical namespace decision

**State:** `OWNER DECISION REQUIRED / DEFERRED`

Current technical financial `VC-*` identifiers under `SC-MD-SPT-0001` remain active. Any migration requires affected owners and a separate architecture decision.

## GOV-06 — Security and compliance governance findings

**State:** `CONTINUOUS`

Current GOV-relevant findings include:

- `COMP-GAP-002`: ADR-0007 lifecycle/semantic ambiguity remains an explicit GOV decision dependency;
- `COMP-GAP-003`: ESS-0006 contains stale assumptions and requires separately scoped GOV/ESS-owner work;
- PR #735 completed COMP-01 factual packages but intentionally preserved `LEGAL_REVIEW`, `UNKNOWN`, `NOT_ASSESSED` and `EVIDENCE_MISSING` gates;
- User-Lifecycle Security verification remains foreign and may not be self-certified by GOV or OPS.

Rules: no Security self-verification by implementing owner; no unsupported compliance/legal claim; fail closed on conflicting authority or missing evidence; route technical remediation through owning Roadmaps.

## GOV-07 — User-Lifecycle governance closeout

**State:** `PARTIAL / OWNER RETURNS PENDING`

GOV decisions for annual Pro pricing and logout semantics are merged. OPS lifecycle harness and stable-user-ID subscription projection evidence are on current `main`. Remaining completion conditions are foreign-owner returns from OPS/provider, Security, Frontend, and Compliance/Human-Legal. GOV closes orchestration only after required current-main evidence exists.

## GOV-08 — Admin Panel process/dependency graph

**State:** `REFERRED / NOT IMPLEMENTED ON CURRENT MAIN`

Target remains a complete process/value-chain visualization in the Admin Panel, with dependency/status projection from existing traceability evidence and the previously selected direction React Flow-style UI plus `ProcessGraphProjection`. Productive implementation belongs to applicable CLIENT/Frontend/OPS owners.

## GOV-09 — Version authority / Version Manager boundary

**State:** `BOUNDARY RESOLVED / FOREIGN EXECUTION REMAINS`

ADR-0096 establishes `package.json#version` as sole platform-version authority; ESS-0004 is suspended; VersionManager is read-only compatibility; productive Version Management remains `CAPITAL-AI-OPS / PVC-06`. Remaining version-impact/drift work must reuse current validators/control plane.

## GOV-10 — Vocabulary / AI development terminology

**State:** `DONE / MAINTAINED`

The requested `AI Development Chat & Execution Terminology` category exists in the canonical Vocabulary implementation and tests.

## GOV-11 — Historical project/workflow records and stale coordination metadata

**State:** `MAINTENANCE / CURRENT CONSOLIDATION BRANCH`

Historical PVC consolidation, user-lifecycle orchestration, old work claims, post-PVC packages and prior branch-correlation records remain audit history and non-authorizing unless current Authority says otherwise.

The current branch terminalizes:

- `CAPITAL-AI-GOV-ADR0104-CROSS-PROJECT-SCOPE-2026-09-01` — PR #699 merged;
- `CAPITAL-AI-GOV-DELETE-POST-PVC-POLICY-CONTRACTS-2026-09-02` — PR #715 merged.

Historical evidence is preserved; only current coordination-state metadata is corrected.

## Current priority

1. **GOV-11 / chat-task consolidation** — validate this refreshed Roadmap/task-register/stale-claim package, obtain exact Human PR-create approval, run Hosted checks after PR creation, then Human/CODEOWNER merge.
2. **GOV-03** — after Human merge and a fresh then-current-main correlation, execute ADR-0060 lifecycle/registry/authority reconciliation and remove obsolete NIST binding on a fresh branch.

## Definition of Done for current Governance cycle

- `PVC-05` ownership remains explicit;
- one readable Governance Roadmap and one consolidated task register represent current GOV planning/traceability;
- completed chat tasks are not reopened due to historical wording;
- foreign work remains with its Primary Owner/project Roadmap;
- current Git terminology uses main/branch/PR/merge SHA language;
- withdrawn post-PVC routing and NIST-derived Governance bindings are not silently restored;
- no parallel Governance/control-plane/runtime/version architecture is introduced;
- Human PR-create and Human-only merge boundaries remain intact.
