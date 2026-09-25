# CAPITAL-AI-COMP — Canonical Roadmap

**Baseline:** `main@4c4a88e7f83150191c81134439e7bc9a1145ad4a`

**Project:** `CAPITAL-AI-COMP`  
**Folder:** `docs/projects/compliance/`  
**Role:** cross-cutting Compliance assessment and regulatory traceability  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-17 — historical task activation removed; DATA ownership references aligned to FINTECH  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

`historical/non-terminal != active`

This file remains a temporary project execution projection until the separately requested Roadmap-removal Pull Request after completion of the Social Roadmap. Archive/superseded copies, old chat/work context, branch state and historical non-terminal markers are ledger/evidence only. A work item is executable only when it is currently active under `/AGENTS.md@CURRENT_MAIN` with a canonical identity or freshly defined/re-authorized by the Human/Owner in the current interaction. Terminal history is retained as ledger and is not reopened.

## Owner-directed landing-first gate — COMP-LF-01

**State:** `ACTIVE / LANDING_BASELINE_PRESENT / EVIDENCE_GATE`  
**Canonical identity:** `COMP-LF-01-STATIC-LANDING-COMPLIANCE-GATE-20260921`  
**Work package:** `../../compliance/CAPITAL-AI-COMP/work-packages/COMP_LF_01_STATIC_LANDING_COMPLIANCE_GATE_2026-09-21.md`

Fresh Human/Owner direction on 2026-09-21 establishes a landing-first dependency program as a non-authorizing projection resolving to `/AGENTS.md@CURRENT_MAIN`. The landing-creation prerequisite is now satisfied on CURRENT_MAIN by merged #1195 and #1206. Compliance therefore no longer holds work merely because a landing page must be created; only remaining concrete evidence gates apply, including truthful live/preview separation, privacy/consent, legal navigation, #1209 desktop stabilization, and independent SEC/QM evidence.

At `main@896722e55ab1304bd798da6fc8c6f2d9b178a12e`, the root landing and pinned presentation are already present. The previous existence blocker is superseded. PR #1209 is the remaining FE desktop-only stabilization writer; COMP keeps only genuine residual evidence gates open and does not re-open merged #1195/#1206 work.

**Exit:** `LF01_COMP_EVIDENCE_READY` only after exact-head/current-main evidence demonstrates a truthful static/presentational root, no productive feature API dependency required for first render, preserved legal/consent boundaries, independent SEC/QM state and explicit owner-routed gaps. This Compliance evidence state does not itself declare the cross-project LF-01 gate PASS.

## Owner-directed financial-regulatory perimeter — COMP-FINREG-01

**State:** `ACTIVE_FROM_HUMAN_OWNER_DIRECTION / LEGAL_REVIEW_REQUIRED`  
**Canonical identity:** `COMP-FINREG-01-FINANCIAL-REGULATORY-PERIMETER-20260922`  
**Primary requirement:** `REQ-COMP-038`  
**Work package:** `../../compliance/CAPITAL-AI-COMP/work-packages/COMP_FINREG_01_FINANCIAL_REGULATORY_PERIMETER_2026-09-22.md`

Fresh Human/Owner direction on 2026-09-22 activates a bounded financial-regulatory content/perimeter review against current BaFin/German/EU sources. Current product evidence includes public scoring/ranking, visible recommendation-like `BUY/SELL` and `Best/Worst` semantics, concrete Crypto trade-setup levels, research/paper portfolio allocation semantics and possible referral remuneration. These facts are sufficient to trigger competent classification but do not establish a licence requirement, exemption or regulatory status by themselves.

The package operationalizes the already-existing `REQ-COMP-038 = UNKNOWN` gate through the existing `COMP-08 → COMP-01..07` lifecycle. It does not create a ninth Compliance workstream, does not assign a productive PVC to COMP and does not pre-empt Human/Legal classification.

**Exit:** `FINREG_PERIMETER_EVIDENCE_READY` only after every material recommendation-like financial/crypto surface is factually inventoried, WpIG/MAR and MiCAR classifications are competently dispositioned, conditional DORA/GwG/§34f consequences remain evidence-gated, remuneration/conflicts are mapped, and all productive remediation is routed to the actual canonical owner.

### FINREG evidence refresh — 2026-09-25

**Evidence pack:** `../../compliance/CAPITAL-AI-COMP/evidence/COMP_FINREG_01_MIFID17_MICAR_DORA_EVIDENCE_2026-09-25.md`

- MiFID II Article 17 / RTS 6: `CONDITIONAL_TRIGGER_NOT_CURRENTLY_EVIDENCED`; no productive broker/order/execution path is evidenced and FT-7+ remains unauthorised. This is not a legal exemption.
- MiCAR/BaFin: `SERVICE_CLASSIFICATION_REQUIRED`; Article 66/81 evidence families are defined but legal/service classification remains Human/Legal.
- DORA: `APPLICABILITY_HELD / ENGINEERING_EVIDENCE_PARTIAL`; ICT risk, incidents, resilience testing, third-party/register/exit and recovery evidence are mapped.
- `REQ-COMP-032 / COMP-GAP-007` remains an open measured recovery-evidence gap.


## Current return reassessment — REQ-COMP-033

### COMP-REQ-033 — Audit / traceability current-return reassessment

**State:** `DONE_MAIN / TERMINAL` via Human-merged PR #973 (`merge aaf246511cc75c525a56ec13728504ee5516b6c3`).

Human-merged OPS PR #937 supplies strict source-owned evidence identity/correlation/freshness binding for `PVC-18`; Human-merged OPS PR #939 binds the productive Traceability → EventMesh returned event into that strict projection. Human-merged Security PR #956 independently verifies the unchanged evidence-identity/freshness contract with fail-closed negative tests. Exact PR-head CI/Governance/Container Security evidence for #939 and #956 is successful.

The previously retained `OPS-18 transport open` and `independent Security verification open` gates are therefore terminal for this bounded reassessment. Compliance records exactly one current status: `REQ-COMP-033 = PARTIALLY_COMPLIANT` for the evidenced repository path. The remaining limitation is exhaustive coverage: current evidence does not prove every protected action, every compliance-relevant event, every provider/runtime event or every future state. No new foreign remediation is invented from that limitation.

Assessment evidence: `../../compliance/CAPITAL-AI-COMP/reports/REQ_COMP_033_CURRENT_RETURN_REASSESSMENT_2026-09-16.md`.

**Exit:** `DONE_MAIN` — OPS #937/#939 and SEC #956 are consumed in canonical COMP assessment/traceability surfaces through PR #973; stale OPS/Security open-return gates are removed; foreign PVC/Domain/Security authority remains unchanged; no Compliance runtime/code delta was introduced.

## Current execution order — EVIDENCE_OR_OWNER_HELD

This order is an **execution-readiness order, not a legal-risk or severity ranking** and does not itself activate work. Every item still requires current canonical activation under `/AGENTS.md@CURRENT_MAIN` or fresh Human/Owner direction. The seven `LEGAL_OR_SCOPE_HELD` inputs remain a separate Human/Legal queue and are not promoted by engineering evidence.

| Order | Requirement | Current evidence state | Concrete owner / required return | Objective exit gate |
|---:|---|---|---|---|
| 1 | `REQ-COMP-032` / `COMP-GAP-007` | `EVIDENCE_MISSING / OPEN` — PR #776 placed the fail-closed Recovery harness on main; PR #802 was closed without merge, and measured operating evidence remains absent | `CAPITAL-AI-OPS / PVC-08` returns measured scheduled backup age/RPO, isolated restore, measured RTO and integrity evidence; `CAPITAL-AI-SEC` independently verifies the returned evidence | At least two successful scheduled backup evidence records, measured DB RPO `<= 24h`, one isolated restore with integrity match and measured DB RTO `<= 60 min`, followed by independent Security verification; no Production/provider mutation inferred from documentation |
| 2 | `REQ-COMP-034` | `EVIDENCE_OR_OWNER_HELD` — PVC-09..11 validation/freshness/provenance/DQ is composed fail-closed; FIN-12 and FIN-20 remain historical/open evidence items until fresh activation | `CAPITAL-AI-FINTECH / PVC-09..17` returns current-main feature-contract mapping and exact data→feature→score→rank→trace lineage | Accepted evidence remains identity-linked through feature, scoring and ranking into required OPS trace/evidence transport; stale/diverged branch evidence is not accepted as a current return |
| 3 | `REQ-COMP-017` / `COMP-GAP-004` | `EVIDENCE_MISSING / LEGAL_REVIEW` | Human/Legal plus the actual provider/domain owner returns provider role, effective DPA/contract, subprocessors, transfer mechanism/TIA and region evidence where applicable; `PVC-N/A` remains until the concrete flow is correlated | Each material provider flow has an evidence-linked role/contract/subprocessor/transfer disposition and competent Legal interpretation where required; no PVC or legal conclusion is guessed |
| 4 | `REQ-COMP-019` | `EVIDENCE_OR_OWNER_HELD / SCOPE_SPECIFIC` | `CAPITAL-AI-CLIENT / PVC-01`, `CAPITAL-AI-DOC / PVC-03` and/or `CAPITAL-AI-FINTECH / PVC-17` return evidence only for actual material generated-output surfaces; Human/Legal supplies any required legal-sufficiency decision | Material customer-facing/generated-content surfaces are inventoried and each applicable surface has evidence for the existing transparency/claim boundary or an owner-routed remediation; no blanket AI-transparency PASS is inferred |
| 5 | `REQ-COMP-021` / `COMP-GAP-005` | `EVIDENCE_MISSING` | Human Owner / organizational operator returns attributable AI-literacy training/completion/acknowledgement evidence; no productive PVC is created | Dated, attributable completion/acknowledgement evidence identifies the applicable training/control version and covered Human role(s); Compliance does not fabricate organizational records |
| 6 | `REQ-COMP-031` | `EVIDENCE_OR_OWNER_HELD / CONTRACT_UNIVERSE_UNKNOWN` | Human/Legal plus each affected owner after correlation returns the complete binding customer/provider/partner contract universe and effective versions; `PVC-N/A` until correlation | Binding-contract inventory is complete for the assessed scope, effective versions are identifiable, and each material obligation is routed to the actual affected owner/PVC or retained as a competent Legal gate |

The historical FIN-12 branch `agent/fintech-fin12-validated-feature-contract-20260916` is **not** a current owner return and is not an execution baseline. It must be freshly re-correlated from then-current main before its content can count as current `REQ-COMP-034` evidence.

## PR #900 / #901 work packages

### COMP-PR900-01 — Production-readiness compliance dispositions
For readiness controls that require legal/compliance judgment, provide explicit disposition, scope, evidence and owner route. Do not let SEC/GOV/DOC synthesize legal PASS.

### COMP-PR900-02 — Auth/lifecycle compliance boundary
Review compliance implications of MFA/AAL, recovery, authentication lifecycle and provider evidence after current implementation/provider state is supplied; normative/security ownership remains separate.

### COMP-PR900-03 — Analytics/marketing/social privacy boundary
Assess provider analytics, PostHog/telemetry, SEO/marketing and social distribution flows for applicable data-minimization/privacy/compliance obligations without creating provider mutations.

#### Consent-Nachweis / FE-CONSENT-V3 — Owner-Fortsetzung 2026-09-16

Status: `DESIGN_READY / IMPLEMENTATION_NOT_STARTED / LEGAL_REVIEW_PENDING` historical projection; not active by status alone.
Der konkrete datensparsame Entwurf steht im bestehenden [Datenschutzprotokoll, Abschnitte 4.1–4.3](../../DATENSCHUTZ_PROTOKOLL.md): Entscheidung, serverseitiger Zeitpunkt, versionierter Informationstext, pseudonyme Zuordnung, Widerrufsfolge und zweckgebundene Löschregel. Die Hinweisversion wird auf `2026-09-15` korrigiert; historische Datensätze bleiben unverändert.

Owner-Rückgaben: FE liefert UI-/Netzwerk-Evidence; SEO/OPS tatsächliche GA4-Retention und Provider-Nachweise; FINTECH/OPS spätere Persistenz-/Purge-Evidence; COMP/Verantwortlicher bewertet Nachweis- und Aufbewahrungsausnahmen. Keine produktive PVC-Ownership wird an COMP übertragen.
Exit: Entwurf geprüft, tatsächliches Verarbeitungsende/Retention endlich abgebildet, implementierte Nachweis-/Löschpfade getestet und Browserbedienung belegt. Kein Runtime- oder Legal-PASS aus Dokumentation.

### COMP-PR900-04 — Monetization/token/regulatory proposals
Before any regulated, entitlement, money-like or crypto-token implementation, classify applicable compliance/legal constraints and route required Human decisions.

**Exit:** no regulated expansion proposal is treated as implementation-ready without explicit compliance routing.

## Historical baseline (pre-2026-09-13) — non-active ledger

Detailed Compliance state remains canonical in `docs/compliance/CAPITAL-AI-COMP/**`. Prior states below are evidence only and do not activate work.

| WP | Historical state |
|---|---|
| COMP-01 Applicability | EXECUTED_CONTINUOUS |
| COMP-02 Requirements | DONE_ON_MAIN / CONTINUOUS |
| COMP-03 Control Mapping | DONE_ON_MAIN / REQ-COMP-033 RETURNS RECORRELATED |
| COMP-04 Assessment | DONE_ON_MAIN / CURRENT RETURN REASSESSED — REQ-COMP-033 PARTIALLY_COMPLIANT |
| COMP-05 Findings | EXECUTED_CURRENT — COMP-GAP-008 resolved on main |
| COMP-06 Evidence | EXECUTED_HELD |
| COMP-07 Remediation Handoff | EXECUTED_HELD historical state only |
| COMP-08 Continuous Compliance | EXECUTED_CONTINUOUS |

Missing legal/regulatory evidence is routed, never inferred as PASS.

## Dependencies
SEC assurance, GOV authority, OPS provider/runtime evidence, FINTECH product/data semantics, SEO/SOCIAL analytics scopes.

## Project exit gate
One active COMP roadmap; all material compliance judgments are explicit, evidence-linked and owner-routed; unknowns remain visible; historical/non-terminal state never self-activates.
