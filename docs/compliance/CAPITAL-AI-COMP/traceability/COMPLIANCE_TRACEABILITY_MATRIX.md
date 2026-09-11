# CAPITAL-AI Compliance Traceability Matrix

**Document ID:** `DOC-COMP-TRACEABILITY-2026-08-31`  
**Role:** traceability / non-authorizing  
**Version:** 1.3.1  
**Date:** 2026-09-10  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Current-main correlation:** `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`  
**Status:** `COMP-03 TRACEABILITY CURRENT — 37 ACTIVE INPUTS; COMP-05/06/07 RETURNS REASSESSED`

This is a navigation/traceability projection. Detailed source wording and applicability remain in `COMPLIANCE_REQUIREMENTS_INVENTORY.md` and `APPLICABILITY_MATRIX.md`; detailed control mapping remains in `REQUIREMENT_CONTROL_EVIDENCE_MATRIX.md`; assessment/evidence status remains in the Compliance reports. Traceability does not create Authority or prove compliance.

Current ownership resolves only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Cross-cutting COMP/SEC/FE/SEO/SOCIAL/QM projects own no productive `PVC-*` stage merely because they assess, verify, present or distribute outputs.

| Requirement(s) | Source class | Existing current mapping | Primary Owner / `PVC-*` when implementation matters | COMP flow | Current finding / handoff state |
|---|---|---|---|---|---|
| `REQ-COMP-001` | Internal Governance | `AUTH-GOV-AGENT-TRUST-ROOT`, `CTRL-GOV-TRUST-001` | `CAPITAL-AI-GOV / PVC-05` | 03→06→04 | mapped; bounded COMP-04 status `COMPLIANT` |
| `REQ-COMP-002` | Internal claim boundary | `CTRL-COMPLIANCE-CLAIM-001` | affected output owner; `CLIENT/PVC-01` where Agent Client output changes | 03→06→04→05/07 | `PARTIALLY_COMPLIANT`; exhaustive output-surface scan not established |
| `REQ-COMP-003..007` | SDLC / Human merge | current branch/sync/PR-create/hosted-CI/Human-merge controls | policy `GOV/PVC-05`; controlled implementation/CI `OPS/PVC-02`; Human merge boundary separate | 03→06→04 | current mappings retained; future PR evidence exact-state only |
| `REQ-COMP-008` | Deployment | `CTRL-DEPLOY-AUTH-001` + verified-main deployment model | `OPS/PVC-07, PVC-08` | 03→06→04 | bounded `COMPLIANT`; release-specific evidence only |
| `REQ-COMP-009..010` | Security | `CTRL-SEC-LEASTPRIV-001`, `CTRL-SEC-SECRET-001` + applicable domain authority | actual productive owner; SEC independent verifier | 03→06→04→05→07 | both remain `PARTIALLY_COMPLIANT`; no blanket Security closure |
| `REQ-COMP-011` | Document lifecycle | `AUTH-GOV-DOCUMENT-LIFECYCLE`, `CTRL-GOV-DOC-001`, `CTRL-GOV-DOC-ROLE-001` | `DOC/PVC-03` implementation; `GOV/PVC-05` shared registry/policy | 03→06→04→05→07 | `COMP-GAP-008` `RESOLVED_ON_MAIN`; bounded internal status `COMPLIANT` after Governance #775 and Documentary #838/#866 returns |
| `REQ-COMP-012` | Historical authority | `CTRL-GOV-HIST-001`, `CTRL-GOV-AUTH-002`; ADR/ESS registries | `GOV/PVC-05` | 03→06→04→05 | `COMP-GAP-002` + `COMP-GAP-003` `RESOLVED_ON_MAIN`; bounded status `COMPLIANT` |
| `REQ-COMP-013..016` | GDPR/privacy | ADR-0086/0092/0095 + current privacy/data controls | `CLIENT/PVC-01`, `DATA/PVC-09..10`, OPS where operational execution is affected | 01→02→03→06→04→05/07 | all bounded `PARTIALLY_COMPLIANT`; processing-specific/legal/evidence limits retained |
| `REQ-COMP-017` | GDPR vendor/transfer | ADR-0086/0095 + vendor-evidence surfaces | Human/Legal + actual provider/domain owner; `PVC-N/A` until flow correlation | 01→02→03→06→04→05→07 | `COMP-GAP-004`; `EVIDENCE_MISSING / LEGAL_REVIEW` |
| `REQ-COMP-018` | EU AI Act role/use-case | ESS-0019 + AI system inventory | Human/Legal; technical facts from actual owner | 01→02→03→06→04/08 | legal/scope-held; no blanket role/high-risk conclusion |
| `REQ-COMP-019` | AI transparency candidate scope | ESS-0019 + `AI_CONTENT_TRANSPARENCY_CONTRACT` + claim control | `CLIENT/PVC-01`, `DOC/PVC-03`, `FINTECH/PVC-17` as actually affected | 01→02→03→06→04→05→07/08 | evidence-held; target handoffs are trigger/scope-specific |
| `REQ-COMP-020` | AI oversight/decision boundary | ESS-0019 + ADR-0087 + `financialDecisionAuthority=false` factual boundary | Human/Legal first; then affected `FINTECH/PVC-16..17` or `CLIENT/PVC-01` | 01→02→03→04/07/08 | legal/scope-held; no pre-emptive obligation backlog |
| `REQ-COMP-021` | AI literacy | `AI_LITERACY_CONTROL.md` + ESS-0019 | Human Owner / organizational operator; no productive PVC by training obligation | 01→02→06→04→05→07 | `COMP-GAP-005`; attributable Human evidence missing |
| `REQ-COMP-022` | DORA | external regulation only until applicability | Human/Legal; `PVC-N/A` until concrete applicable obligation | 01→02→05→07 | `COMP-GAP-006`; `LEGAL_REVIEW`, no pre-emptive DORA controls |
| `REQ-COMP-023` | Consumer/digital contracts | current consumer-contract/billing evidence | Human/Legal; `CLIENT/PVC-01`, `OPS/PVC-08` only after concrete obligation/surface correlation | 01→02→03/06→04→05→07 | legal/scope-held |
| `REQ-COMP-024` | ISO/IEC 27001 | existing Security controls + dated benchmark evidence | SEC evidence; actual productive owner only for independently established internal-control gap | 02→03→06→04 | `NOT_APPLICABLE` as binding authority |
| `REQ-COMP-025` | ISO/IEC 42001 | `CTRL-AIMS-PDCA-001` + standards crosswalk | `GOV/PVC-05` | 02→03→04 | `NOT_APPLICABLE` as binding authority; current Governance benchmark only |
| `REQ-COMP-028` | OWASP/CIS | existing internal Security/SDLC controls when independently applicable | SEC evidence + affected productive owner | 02→03→04 | advisory only; `NOT_APPLICABLE` as binding authority |
| `REQ-COMP-029` | Evidence principle | claim/hosted-CI/document controls + current COMP evidence model | COMP assesses; source Primary Owner produces evidence | 06→04 | bounded `COMPLIANT`; missing/stale evidence never auto-PASS |
| `REQ-COMP-030` | Continuous change impact | COMP-08 + trust-root/PVC routing | dynamically resolved actual owner/PVC | 08→01→02→03→06→04→05→07 | `PARTIALLY_COMPLIANT`; current cycle executed, exhaustive automation not proven |
| `REQ-COMP-031` | Contract universe | partial vendor/customer contract evidence | Human/Legal + affected owner after correlation; `PVC-N/A` until then | 01→02→06→04/07 | `UNKNOWN / EVIDENCE_MISSING`; active handoff retained |
| `REQ-COMP-032` | Resilience / continuity | current OPS/Security resilience roadmaps | `OPS/PVC-08`; SEC independent verification | 03→06→04→05→07 | `COMP-GAP-007`; measured restore/RPO/RTO evidence open |
| `REQ-COMP-033` | Audit / traceability | ESS-0011 + ADR-0059/domain audit controls; ESS-0006 bounded component semantics only | `OPS/PVC-18` transport; `DATA/PVC-10` persistence where applicable | 03→06→04→05/07 | evidence-held; DATA evidence-identity/freshness and composed exit return consumed as `EVIDENCE_READY`; OPS-18 end-to-end transport and independent Security evidence remain open |
| `REQ-COMP-034` | Data / scoring provenance & integrity | ADR-0032, ADR-0041/ESS-0016, ADR-0087 + DATA contracts | `DATA/PVC-09..11` upstream; `FINTECH/PVC-12..17` downstream | 03→06→04→05/07 | evidence-held; DATA `ValidatedDataInput/1.0.0` now composes provider validation/freshness/provenance/DQ fail-closed; FIN-12/FIN-17/FIN-20 downstream lineage remains open |
| `REQ-COMP-035` | Records / documentation | document lifecycle controls | `DOC/PVC-03`; `GOV/PVC-05` for shared registry; DATA/OPS where record storage/trace transport affected | 03→06→04→05→07 | `PARTIALLY_COMPLIANT`; internal `COMP-GAP-008` resolved, external record-keeping duties remain regime/scope-specific |
| `REQ-COMP-036` | Release / rollback | deploy/hosted-CI controls + ADR-0060 where applicable | `OPS/PVC-07..08` | 03→06→04→05/07 | `PARTIALLY_COMPLIANT`; exact-SHA release evidence exists, fresh rollback drill not established |
| `REQ-COMP-037` | DDG/TDDDG | current privacy/consent/claim controls only; no invented legal Authority | Human/Legal first; affected `CLIENT/DATA` plus cross-cutting presentation/marketing owners for their own surfaces | 01→02→03→06→04→05→07 | legal/scope-held |
| `REQ-COMP-038` | Financial-services/supervisory scope | factual decision boundaries only | Human/Legal; `FINTECH/PVC-15..17` supplies facts/owns later technical remediation if required | 01→02→07 | `UNKNOWN`; no pre-emptive regulatory backlog |
| `REQ-COMP-039` | AI Act high-risk trigger | ESS-0019 + AI inventory + current decision boundaries | Human/Legal on trigger; actual use-case owner, commonly `FINTECH/PVC-17` or `CLIENT/PVC-01` | 08→01→02→03→06→04→05→07 | trigger/legal-held; no blanket high-risk classification |

## Retired historical IDs

- `REQ-COMP-026` — NIST SSDF / SP 800-218A: `RETIRED / HISTORICAL`; excluded from current active mapping, findings, gates and backlog.
- `REQ-COMP-027` — NIST AI RMF / GenAI profile: `RETIRED / HISTORICAL`; excluded from current active mapping, findings, gates and backlog.

Existing current controls remain current because of their own repository Authority, not because of retired NIST mappings.

## Current finding traceability

| Finding | Traceability state |
|---|---|
| `COMP-GAP-001` | `RESOLVED_ON_MAIN` — canonical QM project structure exists; no authority activation inferred |
| `COMP-GAP-002` | `RESOLVED_ON_MAIN` — ADR-0007 historical/non-authorizing lifecycle aligned |
| `COMP-GAP-003` | `RESOLVED_ON_MAIN` — ESS-0006 v1.1.0 bounded semantics |
| `COMP-GAP-004` | active evidence/legal handoff, provider/PVC correlation unresolved |
| `COMP-GAP-005` | active Human evidence handoff |
| `COMP-GAP-006` | active Human/Legal gate |
| `COMP-GAP-007` | active `OPS/PVC-08` evidence handoff |
| `COMP-GAP-008` | `RESOLVED_ON_MAIN` — Governance #775 plus Documentary #838/#866 returned adequate current internal lifecycle/registry evidence; no active DOC/GOV remediation handoff remains |

## Traceability invariants

1. Requirement source/applicability is never replaced by internal `AUTH-*`/`CTRL-*` mapping.
2. A mapped internal Authority/Control is not proof of implementation or compliance.
3. Foreign technical remediation is routed only to the current Primary Owner from the canonical `PVC-*` mapping; unresolved legal/provider-specific ownership remains `REQUIRES_CORRELATION` rather than guessed.
4. ADR-0007 is historical/non-authorizing and may not be used as current Compliance value-chain authority.
5. ESS-0006 v1.1.0 is a bounded component specification, not a second Compliance Requirement Registry or audit/risk/event authority.
6. Compliance independently reassesses returned evidence before any `VERIFIED` or `CLOSED` finding state.
7. Active mapping coverage remains `37 / 37`; retired IDs excluded `2 / 2`; new Authority/Controls created by COMP `0`.
