# CAPITAL-AI Compliance Traceability Matrix

**Document ID:** `DOC-COMP-TRACEABILITY-2026-08-31`  
**Role:** traceability / non-authorizing  
**Version:** 1.2.0  
**Date:** 2026-09-05  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Current-main correlation:** `main@33d48e829af4b2fc82d4e561018092f3a5c318ff`  
**Status:** `COMP-03 TRACEABILITY CURRENT — 37 ACTIVE INPUTS; RETIRED IDS EXCLUDED`

This is a navigation/traceability projection. Detailed source wording and applicability remain in `COMPLIANCE_REQUIREMENTS_INVENTORY.md` and `APPLICABILITY_MATRIX.md`; detailed current control/owner mapping remains in `REQUIREMENT_CONTROL_EVIDENCE_MATRIX.md`. Traceability does not create Authority or prove compliance.

Current ownership is resolved only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Cross-cutting COMP/SEC/FE/SEO/SOCIAL/QM projects own no productive `PVC-*` stage merely because they assess, verify, present or distribute outputs.

| Requirement(s) | Source class | Existing current mapping | Primary Owner / `PVC-*` when implementation matters | COMP flow | Current finding / handoff state |
|---|---|---|---|---|---|
| `REQ-COMP-001` | Internal Governance | `AUTH-GOV-AGENT-TRUST-ROOT`, `CTRL-GOV-TRUST-001` | `CAPITAL-AI-GOV / PVC-05` | 03→06→04 | mapped; execution evidence remains per work item |
| `REQ-COMP-002` | Internal claim boundary | `CTRL-COMPLIANCE-CLAIM-001` | affected source/output owner; `CAPITAL-AI-CLIENT / PVC-01` where Agent Client output changes | 03→06→04→05/07 | no unsupported claim may be promoted to PASS by docs alone |
| `REQ-COMP-003..007` | SDLC / Human merge | `CTRL-SDLC-BRANCH-001`, `CTRL-SDLC-SYNC-001`, `CTRL-SDLC-PR-CREATE-001`, `CTRL-CI-HOSTED-001`, `CTRL-MERGE-HUMAN-001` | Governance policy `PVC-05`; controlled implementation/CI `OPS/PVC-02`; Human merge boundary remains separate | 03→06→04 | per-branch/PR lifecycle evidence; no duplicate gate |
| `REQ-COMP-008` | Deployment | `CTRL-DEPLOY-AUTH-001` | `CAPITAL-AI-OPS / PVC-07, PVC-08` | 03→06→04 | exact-SHA release/deploy evidence required per release |
| `REQ-COMP-009..010` | Security | `CTRL-SEC-LEASTPRIV-001`, `CTRL-SEC-SECRET-001` + applicable domain authority | actual productive Primary Owner for technical remediation; SEC remains independent cross-cutting verifier | 03→06→04→05→07 | owner determined from affected PVC; no automatic routing to SEC/COMP for product fixes |
| `REQ-COMP-011..012` | Document lifecycle / authority history | `CTRL-GOV-DOC-001`, `CTRL-GOV-DOC-ROLE-001`, `CTRL-GOV-HIST-001`, `CTRL-GOV-AUTH-002` | `DOC/PVC-03` for documentary implementation; `GOV/PVC-05` for governance registry/authority | 03→06→04→05→07 | `COMP-GAP-002` ADR-0007 + `COMP-GAP-003` ESS-0006 + document-registry assessment remain explicit |
| `REQ-COMP-013..017` | GDPR/privacy/vendor | ADR-0086/0092/0095 + current privacy/data controls | `CLIENT/PVC-01`, `DATA/PVC-09..10`, OPS where operational execution is affected; Human/Legal for role/transfer interpretation | 01→02→03→06→04→05→07 | vendor/transfer universe remains partial; no guessed legal role |
| `REQ-COMP-018..021` | EU AI Act candidate scope | ESS-0019, AI inventory, transparency/literacy material, ADR-0087 decision boundaries | actual source owner (`CLIENT/PVC-01`, `DOC/PVC-03`, `FINTECH/PVC-15..17`) plus Human/Legal/Owner for role/literacy determinations | 01→02→03→06→04→05→07/08 | legal role/high-risk/oversight remains conditional; Human literacy evidence missing |
| `REQ-COMP-022` | DORA | external regulation only until applicability | Human/Legal first; technical owner/PVC unresolved until a concrete applicable obligation is determined | 01→02→05→07 | `LEGAL_REVIEW`; no pre-emptive DORA control/backlog |
| `REQ-COMP-023` | Consumer / digital contracts | current consumer-contract remediation + billing/subscription contracts | `CLIENT/PVC-01` for consumer UX; `OPS/PVC-08` where billing operation is affected; Human/Legal for legal interpretation | 01→02→03/06→04→05→07 | legal sufficiency/customer-market scope remains open |
| `REQ-COMP-024` | ISO/IEC 27001 | existing Security controls + dated benchmark evidence | SEC evidence; actual productive owner only for an independently established internal-control gap | 02→03→06→04 | benchmark only; no certification/binding Authority |
| `REQ-COMP-025` | ISO/IEC 42001 | `CTRL-AIMS-PDCA-001` + standards crosswalk | `GOV/PVC-05` | 02→03 | current Governance benchmark only; non-certifying |
| `REQ-COMP-028` | OWASP / CIS | existing internal Security/SDLC controls only where independently applicable | SEC evidence + affected productive owner | 02→03 | advisory only; citation does not create gap/backlog |
| `REQ-COMP-029` | Evidence principle | `CTRL-COMPLIANCE-CLAIM-001`, `CTRL-CI-HOSTED-001`, `CTRL-GOV-DOC-001`; ESS-0006 bounded component principle only | COMP assesses evidence; source Primary Owner produces implementation evidence | 06→04 | stale ESS-0006 semantics are not a second Requirement Registry |
| `REQ-COMP-030` | Continuous change impact | COMP-08 + trust-root/PVC routing | dynamically resolved actual affected Primary Owner/PVC | 08→01→02→03→06→04→05→07 | trigger-based; no second orchestrator |
| `REQ-COMP-031` | Contract universe | partial vendor/customer contract evidence | Human/Legal + affected owner after correlation | 01→02→06→04/07 | `UNKNOWN / EVIDENCE_MISSING` until complete universe/effective versions established |
| `REQ-COMP-032` | Resilience / continuity | current OPS/Security resilience authorities/roadmaps | `CAPITAL-AI-OPS / PVC-08`; SEC independent verification | 03→06→04→05→07 | measured restore/RPO/RTO evidence remains open |
| `REQ-COMP-033` | Audit / traceability | ESS-0011 + domain audit controls; ESS-0006 bounded only | `OPS/PVC-18` for EventMesh/traceability; `DATA/PVC-10` for evidence persistence where applicable | 03→06→04→05/07 | end-to-end coverage/freshness remains assessment work; ESS-0006 clarification separately GOV-owned |
| `REQ-COMP-034` | Data / scoring provenance & integrity | ADR-0032, ADR-0041/ESS-0016, ADR-0087 + DATA contracts | `DATA/PVC-09..11` upstream; `FINTECH/PVC-12..17` downstream | 03→06→04→05/07 | fail-closed DATA→FINTECH handoff preserved |
| `REQ-COMP-035` | Records / documentation | `CTRL-GOV-DOC-001`, `CTRL-GOV-DOC-ROLE-001`, Documentary authorities | `DOC/PVC-03`; `DATA/PVC-10`/`OPS/PVC-18` where productive evidence/trace storage is affected | 03→06→04→05→07 | conditional external record duties remain regime/scope specific |
| `REQ-COMP-036` | Release / rollback | `CTRL-DEPLOY-AUTH-001`, `CTRL-CI-HOSTED-001`, ADR-0060 where applicable | `OPS/PVC-07..08` | 03→06→04→05/07 | release-specific exact-SHA/rollback evidence |
| `REQ-COMP-037` | DDG / TDDDG | existing privacy/consent/claim controls only; no invented legal Authority | Human/Legal first; CLIENT/DATA and affected cross-cutting presentation/marketing owners supply facts/implement their own surfaces | 01→02→03→06→04→05→07 | `LEGAL_REVIEW` for exact obligation set |
| `REQ-COMP-038` | Financial-services / supervisory scope | factual decision boundaries (`financialDecisionAuthority=false`, ADR-0087/FINTECH contracts) only | Human/Legal; `FINTECH/PVC-15..17` supplies facts/owns later technical remediation if required | 01→02→07 | `UNKNOWN`; no pre-emptive regulatory control mapping |
| `REQ-COMP-039` | AI Act high-risk trigger | ESS-0019 + AI inventory + current decision boundaries | Human/Legal on trigger; actual use-case owner, commonly FINTECH/PVC-17 or CLIENT/PVC-01 | 08→01→02→03→06→04→05→07 | trigger-based; no blanket high-risk classification |

## Retired historical IDs

- `REQ-COMP-026` — NIST SSDF / SP 800-218A: `RETIRED / HISTORICAL`; excluded from current active mapping, findings, gates and backlog.
- `REQ-COMP-027` — NIST AI RMF / GenAI profile: `RETIRED / HISTORICAL`; excluded from current active mapping, findings, gates and backlog.

Existing current controls remain current because of their own repository Authority, **not** because of retired NIST mappings.

## COMP-03 traceability invariants

1. Requirement source/applicability is never replaced by internal `AUTH-*`/`CTRL-*` mapping.
2. A mapped internal Authority/Control is not proof of implementation or compliance.
3. Foreign technical remediation is routed only to the current Product Value Chain Primary Owner; unresolved legal/provider-specific ownership stays `REQUIRES_CORRELATION` rather than guessed.
4. `ADR-0007` is not treated as current mapping Authority until Governance resolves its lifecycle/semantic gap.
5. ESS-0006 remains a bounded component specification; its historical `ComplianceRequirementRegistry` wording is not the current COMP-02 requirement inventory and cannot create a second normative registry.
6. Compliance independently reassesses returned evidence before any `VERIFIED` or `CLOSED` finding state.
7. Active mapping coverage is `37 / 37`; retired IDs excluded `2 / 2`; new Authority/Controls created by COMP `0`.