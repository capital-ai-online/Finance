# CAPITAL-AI-GOV — Component and Architecture Matrix

**Role:** current project assessment — non-authorizing  
**Baseline:** `main@7c607de0dfa12e37b1a4070a2cb65e4d484cc6eb`  
**Correlation date:** `2026-09-05`

| Component / contract | Canonical anchor | GOV relationship | Current architecture assessment | Action |
|---|---|---|---|---|
| Agent Trust Root | `/AGENTS.md` | consume / maintain within authority | single repository-wide trust root; Control Plane v2.7.1 | KEEP SINGLE |
| Governance Control Plane | ADR-0096 + `docs/governance/**` + `src/platform/Governance` | cross-cutting owner | current controlling Governance architecture | KEEP / NO PARALLEL PLANE |
| Control Catalog | `docs/governance/control-catalog.json` | owner / validator input | stable `CTRL-*` identities canonical | VERSION EXISTING CONTROLS ONLY |
| Authority Registry | `docs/governance/authority-registry.json` | owner / resolution | stable `AUTH-*` identities; ADR-0007 historical identity registered by Human-merged PR #755 | KEEP SINGLE |
| ADR Registry | `docs/adr/registry.json` | governance registry | ADR-0007 is `historical` / non-authorizing under stable `AUTH-ADR-COMPLIANCE-VALUE-CHAIN-0007` | DONE_MAIN / DO NOT REAUTHORIZE |
| ESS Registry | `.ai/registry/ess-registry.json` | owner / correlate | ESS-0006 same identity revalidated to v1.1.0; no new ESS number or parallel registry | SYNC v1.1.0 |
| Project surfaces | `docs/projects/**` | project architecture owner | canonical project surfaces present; organizational/non-authorizing | MAINTAIN |
| Project Value Chain | `docs/projects/PROJECT_VALUE_CHAIN.md` | organizational owner mapping | `PVC-01..PVC-18` remains distinct from technical financial `VC-*` | MAINTAIN |
| Platform Director | `PVC-05` + Platform Director ESS/component | primary GOV owner | lifecycle/architecture coordination only; does not absorb Security verification, Compliance assessment or foreign runtime | KEEP BOUNDARY |
| ADR-0007 Compliance Value Chain | `docs/adr/registry.json` + `docs/adr/ADR-0007-compliance-value-chain.md` | GOV lifecycle/architecture owner | historical/non-authorizing after PR #755; visible document lifecycle aligned by PR #758; pre-PVC value-chain, legal-sufficiency and automated-certification semantics are not current Authority | DONE_MAIN / TERMINAL |
| ESS-0006 Security & Compliance | `.ai/skills/ESS-0006-Security-Compliance.md` | GOV ESS lifecycle / component boundary | v1.1.0 on current main via PR #757; keeps only existing `src/platform/Security` + `src/platform/Compliance` component scope; separates SEC verification from COMP assessment; removes stale second-registry/audit/risk/event/orchestration implications | DONE_MAIN / TERMINAL |
| Security project | `docs/projects/security/README.md` + `src/platform/Security/README.md` | foreign independent verifier; GOV consumes boundary | CAPITAL-AI-SEC owns cross-cutting requirements/testing/findings/verification; no productive PVC by role; reusable Security component remains existing implementation | PRESERVE INDEPENDENCE |
| Compliance project | `docs/projects/compliance/README.md` + `docs/compliance/CAPITAL-AI-COMP/**` | foreign independent assessor; GOV consumes findings | CAPITAL-AI-COMP owns applicability/requirements/mapping/evidence assessment/findings/Legal handoff; no productive PVC by role; no second requirement registry | PRESERVE INDEPENDENCE |
| Compliance technical component | `src/platform/Compliance/**` + ADR-0012 | existing technical component | repository scanners, authorized routes and evidence/report/certificate persistence exist; internal certificate/report terminology is not external/legal certification | KEEP COMPONENT / LIMIT CLAIMS |
| Security technical component | `src/platform/Security/**` | existing technical component | reusable IAM/Security helpers; no second IAM authority, no Security project ownership transfer | KEEP COMPONENT |
| Audit / Risk / Traceability | current audit/risk/ESS-0011/ESS-0013 authorities | foreign/current authority surfaces | ESS-0006 may consume evidence but must not instantiate a second AuditTrail, RiskRegister, EventMesh or traceability plane | NO PARALLEL AUTHORITY |
| Compliance Requirement Registry concept | historical ESS-0006 v1.0.0 wording | invalid current implementation implication | removed from current ESS-0006 requirements; canonical COMP inventory/applicability/mapping/traceability surfaces remain the existing source | DONE_MAIN / DO NOT REINTRODUCE |
| Fixed Security/Compliance event lists | historical ESS-0006 v1.0.0 wording | stale implementation implication | removed from current ESS-0006 requirements; use existing EventMesh/traceability only where actually implemented | DONE_MAIN / DO NOT REINTRODUCE |
| GOV-03 / ADR-0060 | current ADR/registry | GOV architecture authority | terminal and unchanged | DONE_MAIN |
| User Lifecycle | GOV decisions + OPS/FE/SEC/COMP returns | GOV orchestration only | residual foreign evidence remains separate; ESS-0006 work does not close those findings | NO SCOPE ABSORPTION |
| Financial technical chain | `SC-MD-SPT-0001` | governance correlation only | current technical `VC-*` remains active | DEFERRED OWNER DECISION |
| PR template / transport | `.github/pull_request_template.md` + Trust Root gate | GOV | exact-snapshot Human PR-create approval and Human-only merge remain mandatory | MAINTAIN |

## Current priority assessment

1. **POST-ESS-0006 RECORRELATION** — synchronize these Governance project projections with the Human-merged ADR-0007/ESS-0006 state.
2. **NO IMMEDIATELY EXECUTABLE GOV SUCCESSOR** — `GOV-05` requires an Owner/multi-owner decision, `GOV-07` awaits foreign assurance/evidence returns, and `GOV-08` remains CLIENT/FE/OPS-owned.

## Overall assessment

PRs #755, #757 and #758 close the bounded ADR-0007/ESS-0006 Governance semantics on current main. No new Security, Compliance, IAM, Audit, Risk, EventMesh, Requirement Registry or Governance runtime is needed. The next local implementation must remain paused until an Owner/multi-owner decision or material foreign-owner return creates an executable `PVC-05` work item.
