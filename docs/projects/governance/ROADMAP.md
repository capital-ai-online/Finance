# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@1b9def6d414ee8838e5403bfc9f705bbbe438d2a`  
**Correlation date:** `2026-09-06`  
**Trust root:** `/AGENTS.md`  
**Role:** Human-readable project roadmap / non-authorizing execution projection  
**Status:** ACTIVE

## Navigation

```text
PVC-05 / Platform Director
→ this Roadmap
→ applicable ADR
→ applicable ESS
→ code / tests / evidence
```

`AUTH-*`, `CTRL-*`, registries and work claims support integrity/audit only and do not replace this Human-readable sequence.

## Current-main reconciliation — 2026-09-06

Current `main@1b9def6d414ee8838e5403bfc9f705bbbe438d2a` includes the Human-merged Governance and material foreign-owner return sequence relevant to the current Governance decision:

- PR #762 completed the post-ESS-0006 Governance project correlation;
- PR #761 completed the current Compliance COMP-04 `READY_NOW` assessment slice while leaving evidence-/owner-held and Legal-/scope-held requirements explicit;
- PR #763 completed Frontend BB-2D View Router work; this is architecture progress but does not establish the broader User-Lifecycle pricing/entitlement UX return required by GOV-07;
- PR #766 completed `SEC-ASSESS-ALIGN`, removing stale Security assessment authority/methodology references; it does not by itself close `SEC-VERIFY-ULS-001` or provider/E2E residuals;
- PR #767 Human-merged the Owner-confirmed GOV-05 no-migration decision and the corresponding Governance project closeout;
- PR #768 Human-merged the Compliance roadmap closeout and confirms the current `COMP-GAP-008` split: Documentary/PVC-03 owns Documentary lifecycle treatment; Governance/PVC-05 decides any required shared Governance Document Registry treatment. Compliance remains assessor and does not own shared-registry mutation;
- PR #769 Human-merged the post-GOV-05 owner/evidence re-correlation and therefore completes `GOV-CHAT-066` on current main;
- PR #771 Human-merged an OPS-owned Security-backlog re-correlation affecting only `docs/projects/operations/**`. It introduces no changed-file, semantic, namespace, authority or Primary-Owner conflict for the bounded `COMP-GAP-008` PVC-05 decision.

There are no open Pull Requests against `main` at this correlation point. No current active writer was found for the three Governance project projections or `docs/governance/document-registry.json`; historical/released/stale coordination metadata remains non-authorizing evidence only.

### Completed / terminal

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- `GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via Human-merged PR #743.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive continuation remains OPS-owned.
- `GOV-05` financial technical `VC-*` namespace decision — `DONE_MAIN / TERMINAL` via Human-merged PR #767. Organizational `PVC-*` and technical `VC-*` under `SC-MD-SPT-0001` remain separate; no technical migration was authorized or implemented.
- `GOV-06 / COMP-GAP-002 — ADR-0007` — `DONE_MAIN / TERMINAL` via Human-merged PR #755.
- `GOV-06 / COMP-GAP-003 — ESS-0006` — `DONE_MAIN / TERMINAL` via Human-merged PR #757.
- `GOV-06 / ADR-0007 visible semantic closeout` — `DONE_MAIN / TERMINAL` via Human-merged PR #758.
- `POST-GOV-05 OWNER / EVIDENCE RECORRELATION` — `DONE_MAIN` via Human-merged PR #769.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

### Current Governance work package

#### COMP-GAP-008 — GOVERNANCE DOCUMENT REGISTRY TREATMENT DECISION

**State:** `IMPLEMENTED_BRANCH / PR + HUMAN MERGE PENDING`  
**Branch:** `agent/governance-comp-gap-008-decision-v2-20260906`

This bounded work package evaluates only the `CAPITAL-AI-GOV / PVC-05` portion of `COMP-GAP-008` after PR #769 reached main and has been freshly re-correlated after Human-merged PR #771. It does not execute the separate `CAPITAL-AI-DOC / PVC-03` lifecycle return and does not edit Compliance-owned source documents.

**Governance decision: `NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT`.**

The eight Compliance candidates identified by `REGISTRY_IMPACT_REPORT.md` remain valid stable non-normative `DOC-*` identities in canonical `docs/compliance/**` placement:

- `DOC-COMP-PROJECT-README-2026-08-31` — projection/project index;
- `DOC-COMP-ROADMAP-2026-08-31` — roadmap;
- `DOC-COMP-REQUIREMENTS-INVENTORY-2026-08-31` — inventory;
- `DOC-COMP-APPLICABILITY-MATRIX-2026-08-31` — assessment inventory;
- `DOC-COMP-VC-COVERAGE-2026-08-31` — assessment mapping/projection;
- `DOC-COMP-HANDOFF-REGISTER-2026-08-31` — traceability surface;
- `DOC-COMP-GAP-REPORT-2026-08-31` — assessment report;
- `DOC-COMP-VALIDATION-2026-08-31` — validation evidence.

Current Authority/contract evidence does **not** require exhaustive registration of every document that exposes a `DOC-*` identity:

1. ADR-0096 defines `docs/governance/document-registry.json` as the canonical document identity/role/projection metadata registry, but it does not state that every `DOC-*` file must be registered.
2. `DOCUMENT_LIFECYCLE_POLICY.md` requires stable metadata for new/materially migrated governance/decision documents and registry updates for path moves; it does not impose exhaustive registration on every non-authorizing Compliance artifact.
3. `controlPlaneRegistryRules.mjs` validates uniqueness and role/authority relations for entries that are present and has explicit mandatory-registration checks only for defined special cases such as the Frontend document family; it contains no generic `DOC-*` completeness rule.
4. Current `document-registry.json` already demonstrates selective Compliance registration rather than exhaustive Compliance project registration.
5. Adding the eight candidates would therefore create registry churn without closing a current Governance invariant, while their existing source metadata already preserves stable identity, non-normative role and canonical placement.

Accordingly this work package makes **no mutation** to `docs/governance/document-registry.json`, creates no parallel registry, and introduces no new `AUTH-*`, `CTRL-*`, ADR or ESS identity. A future registration requirement must come from an explicit contract/validator change or a concrete identity/path/role integrity need; it is not inferred from `DOC-*` existence alone.

**Exit Gate:** the Governance decision is recorded consistently in the Governance Roadmap, Task Register and Component Architecture Matrix; current `document-registry.json` remains unchanged; no Compliance/Documentary source or runtime is mutated; exact-head applicable checks and Human/CODEOWNER merge remain required. After merge, the Governance/PVC-05 portion of `COMP-GAP-008` is complete; the overall Compliance finding may remain partial until the separate Documentary/PVC-03 lifecycle return is assessed by its owner and then independently reassessed by Compliance.

### Other states

- `GOV-07` User-Lifecycle governance closeout — `PARTIAL / OWNER RETURNS PENDING`.
- `GOV-08` Admin Panel process/dependency graph — `REFERRED / FOREIGN OPEN`.
- `COMP-GAP-008` — `GOVERNANCE DECISION IMPLEMENTED_BRANCH / DOCUMENTARY RETURN SEPARATE`; the PVC-05 decision is no registry mutation under the current contract, while PVC-03 lifecycle treatment remains foreign-owned.

## GOV-05 Owner decision and main closeout — 2026-09-06

**Decision correlation baseline:** `main@eaa5fe228ff0d61d8116932665406c75b0bbf8e7`  
**Decision source:** Owner response `bestätige gov 05`.  
**Closeout evidence:** Human-merged PR #767.  
**State:** `DONE_MAIN / TERMINAL — NO MIGRATION`

The Owner confirmed retaining the existing namespace separation: `PVC-*` denotes organizational project ownership; technical `VC-*` under `SC-MD-SPT-0001` retains its existing meaning. Technical renumbering is not performed within GOV-05. Equal numeric suffixes do not establish equivalent stages.

GOV-05 is decision complete and documentation-complete on current main. This is not a claim that a migration was implemented. A future migration requires a new justified, owner-coordinated request.

## Material foreign-owner return state

| Owner | Current-main return | Governance interpretation |
|---|---|---|
| `CAPITAL-AI-OPS` | PR #771 re-correlates the OPS Security backlog; User-Lifecycle/provider evidence and independent Security verification remain separate from this Governance decision | `FOREIGN_PARTIAL`; no GOV-07 or COMP-GAP-008 closure inferred |
| `CAPITAL-AI-FE` | PR #736 auth recovery, PR #745 startup hardening and PR #763 BB-2D View Router are merged | Architecture/auth progress exists; broader lifecycle/pricing/entitlement UX required for GOV-07 is not established |
| `CAPITAL-AI-SEC` | PR #766 merged `SEC-ASSESS-ALIGN` | Assessment-authority drift is closed; independent ULS re-verification and provider/E2E residuals remain separate |
| `CAPITAL-AI-COMP` / Human-Legal | PR #761 merged COMP-04 and PR #768 merged Compliance roadmap closeout | Bounded assessment/closeout evidence is current; external Owner/Legal/Evidence gates remain explicit; COMP-GAP-008 Governance and Documentary surfaces remain separately owned |
| `CAPITAL-AI-DOC` | Documentary project surface and continuous WP-DOC-02 lifecycle/governance work remain current | PVC-03 may return lifecycle evidence, but cannot acquire shared Governance registry-write authority |

## Current priority

1. Complete the bounded `COMP-GAP-008` Governance decision through applicable exact-head validation and Human/CODEOWNER merge, with `document-registry.json` unchanged.
2. After merge and a fresh current-main/open-PR re-correlation, consume any Documentary/PVC-03 return or other higher-priority Governance dependency evidence; do not execute Documentary work from Governance.

GOV-07 remains dependency-held and GOV-08 remains foreign-owned.

## Definition of Done for current Governance cycle

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- GOV-05 is terminal as a no-migration decision and technical `SC-MD-SPT-0001` identities remain unchanged;
- ADR-0007 remains historical/non-authorizing;
- ESS-0006 remains a bounded component specification;
- Security requirements/testing/verification remain with CAPITAL-AI-SEC;
- Compliance applicability/requirements/assessment remain with CAPITAL-AI-COMP;
- Documentary lifecycle treatment remains with CAPITAL-AI-DOC/PVC-03 while shared Governance Document Registry policy/treatment remains with CAPITAL-AI-GOV/PVC-05;
- `DOC-*` existence alone is not treated as an exhaustive-registration mandate absent a current contract or validator rule;
- no second Requirement Registry, Document Registry, Security/Compliance runtime, IAM/Audit/Risk/EventMesh authority or orchestration plane is introduced;
- missing/stale evidence cannot silently become PASS;
- Human PR-create and Human-only merge boundaries remain intact.
