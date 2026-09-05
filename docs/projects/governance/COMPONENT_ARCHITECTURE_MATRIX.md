# CAPITAL-AI-GOV — Component and Architecture Matrix

**Role:** current project assessment — non-authorizing  
**Baseline:** `main@d69e75b6853f3b56ca313fe3c3256e56bc21c220`  
**Correlation date:** `2026-09-05`

| Component / contract | Canonical anchor | GOV relationship | Current architecture assessment | Action |
|---|---|---|---|---|
| Agent Trust Root | `/AGENTS.md` | consume / maintain within authority | single repository-wide trust root; Control Plane v2.7.0 | KEEP SINGLE |
| Governance Control Plane | ADR-0096 + `docs/governance/**` + `src/platform/Governance` | cross-cutting owner | current controlling Governance architecture | KEEP / NO PARALLEL PLANE |
| Control Catalog | `docs/governance/control-catalog.json` | owner / validator input | stable `CTRL-*` identities canonical | VERSION EXISTING CONTROLS ONLY |
| Authority Registry | `docs/governance/authority-registry.json` | owner / resolution | stable `AUTH-*` identities; ADR-0060 authority reconciled | KEEP SINGLE |
| ADR Registry | `docs/adr/registry.json` | governance registry | ADR-0060 reconciled; ADR-0007 remains the material legacy lifecycle/migration ambiguity | RECONCILE ADR-0007 NEXT |
| ESS Registry | `.ai/registry/ess-registry.json` | consume / correlate | canonical ESS identity registry; ESS-0006 v1.0.0 assumptions remain later reconciliation target | RECONCILE AFTER ADR-0007 |
| Project surfaces | `docs/projects/**` | project architecture owner | canonical project surfaces present; organizational/non-authorizing | MAINTAIN |
| Project Value Chain | `docs/projects/PROJECT_VALUE_CHAIN.md` | organizational owner mapping | `PVC-01..PVC-18` remains distinct from technical financial `VC-*` | MAINTAIN |
| Human-readable development chain | `/AGENTS.md` + affected Roadmap | governance lifecycle | PVC → Roadmap → ADR → ESS → code/tests/evidence | MAINTAIN |
| Platform Director | `PVC-05` + Platform Director ESS/component | primary GOV owner | orchestration remains separate from Human merge/deploy and foreign productive ownership | KEEP BOUNDARY |
| GOV-03 / ADR-0060 | `docs/adr/ADR-0060-software-supply-chain-provenance-and-attestation.md` | GOV architecture authority | v1.1.0 `ACCEPTED / ACTIVE`; stable Authority + registries aligned by Human-merged PR #743; obsolete current NIST-SSDF binding removed | DONE_MAIN / TERMINAL |
| Deep Research GOV boundary | ESS-0019 v1.2.0 + GOV-03/DR-02B | GOV evidence/authority boundary | DR-01, DR-02A and GOV-side DR-02B complete. Human-merged OPS PR #747 materializes DR-03 in OPS planning, still behind the higher-priority OPS security/data-integrity gate; no GOV runtime ownership transfer | CLOSE GOV BOUNDARY / READ OPS DR-03 AS FOREIGN INPUT |
| ADR-0007 Compliance Value Chain | `docs/adr/ADR-0007-compliance-value-chain.md` | GOV lifecycle/architecture owner | file declares `ACCEPTED`, current ADR registry lacks migrated ADR-0007 record; content spans Compliance/Data/FinTech/audit/export/legal semantics across current owners | P1 CORRELATE / DECIDE CLARIFY-MIGRATE-SUPERSEDE-ARCHIVE |
| ESS-0006 Security & Compliance | `.ai/skills/ESS-0006-Security-Compliance.md` | GOV / ESS owner boundary | v1.0.0 combined Security/Compliance assumptions may conflict with current independent assessment/verification and owner boundaries | P2 AFTER ADR-0007 |
| Compliance assessment | `docs/projects/compliance/**` + `docs/compliance/CAPITAL-AI-COMP/**` | foreign independent assessor; GOV consumes findings | COMP-GAP-002 routes ADR-0007 to GOV; COMP-GAP-003 flags ESS-0006; Human-merged PR #746 updates requirements inventory but does not decide GOV lifecycle semantics | READ-ONLY INPUT / RETURN GOV EVIDENCE TO COMP |
| Operations roadmap | `docs/projects/operations/ROADMAP.md` + `WORK_PACKAGES.md` | foreign Primary Owner input | PR #747 re-correlates OPS planning and materializes DR-03 without changing PVC-05 or GOV authority; higher-priority OPS security/data-integrity gate remains controlling for OPS execution order | READ-ONLY CORRELATION / NO GOV ABSORPTION |
| Security verification | `docs/projects/security/ROADMAP.md` + detailed Security roadmap | foreign independent verifier | Human-merged PR #749 confirms User-Lifecycle Security integration evidence on main while `SEC-VERIFY-ULS-001` subscription-identity re-verification and provider/E2E residuals remain open; GOV cannot self-verify or close them | KEEP INDEPENDENT / READ RETURN EVIDENCE |
| User Lifecycle | GOV decisions + OPS/FE/SEC/COMP returns | GOV orchestration only | decisions merged; provider/UX/Legal evidence remains partial and Security return is `IMPLEMENTED_MAIN / RESIDUAL_VERIFICATION_OPEN`, not blanket closure | WAIT FOR REMAINING OWNER RETURNS |
| Frontend architecture | `docs/frontend/FRONTEND_ARCH.md` + FE roadmap | foreign cross-cutting owner | PR #745 startup/dependency hardening merged; no GOV ownership transfer | READ-ONLY CORRELATION |
| Financial technical chain | `SC-MD-SPT-0001` | governance correlation only | current technical `VC-*` remains active | DEFERRED OWNER DECISION |
| Quality projection | `src/platform/Quality/**` / ESS-0005 | cross-cutting dependency | canonical project surface exists; no Primary PVC ownership | MAINTAIN BOUNDARY |
| Documentary | `src/platform/Documentary/**` / ESS-0010/0012 + documentary project | foreign dependency | canonical project navigation exists | READ-ONLY / HANDOFF WHEN NEEDED |
| EventMesh / Traceability | existing authorities | foreign OPS execution | transport/traceability only; no approval authority | KEEP OPS BOUNDARY |
| PR template / transport | `.github/pull_request_template.md` + Trust Root gate | GOV | canonical template + exact-snapshot Human PR-create gate active; stale exact-SHA approval invalidates PR creation and requires re-correlation/reapproval | MAINTAIN / FAIL CLOSED ON SHA DRIFT |
| Work claims | `.ai/work-claims/**` | coordination metadata | historical consolidation writer released/archived; claims do not replace PVC/Roadmap/ADR/ESS | MAINTAIN HYGIENE |
| Admin Panel process graph | Admin Panel consumers / future `ProcessGraphProjection` | GOV semantic boundary only | no current-main implementation evidence | FOREIGN OPEN |

## Current priority assessment

1. **GOV-ROADMAP-RECORRELATE** — synchronize this matrix, Roadmap and Task Register; terminalize GOV-03/DR-02B and reflect current OPS/Security/Compliance return evidence without absorbing it.
2. **COMP-GAP-002 / ADR-0007** — separate fresh then-current-main Governance branch after step 1 is terminal; correlate Authority, ADR registry, PVC ownership, Compliance facts and runtime before lifecycle/semantic decision.
3. **COMP-GAP-003 / ESS-0006** — only after ADR-0007; no parallel Security/Compliance architecture or Requirement Registry.

## Overall assessment

The Governance architecture needs no new control plane or runtime restructuring. The immediate gap is legacy artifact lifecycle/semantic consistency, led by ADR-0007 and then ESS-0006. Project/PVC surfaces, Trust Root, human-readable development navigation, ADR-0060 supply-chain authority and stale-writer hygiene are established on current main. OPS DR-03 and Security verification work are current-main foreign-owner inputs only. Foreign productive work and independent verification remain with their respective owners.
