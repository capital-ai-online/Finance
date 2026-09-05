# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.6.0  
**Date:** 2026-09-05  
**Current-main reconciliation baseline:** `main@a5026e194e243d556c91e2749da8f405e946c025`  
**Status:** ACTIVE — COMP-04 READY_NOW 23/23 ASSESSED / NON-AUTHORIZING  
**Primary Project Value Chain ownership:** none (`[]`)

## Mission and ownership boundary

`CAPITAL-AI-COMP` owns applicability, requirement/control mapping, evidence-based assessment, findings, evidence sufficiency, regulatory traceability, remediation handoff and continuous reassessment. It owns no productive `PVC-*` stage, does not implement foreign remediation and does not replace Human/Legal Review.

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

1. `/AGENTS.md` v2.7.1 and `main@a5026e194e243d556c91e2749da8f405e946c025` are the current execution baseline.
2. `COMP-01` remains executed/continuous with explicit Legal Review and evidence gates.
3. `COMP-02` has 37 active inputs; retired `REQ-COMP-026/027` remain historical and excluded.
4. Human-merged PR #753 established the 37/37 COMP-03 control/owner mapping without new authority.
5. Human-merged PR #754 is current-main Google consent runtime/test evidence.
6. Human-merged Governance PR #755 migrated ADR-0007 into the ADR/Authority registries with stable ID `AUTH-ADR-COMPLIANCE-VALUE-CHAIN-0007`, lifecycle `historical`, explicitly non-authorizing.
7. The COMP-04 branch has been synchronized after both later Human merges and retains only bounded COMP-owned changes in its net diff.
8. Final pre-PR correlation sees **1 open Pull Request against main: PR #757 / CAPITAL-AI-GOV**. Its four changed files are `.ai/registry/ess-registry.json`, `.ai/skills/ESS-0006-Security-Compliance.md`, `docs/projects/governance/COMPONENT_ARCHITECTURE_MATRIX.md` and `docs/projects/governance/ROADMAP.md`; there is no changed-file overlap with COMP-04. PR #757 is semantically relevant to `COMP-GAP-003` but remains non-main evidence until Human merge and subsequent reassessment.
9. Foreign remediation remains with the actual Primary Owner; Security verification remains Security-owned; legal applicability/accepted-risk decisions remain Human/Legal/Owner-controlled.

## COMP-04 assessment universe

Active inputs: **37**. Retired historical inputs excluded: **2**.

| Queue | Count | State after this slice |
|---|---:|---|
| `READY_NOW` | **23** | **23/23 ASSESSED** |
| `EVIDENCE_OR_OWNER_HELD` | **7** | retained explicitly |
| `LEGAL_OR_SCOPE_HELD` | **7** | retained explicitly |
| **Total active** | **37** | fully partitioned |

## READY_NOW assessment result

The canonical requirement-by-requirement Evidence + Limitation detail is `reports/COMPLIANCE_EVIDENCE_REPORT.md` v1.6.0.

| Assessment | Count | Requirements |
|---|---:|---|
| `COMPLIANT` | **8** | `001`, `003`, `004`, `006`, `007`, `008`, `012`, `029` |
| `PARTIALLY_COMPLIANT` | **12** | `002`, `005`, `009`, `010`, `011`, `013`, `014`, `015`, `016`, `030`, `035`, `036` |
| `NON_COMPLIANT` | **0** | none demonstrated in this bounded set |
| `NOT_APPLICABLE` | **3** | `024`, `025`, `028` — binding-authority scope only |
| `NOT_ASSESSED` | **0** | none inside `READY_NOW` |
| `EVIDENCE_MISSING` | **0** | none inside `READY_NOW`; evidence-missing inputs remain held |

`COMPLIANT` is bounded to the stated evidence scope only and is not a certification, blanket legal-compliance statement or permanent future-state claim.

### Evidence delta from PR #754

Current main contains fail-closed Google consent defaults, category-gated GA4/AdSense loading, non-disruptive generic status changes and one-time reload on relevant explicit revoke, with unit-test coverage. This strengthens `REQ-COMP-014`, but the status remains `PARTIALLY_COMPLIANT` because complete/current transparency over every processing/public/product surface is not exhaustively proven.

### Evidence delta from PR #755

ADR-0007 now has a stable registry identity and `historical` / non-authorizing lifecycle. The lifecycle/authority portion of `COMP-GAP-002` is therefore `RESOLVED_ON_MAIN`, and `REQ-COMP-012` can be assessed `COMPLIANT` for the bounded historical-authority requirement. This does **not** re-authorize legacy legal/certification claims or a parallel Compliance value chain. `COMP-GAP-003` / ESS-0006 remains a separate open Governance clarification gap on current main; open PR #757 proposes Governance-owned clarification but is not merged-main evidence and does not alter this assessment.

## Held sets — unchanged

### EVIDENCE_OR_OWNER_HELD — 7

`REQ-COMP-017`, `019`, `021`, `031`, `032`, `033`, `034` remain held because provider/transfer evidence, AI output evidence, Human AI-literacy records, contract-universe evidence, measured recovery or end-to-end traceability/provenance evidence is incomplete or awaiting independent owner/verifier return.

### LEGAL_OR_SCOPE_HELD — 7

`REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain `NOT_ASSESSED` with explicit Human/Legal gates where applicable. `LEGAL_REVIEW` is an external decision gate, not an additional COMP-04 assessment status.

## Material limitations retained

- `REQ-COMP-009/010`: existing Security controls and scoped evidence do not close repository-wide Security/secret residuals.
- `REQ-COMP-011/035`: `COMP-GAP-008` document-registry treatment remains open at the Documentary/Governance boundary.
- `REQ-COMP-013..016`: privacy, data-subject-request, consent and retention evidence supports bounded partial assessments only; no blanket GDPR sufficiency is claimed.
- `REQ-COMP-030`: repeated change-impact execution is evidenced, but exhaustive automated trigger coverage is not established.
- `REQ-COMP-036`: verified-main workflow `33992951411` successfully built, attested, deployed and post-deploy verified current `main@a5026e194e243d556c91e2749da8f405e946c025`; a fresh independent rollback execution/test is not established.
- `COMP-GAP-003` ESS-0006 remains open on current main. Open Governance PR #757 is correlation input only and cannot close the finding before Human merge and Compliance reassessment.

## Current Compliance findings

| Finding | Current state | Owner / gate |
|---|---|---|
| `COMP-GAP-002` ADR-0007 lifecycle/authority ambiguity | `RESOLVED_ON_MAIN` | historical/non-authorizing migration via Human-merged PR #755; no legacy reauthorization |
| `COMP-GAP-003` ESS-0006 | `PARTIALLY_COMPLIANT / OPEN` | Governance clarification remains; PR #757 is open/non-main and does not yet close the finding |
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

## Evidence and standards boundary

Preferred evidence order remains Runtime/Provider → Code/Configuration → exact-identity Hosted CI → Registry/Control → Approved Documentation → Roadmap Claims. Historical evidence is not automatic current proof and `EVIDENCE_READY` is not `VERIFIED`.

ISO/IEC 42001:2023 remains a non-certifying Governance benchmark. ISO/IEC 27001, OWASP and CIS remain bounded benchmark/advisory inputs. NIST remains withdrawn from the current Governance baseline. Engineering alignment creates no certification, regulated-status or complete legal-compliance conclusion.

## COMP-04 READY_NOW exit gate

**PASS at this branch document state, subject to final main/open-PR correlation before PR creation:**

- all **23/23** `READY_NOW` requirements have exactly one six-value assessment status;
- each has named current evidence and explicit limitations in the Evidence Report;
- `EVIDENCE_MISSING`, `NOT_ASSESSED`, `LEGAL_REVIEW` and foreign-owner gates remain explicit outside the READY_NOW set;
- returned ADR-0007 evidence closes only its proven lifecycle/authority gap;
- no foreign implementation, Security verification, Legal Review or shared registry mutation is claimed by Compliance;
- open PR #757 is correlated as non-main evidence and is not treated as a merged closure;
- PR creation remains separately subject to exact main/head Human/Owner approval; merge remains Human/CODEOWNER-only.
