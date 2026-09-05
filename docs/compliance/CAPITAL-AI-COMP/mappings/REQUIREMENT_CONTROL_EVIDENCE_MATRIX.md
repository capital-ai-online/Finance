# Requirement → Control → Evidence Matrix

**Document ID:** `DOC-COMP-REQ-CTRL-EVIDENCE-2026-08-31`  
**Role:** projection / control mapping / non-authorizing  
**Version:** 1.3.0  
**Date:** 2026-09-05  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Current-main correlation:** `main@33d48e829af4b2fc82d4e561018092f3a5c318ff`  
**Applicability / requirement input:** `APPLICABILITY_MATRIX.md` v1.3.0 + `COMPLIANCE_REQUIREMENTS_INVENTORY.md` v1.2.0  
**Status:** `COMP-03 EXECUTED — CURRENT AUTHORITY/CONTROL/OWNER MAPPING; OWNER/LEGAL GAPS PRESERVED`

This is the canonical COMP-03 mapping projection. It maps the 37 active COMP-02 inputs to **existing** CAPITAL-AI Authority/Controls, ADR/ESS/domain contracts and the current Primary Owner / `PVC-*` surface. It does not create Authority, Controls, ADRs, ESS records, legal obligations or technical remediation.

`Assessment` is deliberately not recomputed here. Evidence sufficiency and `COMPLIANT`/`PARTIALLY_COMPLIANT`/`NON_COMPLIANT` decisions belong to COMP-04/06. A mapped control is not implementation evidence and does not prove compliance.

Current owner routing is resolved only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Historical `VC-*` handoff labels are not current ownership authority.

## Active COMP-03 mapping

| Req | Applicability input | Existing AUTH / CTRL / ADR / ESS / contract mapping | Affected `PVC-*` / Primary Owner when implementation matters | Mapping state | Evidence / remaining gap |
|---|---|---|---|---|---|
| `REQ-COMP-001` | APPLICABLE | `AUTH-GOV-AGENT-TRUST-ROOT`, `CTRL-GOV-TRUST-001` | `PVC-05` / `CAPITAL-AI-GOV` for trust-root governance | `MAPPED` | `/AGENTS.md` + current authority/control registries; execution evidence remains per work item |
| `REQ-COMP-002` | APPLICABLE | `CTRL-COMPLIANCE-CLAIM-001` | affected publishing/product owner; `CAPITAL-AI-CLIENT / PVC-01` when Agent-Client output is changed; cross-cutting FE/SEO/SOCIAL remain presentation/distribution owners only | `MAPPED_WITH_SCOPE_ROUTING` | current claim control exists; exact output surface must be correlated before remediation |
| `REQ-COMP-003` | APPLICABLE | `CTRL-SDLC-BRANCH-001` | `PVC-05` / `CAPITAL-AI-GOV` owns policy; every target project executes it in its own branch | `MAPPED` | current trust-root branch contract |
| `REQ-COMP-004` | APPLICABLE | `CTRL-SDLC-SYNC-001` | `PVC-05` / `CAPITAL-AI-GOV` owns policy; target project supplies branch/main correlation evidence | `MAPPED` | exact pre-PR correlation is per concrete branch state |
| `REQ-COMP-005` | APPLICABLE | `CTRL-SDLC-PR-CREATE-001` | Human/Owner gate under `CAPITAL-AI-GOV / PVC-05` policy | `MAPPED` | approval evidence is per exact main/head state |
| `REQ-COMP-006` | APPLICABLE | `CTRL-CI-HOSTED-001` | `CAPITAL-AI-OPS / PVC-02` for controlled implementation/CI operation; Governance control remains non-executing authority | `MAPPED` | hosted exact-PR-head evidence exists only after PR creation |
| `REQ-COMP-007` | APPLICABLE | `CTRL-MERGE-HUMAN-001` | Human/CODEOWNER; Governance policy at `PVC-05` | `MAPPED` | merge record exists only at Human merge phase |
| `REQ-COMP-008` | APPLICABLE | `CTRL-DEPLOY-AUTH-001`, current verified-main deployment model | `PVC-07` + `PVC-08` / `CAPITAL-AI-OPS` | `MAPPED` | release/deploy evidence is exact-SHA and release-specific |
| `REQ-COMP-009` | APPLICABLE | `CTRL-SEC-LEASTPRIV-001` + applicable Security/domain authority | affected productive Primary Owner by surface; `CAPITAL-AI-SEC` remains cross-cutting verifier with no productive PVC | `MAPPED_WITH_OWNER_ROUTING` | Security control is reusable; any technical gap must be routed to the actual PVC owner rather than SEC/COMP by default |
| `REQ-COMP-010` | APPLICABLE | `CTRL-SEC-SECRET-001` | affected productive Primary Owner; `CAPITAL-AI-SEC` supplies independent Security evidence | `MAPPED_WITH_OWNER_ROUTING` | continuous secret/scanner evidence is scope-specific |
| `REQ-COMP-011` | APPLICABLE | `AUTH-GOV-DOCUMENT-LIFECYCLE`, `CTRL-GOV-DOC-001`, `CTRL-GOV-DOC-ROLE-001` | `PVC-03 / CAPITAL-AI-DOC` for documentary implementation; `PVC-05 / CAPITAL-AI-GOV` for governance registry/policy | `MAPPED` | document-registry treatment remains separately evidence-assessed; COMP must not mutate shared GOV registry in this branch |
| `REQ-COMP-012` | APPLICABLE | `CTRL-GOV-HIST-001`, `CTRL-GOV-AUTH-002`, ADR/ESS registries | `PVC-05 / CAPITAL-AI-GOV` | `MAPPED_WITH_OPEN_GAPS` | `COMP-GAP-002` ADR-0007 and `COMP-GAP-003` ESS-0006 remain Governance-owned; historical labels cannot self-authorize |
| `REQ-COMP-013` | APPLICABLE | ADR-0095 privacy single-source boundary + current privacy/data controls | `PVC-01 / CAPITAL-AI-CLIENT` for client-facing behavior; `PVC-09..10 / CAPITAL-AI-DATA` for data/evidence scope; OPS where operational processing is the changed surface | `MAPPED_WITH_FLOW_ROUTING` | exact lawful basis/processing role remains processing-specific |
| `REQ-COMP-014` | APPLICABLE | ADR-0095 + `CTRL-GOV-DOC-001`/Documentary evidence controls | `PVC-01 / CAPITAL-AI-CLIENT`, `PVC-03 / CAPITAL-AI-DOC`, `PVC-10 / CAPITAL-AI-DATA` according to the affected transparency/accountability surface | `MAPPED_WITH_FLOW_ROUTING` | completeness/currentness is COMP-04/06 evidence work |
| `REQ-COMP-015` | APPLICABLE | current privacy rights/request implementation authorities and contracts | `PVC-01 / CAPITAL-AI-CLIENT` for user interaction; authoritative data execution routes to the owner of the affected data surface, normally `CAPITAL-AI-DATA / PVC-09..10` | `MAPPED_WITH_FLOW_ROUTING` | current runtime sufficiency remains to be assessed, not inferred from docs |
| `REQ-COMP-016` | APPLICABLE | ADR-0092 `AUTH-ADR-PRIVACY-RETENTION-2026-08-19` | `PVC-09..10 / CAPITAL-AI-DATA`; `PVC-08 / CAPITAL-AI-OPS` only where scheduled/operational execution is affected | `MAPPED` | operational freshness/evidence remains COMP-04/06 and target-owner work if a gap is proven |
| `REQ-COMP-017` | PARTIALLY_APPLICABLE | ADR-0086 + ADR-0095; vendor-evidence contracts | Human/Legal for role/transfer interpretation; actual provider/domain Primary Owner is `REQUIRES_CORRELATION` per flow | `PARTIAL_MAPPING` | DPA/subprocessor/transfer/TIA/role evidence incomplete; no guessed owner or legal conclusion |
| `REQ-COMP-018` | PARTIALLY_APPLICABLE | ESS-0019 + AI system inventory | Human/Legal for legal role; technical facts come from the actual source owner (`CLIENT/PVC-01`, `DOC/PVC-03`, `FINTECH/PVC-15..17`, or cross-cutting publication domain as applicable) | `MAPPED_WITH_LEGAL_GATE` | provider/deployer/other legal role not established for every material system |
| `REQ-COMP-019` | PARTIALLY_APPLICABLE | ESS-0019 + `docs/contracts/AI_CONTENT_TRANSPARENCY_CONTRACT.md` + `CTRL-COMPLIANCE-CLAIM-001` | affected output owner; `CLIENT/PVC-01`, `DOC/PVC-03`, `FINTECH/PVC-17` where those productive surfaces are involved | `MAPPED_WITH_SCOPE_ROUTING` | complete output-surface inventory/legal sufficiency remains open |
| `REQ-COMP-020` | REQUIRES_LEGAL_REVIEW | ESS-0019 + ADR-0087/scoring decision boundaries + `financialDecisionAuthority=false` application contract | Human/Legal first; technical remediation only after scope determination, normally `FINTECH/PVC-16..17` for scoring/ranking authority or `CLIENT/PVC-01` for client interaction | `MAPPING_DEFERRED_PENDING_LEGAL_SCOPE` | current engineering boundaries do not establish a specific AI-Act oversight obligation |
| `REQ-COMP-021` | PARTIALLY_APPLICABLE | `AI_LITERACY_CONTROL.md` + ESS-0019 | Human/Owner organizational evidence; no productive PVC is created by the training/evidence obligation | `MAPPED_WITH_EVIDENCE_GATE` | attributable Human completion/acknowledgement evidence remains missing; role interpretation may require Legal Review |
| `REQ-COMP-022` | REQUIRES_LEGAL_REVIEW | external DORA source; **no internal control is promoted before applicability** | Human/Legal; technical Primary Owner/PVC remains unset until actual entity/activity scope creates a concrete obligation | `NO_PREEMPTIVE_CONTROL_MAPPING` | DORA entity/activity applicability is unresolved; no DORA remediation backlog invented |
| `REQ-COMP-023` | REQUIRES_LEGAL_REVIEW | current consumer-contract remediation, billing/subscription contracts and claim boundary | Human/Legal for obligation interpretation; `CLIENT/PVC-01` for consumer UX/contract presentation; `OPS/PVC-08` where billing operation is affected | `PARTIAL_MAPPING_PENDING_LEGAL_SCOPE` | customer mix/market and legal sufficiency remain unresolved |
| `REQ-COMP-024` | NOT_APPLICABLE as binding authority | existing Security controls, including `CTRL-SEC-LEASTPRIV-001`/`CTRL-SEC-SECRET-001`; dated ISO 27001 SoA evidence | `CAPITAL-AI-SEC` as cross-cutting evidence source; affected productive owner only if an existing internal control has a real gap | `BENCHMARK_ONLY` | no certification/binding-authority inference |
| `REQ-COMP-025` | NOT_APPLICABLE as binding authority | `CTRL-AIMS-PDCA-001` + `STANDARDS_CROSSWALK.md` | `PVC-05 / CAPITAL-AI-GOV` | `BENCHMARK_ONLY` | current Governance benchmark; certification requires separate Owner target/assurance evidence |
| `REQ-COMP-028` | NOT_APPLICABLE as binding authority | existing Security/SDLC controls only where independently applicable | `CAPITAL-AI-SEC` evidence + affected productive owner | `ADVISORY_ONLY` | OWASP/CIS citation cannot create a repository requirement, finding or backlog by itself |
| `REQ-COMP-029` | APPLICABLE | `CTRL-COMPLIANCE-CLAIM-001`, `CTRL-CI-HOSTED-001`, `CTRL-GOV-DOC-001` + current COMP evidence model | `CAPITAL-AI-COMP` is evidence assessor only; evidence implementation remains with the source Primary Owner | `MAPPED` | ESS-0006 evidence principle may be consumed only within its valid component scope; stale ESS assumptions are not required for this control mapping |
| `REQ-COMP-030` | APPLICABLE | COMP-08 change-impact model + current trust-root/project-roadmap routing | affected Primary Owner/PVC determined from the changed fact; COMP remains cross-cutting assessor | `MAPPED_DYNAMIC_OWNER` | reassessment trigger is continuous; no second orchestrator/control created |
| `REQ-COMP-031` | UNKNOWN | partial vendor/consumer contract evidence; no complete contract-universe control mapping | Human/Legal + affected domain Primary Owner after contract correlation | `PARTIAL_MAPPING` | complete binding-contract universe and effective versions remain `EVIDENCE_MISSING/UNKNOWN` |
| `REQ-COMP-032` | APPLICABLE internal scope | current OPS/Security resilience and continuity authorities/roadmaps | `PVC-08 / CAPITAL-AI-OPS`; independent Security verification remains `CAPITAL-AI-SEC` | `MAPPED` | measured backup/restore/RPO/RTO evidence remains open and must be assessed in COMP-04/06 |
| `REQ-COMP-033` | APPLICABLE | ESS-0011 traceability + applicable domain audit controls; ESS-0006 only as bounded component specification | `PVC-18 / CAPITAL-AI-OPS` for EventMesh/traceability transport; `PVC-10 / CAPITAL-AI-DATA` where evidence persistence is affected | `MAPPED_WITH_ESS_CLARIFICATION_GAP` | end-to-end coverage/freshness remains assessment work; ESS-0006 stale semantics do not create a second audit authority |
| `REQ-COMP-034` | APPLICABLE | ADR-0032 + ADR-0041/ESS-0016 provider provenance/freshness + ADR-0087 canonical scoring + current DATA contracts | `PVC-09..11 / CAPITAL-AI-DATA` upstream; `PVC-12..17 / CAPITAL-AI-FINTECH` downstream | `MAPPED` | DATA→FINTECH boundary remains fail-closed; current evidence coverage belongs to COMP-04/06 |
| `REQ-COMP-035` | APPLICABLE internal scope | `CTRL-GOV-DOC-001`, `CTRL-GOV-DOC-ROLE-001`, Documentary authorities | `PVC-03 / CAPITAL-AI-DOC`; `PVC-10 / CAPITAL-AI-DATA` or `PVC-18 / CAPITAL-AI-OPS` where evidence/trace records are the affected productive surfaces | `MAPPED` | conditional external record-keeping duties remain legal/scope-specific |
| `REQ-COMP-036` | APPLICABLE | `CTRL-DEPLOY-AUTH-001`, `CTRL-CI-HOSTED-001`, ADR-0060 supply-chain provenance/attestation where applicable | `PVC-07..08 / CAPITAL-AI-OPS` | `MAPPED` | release/rollback/exact-SHA evidence is release-specific |
| `REQ-COMP-037` | REQUIRES_LEGAL_REVIEW | ADR-0095/privacy and consent implementation surfaces + `CTRL-COMPLIANCE-CLAIM-001`; no DDG/TDDDG-specific repository authority is invented | Human/Legal first; `CLIENT/PVC-01` for public/client UX, `DATA/PVC-09` for affected processing, cross-cutting FE/SEO for their presentation/marketing surfaces | `PARTIAL_MAPPING_PENDING_LEGAL_SCOPE` | exact provider/digital-service/consent obligation set requires competent Legal Review |
| `REQ-COMP-038` | UNKNOWN | `financialDecisionAuthority=false` + ADR-0087/FINTECH contracts are **factual boundaries**, not proof of regulated status | Human/Legal; `FINTECH/PVC-15..17` supplies business/technical facts and owns any later technical remediation in its scope | `NO_PREEMPTIVE_CONTROL_MAPPING` | regulated activity/licensing/jurisdictional scope unresolved |
| `REQ-COMP-039` | REQUIRES_LEGAL_REVIEW | ESS-0019 + AI inventory + current decision/scoring boundaries | Human/Legal on trigger; affected productive owner determined by actual use case, commonly `FINTECH/PVC-17` or `CLIENT/PVC-01` | `MAPPING_DEFERRED_PENDING_TRIGGER` | no current blanket high-risk classification and no pre-emptive high-risk remediation backlog |

## Retired historical IDs — excluded from active mapping

| Requirement ID | State | COMP-03 treatment |
|---|---|---|
| `REQ-COMP-026` — NIST SSDF / SP 800-218A | `RETIRED / HISTORICAL` | no active AUTH/CTRL mapping, finding, gate or backlog. Existing SDLC controls stand on their own current Authority; they are not mapped *because of* NIST. |
| `REQ-COMP-027` — NIST AI RMF / GenAI profile | `RETIRED / HISTORICAL` | no active AUTH/CTRL mapping, finding, gate or backlog. Existing AI/Governance controls stand on their own current Authority; future NIST use requires explicit Human/Owner re-adoption. |

## COMP-03 owner-gap decisions

1. **ADR-0007 is not used as current mapping Authority.** Its document says `ACCEPTED`, but `docs/adr/registry.json` has no migrated record/stable `authorityId`. Current Governance Roadmap assigns the `clarify / migrate / supersede / archive` decision to a separate fresh `CAPITAL-AI-GOV / PVC-05` work item.
2. **ESS-0006 remains a registered component specification, not a second Compliance Requirement Registry.** Its current v1.0.0 body contains stale collaboration/path/event/finding assumptions and the historical `ComplianceRequirementRegistry` concept. COMP maps only the bounded evidence/component principle until Governance performs the separately owned clarification after ADR-0007.
3. **Legal-scope rows do not receive invented internal controls.** `REQ-COMP-022`, `038` and the legally conditional portions of `020`, `023`, `037`, `039` stay deferred/partial until competent applicability decisions exist.
4. **Cross-cutting projects do not acquire productive PVC ownership.** COMP, SEC, FE, SEO and SOCIAL may assess/verify/present/distribute but technical remediation remains with the actual Product Value Chain Primary Owner.

## COMP-03 Definition of Done result

- Existing controls/authorities are reused where they fit: **PASS**.
- Missing/conditional mappings are explicit gaps rather than new controls: **PASS**.
- Primary Owner / affected `PVC-*` is explicit where implementation is currently determinable: **PASS**; unresolved legal/provider-specific owners remain explicitly `REQUIRES_CORRELATION` rather than guessed.
- Historical/retired authority is prevented from becoming current by citation: **PASS**.
- Active COMP-02 inputs mapped: **37 / 37**.
- Retired historical IDs excluded from active mapping: **2 / 2**.
- New `AUTH-*`, `CTRL-*`, ADR or ESS created by COMP: **0**.

Next COMP path after this mapping is COMP-04/06 evidence-based assessment, while `COMP-GAP-002` and `COMP-GAP-003` remain separately owned Governance return dependencies.