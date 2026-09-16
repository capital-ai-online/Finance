# CAPITAL-AI-COMP — Canonical Roadmap

**Project:** `CAPITAL-AI-COMP`  
**Folder:** `docs/projects/compliance/`  
**Role:** cross-cutting Compliance assessment and regulatory traceability  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — PR #973 terminalized; six held inputs re-prioritized against current main  
**Baseline:** `main@7e083b6c99327884fbc4169525bf8646519d06a7`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## Current return reassessment — REQ-COMP-033

### COMP-REQ-033 — Audit / traceability current-return reassessment

**State:** `DONE_MAIN / TERMINAL` via Human-merged PR #973 (`merge aaf246511cc75c525a56ec13728504ee5516b6c3`).

Human-merged OPS PR #937 supplies strict source-owned evidence identity/correlation/freshness binding for `PVC-18`; Human-merged OPS PR #939 binds the productive Traceability → EventMesh returned event into that strict projection. Human-merged Security PR #956 independently verifies the unchanged DATA evidence-identity/freshness contract with fail-closed negative tests. Exact PR-head CI/Governance/Container Security evidence for #939 and #956 is successful.

The previously retained `OPS-18 transport open` and `independent Security verification open` gates are therefore terminal for this bounded reassessment. Compliance records exactly one current status: `REQ-COMP-033 = PARTIALLY_COMPLIANT` for the evidenced repository path. The remaining limitation is exhaustive coverage: current evidence does not prove every protected action, every compliance-relevant event, every provider/runtime event or every future state. No new foreign remediation is invented from that limitation.

Assessment evidence: `../../compliance/CAPITAL-AI-COMP/reports/REQ_COMP_033_CURRENT_RETURN_REASSESSMENT_2026-09-16.md`.

**Exit:** `DONE_MAIN` — OPS #937/#939 and SEC #956 are consumed in canonical COMP assessment/traceability surfaces through PR #973; stale OPS/Security open-return gates are removed; foreign PVC/Domain/Security authority remains unchanged; no Compliance runtime/code delta was introduced.

## Current execution order — EVIDENCE_OR_OWNER_HELD

This order is an **execution-readiness order, not a legal-risk or severity ranking**. It prioritizes concrete owner-routable returns and current dependency readiness. The seven `LEGAL_OR_SCOPE_HELD` inputs remain a separate Human/Legal queue and are not promoted by engineering evidence.

| Order | Requirement | Current evidence state | Concrete owner / required return | Objective exit gate |
|---:|---|---|---|---|
| 1 | `REQ-COMP-032` / `COMP-GAP-007` | `EVIDENCE_MISSING / OPEN` — PR #776 placed the fail-closed Recovery harness on main; PR #802 was closed without merge, and measured operating evidence remains absent | `CAPITAL-AI-OPS / PVC-08` returns measured scheduled backup age/RPO, isolated restore, measured RTO and integrity evidence; `CAPITAL-AI-SEC` independently verifies the returned evidence | At least two successful scheduled backup evidence records, measured DB RPO `<= 24h`, one isolated restore with integrity match and measured DB RTO `<= 60 min`, followed by independent Security verification; no Production/provider mutation inferred from documentation |
| 2 | `REQ-COMP-034` | `EVIDENCE_OR_OWNER_HELD` — DATA validation/freshness/provenance/DQ is composed fail-closed; FIN-12 and FIN-20 remain open | `CAPITAL-AI-FINTECH / PVC-12..17` returns current-main FIN-12 feature-contract mapping and FIN-20 exact DATA→feature→score→rank→trace lineage; `CAPITAL-AI-DATA / PVC-09..11` returns only independently proven correction-version-lineage residuals | Accepted DATA evidence remains identity-linked through feature, scoring and ranking into required OPS trace/evidence transport; stale/diverged branch evidence is not accepted as a current return |
| 3 | `REQ-COMP-017` / `COMP-GAP-004` | `EVIDENCE_MISSING / LEGAL_REVIEW` | Human/Legal plus the actual provider/domain owner returns provider role, effective DPA/contract, subprocessors, transfer mechanism/TIA and region evidence where applicable; `PVC-N/A` remains until the concrete flow is correlated | Each material provider flow has an evidence-linked role/contract/subprocessor/transfer disposition and competent Legal interpretation where required; no PVC or legal conclusion is guessed |
| 4 | `REQ-COMP-019` | `EVIDENCE_OR_OWNER_HELD / SCOPE_SPECIFIC` | `CAPITAL-AI-CLIENT / PVC-01`, `CAPITAL-AI-DOC / PVC-03` and/or `CAPITAL-AI-FINTECH / PVC-17` return evidence only for actual material generated-output surfaces; Human/Legal supplies any required legal-sufficiency decision | Material customer-facing/generated-content surfaces are inventoried and each applicable surface has evidence for the existing transparency/claim boundary or an owner-routed remediation; no blanket AI-transparency PASS is inferred |
| 5 | `REQ-COMP-021` / `COMP-GAP-005` | `EVIDENCE_MISSING` | Human Owner / organizational operator returns attributable AI-literacy training/completion/acknowledgement evidence; no productive PVC is created | Dated, attributable completion/acknowledgement evidence identifies the applicable training/control version and covered Human role(s); Compliance does not fabricate organizational records |
| 6 | `REQ-COMP-031` | `EVIDENCE_OR_OWNER_HELD / CONTRACT_UNIVERSE_UNKNOWN` | Human/Legal plus each affected owner after correlation returns the complete binding customer/provider/partner contract universe and effective versions; `PVC-N/A` until correlation | Binding-contract inventory is complete for the assessed scope, effective versions are identifiable, and each material obligation is routed to the actual affected owner/PVC or retained as a competent Legal gate |

The currently known FIN-12 branch `agent/fintech-fin12-validated-feature-contract-20260916` is **not** a current owner return: against this baseline it is `56 behind / 3 ahead` with merge base `683dc08b5079ee41e736b5073e52ef62c4105cf3`. It must be rematerialized/re-correlated from then-current main before its payload can count as current `REQ-COMP-034` evidence.

## PR #900 / #901 work packages

### COMP-CARRY-01 — Existing non-terminal Compliance backlog
Carry forward all non-terminal compliance assessments, control mappings, regulatory traces and owner returns.

### COMP-PR900-01 — Production-readiness compliance dispositions
For readiness controls that require legal/compliance judgment, provide explicit disposition, scope, evidence and owner route. Do not let SEC/GOV/DOC synthesize legal PASS.

### COMP-PR900-02 — Auth/lifecycle compliance boundary
Review compliance implications of MFA/AAL, recovery, authentication lifecycle and provider evidence after current implementation/provider state is supplied; normative/security ownership remains separate.

### COMP-PR900-03 — Analytics/marketing/social privacy boundary
Assess provider analytics, PostHog/telemetry, SEO/marketing and social distribution flows for applicable data-minimization/privacy/compliance obligations without creating provider mutations.

#### Consent-Nachweis / FE-CONSENT-V3 — Owner-Fortsetzung 2026-09-16

Status: `DESIGN_READY / IMPLEMENTATION_NOT_STARTED / LEGAL_REVIEW_PENDING`.
Der konkrete datensparsame Entwurf steht im bestehenden [Datenschutzprotokoll, Abschnitte 4.1–4.3](../../DATENSCHUTZ_PROTOKOLL.md): Entscheidung, serverseitiger Zeitpunkt, versionierter Informationstext, pseudonyme Zuordnung, Widerrufsfolge und zweckgebundene Löschregel. Die Hinweisversion wird auf `2026-09-15` korrigiert; historische Datensätze bleiben unverändert.

Owner-Rückgaben: FE liefert UI-/Netzwerk-Evidence; SEO/OPS tatsächliche GA4-Retention und Provider-Nachweise; DATA/OPS spätere Persistenz-/Purge-Evidence; COMP/Verantwortlicher bewertet Nachweis- und Aufbewahrungsausnahmen. Keine produktive PVC-Ownership wird an COMP übertragen.
Exit: Entwurf geprüft, tatsächliches Verarbeitungsende/Retention endlich abgebildet, implementierte Nachweis-/Löschpfade getestet und Browserbedienung belegt. Cloudbrowser aktuell `BLOCKED` durch erneuten CDP-Timeout; kein Runtime- oder Legal-PASS aus Dokumentation.

### COMP-PR900-04 — Monetization/token/regulatory proposals
Before any regulated, entitlement, money-like or crypto-token implementation, classify applicable compliance/legal constraints and route required Human decisions.

**Exit:** no regulated expansion proposal is treated as implementation-ready without explicit compliance routing.

## Carried-forward baseline (pre-2026-09-13)

Detailed Compliance state remains canonical in `docs/compliance/CAPITAL-AI-COMP/**`.

| WP | State |
|---|---|
| COMP-01 Applicability | EXECUTED_CONTINUOUS |
| COMP-02 Requirements | DONE_ON_MAIN / CONTINUOUS |
| COMP-03 Control Mapping | DONE_ON_MAIN / REQ-COMP-033 RETURNS RECORRELATED |
| COMP-04 Assessment | DONE_ON_MAIN / CURRENT RETURN REASSESSED — REQ-COMP-033 PARTIALLY_COMPLIANT |
| COMP-05 Findings | EXECUTED_CURRENT — COMP-GAP-008 resolved on main |
| COMP-06 Evidence | EXECUTED_HELD — 6 evidence/owner-held inputs remain after REQ-COMP-033 reassessment |
| COMP-07 Remediation Handoff | EXECUTED_HELD — REQ-COMP-033 OPS/Security return gates terminalized; other active handoffs retained |
| COMP-08 Continuous Compliance | EXECUTED_CONTINUOUS |

Missing legal/regulatory evidence is routed, never inferred as PASS.

## Dependencies
SEC assurance, GOV authority, OPS provider/runtime evidence, DATA/FINTECH product semantics, SEO/SOCIAL analytics scopes.

## Project exit gate
One active COMP roadmap; all material compliance judgments are explicit, evidence-linked and owner-routed; unknowns remain visible.