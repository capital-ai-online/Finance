# CAPITAL-AI-GOV — Component and Architecture Matrix

**Role:** current project assessment — non-authorizing  
**Baseline:** `main@56f196fc034c5514463546ee975ffb83fd50f44a`  
**Correlation date:** `2026-09-06`

| Component / contract | Canonical anchor | GOV relationship | Current architecture assessment | Action |
|---|---|---|---|---|
| Agent Trust Root | `/AGENTS.md` | consume / maintain within authority | single repository-wide trust root; execution semantics resolve only from current main | KEEP SINGLE |
| Governance Control Plane | ADR-0096 + `docs/governance/**` + `src/platform/Governance` | cross-cutting owner | current controlling Governance architecture | KEEP / NO PARALLEL PLANE |
| Control Catalog | `docs/governance/control-catalog.json` | owner / validator input | current merged controls remain authoritative within scope | KEEP SINGLE |
| Authority Registry | `docs/governance/authority-registry.json` | owner / resolution | current merged authority/version projection | KEEP SINGLE |
| ADR Registry | `docs/adr/registry.json` | governance registry | no new ADR required by post-#775 synchronization | NO CHANGE |
| ESS Registry | `.ai/registry/ess-registry.json` | owner / correlate | no component/capability contract change required | NO CHANGE |
| Document Registry | `docs/governance/document-registry.json` + ADR-0096 | canonical Governance registry | PR #775 Human-merged decision: canonical but non-exhaustive under current contract; no COMP-GAP-008 insertion required | `DONE_MAIN / NO REGISTRY CHANGE` |
| Document Lifecycle Policy | `docs/governance/control-plane/DOCUMENT_LIFECYCLE_POLICY.md` | governance lifecycle authority | current contract unchanged; no blanket registration requirement | KEEP CURRENT CONTRACT |
| Documentation Governance | ESS-0012 + `src/platform/Documentary/Governance` | foreign Documentary validation input | documentation-only/read-only; cannot modify Registry or documentation | PRESERVE READ-ONLY BOUNDARY |
| Documentary Engine | `CAPITAL-AI-DOC / PVC-03` + ESS-0010 | foreign project owner / evidence input | WP-DOC-02 remains active/continuous; current Documentary Roadmap contains no concrete COMP-GAP-008 lifecycle return | WAIT FOR OWNER RETURN / DO NOT ABSORB |
| Compliance V2.1 DOC candidates | `docs/compliance/CAPITAL-AI-COMP/**` | foreign assessment input | Governance treatment terminal via PR #775; independent Compliance reassessment remains foreign-owned | NO SOURCE MUTATION |
| Project Value Chain | `docs/projects/PROJECT_VALUE_CHAIN.md` | organizational owner mapping | `PVC-01..PVC-18` remains distinct from technical financial `VC-*` | MAINTAIN |
| Platform Director | `PVC-05` | primary GOV owner | Governance coordination/decision boundary only; no Documentary, Security, Compliance, Frontend or OPS productive takeover | KEEP BOUNDARY |
| Security project | `docs/projects/security/**` + `src/platform/Security/**` | foreign independent verifier | no new independent ULS verification return identified after prior correlation | DEPENDENCY / PRESERVE INDEPENDENCE |
| Compliance project | `docs/projects/compliance/**` + `docs/compliance/CAPITAL-AI-COMP/**` | foreign independent assessor | no new Owner/Legal closure return identified after prior correlation | DEPENDENCY / NO GOV LEGAL INFERENCE |
| Operations project | `docs/projects/operations/**` | foreign owner | PR #771 and PR #774 merged; no new User-Lifecycle/provider closeout return identified | FOREIGN_PARTIAL |
| Frontend project | `docs/projects/frontend/**` | foreign owner | prior auth/view-router returns merged; broader lifecycle/pricing/entitlement UX return still not established | FOREIGN_OPEN |
| User Lifecycle | GOV decisions + OPS/FE/SEC/COMP returns | GOV orchestration only | GOV-07 remains dependency-held; no new closeout evidence supports terminalization | WAIT FOR NEW RETURNS |
| Admin Panel process/dependency graph | GOV-08 + CLIENT/FE/OPS ownership | referral only | productive implementation remains foreign-owned | REFERRED / FOREIGN OPEN |
| PR #775 Governance return | Human-merged PR #775 | same-owner current-main evidence | terminalizes `GOV-CHAT-067` / Governance portion of COMP-GAP-008 | DONE_MAIN |
| PR template / transport | `.github/pull_request_template.md` + Trust Root gate | GOV | exact-snapshot Human PR-create approval and Human-only merge remain mandatory | MAINTAIN |

## Current work package — 2026-09-06

### POST-COMP-GAP-008 OWNER / DEPENDENCY RECORRELATION

**Branch:** `agent/governance-post-comp-gap-008-recorrelate-20260906`  
**State:** `IMPLEMENTED_BRANCH / PR-CREATION GATE PENDING`

Architecture conclusion:

1. Human-merged PR #775 terminalizes the Governance/PVC-05 portion of COMP-GAP-008 as `NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT`.
2. No current-main Documentary/PVC-03 COMP-GAP-008 lifecycle return exists in `docs/projects/documentary/ROADMAP.md`; Governance must not fabricate or implement that foreign return.
3. GOV-07 still lacks new OPS/FE/SEC/COMP/Legal evidence required for a legitimate Governance closeout.
4. GOV-08 remains a foreign CLIENT/FE/OPS productive implementation surface.
5. Therefore the only immediately justified GOV-owned action is synchronization of the Governance project projections and explicit preservation of dependency/ownership gates.
6. No new ADR, ESS, `AUTH-*`, `CTRL-*`, Document Registry mutation, runtime code, plugin or policy overlay is justified.

**Exit gate:** Roadmap, Task Register and this Matrix agree on PR #775 terminalization and the remaining dependency boundaries; branch remains current-main synchronized and overlap-free; exact-head Human PR-create approval is obtained; hosted checks and Human/CODEOWNER merge remain separate gates.

## Current priority assessment

1. Complete this post-#775 Governance projection synchronization through the normal exact-snapshot PR lifecycle.
2. After merge, only reopen GOV-07 when new owner/verifier/Legal evidence exists; otherwise no further productive GOV-owned implementation is currently justified. GOV-08 remains foreign-owned.

## Overall assessment

Governance remains convergent around one Control Plane and one canonical Document Registry. COMP-GAP-008 is resolved at the Governance boundary without registry churn. The remaining roadmap work is dependency-driven rather than an invitation for Governance to absorb Documentary, Security, Compliance, Frontend or Operations execution.
