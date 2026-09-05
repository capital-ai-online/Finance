# CAPITAL-AI Compliance Evidence Report

**Document ID:** `DOC-COMP-EVIDENCE-REPORT-2026-08-31`  
**Role:** evidence assessment / non-authorizing  
**Version:** 1.5.0  
**Date:** 2026-09-05  
**Baseline:** `main@611e4c07cd13c146b3a0e0f5e5e5c37117697f0d`  
**Scope:** COMP-04 evidence-based assessment of the 23 `READY_NOW` requirements

## Evidence principle

Evidence priority is Runtime/Provider → Code/Configuration → Hosted CI → Registry/Control → Approved Documentation → Roadmap Claims. Historical evidence is not automatic current proof. Open Pull Requests are correlation input, not merged-main evidence. `EVIDENCE_READY` is not `VERIFIED`.

Approved assessment vocabulary:

`COMPLIANT` · `PARTIALLY_COMPLIANT` · `NON_COMPLIANT` · `NOT_APPLICABLE` · `NOT_ASSESSED` · `EVIDENCE_MISSING`.

`COMPLIANT` is always bounded to the explicitly evidenced scope and is not a certification, blanket legal-compliance conclusion or permanent future-state assertion.

## Current execution baseline

- Current trust root: `/AGENTS.md` v2.7.1.
- Current main: `611e4c07cd13c146b3a0e0f5e5e5c37117697f0d`, Human merge of PR #754.
- PR #754 changed only `public/google-analytics-consent.js` and `tests/unit/googleMarketingConsent.test.ts`; it is now current-main consent evidence.
- Current main CI run `33992619427` completed successfully. Both `build-and-test` and `Deployment verifiziert / Render-Produktion` are `success`; the deployment job verified the deployed commit identity and health against the expected main commit.
- The COMP-04 branch was synchronized with this main after the merge and preserved only the bounded COMP work as branch-owned changes.
- Open PR #755 (`CAPITAL-AI-GOV`, ADR-0007 Registry-Migration) is semantically relevant to `REQ-COMP-012` / `COMP-GAP-002`, but changes Governance-owned registry files only and is **not** current-main evidence while open.
- `CAPITAL-AI-COMP` remains cross-cutting with no productive `PVC-*` ownership.

## COMP-04 assessment — 23 `READY_NOW` requirements

### Result distribution

| Assessment | Count |
|---|---:|
| `COMPLIANT` | **7** |
| `PARTIALLY_COMPLIANT` | **13** |
| `NON_COMPLIANT` | **0** |
| `NOT_APPLICABLE` | **3** |
| `NOT_ASSESSED` | **0** |
| `EVIDENCE_MISSING` | **0** |
| **Total assessed** | **23** |

No `NON_COMPLIANT` status is assigned because no concrete control failure is demonstrated inside this bounded `READY_NOW` set. Incomplete scope is represented as `PARTIALLY_COMPLIANT`; benchmark/advisory-only inputs are `NOT_APPLICABLE` as binding obligations.

### Requirement-by-requirement assessment

| Requirement | Assessment | Evidence | Limitation / retained gate |
|---|---|---|---|
| `REQ-COMP-001` | **COMPLIANT** | Current `/AGENTS.md` v2.7.1 is the assessed trust root; `AUTH-GOV-AGENT-TRUST-ROOT` / `CTRL-GOV-TRUST-001` remain mapped and were re-read before protected work. | Bounded to repository/current-work execution; no claim about every external client or future run. |
| `REQ-COMP-002` | **PARTIALLY_COMPLIANT** | `CTRL-COMPLIANCE-CLAIM-001` exists; Compliance artifacts prohibit unsupported certification/regulatory claims; `privacyPolicy.ts` explicitly disclaims external DSGVO certification. | No exhaustive scan of every public/product/marketing output surface was executed. |
| `REQ-COMP-003` | **COMPLIANT** | Work uses `agent/compliance-comp-04-reassessment-baseline-20260905`, a project-qualified scoped branch; no direct-main mutation. | Per-work-item evidence; future work requires its own branch. |
| `REQ-COMP-004` | **COMPLIANT** | Main, branch merge-base, open PRs and overlap were re-correlated after PR #754 merged; branch was synchronized to current main. | Must be repeated immediately before PR readiness/creation. |
| `REQ-COMP-005` | **PARTIALLY_COMPLIANT** | `CTRL-SDLC-PR-CREATE-001` is current; PR #753 repository metadata records exact main/head correlation and Human/Owner gate handling; no COMP-04 PR exists yet. | Human chat approval is not a standalone current-main repository artifact; every future PR needs fresh exact-state approval. |
| `REQ-COMP-006` | **COMPLIANT** | PR #753 exact-head hosted CI/Governance/Container-Security completed successfully; current main has independent successful hosted CI. | Exact-identity evidence only; future PR heads require fresh hosted checks. |
| `REQ-COMP-007` | **COMPLIANT** | PR #753 and PR #754 are Human-merged; `/AGENTS.md` and `CTRL-MERGE-HUMAN-001` retain Human/CODEOWNER-only merge authority. | Demonstrates observed/current merge boundary, not every historical/future PR. |
| `REQ-COMP-008` | **COMPLIANT** | Verified-main is the sole production promotion path; run `33992619427` completed build/test, provenance, Render deployment and deployed-commit/health verification for current `main@611e4c07...`. | Release-specific; no future-release or unrelated operational assurance. |
| `REQ-COMP-009` | **PARTIALLY_COMPLIANT** | `CTRL-SEC-LEASTPRIV-001`; repository evidence includes RLS, service-role separation and fail-closed consent/auth patterns. | Current Security/OPS roadmaps retain unresolved findings/evidence, so no blanket least-privilege closure. Foreign remediation stays with actual Primary Owner. |
| `REQ-COMP-010` | **PARTIALLY_COMPLIANT** | `CTRL-SEC-SECRET-001`; covered flows document encrypted OAuth tokens, service-role-only access and no browser token disclosure. | No fresh repository-wide secret-exposure/scanner result covering every secret-bearing surface. |
| `REQ-COMP-011` | **PARTIALLY_COMPLIANT** | `AUTH-GOV-DOCUMENT-LIFECYCLE`, `CTRL-GOV-DOC-001`, `CTRL-GOV-DOC-ROLE-001`; COMP artifacts use canonical `docs/compliance/**` placement and stable `DOC-*` identities. | `COMP-GAP-008` persists: Compliance document-registry treatment/ownership is not fully resolved. |
| `REQ-COMP-012` | **PARTIALLY_COMPLIANT** | `/AGENTS.md`, `CTRL-GOV-HIST-001`, `CTRL-GOV-AUTH-002` prevent historical material regaining authority by citation; COMP-03 does not use ADR-0007 as current authority. | `COMP-GAP-002` and `COMP-GAP-003` remain open. PR #755 proposes a historical/non-authorizing ADR-0007 registry migration but is open and cannot close the gap until Human merge and COMP reassessment. |
| `REQ-COMP-013` | **PARTIALLY_COMPLIANT** | `privacyPolicy.ts` enumerates processing purpose, categories, legal basis, recipients, transfer, retention and controls; ADR-0095 provides privacy single-source boundary. | Exact lawful basis, role, provider/transfer facts and legal sufficiency remain processing-specific. |
| `REQ-COMP-014` | **PARTIALLY_COMPLIANT** | Versioned privacy/accountability records exist. Current main now includes PR #754: Google consent defaults fail closed, GA4/AdSense load only after category consent, generic CookieHub status changes do not force reload, and relevant explicit revocation reloads once; unit tests cover these states. | This strengthens consent/transparency evidence but does not exhaustively prove completeness/currentness of every processing/public/product surface. |
| `REQ-COMP-015` | **PARTIALLY_COMPLIANT** | `server/privacy.ts` creates/lists `privacy_requests`; migration `20260819010000_privacy_governance_and_requests.sql` establishes table/RLS; production evidence records deployed table/RLS. Request types cover access, rectification, erasure, restriction, objection and portability. | Full end-to-end fulfilment for every type, external-provider deletion and coordinated erasure were not freshly re-executed. |
| `REQ-COMP-016` | **PARTIALLY_COMPLIANT** | ADR-0092, retention migration `20260819103000_privacy_retention_lifecycle_hardening.sql`, production evidence and per-activity retention statements establish concrete lifecycle controls. | Operational purge execution, provider-side retention, every statutory period and hold governance were not independently revalidated now. |
| `REQ-COMP-024` | **NOT_APPLICABLE** | COMP-01/02 classify ISO/IEC 27001:2022 as not applicable as binding repository/legal authority; existing SoA is dated benchmark evidence only. | Optional benchmark use remains possible; no certification conclusion is inferred. |
| `REQ-COMP-025` | **NOT_APPLICABLE** | `/AGENTS.md` and `STANDARDS_CROSSWALK.md` treat ISO/IEC 42001:2023 as a non-certifying/non-authorizing management-system benchmark mapped through `CTRL-AIMS-PDCA-001`. | Any future assurance/certification target needs separate Owner scope and evidence. |
| `REQ-COMP-028` | **NOT_APPLICABLE** | OWASP/CIS remain advisory/security-method inputs only when correlated to current internal controls; citation alone creates no requirement/gap. | Advisory Security use remains permitted; status concerns binding applicability only. |
| `REQ-COMP-029` | **COMPLIANT** | Current Compliance process requires scope-adequate evidence before positive conclusions; this assessment preserves owner/legal/evidence gaps instead of promoting mappings, merges or roadmap claims into proof. | Compliance-process control only; does not prove every underlying domain requirement. |
| `REQ-COMP-030` | **PARTIALLY_COMPLIANT** | COMP-08 change-impact flow exists; PR #754 merge caused current-main re-correlation; newly opened PR #755 was detected and is held as correlation-only input. | No complete automated proof that every material provider/model/data/market/user/purpose/deployment/content/authority change is detected before evidence stales. |
| `REQ-COMP-035` | **PARTIALLY_COMPLIANT** | Document controls, stable `DOC-*` identities, privacy request/accountability records and retention metadata provide record/lifecycle evidence. | `COMP-GAP-008` remains; external record-keeping duties remain regime/scope-specific. |
| `REQ-COMP-036` | **PARTIALLY_COMPLIANT** | Current verified-main run `33992619427` provides successful release path, exact-SHA provenance and verified production identity for `611e4c07...`; rollback remains an explicit Release/OPS capability. | No fresh independent rollback execution/test for this release was established; deployment PASS alone is insufficient for full rollback evidence. |

## Assessment sets

- **COMPLIANT (7):** `REQ-COMP-001`, `003`, `004`, `006`, `007`, `008`, `029`.
- **PARTIALLY_COMPLIANT (13):** `REQ-COMP-002`, `005`, `009`, `010`, `011`, `012`, `013`, `014`, `015`, `016`, `030`, `035`, `036`.
- **NOT_APPLICABLE (3):** `REQ-COMP-024`, `025`, `028` — binding-authority scope only.

## Requirements intentionally not upgraded

`EVIDENCE_OR_OWNER_HELD`: `REQ-COMP-017`, `019`, `021`, `031`, `032`, `033`, `034` remain evidence/owner-held. Provider/transfer evidence, AI output evidence, Human AI-literacy records, contractual universe, measured recovery and end-to-end traceability/provenance evidence remain incomplete or await independent return.

`LEGAL_OR_SCOPE_HELD`: `REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain `NOT_ASSESSED` with explicit Human/Legal scope gates where applicable. `LEGAL_REVIEW` is an external decision gate, not a seventh COMP-04 assessment status.

## Current findings preserved

- `COMP-GAP-002` ADR-0007: `PARTIALLY_COMPLIANT / OPEN`; PR #755 is open correlation input only.
- `COMP-GAP-003` ESS-0006: `PARTIALLY_COMPLIANT / OPEN`, Governance-owned after ADR-0007 lifecycle resolution.
- `COMP-GAP-004`: `EVIDENCE_MISSING / LEGAL_REVIEW`.
- `COMP-GAP-005`: `EVIDENCE_MISSING`.
- `COMP-GAP-006`: `NOT_ASSESSED / LEGAL_REVIEW`.
- `COMP-GAP-007`: `EVIDENCE_MISSING / OPEN`, `CAPITAL-AI-OPS / PVC-08`.
- `COMP-GAP-008`: `PARTIALLY_COMPLIANT / OPEN`, Documentary/Governance boundary.
- DATA realtime-newsfeed entitlement remains implementation evidence with independent verification pending.
- FINTECH verified-screening and financial-analysis entitlement children remain open under FINTECH ownership.

No finding closes because another scoped requirement is `COMPLIANT`, because a PR exists, or because CI/deployment passed.

## Evidence sources used

`/AGENTS.md` v2.7.1; project/PVC mappings; Compliance requirements/mapping; current control/authority/ADR/ESS registries; `STANDARDS_CROSSWALK.md`; `privacyPolicy.ts`; `server/privacy.ts`; privacy migrations and production evidence; relevant GOV/OPS/DATA/FINTECH/SEC/DOC roadmaps; PR #753 evidence; Human-merged PR #754 plus its consent runtime/tests; current-main workflow `33992619427`; PR #755 metadata as correlation-only evidence.

## Foreign evidence rule

Compliance records affected `PVC-*` / Primary Owner and waits for returned evidence. It does not execute foreign Security hardening, runtime remediation, provider contracts, organizational training, registry mutation or Legal Review. Unresolved technical ownership remains `REQUIRES_CORRELATION`; unresolved legal interpretation remains `NOT_ASSESSED` with explicit `LEGAL_REVIEW` where applicable.

## COMP-04 slice exit gate

**PASS at this document state, subject to final branch/main correlation:** all 23 `READY_NOW` requirements have exactly one approved assessment status, named evidence and an explicit limitation. Held requirements and foreign/legal gates remain explicit rather than silently closed.
