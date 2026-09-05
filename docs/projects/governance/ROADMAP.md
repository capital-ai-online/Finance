# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@465a5f77c7b7fe6530648acd24c7033a40d5327e`  
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

## Current-main reconciliation — 2026-09-05

Repository-visible implementation, merged PR evidence, current project/PVC mapping, current Governance authorities and the consolidated chat backlog were re-correlated against `main@465a5f77c7b7fe6530648acd24c7033a40d5327e`.

The requested earlier baseline `main@e96c8d13d9ef3a7d566fb579e93fc680482d07c3` is contained in current `main`; it is the Human merge of PR #743 for GOV-03. Current `main` subsequently advanced through Human-merged Frontend PR #745 without changing this Governance project surface.

At this correlation point PR #746 is open under `CAPITAL-AI-COMP` and changes only `docs/compliance/CAPITAL-AI-COMP/inventory/COMPLIANCE_REQUIREMENTS_INVENTORY.md`. It is not current-main evidence and has no changed-file overlap with this Governance roadmap recorrelation.

### Confirmed completed or superseded work

- canonical `docs/projects/` / `PVC-*` project ownership architecture is established and maintained;
- Human-readable DevelopmentChain simplification is implemented in current normative surfaces;
- post-PVC routing/handoff policy overlays were withdrawn through Human-merged PR #715;
- Deep Research DR-01 and ESS-0019 v1.2.0 / DR-02A are on current `main`;
- **GOV-03 / DR-02B is terminal:** Human-merged PR #743 made ADR-0060 v1.1.0 `ACCEPTED / ACTIVE`, aligned its stable Authority identity with ADR/Authority registries and removed the obsolete current NIST-SSDF binding while preserving historical evidence as non-authorizing;
- AI Development Chat & Execution Terminology exists in the Vocabulary runtime and tests;
- User-Lifecycle Governance decisions are merged and the OPS lifecycle harness/stable-user-ID repository/provider contract exists on current `main`;
- Compliance PR #735 completed bounded COMP-01 factual applicability work while preserving Legal/Evidence gates;
- Frontend PR #736 restored the bounded email-login/password-recovery flow; PR #745 subsequently hardened browser startup/dependency validation without transferring Governance ownership;
- stale GOV claims tied to Human-merged PR #699 and #715 were terminalized by the Human-merged consolidation work; the consolidation writer itself was terminalized by Human-merged PR #741.

### Confirmed open or externally dependent work

- **COMP-GAP-002 / ADR-0007** remains the highest-priority bounded Governance finding: the ADR file declares `ACCEPTED`, but the current ADR registry does not contain a migrated ADR-0007 record and the decision mixes legacy Compliance value-chain semantics with technical/domain assertions that must be reconciled against current Authority/PVC boundaries;
- **COMP-GAP-003 / ESS-0006** remains a subsequent GOV-relevant finding: ESS-0006 v1.0.0 contains stale Security/Compliance component and collaboration assumptions requiring a separately bounded reconciliation after the ADR-0007 decision is clear;
- User-Lifecycle provider verification remains incomplete: isolated Supabase/Mailpit scenarios, Stripe sandbox/Test Clock evidence and independent Security verification are outside GOV ownership;
- Frontend, Security, Compliance and other foreign-owner lifecycle follow-up remains governed by those project Roadmaps;
- Admin Panel process/dependency graph has no current-main React Flow / `ProcessGraphProjection` implementation evidence and remains foreign CLIENT/FE/OPS implementation work;
- financial technical `VC-*` namespace migration remains an explicit deferred multi-owner decision.

## GOV-01 — Project Value Chain architecture

**State:** `DONE / MAINTAINED`

Canonical project ownership is defined only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Governance owns `PVC-05` and does not absorb foreign productive ownership.

## GOV-02 — Human-readable DevelopmentChain simplification

**State:** `DONE / MAINTAINED`

Current normative model is `Project Value Chain → project Roadmap → ADR → ESS → implementation / tests / evidence`. Normal Git SHA terminology is active, work claims are coordination/audit metadata only, post-PVC overlays are withdrawn, and Human PR-create / Human-only merge / separate production-mutation controls remain intact.

## GOV-03 — ADR-0060 Supply-Chain Authority Drift Reconciliation

**State:** `DONE_MAIN / TERMINAL — HUMAN-MERGED PR #743`

ADR-0060 is now version `1.1.0`, `ACCEPTED / ACTIVE`, with stable Authority ID `AUTH-ADR-SOFTWARE-SUPPLY-CHAIN-PROVENANCE-0060`. `docs/adr/registry.json` and `docs/governance/authority-registry.json` were reconciled with the same lifecycle/identity, the obsolete current NIST-SSDF binding was removed, and the existing M6/SBOM/provenance/attestation implementation remains reused rather than duplicated.

Implementation evidence remains technical evidence only; acceptance derives from the explicit Human/Owner decision and Human merge, not from historical `VERIFIED PASS` evidence alone.

## GOV-04 — Deep Research governance boundary

**State:** `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`

DR-01 provider-neutral Deep Research Evidence Pipeline, DR-02A ESS-0019 v1.2.0 and DR-02B/GOV-03 governance reconciliation are complete on current `main`. Productive provider-adapter/runtime work remains `CAPITAL-AI-OPS` owned under its own Roadmap/PVC scope. Remote-skill distribution remains a separate architecture/security decision.

## GOV-05 — Financial technical namespace decision

**State:** `OWNER DECISION REQUIRED / DEFERRED`

Current technical financial `VC-*` identifiers under `SC-MD-SPT-0001` remain active. Any migration requires affected owners and a separate architecture decision.

## GOV-06 — Security and compliance governance findings

**State:** `ACTIVE / CONTINUOUS`

Current GOV-relevant queue:

1. **COMP-GAP-002 / ADR-0007 lifecycle + semantic reconciliation** — next bounded Governance architecture task after this roadmap recorrelation reaches a terminal state;
2. **COMP-GAP-003 / ESS-0006 stale-assumption reconciliation** — subsequent bounded ESS task after ADR-0007 establishes the correct decision/authority boundary;
3. preserve Legal/Evidence gates and independent Security verification boundaries for foreign User-Lifecycle returns.

No Security self-verification, unsupported compliance/legal conclusion, second Compliance/Security runtime plane or repository requirement derived solely from advisory external standards is allowed.

## GOV-07 — User-Lifecycle governance closeout

**State:** `PARTIAL / OWNER RETURNS PENDING`

GOV decisions for annual Pro pricing and logout semantics are merged. OPS lifecycle harness and stable-user-ID subscription projection evidence are on current `main`. Remaining completion conditions are foreign-owner returns from OPS/provider, Security, Frontend, and Compliance/Human-Legal. PR #736 is relevant Frontend auth evidence and PR #745 hardens Frontend startup validation; neither by itself closes the broader lifecycle/pricing/entitlement UX package.

## GOV-08 — Admin Panel process/dependency graph

**State:** `REFERRED / NOT IMPLEMENTED ON CURRENT MAIN`

Target remains complete process/value-chain visualization in the Admin Panel using existing traceability evidence and the previously selected React Flow-style UI plus `ProcessGraphProjection`. Productive implementation belongs to applicable CLIENT/Frontend/OPS owners.

## GOV-09 — Version authority / Version Manager boundary

**State:** `BOUNDARY RESOLVED / FOREIGN EXECUTION REMAINS`

ADR-0096 establishes `package.json#version` as sole platform-version authority; ESS-0004 is suspended; VersionManager is read-only compatibility; productive Version Management remains `CAPITAL-AI-OPS / PVC-06`.

## GOV-10 — Vocabulary / AI development terminology

**State:** `DONE / MAINTAINED`

The requested `AI Development Chat & Execution Terminology` category exists in the canonical Vocabulary implementation and tests.

## GOV-11 — Historical project/workflow records and stale coordination metadata

**State:** `DONE_MAIN / MAINTENANCE`

Historical claims remain available as non-authorizing audit/coordination history. The previously stale consolidation writer `CAPITAL-AI-GOV-CHAT-TASK-CONSOLIDATION-V3-2026-09-05` is `released / archived / activeWriter:false / exclusive:false` after Human-merged PR #741. No historical branch or work claim is a current merge source.

## Current priority

1. **GOV-ROADMAP-RECORRELATE** — make this Roadmap, the canonical Task Register and the Component/Architecture Matrix agree with current `main`, terminal GOV-03/DR-02B and remove stale current-priority/writer wording. Exit gate: exact scoped branch state validated, current-main/open-PR correlation refreshed, explicit Human PR-create approval, hosted checks after PR creation and Human/CODEOWNER merge.
2. **COMP-GAP-002 / ADR-0007** — only after the roadmap-recorrelation work reaches a terminal state, start a fresh then-current-main Governance branch and decide `clarify / migrate / supersede / archive` from current Authority, ADR registry, PVC, Compliance and runtime facts. Exit gate: one unambiguous ADR-0007 lifecycle/semantic treatment with no foreign implementation or parallel authority architecture.

## Definition of Done for current Governance cycle

- `PVC-05` ownership remains explicit;
- one readable Governance Roadmap, one consolidated Task Register and one current Component/Architecture Matrix agree with current-main evidence;
- GOV-03/DR-02B is terminal and cannot be reopened by stale pre-#743 wording;
- the next bounded Governance finding is explicit without pre-deciding ADR-0007 before its fresh correlation;
- completed chat tasks are not reopened due to historical wording;
- foreign work remains with its Primary Owner/project Roadmap;
- withdrawn post-PVC routing and NIST-derived Governance bindings are not silently restored;
- no parallel Governance/control-plane/runtime/version architecture is introduced;
- Human PR-create and Human-only merge boundaries remain intact.
