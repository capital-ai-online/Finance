# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@56f196fc034c5514463546ee975ffb83fd50f44a`  
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

Current `main@56f196fc034c5514463546ee975ffb83fd50f44a` includes the Human-merged Governance and material foreign-owner return sequence relevant to current Governance work:

- PR #761 completed the current Compliance COMP-04 `READY_NOW` assessment slice while leaving evidence-/owner-held and Legal-/scope-held requirements explicit;
- PR #763 completed Frontend BB-2D View Router work; this is architecture progress but does not establish the broader User-Lifecycle pricing/entitlement UX return required by GOV-07;
- PR #766 completed `SEC-ASSESS-ALIGN`, removing stale Security assessment authority/methodology references; it does not by itself close `SEC-VERIFY-ULS-001` or provider/E2E residuals;
- PR #767 Human-merged the Owner-confirmed GOV-05 no-migration decision and corresponding Governance project closeout;
- PR #768 Human-merged the Compliance roadmap closeout and established the `COMP-GAP-008` split between Documentary/PVC-03 lifecycle treatment and Governance/PVC-05 shared-registry treatment;
- PR #769 Human-merged the post-GOV-05 Owner/Evidence re-correlation;
- PR #771 Human-merged OPS-only Security-backlog correlation under `docs/projects/operations/**`;
- PR #772 Human-merged `GOV-CHAT-068`, extending the existing `CTRL-SDLC-CHAT-HANDOFF-001` with copyable `CHAT_RUN_HANDOFF` and preserving `POST_PR_HANDOFF`; `/AGENTS.md` remains Control Plane v2.8.0;
- PR #773 was closed without merge after a concurrent-main race and remains historical/non-authorizing;
- PR #774 Human-merged the OPS-owned IONOS/Render `www` CNAME desired-state work; its DNS/runbook/test scope is disjoint from Governance project projections;
- PR #775 Human-merged the bounded `COMP-GAP-008` Governance decision. The merged decision is `NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT`; `docs/governance/document-registry.json` remained unchanged.

There are no open Pull Requests against `main` at this correlation point. No current active writer was identified for the three Governance project projections. Historical/released claims remain non-authorizing evidence only.

### Completed / terminal

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- `GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via Human-merged PR #743.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive continuation remains OPS-owned.
- `GOV-05` financial technical `VC-*` namespace decision — `DONE_MAIN / TERMINAL` via Human-merged PR #767. Organizational `PVC-*` and technical `VC-*` under `SC-MD-SPT-0001` remain separate; no technical migration was authorized or implemented.
- `GOV-06 / COMP-GAP-002 — ADR-0007` — `DONE_MAIN / TERMINAL` via Human-merged PR #755.
- `GOV-06 / COMP-GAP-003 — ESS-0006` — `DONE_MAIN / TERMINAL` via Human-merged PR #757.
- `GOV-06 / ADR-0007 visible semantic closeout` — `DONE_MAIN / TERMINAL` via Human-merged PR #758.
- `POST-GOV-05 OWNER / EVIDENCE RECORRELATION` — `DONE_MAIN / TERMINAL` via Human-merged PR #769.
- `COPYABLE CHAT HANDOFF / OWNER RESPONSES` — `DONE_MAIN / MAINTAINED` via Human-merged PR #772.
- `COMP-GAP-008 — GOVERNANCE DOCUMENT REGISTRY TREATMENT DECISION` — `DONE_MAIN / TERMINAL` via Human-merged PR #775. Governance/PVC-05 requires no Document Registry mutation under the current contract; Documentary/PVC-03 lifecycle treatment and independent Compliance reassessment remain separate owner surfaces.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

### Current Governance work package

#### POST-COMP-GAP-008 OWNER / DEPENDENCY RECORRELATION

**State:** `IMPLEMENTED_BRANCH / PR-CREATION GATE PENDING`  
**Branch:** `agent/governance-post-comp-gap-008-recorrelate-20260906`

This bounded work package synchronizes the Governance project projections after Human Merge of PR #775 and determines whether a new immediately executable PVC-05 implementation slice exists.

Current correlation result:

1. `COMP-GAP-008` Governance/PVC-05 is terminal on current main through PR #775.
2. `docs/projects/documentary/ROADMAP.md` remains `ACTIVE / CONTINUOUS` for WP-DOC-02 but contains no concrete current-main `COMP-GAP-008` lifecycle return that Governance can consume as new evidence.
3. Governance does not execute Documentary/PVC-03 lifecycle work, Compliance reassessment, Security verification, Frontend UX work or OPS provider/runtime work.
4. GOV-07 remains dependency-held because current known OPS/FE/SEC/COMP/Legal evidence has not changed since the last correlated returns.
5. GOV-08 remains foreign-owned CLIENT/FE/OPS implementation scope.
6. No new ADR, ESS, `AUTH-*`, `CTRL-*`, registry mutation, runtime implementation or cross-project policy overlay is required for this post-merge synchronization.

**Exit Gate:** Roadmap, Task Register and Component Architecture Matrix agree that PR #775 terminalized the Governance portion of `COMP-GAP-008`; no false Documentary return or GOV-07 closure is inferred; current main/open-PR correlation remains clean; exact branch state receives Human/Owner PR-creation approval; hosted checks and Human/CODEOWNER merge remain separate gates.

### Other states

- `GOV-07` User-Lifecycle governance closeout — `PARTIAL / OWNER RETURNS PENDING`.
- `GOV-08` Admin Panel process/dependency graph — `REFERRED / FOREIGN OPEN`.
- `COMP-GAP-008` — `GOVERNANCE/PVC-05 DONE_MAIN / DOCUMENTARY PVC-03 RETURN SEPARATE`.

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
| `CAPITAL-AI-OPS` | PR #771 re-correlates the OPS Security backlog; PR #774 updates OPS DNS desired-state/runbook/test; User-Lifecycle/provider evidence remains separate | `FOREIGN_PARTIAL`; no GOV-07 closure inferred |
| `CAPITAL-AI-FE` | PR #736 auth recovery, PR #745 startup hardening and PR #763 BB-2D View Router are merged | Architecture/auth progress exists; broader lifecycle/pricing/entitlement UX required for GOV-07 is not established |
| `CAPITAL-AI-SEC` | PR #766 merged `SEC-ASSESS-ALIGN` | Assessment-authority drift is closed; independent ULS re-verification and provider/E2E residuals remain separate |
| `CAPITAL-AI-COMP` / Human-Legal | PR #761 merged COMP-04 and PR #768 merged Compliance roadmap closeout | Bounded assessment/closeout evidence is current; external Owner/Legal/Evidence gates remain explicit |
| `CAPITAL-AI-DOC` | WP-DOC-02 lifecycle/Documentation Governance remains `ACTIVE / CONTINUOUS`; no concrete COMP-GAP-008 lifecycle return is present in the current Documentary Roadmap | PVC-03 remains owner of lifecycle treatment; Governance waits for owner evidence rather than implementing it |

## Current priority

1. Complete this post-PR-#775 Governance projection synchronization through exact-head correlation, Human/Owner PR-creation approval, PR creation, applicable hosted checks and Human/CODEOWNER merge.
2. After merge, re-evaluate GOV-07 only when new OPS/FE/SEC/COMP/Legal evidence exists; otherwise no additional productive GOV-owned implementation slice is currently justified. GOV-08 remains foreign-owned.

## Definition of Done for current Governance cycle

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- end-of-chat next steps and exact Owner responses remain directly copyable under the merged existing control;
- GOV-05 remains terminal as a no-migration decision and technical `SC-MD-SPT-0001` identities remain unchanged;
- ADR-0007 remains historical/non-authorizing;
- ESS-0006 remains a bounded component specification;
- `COMP-GAP-008` Governance/PVC-05 is terminal via PR #775 with no forced Document Registry mutation;
- Security requirements/testing/verification remain with CAPITAL-AI-SEC;
- Compliance applicability/requirements/assessment remain with CAPITAL-AI-COMP;
- Documentary lifecycle treatment remains with CAPITAL-AI-DOC/PVC-03;
- no second Requirement Registry, Document Registry, Security/Compliance runtime, IAM/Audit/Risk/EventMesh authority or orchestration plane is introduced;
- missing/stale evidence cannot silently become PASS;
- Human PR-create and Human-only merge boundaries remain intact.
