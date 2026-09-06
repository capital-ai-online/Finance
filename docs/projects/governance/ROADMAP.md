# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@e61cb294e368135861c95911b8edfeee8b0de471`  
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

Current `main@e61cb294e368135861c95911b8edfeee8b0de471` includes the Human-merged Governance and material foreign-owner return sequence relevant to the next Governance decision:

- PR #762 completed the post-ESS-0006 Governance project correlation;
- PR #761 completed the current Compliance COMP-04 `READY_NOW` assessment slice while leaving evidence-/owner-held and Legal-/scope-held requirements explicit;
- PR #763 completed Frontend BB-2D View Router work; this is architecture progress but does not establish the broader User-Lifecycle pricing/entitlement UX return required by GOV-07;
- PR #766 completed `SEC-ASSESS-ALIGN`, removing stale Security assessment authority/methodology references; it does not by itself close `SEC-VERIFY-ULS-001` or provider/E2E residuals;
- PR #767 Human-merged the Owner-confirmed GOV-05 no-migration decision and the corresponding Governance project closeout;
- PR #768 Human-merged the Compliance roadmap closeout and confirms the current `COMP-GAP-008` split: Documentary/PVC-03 owns Documentary lifecycle treatment; Governance/PVC-05 decides and applies any required shared Governance Document Registry treatment. Compliance remains assessor and does not own shared-registry mutation.

There are no open Pull Requests against `main` at this correlation point. No active Governance writer claim covers the three local project projection files. Closed/unmerged historical PRs and released claims remain non-authorizing evidence only.

### Completed / terminal

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- `GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via Human-merged PR #743.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive continuation remains OPS-owned.
- `GOV-05` financial technical `VC-*` namespace decision — `DONE_MAIN / TERMINAL` via Human-merged PR #767. Organizational `PVC-*` and technical `VC-*` under `SC-MD-SPT-0001` remain separate; no technical migration was authorized or implemented.
- `GOV-06 / COMP-GAP-002 — ADR-0007` — `DONE_MAIN / TERMINAL` via Human-merged PR #755.
- `GOV-06 / COMP-GAP-003 — ESS-0006` — `DONE_MAIN / TERMINAL` via Human-merged PR #757.
- `GOV-06 / ADR-0007 visible semantic closeout` — `DONE_MAIN / TERMINAL` via Human-merged PR #758.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

### Current Governance work package

#### POST-GOV-05 OWNER / EVIDENCE RECORRELATION

**State:** `IMPLEMENTED_BRANCH / PR + HUMAN MERGE PENDING`  
**Branch:** `agent/governance-post-gov05-recorrelate-v2-20260906`

This bounded work package refreshes the three Governance project projections after PR #767 and PR #768 and ingests the material current owner returns from PR #761, #763 and #766 as read-only evidence. It does not claim that foreign-owner evidence gaps are closed merely because adjacent implementation or assessment work merged.

The correlation establishes:

- GOV-05 is terminal on `main`; its previous `DOCUMENTATION_MERGE_PENDING` state is obsolete;
- GOV-07 remains dependent because independent Security User-Lifecycle re-verification/provider-E2E residuals, broader Frontend lifecycle/pricing/entitlement UX, Compliance evidence/Legal scope and OPS/provider evidence are not all closed;
- GOV-08 remains referred to CLIENT/FE/OPS and cannot be implemented by Governance;
- `COMP-GAP-008` is the next bounded Governance-owned correlation candidate after this project-state refresh. PR #768 now explicitly confirms that Governance/PVC-05 owns the shared Governance-registry decision while Documentary/PVC-03 owns Documentary lifecycle treatment. ADR-0096 makes `docs/governance/document-registry.json` a canonical Governance registry, while ESS-0012 Documentary Governance remains documentation-only/read-only and cannot autonomously mutate a Registry.

**Exit Gate:** Roadmap, Task Register and Component Architecture Matrix consistently reflect current `main@e61cb294e368135861c95911b8edfeee8b0de471`; GOV-05 is terminal; PR #761/#763/#766/#768 are represented without false GOV-07 closure or foreign-ownership absorption; no new Authority/Control/ADR/ESS is introduced; exact-head applicable checks and Human/CODEOWNER merge remain required.

### Other states

- `GOV-07` User-Lifecycle governance closeout — `PARTIAL / OWNER RETURNS PENDING`.
- `GOV-08` Admin Panel process/dependency graph — `REFERRED / FOREIGN OPEN`.
- `COMP-GAP-008` Compliance document-registry treatment — `OPEN / GOVERNANCE CORRELATION CANDIDATE`; PR #768 confirms GOV/PVC-05 as owner of shared Governance-registry treatment and DOC/PVC-03 as owner of Documentary lifecycle treatment.

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
| `CAPITAL-AI-OPS` | User-Lifecycle harness/stable-ID evidence exists with provider evidence still partial; DR-03 remains behind higher-priority OPS gates | `FOREIGN_PARTIAL`; no GOV closure inferred |
| `CAPITAL-AI-FE` | PR #736 auth recovery, PR #745 startup hardening and PR #763 BB-2D View Router are merged | Architecture/auth progress exists; broader lifecycle/pricing/entitlement UX required for GOV-07 is not established |
| `CAPITAL-AI-SEC` | PR #766 merged `SEC-ASSESS-ALIGN` | Assessment-authority drift is closed; independent ULS re-verification and provider/E2E residuals remain separate |
| `CAPITAL-AI-COMP` / Human-Legal | PR #761 merged COMP-04 and PR #768 merged Compliance roadmap closeout | Bounded assessment/closeout evidence is current; external Owner/Legal/Evidence gates remain explicit; COMP-GAP-008 is routed to DOC/PVC-03 and GOV/PVC-05 without Compliance-owned registry mutation |

## Current priority

1. Complete the `POST-GOV-05 OWNER / EVIDENCE RECORRELATION` through applicable exact-head validation and Human/CODEOWNER merge.
2. After merge and a fresh current-main/open-PR re-correlation, evaluate `COMP-GAP-008` as the next bounded Governance slice: decide whether the canonical Governance Document Registry requires entries for the existing non-normative Compliance `DOC-*` artifacts, without creating a second registry, mutating foreign project documents, or transferring Documentary read-only validation into Governance-registry write authority.

GOV-07 remains dependency-held and GOV-08 remains foreign-owned.

## Definition of Done for current Governance cycle

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- GOV-05 is terminal as a no-migration decision and technical `SC-MD-SPT-0001` identities remain unchanged;
- ADR-0007 remains historical/non-authorizing;
- ESS-0006 remains a bounded component specification;
- Security requirements/testing/verification remain with CAPITAL-AI-SEC;
- Compliance applicability/requirements/assessment remain with CAPITAL-AI-COMP;
- Documentary lifecycle treatment remains with CAPITAL-AI-DOC/PVC-03 while shared Governance Document Registry treatment remains with CAPITAL-AI-GOV/PVC-05;
- no second Requirement Registry, Security/Compliance runtime, IAM/Audit/Risk/EventMesh authority or orchestration plane is introduced;
- missing/stale evidence cannot silently become PASS;
- Human PR-create and Human-only merge boundaries remain intact.
