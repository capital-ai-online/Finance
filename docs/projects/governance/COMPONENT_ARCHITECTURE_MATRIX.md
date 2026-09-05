# CAPITAL-AI-GOV — Component and Architecture Matrix

**Role:** current project assessment — non-authorizing  
**Baseline:** `main@465a5f77c7b7fe6530648acd24c7033a40d5327e`  
**Correlation date:** `2026-09-05`

| Component / contract | Canonical anchor | GOV relationship | Current architecture assessment | Action |
|---|---|---|---|---|
| Agent Trust Root | `/AGENTS.md` | consume / maintain within authority | single repository-wide trust root; Control Plane v2.7.0 | KEEP SINGLE |
| Governance Control Plane | ADR-0096 + `docs/governance/**` + `src/platform/Governance` | cross-cutting owner | current controlling Governance architecture; no second plane required | KEEP / NO PARALLEL PLANE |
| Control Catalog | `docs/governance/control-catalog.json` | owner / validator input | stable `CTRL-*` identities remain canonical | VERSION EXISTING CONTROLS ONLY |
| Authority Registry | `docs/governance/authority-registry.json` | owner / resolution | stable `AUTH-*` identities; ADR-0060 stable authority now reconciled on current main | KEEP SINGLE |
| ADR Registry | `docs/adr/registry.json` | governance registry | ADR-0060 is reconciled; ADR-0007 is the material legacy lifecycle/migration ambiguity now requiring bounded GOV correlation | RECONCILE ADR-0007 NEXT |
| ESS Registry | `.ai/registry/ess-registry.json` | consume / correlate | canonical ESS identity registry; ESS-0006 remains current but its v1.0.0 assumptions require later bounded reconciliation | RECONCILE ESS-0006 AFTER ADR-0007 |
| Project execution model | `docs/projects/**` | project architecture owner | canonical project surfaces are present on current main; organizational/non-authorizing only | MAINTAIN |
| Project Value Chain | `docs/projects/PROJECT_VALUE_CHAIN.md` | organizational owner mapping | `PVC-01..PVC-18` cleanly separates project ownership from technical financial `VC-*` identifiers | MAINTAIN / NO SILENT RENUMBERING |
| Human-readable development chain | `/AGENTS.md` + affected project Roadmap | governance lifecycle | current working order is PVC → Roadmap → ADR → ESS → code/tests/evidence; old post-PVC overlays are withdrawn | MAINTAIN |
| Platform Director | `PVC-05` + Platform Director ESS/component | primary project owner | Governance decision orchestration remains distinct from Human merge/deploy and foreign productive ownership | KEEP BOUNDARY |
| GOV-03 / ADR-0060 | `docs/adr/ADR-0060-software-supply-chain-provenance-and-attestation.md` | GOV architecture authority | version 1.1.0 is `ACCEPTED / ACTIVE`; stable Authority and ADR/Authority registries aligned by Human-merged PR #743; obsolete current NIST-SSDF binding removed | DONE_MAIN / TERMINAL |
| Deep Research GOV boundary | ESS-0019 v1.2.0 + GOV-03/DR-02B | GOV evidence/authority boundary | DR-01, DR-02A and GOV-side DR-02B are complete; productive provider/runtime continuation is OPS-owned | CLOSE GOV BOUNDARY / HANDOFF OPS RUNTIME |
| ADR-0007 Compliance Value Chain | `docs/adr/ADR-0007-compliance-value-chain.md` | GOV lifecycle/architecture decision owner | file declares `ACCEPTED`, but current ADR registry lacks a migrated ADR-0007 entry; content mixes legacy Compliance, Data, FinTech, logging/export and legal-claim semantics across multiple owners | P1 CORRELATE / DECIDE CLARIFY-MIGRATE-SUPERSEDE-ARCHIVE |
| ESS-0006 Security & Compliance | `.ai/skills/ESS-0006-Security-Compliance.md` | GOV / ESS owner boundary | v1.0.0 still describes combined Security/Compliance component assumptions and a ComplianceRequirementRegistry-style model that may conflict with current owner/assessment boundaries | P2 CORRELATE AFTER ADR-0007 |
| Compliance assessment | `docs/projects/compliance/**` + `docs/compliance/CAPITAL-AI-COMP/**` | foreign independent assessor; GOV consumes findings | COMP-GAP-002 routes ADR-0007 semantic/lifecycle remediation to GOV; COMP-GAP-003 flags ESS-0006; open PR #746 is foreign and not current-main evidence | READ-ONLY INPUT / RETURN EVIDENCE TO COMP AFTER GOV DECISION |
| Security verification | `docs/projects/security/**` + Security runtime/evidence | foreign independent verifier | Security verification remains independent; GOV must not self-verify Security findings | KEEP INDEPENDENT |
| User Lifecycle governance | GOV decisions + foreign OPS/FE/SEC/COMP returns | GOV orchestration only | governance decisions merged; provider/Security/UX/Legal evidence remains partially foreign/pending | WAIT FOR OWNER RETURNS / RECORRELATE ONLY |
| Frontend architecture | `docs/frontend/FRONTEND_ARCH.md` + current FE roadmap | foreign cross-cutting owner | PR #745 hardens browser startup/dependency validation; no GOV ownership transfer | READ-ONLY CORRELATION |
| Financial technical chain | `SC-MD-SPT-0001` | governance correlation only | current technical `VC-*` remains active; any migration is deferred multi-owner architecture work | DEFERRED OWNER DECISION |
| Quality projection | `src/platform/Quality/**` / ESS-0005 | cross-cutting dependency | canonical project surface exists; no Primary PVC ownership | MAINTAIN BOUNDARY |
| Documentary | `src/platform/Documentary/**` / ESS-0010/0012 + `docs/projects/documentary/` | foreign primary/project dependency | canonical Documentary project navigation now exists; no GOV relocation required | READ-ONLY / HANDOFF WHEN NEEDED |
| EventMesh / Traceability | existing EventMesh/Traceability authorities | foreign OPS execution | transport/traceability only; must not become approval authority | KEEP OPS BOUNDARY |
| PR template / PR transport | `.github/pull_request_template.md` + Trust Root PR-create gate | GOV | compact canonical template and exact-snapshot Human PR-create gate are active | MAINTAIN |
| Work claims | `.ai/work-claims/**` | coordination metadata | historical GOV consolidation claim is released/archived; claims do not replace PVC/Roadmap/ADR/ESS planning | MAINTAIN HYGIENE / NO INVENTED CLAIM |
| Admin Panel process graph | Admin Panel consumers / future `ProcessGraphProjection` | GOV semantic boundary only | no current-main React Flow / `ProcessGraphProjection` implementation evidence; productive implementation remains CLIENT/FE/OPS-owned | FOREIGN OPEN |

## Current priority assessment

1. **GOV-ROADMAP-RECORRELATE** — synchronize this matrix, `ROADMAP.md` and `TASK_REGISTER.md` with current main and terminal GOV-03/DR-02B.
2. **COMP-GAP-002 / ADR-0007** — on a separate fresh then-current-main Governance branch, correlate lifecycle and semantics against Authority, ADR registry, PVC ownership, Compliance findings and actual runtime before deciding `clarify / migrate / supersede / archive`.
3. **COMP-GAP-003 / ESS-0006** — only after ADR-0007 establishes the correct boundary, reconcile stale ESS assumptions without creating a parallel Security/Compliance architecture or Requirement Registry.

## Overall assessment

The Governance architecture itself does not need another control plane or runtime restructuring. The immediate gap is **semantic/lifecycle consistency of legacy Governance artifacts**, led by ADR-0007 and then ESS-0006. Project/PVC surfaces, Trust Root, Human-readable development navigation, ADR-0060 supply-chain authority and stale-writer hygiene are already established on current main. Foreign productive work remains with its Primary Owner.
