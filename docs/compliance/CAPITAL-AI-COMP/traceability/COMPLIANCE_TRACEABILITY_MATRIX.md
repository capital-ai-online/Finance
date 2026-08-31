# CAPITAL-AI Compliance Traceability Matrix

**Document ID:** `DOC-COMP-TRACEABILITY-2026-08-31`  
**Role:** traceability / non-authorizing  
**Version:** 1.1.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@5d3360c21ee51771495aab734ba81c2bdfd3d08b`

This is a navigation/traceability projection. Detailed source wording, applicability and assessments remain in the Requirements, Applicability and Requirement-Control-Evidence matrices.

Main correlation on 2026-08-31 resolved `VC-01 — Agent Client` ownership to `CAPITAL-AI-CLIENT`. Where Security, Privacy, Frontend, SEO-GM or AI evidence is relevant to a VC-01 finding, those domains remain evidence/control sources; confirmed VC-01 technical remediation is owned by `CAPITAL-AI-CLIENT`.

| Requirement(s) | Source class | Existing AUTH / CTRL / ADR / ESS | Primary Owner / VC | COMP flow | Evidence / assessment source | Finding / handoff |
|---|---|---|---|---|---|---|
| REQ-COMP-001 | Internal Governance | `AUTH-GOV-AGENT-TRUST-ROOT`, `CTRL-GOV-TRUST-001` | Governance / VC-02 | 03→06→04 | AGENTS + registries | none; final snapshot validation pending |
| REQ-COMP-002 | Internal claim control | `CTRL-COMPLIANCE-CLAIM-001` | `CAPITAL-AI-CLIENT` for VC-01 client output; source publishing domains remain evidence owners | 03→06→04→05 | claim control + regression evidence | VC-01 technical gap → `CAPITAL-AI-CLIENT`; legacy claim relevance remains COMP-GAP-002 |
| REQ-COMP-003..007 | DevelopmentChain | SDLC branch/sync/PR/CI/merge controls | Governance/Development/Human / VC-02 | 03→06→04 | GitHub main/branch/PR/CI | lifecycle evidence; no duplicate gate |
| REQ-COMP-008 | Deployment | `CTRL-DEPLOY-AUTH-001` | Release/Operations / VC-07/08 | 03→06→04 | release/deploy evidence | future target remediation only if gap confirmed |
| REQ-COMP-009..010 | Security | least-privilege + secret controls, S1 authorities | **CAPITAL-AI-CLIENT / VC-01** for Agent-Client implementation; Security/Governance remain control/evidence owners for VC-01/02 concerns | 03→06→04→05→07 | S1 code/tests/evidence + Agent Client contracts | `[COMPLIANCE_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]` for confirmed client remediation; S1 remains source-domain evidence |
| REQ-COMP-011..012 | Document lifecycle / supersession | document/historical controls, ADR/ESS registries | Governance/Documentary / VC-03 | 03→06→04→05 | lifecycle/registry/archive evidence | COMP-GAP-002/003/008; target-owner lifecycle work only |
| REQ-COMP-013..017 | GDPR/privacy/vendor | privacy ADRs, ADR-0086/0092/0095 | `CAPITAL-AI-CLIENT / VC-01` for client-facing implementation; Privacy/Data/Legal / VC-09/10 for source-domain processing/evidence | 01→02→03→06→04→05→07 | privacy/vendor/data evidence + Agent Client mapping | VC-01 technical gap → CAPITAL-AI-CLIENT; PRIVACY-DATA / PRIVACY-LEGAL handoffs for VC-09/10 scope |
| REQ-COMP-018..021 | EU AI Act candidate obligations | ESS-0019, AI inventory, transparency/literacy material, scoring authorities | `CAPITAL-AI-CLIENT / VC-01` for client-facing implementation; AI/Product/Scoring/Owner / VC-13..17 for source-domain/legal scope | 01→02→03→06→04→05→07/08 | AI inventory, output/audit, human evidence, Agent Client contracts | LEGAL-OWNER / OWNER-OPERATIONS / AI-T as non-client/legal evidence handoffs; VC-01 technical gap → CAPITAL-AI-CLIENT |
| REQ-COMP-022 | DORA scope | external Regulation only; no new internal authority | Human Owner/Legal / VC-08 | 01→02→05→07 | entity/business/regulatory-status evidence | COMP-GAP-006; `[COMPLIANCE_HANDOFF -> LEGAL-OWNER | VC-08]` |
| REQ-COMP-023 | Consumer/digital contracts | legal remediation docs | `CAPITAL-AI-CLIENT / VC-01` for client-facing contract/UX implementation; Legal/Product for legal interpretation | 01→02→04/07 | user/market/contract evidence + Agent Client contracts | Legal Review for obligation interpretation; confirmed VC-01 technical gap → CAPITAL-AI-CLIENT |
| REQ-COMP-024 | ISO/IEC 27001 | existing SoA + Security controls | Security / VC-02 | 02→03→06→04 | dated SoA/scanner evidence | benchmark only; no certification claim |
| REQ-COMP-025 | ISO/IEC 42001 | `CTRL-AIMS-PDCA-001` | Governance / VC-02 | 02→03 | standards crosswalk | benchmark only; Owner target decision separate |
| REQ-COMP-026 | NIST SSDF / SP 800-218A | SDLC controls + crosswalk | Development/Security / VC-02 | 02→03→06→04 | branch/review/CI/dependency evidence | benchmark/control source only |
| REQ-COMP-027 | NIST AI RMF | `CTRL-AIMS-PDCA-001` | AI/Product / VC-17 | 02→03 | AI risk mappings | benchmark only |
| REQ-COMP-028 | OWASP/CIS | Security/SDLC controls | Security/Development / VC-02 | 02→03 | hardening/test/scanner evidence | benchmark/control source only |
| REQ-COMP-029 | Evidence principle | ESS-0006 principle + claim control | Compliance evidence consumer / VC-10 | 06→04 | runtime/code/CI/registry/docs | missing evidence remains explicit |
| REQ-COMP-030 | Change impact | AI inventory triggers + this roadmap | Compliance + affected Primary Owner / relevant VC; `CAPITAL-AI-CLIENT` when affected VC is VC-01 | 08→01→02→03→06→04→05→07 | change records | handoff only after affected owner/stage identified |
| REQ-COMP-031 | Contract universe | existing partial vendor/contract artifacts | Human Owner/Legal / affected VC | 01→02→06→04/07 | contract inventory | UNKNOWN until universe established |
| REQ-COMP-032 | Resilience/continuity | S1/Operations authorities | S1/Operations / VC-08 | 03→06→04→05→07 | restore/incident evidence | COMP-GAP-007; `[COMPLIANCE_HANDOFF -> S1 | VC-08]` |
| REQ-COMP-033 | Audit/traceability | ESS-0006, ESS-0011/0013, domain controls | Security/Traceability/EventMesh / VC-10/18 | 03→06→04→05/07 | logs/compliance runs/traceability evidence | target handoff only on confirmed implementation gap |
| REQ-COMP-034 | Data provenance/integrity | data/scoring authorities | Data/Scoring / VC-09..17 | 03→06→04→05/07 | provider/DQ/feature/scoring evidence | affected stage owner identified by VC coverage matrix |
| REQ-COMP-035 | Records/documentation | `CTRL-GOV-DOC-001`, Documentary authorities | Documentary/all domains / VC-03/10 | 03→06→04→05→07 | registry/archive/evidence dirs | `[COMPLIANCE_HANDOFF -> DOC | VC-03]` if technical documentary remediation confirmed |
| REQ-COMP-036 | Release/rollback | deployment/DevelopmentChain controls | Release/Operations / VC-07/08 | 03→06→04→05/07 | release/rollback/exact-SHA evidence | target Release/Operations handoff if gap confirmed |

## Traceability invariants

1. Requirement source and applicability are never replaced by an internal `AUTH-*`/`CTRL-*` mapping.
2. Internal Authority/Controls do not prove implementation; implementation does not prove complete Compliance without scoped evidence.
3. Every foreign remediation is linked to Primary Owner + VC stage + target roadmap/reference in the Handoff Register.
4. `CAPITAL-AI-CLIENT` is the single VC-01 Primary Owner; source-domain controls/evidence cannot create parallel VC-01 execution ownership.
5. Compliance verification follows returned evidence and remains independent from the target project's implementation claim.
