# CAPITAL-AI Compliance

**Project ID:** `CAPITAL-AI-COMP`  
**Display name:** CAPITAL-AI Compliance  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Domain:** Compliance  
**Document ID:** `DOC-COMP-PROJECT-README-2026-08-31`  
**Document role:** projection / project index  
**Version:** 1.2.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Date:** 2026-09-06  
**Status:** ACTIVE — NON-AUTHORIZING COMPLIANCE ASSESSMENT INDEX  
**Owner:** CAPITAL-AI Owner / Compliance  
**Current baseline:** `main@7fe061a897f669fd21ca4c46e564351e14f1c7dc`

## Purpose

`CAPITAL-AI-COMP` is the project execution surface for Compliance assessment work. It owns applicability, requirement/control mapping, compliance assessment, findings, evidence sufficiency, regulatory traceability, remediation handoff and continuous reassessment.

It owns **no productive `PVC-*` stage**:

```yaml
primary_value_chain_ownership: []
```

Compliance does not implement foreign-domain remediation. Technical and organizational implementation remains with the Primary Owner of the affected project stage; competent Human/Legal decisions remain external gates where required.

```text
External / Internal Requirement
→ Applicability
→ Existing CAPITAL-AI Authority / Control
→ Primary Owner implementation or Human/Legal decision
→ Evidence
→ Compliance Assessment
→ Compliance Finding
→ Remediation Handoff
→ Primary Owner remediation / evidence return
→ Compliance Verification
→ Continuous Compliance
```

## Canonical ownership routing

Current ownership resolves only through:

- `docs/projects/README.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`.

Current handoff marker:

```text
[COMPLIANCE_HANDOFF -> <TARGET_PROJECT_OR_GATE> | PVC-<NN>]
```

If productive ownership cannot be determined before a provider/legal/scope decision, use `PVC-N/A — REQUIRES_CORRELATION`; do not guess a stage.

Historical `VC-*` handoff labels are migration/audit history only and are not current ownership authority.

## Authority boundary

Authority remains with effective repository sources on current `main`, especially:

- `/AGENTS.md` — repository trust root and instruction surface;
- `docs/governance/authority-registry.json` — stable `AUTH-*` identities;
- `docs/governance/control-catalog.json` — existing `CTRL-*` controls;
- `docs/adr/registry.json` and `.ai/registry/ess-registry.json` — ADR/ESS lifecycle and namespace state;
- applicable current ADR/ESS/contracts for implementation decisions.

Roadmaps, assessments, findings, reports, requirements inventories and evidence in this project are non-authorizing unless an existing authority explicitly says otherwise. External requirements do not become repository Architecture Authority merely because Compliance maps them.

ESS-0006 v1.1.0 is a bounded component specification for the existing `src/platform/Security` and `src/platform/Compliance` technical boundaries. It does not create a second Requirement Registry, Compliance runtime, Security authority, legal determination or productive project ownership.

## Workstreams

The V2.1 execution model has exactly eight Compliance workstreams:

| WP | Name | Compliance-owned outcome | Current state |
|---|---|---|---|
| `COMP-01` | Applicability | source-backed applicability decision or explicit Legal Review state | `EXECUTED_CONTINUOUS` |
| `COMP-02` | Requirements | source/version/scope-backed requirement inventory | `DONE_ON_MAIN / CONTINUOUS` |
| `COMP-03` | Control Mapping | mapping to existing `AUTH-*` / `CTRL-*` / ADR / ESS and current Primary Owner/PVC | `DONE_ON_MAIN` |
| `COMP-04` | Assessment | evidence-based assessment status | `DONE_ON_MAIN` |
| `COMP-05` | Findings | normalized compliance finding lifecycle and priority | `EXECUTED_CURRENT` |
| `COMP-06` | Evidence | provenance-bound evidence inventory and sufficiency status | `EXECUTED_HELD` |
| `COMP-07` | Remediation Handoff | assignment to affected Primary Owner/gate; no foreign execution | `EXECUTED_HELD` |
| `COMP-08` | Continuous Compliance | change-impact reassessment and evidence freshness review | `EXECUTED_CONTINUOUS` |

No `COMP-09` or higher workstream is valid in the V2.1 model. Earlier branch-draft references are migration history only.

## Finding lifecycle

```text
DISCOVERED
→ TRIAGED
→ APPLICABILITY_CONFIRMED
→ GAP_CONFIRMED
→ REMEDIATION_ASSIGNED
→ IMPLEMENTED
→ EVIDENCE_READY
→ VERIFIED
→ CLOSED
```

Allowed alternate/terminal states include `NOT_APPLICABLE`, `ACCEPTED_RISK`, `LEGAL_REVIEW`, `DEFERRED`, `SUPERSEDED` and `RESOLVED_ON_MAIN` where current-main evidence closes the bounded finding. `ACCEPTED_RISK` requires competent Human/Owner authority.

A merged target PR, roadmap claim or `EVIDENCE_READY` marker alone is not enough for Compliance closure; returned evidence is independently reassessed.

## Evidence priority

```text
Runtime / Provider Evidence
→ Code / Configuration
→ exact-identity Hosted CI
→ Registry / Control Evidence
→ Signed / Approved Documentation
→ Roadmap Claims
```

Evidence gaps remain explicit. Missing evidence is not converted into a positive compliance status.

## Current finding summary

Resolved on current main:

- `COMP-GAP-001` — canonical QM project structure now exists;
- `COMP-GAP-002` — ADR-0007 historical/non-authorizing lifecycle resolved by Human-merged Governance work;
- `COMP-GAP-003` — ESS-0006 stale semantics resolved by v1.1.0 revalidation.

Still externally held/open:

- `COMP-GAP-004` — provider/vendor/transfer evidence and legal interpretation;
- `COMP-GAP-005` — attributable Human AI-literacy evidence;
- `COMP-GAP-006` — DORA entity/activity applicability decision;
- `COMP-GAP-007` — OPS measured backup/restore/RPO/RTO evidence;
- `COMP-GAP-008` — Documentary/Governance document-registry treatment.

## Change-impact rule

New or changed features, AI models, data sources, providers, markets/countries, user types, processing purposes, deployment models, external integrations, authority/control state, legal-source versions or evidence freshness trigger:

```text
Change
→ COMP-08 impact review
→ COMP-01 applicability reassessment
→ COMP-02 changed requirements
→ COMP-03 control/owner/PVC impact
→ COMP-06 evidence impact
→ COMP-04 reassessment
→ COMP-05 finding when needed
→ COMP-07 handoff when remediation belongs elsewhere
```

## External standards and claim rule

ISO/IEC 42001:2023 remains the current Governance management-system benchmark. Other standards or guidance are used only within their current repository-authorized advisory/benchmark scope. NIST remains withdrawn from the current Governance baseline unless a future explicit Human/Owner decision re-adopts an exact source/version/scope.

This project must not claim `ISO certified`, `fully compliant`, `AI Act compliant`, `GDPR compliant`, `SOC compliant` or `audit passed` without scope-appropriate evidence and competent confirmation. Prefer precise states such as `mapped`, `assessed`, `partially evidenced`, `control implemented`, `evidence missing`, `verification pending` or `not assessed`.

## Pull-request boundary

- agent-managed branch naming and PR naming are taken **only** from current `/AGENTS.md`;
- for this project, the current branch slug is `compliance` and the project ID is `CAPITAL-AI-COMP`;
- a ChatGPT-created PR therefore uses the current canonical form `[CAPITAL-AI-COMP] [ChatGPT] <compact-title>`;
- one bounded work item uses one scoped branch; related local Compliance document changes may be consolidated when they form one coherent work item and do not cross ownership boundaries;
- technical remediation uses the target project's work item/branch/PR, not the Compliance branch;
- explicit Human/Owner PR-creation approval is required for the exact correlated `main SHA` + `branch head SHA` and exact intended PR title;
- merge remains Human/CODEOWNER-only;
- direct `main` edits are prohibited.

## Project structure

```text
docs/compliance/CAPITAL-AI-COMP/
├── README.md
├── CAPITAL_AI_COMPLIANCE_ROADMAP.md
├── inventory/
├── mappings/
├── work-packages/
├── reports/
└── traceability/
```

Detailed state lives in the canonical roadmap, requirement/applicability inventories, mapping surfaces, handoff register, reports and traceability matrix. This README is navigation and must not become a second roadmap or authority plane.
