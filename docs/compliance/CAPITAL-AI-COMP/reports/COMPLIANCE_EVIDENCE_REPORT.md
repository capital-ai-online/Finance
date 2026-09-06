# CAPITAL-AI Compliance Evidence Report

**Document ID:** `DOC-COMP-EVIDENCE-REPORT-2026-08-31`  
**Role:** evidence assessment / non-authorizing  
**Version:** 1.8.3  
**Date:** 2026-09-06  
**Baseline:** `main@dbdb1d5ed2c93c857ab9de1329b9d4dcbba2fd67`  
**Scope:** COMP-04 current-main assessment baseline plus COMP-06 held-evidence review, post-merge closeout evidence and Governance/OPS/FINTECH return reassessment

## Evidence principle

Evidence priority is Runtime/Provider → Code/Configuration → exact-identity Hosted CI → Registry/Control → Approved Documentation → Roadmap Claims. Historical evidence is not automatic current proof. Open Pull Requests are correlation input, not merged-main evidence. `EVIDENCE_READY` is not `VERIFIED`.

Approved assessment vocabulary:

`COMPLIANT` · `PARTIALLY_COMPLIANT` · `NON_COMPLIANT` · `NOT_APPLICABLE` · `NOT_ASSESSED` · `EVIDENCE_MISSING`.

`COMPLIANT` is bounded to the explicitly evidenced scope and is not a certification, blanket legal-compliance conclusion or permanent future-state assertion.

## Current execution baseline

- Current trust root: `/AGENTS.md` v2.8.0.
- Current main: `dbdb1d5ed2c93c857ab9de1329b9d4dcbba2fd67`.
- Human-merged PR #761 placed the 23/23 `READY_NOW` COMP-04 assessment baseline on main.
- Human-merged PR #754 supplies Google consent runtime/test evidence used by the bounded privacy/transparency assessments.
- Human-merged PR #755 registered ADR-0007 as historical/non-authorizing; PR #758 aligned the canonical ADR document to the same lifecycle.
- Human-merged PR #757 revalidated ESS-0006 v1.1.0 as a bounded component specification for existing Security/Compliance technical boundaries and explicitly preserved separate SEC verification, COMP assessment and foreign Primary Owner remediation.
- Human-merged PR #768 consolidated the remaining locally executable Compliance roadmap closeout.
- Exact PR-head `3f127cb8751d114e60672c9793b1dd6ea60cf33a` hosted checks completed successfully: `PR #768 – CI-Prüfung`, `PR #768 – Governance-Prüfung`, and `Container Security`.
- Human-merged Governance PR #775 provides the current Governance-side decision for `COMP-GAP-008`: **NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT**. `docs/governance/document-registry.json` remains unchanged by design; this is positive Governance decision evidence, not missing implementation.
- Human-merged OPS PR #776 implements the recovery evidence harness for `OPS-08-SEC-07`, but the authoritative OPS evidence record remains `IMPLEMENTED_BRANCH / EXECUTION_EVIDENCE_PENDING / SECURITY_UNVERIFIED`; operating recovery evidence is still incomplete.
- Human-merged FINTECH PR #777 confirms DATA `ValidatedDataInput/1.0.0` upstream and retains FIN-12 / FIN-20 as partial/open, so exact DATA→feature→score→rank lineage remains incomplete.
- Current DATA roadmap still marks Evidence Management security evidence as open and provenance/freshness/DQ as active requirements; no DATA-side current-main evidence closes `REQ-COMP-033` or `REQ-COMP-034`.
- `src/platform/Compliance` was re-correlated against ADR-0012 / ESS-0006. Its implemented scanner/router/store/evidence boundary already covers the authorized local technical component role. No current roadmap item or finding requires a new local Compliance code path; `CODE_DELTA_REQUIRED = NO` for this post-merge sync.
- `CAPITAL-AI-COMP` remains cross-cutting with no productive `PVC-*` ownership.

## COMP-04 assessment — 23 `READY_NOW` requirements

### Result distribution

| Assessment | Count |
|---|---:|
| `COMPLIANT` | **8** |
| `PARTIALLY_COMPLIANT` | **12** |
| `NON_COMPLIANT` | **0** |
| `NOT_APPLICABLE` | **3** |
| `NOT_ASSESSED` | **0** |
| `EVIDENCE_MISSING` | **0** |
| **Total assessed** | **23** |

### Requirement-by-requirement assessment

| Requirement | Assessment | Evidence | Limitation / retained gate |
|---|---|---|---|
| `REQ-COMP-001` | **COMPLIANT** | Current `/AGENTS.md` v2.8.0 is the assessed trust root; `AUTH-GOV-AGENT-TRUST-ROOT` / `CTRL-GOV-TRUST-001` remain mapped. | Bounded to repository/current-work execution; no claim about every external client or future run. |
| `REQ-COMP-002` | **PARTIALLY_COMPLIANT** | `CTRL-COMPLIANCE-CLAIM-001` exists; Compliance artifacts prohibit unsupported certification/regulatory claims; privacy policy evidence includes bounded claim language. | No exhaustive scan of every public/product/marketing output surface. |
| `REQ-COMP-003` | **COMPLIANT** | Current work uses a project-qualified `agent/compliance-...` branch; no direct-main mutation. | Per-work-item evidence; future work requires its own current branch state. |
| `REQ-COMP-004` | **COMPLIANT** | Main/open-PR/writer/overlap correlation is required and has been exercised through the COMP workstream sequence and repeated fail-closed resynchronization as main advanced. | Must be repeated immediately before any future PR creation for the exact head. |
| `REQ-COMP-005` | **PARTIALLY_COMPLIANT** | `CTRL-SDLC-PR-CREATE-001` is current; stale approvals were invalidated when main changed before PR creation. | Every future PR needs fresh exact-state Human approval; technical evidence is not authorization. |
| `REQ-COMP-006` | **COMPLIANT** | PR #768 exact-head hosted CI, Governance and Container Security checks all completed successfully. | Future PR heads require their own exact-head hosted checks. |
| `REQ-COMP-007` | **COMPLIANT** | PR #768 and the subsequent relevant Governance/OPS/FINTECH returns were Human-merged; `/AGENTS.md` retains Human/CODEOWNER-only merge authority. | Does not prove every historical/future PR; merge remains a separate Human action. |
| `REQ-COMP-008` | **COMPLIANT** | Verified-main deployment model and exact-SHA workflow evidence exist for cited release baselines. | Release-specific; no blanket production assertion is inferred from documentation-only evidence. |
| `REQ-COMP-009` | **PARTIALLY_COMPLIANT** | `CTRL-SEC-LEASTPRIV-001`; repository evidence includes fail-closed auth/consent and role-separation patterns. | Current Security/OPS findings remain open; no blanket least-privilege closure. |
| `REQ-COMP-010` | **PARTIALLY_COMPLIANT** | `CTRL-SEC-SECRET-001`; covered flows document secret/token handling controls. | No fresh repository-wide scanner result covering every secret-bearing surface. |
| `REQ-COMP-011` | **PARTIALLY_COMPLIANT** | `AUTH-GOV-DOCUMENT-LIFECYCLE`, `CTRL-GOV-DOC-001`, `CTRL-GOV-DOC-ROLE-001`; COMP artifacts use canonical `docs/compliance/**` placement and stable `DOC-*` identities; PR #775 establishes that no Governance Document Registry mutation is required under the current contract. | Documentary/PVC-03 lifecycle return and Compliance reassessment remain outstanding. |
| `REQ-COMP-012` | **COMPLIANT** | Historical-authority controls plus PR #755/#758 and ESS-0006 v1.1.0 prevent ADR-0007 historical content from regaining current authority by citation. | Bounded to historical-authority handling; unrelated evidence/legal/security gaps remain separate. |
| `REQ-COMP-013` | **PARTIALLY_COMPLIANT** | Privacy policy and ADR-0095 provide documented processing-purpose/category/legal-basis/recipient/retention context. | Exact lawful basis, role, provider/transfer facts and legal sufficiency remain processing-specific. |
| `REQ-COMP-014` | **PARTIALLY_COMPLIANT** | Versioned privacy/accountability records exist; PR #754 adds consent fail-closed runtime/test evidence. | Does not exhaustively prove every processing/public/product surface. |
| `REQ-COMP-015` | **PARTIALLY_COMPLIANT** | Existing privacy request implementation/migration evidence covers rights-request workflow surfaces. | Full end-to-end fulfilment for every request type/provider was not freshly re-executed. |
| `REQ-COMP-016` | **PARTIALLY_COMPLIANT** | ADR-0092 plus retention/lifecycle implementation evidence establish concrete controls. | Operational purge execution, provider-side retention and every statutory/hold case not independently revalidated now. |
| `REQ-COMP-024` | **NOT_APPLICABLE** | ISO/IEC 27001 remains bounded benchmark evidence rather than binding repository/legal authority. | Optional benchmark use remains possible; no certification conclusion inferred. |
| `REQ-COMP-025` | **NOT_APPLICABLE** | `/AGENTS.md` treats ISO/IEC 42001:2023 as a non-certifying/non-authorizing Governance benchmark. | Any future certification target needs separate Owner scope/evidence. |
| `REQ-COMP-028` | **NOT_APPLICABLE** | OWASP/CIS remain advisory inputs only when correlated to current internal controls. | Advisory Security use remains permitted; status concerns binding applicability only. |
| `REQ-COMP-029` | **COMPLIANT** | Current Compliance process requires scope-adequate evidence before positive conclusions; held/legal sets remain explicit. | Process-control status does not prove every underlying domain requirement. |
| `REQ-COMP-030` | **PARTIALLY_COMPLIANT** | COMP-08 change-impact flow was exercised across PR #768 closeout and subsequent returns through PRs #775, #776 and #777. | No complete automated proof that every material future change is detected before evidence stales. |
| `REQ-COMP-035` | **PARTIALLY_COMPLIANT** | Document controls, stable `DOC-*` identities and PR #775 Governance decision evidence exist. | Documentary/PVC-03 lifecycle return remains; external record-keeping duties remain regime/scope-specific. |
| `REQ-COMP-036` | **PARTIALLY_COMPLIANT** | Verified-main workflow evidence provides exact-SHA release/deploy/provenance evidence for cited release baselines. | No fresh independent rollback execution/test established. |

## COMP-06 — evidence/owner-held review

All seven held inputs were rechecked against current-main repository evidence. PRs #776 and #777 add material implementation/roadmap evidence but do not yet satisfy the retained positive-assessment gates.

| Requirement | Current evidence state | Why still held | Required return / owner boundary |
|---|---|---|---|
| `REQ-COMP-017` | `EVIDENCE_MISSING` | provider inventory and some subprocessor/transfer evidence exist, but actual-provider role/DPA/contract/transfer/TIA/region evidence remains flow-specific and incomplete | Human/Legal + actual provider/domain owner; no guessed PVC before correlation |
| `REQ-COMP-019` | held / partial evidence | AI system inventory and transparency contract exist, but all material customer-facing/generated-content surfaces are not exhaustively evidenced | affected `CLIENT/PVC-01`, `DOC/PVC-03` or `FINTECH/PVC-17` owner after scope correlation; Legal gate where applicable |
| `REQ-COMP-021` | `EVIDENCE_MISSING` | `AI_LITERACY_CONTROL.md` is a specification; attributable Human completion/acknowledgement evidence is absent | Human Owner/organizational operator; Compliance does not fabricate training records |
| `REQ-COMP-031` | `UNKNOWN / EVIDENCE_MISSING` | complete binding customer/provider/partner contract universe and effective versions are not established | Human/Legal + affected owner after contract correlation |
| `REQ-COMP-032` | `EVIDENCE_MISSING` | PR #776 implements a main-only encrypted backup / isolated restore evidence harness, but its own exit gate still lacks configured protected inputs, two successful scheduled backups, encrypted-artifact operating evidence, successful restore drill, measured ≤24 h RPO evidence, measured ≤60 min isolated DB restore RTO evidence and independent Security verification | `CAPITAL-AI-OPS / PVC-08` + independent `CAPITAL-AI-SEC` verification |
| `REQ-COMP-033` | held / incomplete | current traceability authorities exist, but end-to-end protected-action/compliance-event coverage and freshness are not fully evidenced; current DATA roadmap still treats Evidence Management security evidence as open | `CAPITAL-AI-OPS / PVC-18` transport and `CAPITAL-AI-DATA / PVC-10` persistence as actually affected |
| `REQ-COMP-034` | held / incomplete | DATA `ValidatedDataInput/1.0.0` is implemented upstream and FINTECH #777 preserves that boundary, but FIN-12 remains partial and FIN-20 remains open; exact feature/model/scoring/ranking provenance is not yet reproducible end to end | `CAPITAL-AI-DATA / PVC-09..11` upstream and `CAPITAL-AI-FINTECH / PVC-12..17` downstream |

## Legal/scope-held review

`REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain `NOT_ASSESSED` or legal/scope-held where competent Human/Legal determination is required. Repository engineering facts and official-source rechecks are factual inputs only and are not a substitute for a competent legal applicability/classification decision.

The 2026-09-06 official-source recheck confirms the already-recorded current legal-source surface for the EU AI Act and DORA and confirms current German DDG/TDDDG source availability. No new positive legal conclusion or repository authority is inferred from that recheck.

## Current findings preserved / changed by returned evidence

- `COMP-GAP-001`: **RESOLVED_ON_MAIN** — canonical `docs/projects/quality-management/` structure now exists; structural presence does not activate proposed authority.
- `COMP-GAP-002`: **RESOLVED_ON_MAIN** — ADR-0007 historical/non-authorizing lifecycle and document semantics aligned.
- `COMP-GAP-003`: **RESOLVED_ON_MAIN** — ESS-0006 v1.1.0 bounded component semantics.
- `COMP-GAP-004`: `EVIDENCE_MISSING / LEGAL_REVIEW`.
- `COMP-GAP-005`: `EVIDENCE_MISSING`.
- `COMP-GAP-006`: `NOT_ASSESSED / LEGAL_REVIEW`.
- `COMP-GAP-007`: `EVIDENCE_MISSING / OPEN`; PR #776 provides the recovery harness implementation, while operational execution evidence, measured RPO/RTO and independent Security verification remain pending.
- `COMP-GAP-008`: `PARTIALLY_COMPLIANT / OPEN`; Governance/PVC-05 decision is resolved by PR #775 with no registry change required, while Documentary/PVC-03 lifecycle return and Compliance reassessment remain open.

No unrelated finding closes because another requirement is compliant, a target PR merged, or CI/deployment passed.

## Post-merge code/evidence correlation

The post-merge review explicitly checked the existing technical boundary rather than assuming documentation completion implied code completion.

- Existing authorized Compliance component: `src/platform/Compliance/**` under ADR-0012 / ESS-0006.
- Current technical role: repository scanners, authorized `/api/compliance/*` routes, purpose-bound store, and evidence helpers.
- New Compliance-owned code requirement after PRs #768, #775, #776 and #777: **none identified**.
- PR #775 resolves the Governance Document Registry decision with no registry change required; it does not authorize Compliance-local runtime code.
- PR #776 creates foreign OPS/PVC-08 recovery instrumentation; Compliance consumes its evidence state but does not execute or configure the protected workflow inputs.
- PR #777 consolidates foreign FINTECH/PVC-12..17 planning and confirms remaining FIN-12/FIN-20 work; Compliance consumes the returned state without implementing FINTECH code.
- Current remaining findings require foreign owner evidence/remediation or Human/Legal decisions, not new local Compliance runtime code.
- Therefore `CODE_DELTA_REQUIRED = NO`; this is a positive scope determination, not a skipped implementation.

## Foreign evidence rule

Compliance records the affected `PVC-*` / Primary Owner and waits for returned evidence. It does not execute foreign Security hardening, runtime remediation, recovery workflow configuration/runs, provider contracts, organizational training, Documentary lifecycle implementation, DATA/FINTECH technical remediation or Legal Review. Unresolved technical ownership remains `REQUIRES_CORRELATION`; unresolved legal interpretation remains `NOT_ASSESSED` with explicit `LEGAL_REVIEW` where applicable.

## Closeout exit gate

The local COMP-06 review is `EXECUTED_HELD`: all held requirements have an explicit current evidence state, limitation and return owner/gate. The bounded local roadmap closeout is Human-merged and its exact-head hosted checks passed. PRs #775, #776 and #777 have been consumed as subsequent decision/evidence returns without falsely promoting remaining Documentary, recovery or DATA→FINTECH lineage gates to resolved. That is completion of the local evidence-review/closeout step, not proof that the external evidence gaps are closed.
