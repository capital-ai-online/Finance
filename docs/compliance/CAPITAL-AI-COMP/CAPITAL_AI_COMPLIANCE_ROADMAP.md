# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.5.0  
**Date:** 2026-09-05  
**Current-main reconciliation baseline:** `main@611e4c07cd13c146b3a0e0f5e5e5c37117697f0d`  
**Status:** ACTIVE — COMP-04 READY_NOW ASSESSMENT EXECUTED / NON-AUTHORIZING  
**Primary Project Value Chain ownership:** none (`[]`)

## Mission and boundary

`CAPITAL-AI-COMP` owns applicability, requirement/control mapping, evidence-based assessment, findings, evidence sufficiency, regulatory traceability, remediation handoff and continuous reassessment. It owns no productive `PVC-*` stage, does not implement foreign remediation and does not replace Human/Legal Review.

Human-readable routing remains:

```text
Requirement / Finding
→ affected PVC / Primary Owner
→ target project Roadmap
→ applicable ADR / ESS
→ owner implementation / tests / evidence
→ independent Compliance reassessment
```

Project ownership resolves only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Missing evidence, unresolved legal scope and foreign-owner gaps never become PASS by inference.

## Current-main reconciliation — 2026-09-05

1. `/AGENTS.md` v2.7.1 and `main@611e4c07cd13c146b3a0e0f5e5e5c37117697f0d` are the current execution baseline.
2. `COMP-01` applicability work remains executed/continuous with explicit Legal Review and evidence gates.
3. `COMP-02` has 37 active requirement/assessment inputs; retired `REQ-COMP-026/027` remain historical and excluded.
4. Human-merged PR #753 established the 37/37 COMP-03 control/owner mapping without new authority.
5. Human-merged PR #754 changed only the Google marketing-consent runtime/test surface and is now current-main privacy/consent evidence.
6. Current-main workflow `33992619427` completed `build-and-test` and `Deployment verifiziert / Render-Produktion` successfully for `611e4c07...`.
7. The COMP-04 branch was synchronized after PR #754 merged; no FE changed-file overlap is retained in the COMP-owned net diff.
8. Open PR #755 is Governance-owned ADR-0007 registry migration. It is semantically relevant to `REQ-COMP-012` / `COMP-GAP-002` but remains open and therefore is not current-main evidence.
9. Foreign remediation remains with the actual Primary Owner; Security verification remains Security-owned; legal applicability/accepted-risk decisions remain Human/Legal/Owner-controlled.

## COMP-04 assessment universe

Active inputs: **37**. Retired historical inputs excluded: **2**.

| Queue | Count | State after this slice |
|---|---:|---|
| `READY_NOW` | **23** | **23/23 ASSESSED** |
| `EVIDENCE_OR_OWNER_HELD` | **7** | retained explicitly |
| `LEGAL_OR_SCOPE_HELD` | **7** | retained explicitly |
| **Total active** | **37** | fully partitioned |

### READY_NOW result — 23/23

The canonical evidence/status detail is `reports/COMPLIANCE_EVIDENCE_REPORT.md` v1.5.0.

| Assessment | Count | Requirements |
|---|---:|---|
| `COMPLIANT` | **7** | `001`, `003`, `004`, `006`, `007`, `008`, `029` |
| `PARTIALLY_COMPLIANT` | **13** | `002`, `005`, `009`, `010`, `011`, `012`, `013`, `014`, `015`, `016`, `030`, `035`, `036` |
| `NON_COMPLIANT` | **0** | none demonstrated in this bounded set |
| `NOT_APPLICABLE` | **3** | `024`, `025`, `028` — binding-authority scope only |
| `NOT_ASSESSED` | **0** | none inside `READY_NOW` |
| `EVIDENCE_MISSING` | **0** | none inside `READY_NOW`; evidence-missing inputs remain in the held queue |

`COMPLIANT` is bounded to the stated evidence scope only. It is not a certification, blanket legal-compliance statement or permanent future-state claim.

### EVIDENCE_OR_OWNER_HELD — unchanged

`REQ-COMP-017`, `019`, `021`, `031`, `032`, `033`, `034` remain held because provider/transfer evidence, AI output evidence, Human AI-literacy records, contract-universe evidence, measured recovery or end-to-end traceability/provenance evidence is incomplete or awaiting independent owner/verifier return.

### LEGAL_OR_SCOPE_HELD — unchanged

`REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain `NOT_ASSESSED` with explicit Human/Legal gates where applicable. `LEGAL_REVIEW` is an external decision gate, not an additional COMP-04 assessment status.

## Material assessment limitations retained

- `REQ-COMP-009/010`: existing Security controls and scoped technical evidence do not close repository-wide Security/secret evidence residuals.
- `REQ-COMP-011/035`: `COMP-GAP-008` document-registry treatment remains open at Documentary/Governance ownership boundary.
- `REQ-COMP-012`: ADR-0007 / ESS-0006 gaps remain open. PR #755 cannot be consumed as resolution before Human merge and subsequent COMP reassessment.
- `REQ-COMP-013..016`: current privacy, data-subject-request, consent and retention evidence supports bounded partial assessments only; no blanket GDPR sufficiency is claimed.
- `REQ-COMP-014`: PR #754 strengthens fail-closed consent runtime evidence but does not prove every transparency/processing surface complete.
- `REQ-COMP-030`: change-impact execution is evidenced in this cycle, but exhaustive automated trigger coverage is not established.
- `REQ-COMP-036`: current exact-SHA deploy evidence exists; a fresh independent rollback execution/test for this release is not established.

## Current findings preserved

| Finding | Current state | Owner / gate |
|---|---|---|
| `COMP-GAP-002` ADR-0007 | `PARTIALLY_COMPLIANT / OPEN` | `CAPITAL-AI-GOV / PVC-05`; PR #755 open only |
| `COMP-GAP-003` ESS-0006 | `PARTIALLY_COMPLIANT / OPEN` | Governance after ADR-0007 resolution |
| `COMP-GAP-004` vendor/transfer | `EVIDENCE_MISSING / LEGAL_REVIEW` | Human/Legal + actual provider/domain owner |
| `COMP-GAP-005` AI literacy | `EVIDENCE_MISSING` | Human/Owner evidence |
| `COMP-GAP-006` DORA | `NOT_ASSESSED / LEGAL_REVIEW` | Human/Legal |
| `COMP-GAP-007` recovery | `EVIDENCE_MISSING / OPEN` | `CAPITAL-AI-OPS / PVC-08` + Security verification |
| `COMP-GAP-008` document registry | `PARTIALLY_COMPLIANT / OPEN` | Documentary/Governance boundary |

DATA realtime-newsfeed entitlement remains implementation evidence with independent verification pending. FINTECH verified-screening and financial-analysis entitlement children remain foreign-open.

## Compliance workstreams

| WP | Workstream | Current state |
|---|---|---|
| `COMP-01` | Applicability | `EXECUTED / CONTINUOUS` |
| `COMP-02` | Requirements | `DONE_ON_MAIN / CONTINUOUS` |
| `COMP-03` | Control Mapping | `DONE_ON_MAIN` |
| `COMP-04` | Assessment / Verification | `ACTIVE — READY_NOW 23/23 ASSESSED` |
| `COMP-05` | Findings | `ACTIVE` — consume evidence-supported deltas only |
| `COMP-06` | Evidence | `ACTIVE` — refresh held/stale evidence without fabrication |
| `COMP-07` | Remediation assignment | `ACTIVE` — foreign work stays with Primary Owner |
| `COMP-08` | Continuous Compliance | `ACTIVE` — trigger on material fact/authority/evidence changes |

## Evidence model and standards boundary

Preferred evidence order remains Runtime/Provider → Code/Configuration → exact-identity Hosted CI → Registry/Control → Approved Documentation → Roadmap Claims. Historical evidence is not automatic current proof and `EVIDENCE_READY` is not `VERIFIED`.

ISO/IEC 42001:2023 remains a non-certifying Governance benchmark. ISO/IEC 27001, OWASP and CIS remain bounded benchmark/advisory inputs. NIST remains withdrawn from the current Governance baseline. Engineering alignment creates no certification, regulated-status or complete legal-compliance conclusion.

## COMP-04 READY_NOW exit gate

**PASS at this branch document state, subject to final main/open-PR correlation before PR readiness:**

- all **23/23** `READY_NOW` requirements have exactly one six-value assessment status;
- each has named current evidence and explicit limitations in the Evidence Report;
- `EVIDENCE_MISSING`, `NOT_ASSESSED`, `LEGAL_REVIEW` and foreign-owner gates remain explicit outside the READY_NOW set;
- no foreign implementation, Security verification, Legal Review or shared registry mutation is claimed by Compliance;
- no open PR is treated as merged-main evidence;
- PR creation remains separately subject to exact main/head Human/Owner approval; merge remains Human/CODEOWNER-only.
