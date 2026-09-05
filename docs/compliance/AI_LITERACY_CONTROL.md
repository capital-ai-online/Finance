# AI Literacy Control

**Status:** CONTROL DEFINED — COMP-01 APPLICABILITY EXECUTED — HUMAN COMPLETION EVIDENCE REQUIRED  
**Date:** 2026-09-05  
**Owner:** Security & Compliance / CAPITAL-AI Owner  
**Parent authorities:** ESS-0019 · ADR-0096  
**COMP-01 baseline:** `main@04258ce9122dd600707aa25feb431282c715d104`

## Purpose

Define the repository-side control supporting role-appropriate AI literacy and record the current COMP-01 factual/applicability assessment. This document does not fabricate attendance/completion evidence and does not certify legal compliance by itself.

## Current legal-source correlation

The consolidated Regulation (EU) 2024/1689 as of 27 July 2026 retains Article 4 on AI literacy and the staged application rules. Article 4 is relevant to providers and deployers within its scope. CAPITAL-AI therefore treats AI literacy as a material applicability candidate, while the exact legal-role conclusion remains bounded by the system-specific provider/deployer analysis in `AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md`.

Official source used for this COMP-01 correlation:

- `https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng`

This correlation is not legal advice and does not itself determine that every listed CAPITAL-AI role is legally subject to Article 4.

## COMP-01-D applicability result

| Question | Current evidence | Result |
|---|---|---|
| Does CAPITAL-AI use/operate AI-assisted systems and model tooling? | current AI-system inventory documents user-facing AI chat, AI explanations, Documentary AI, marketing/content assistance and research/evidence tooling | `YES — FACTUAL SCOPE PRESENT` |
| Is an AI-literacy control defined? | this control defines competency domains and role profiles | `YES — CONTROL DEFINED` |
| Are legal provider/deployer roles conclusively classified for every material system? | current repository evidence retains role classification as system-specific and partly unresolved | `NO — LEGAL ROLE REVIEW REMAINS` |
| Does repository evidence prove Human completion/training? | no attributable role/person or governed-cohort completion records are established by current repository evidence | `NO — EVIDENCE_MISSING` |
| Can a model-generated statement close the evidence gap? | completion must be recorded outside model-generated assertions | `NO — PROHIBITED` |

**Bounded COMP-01 status:** `PARTIALLY_APPLICABLE / EVIDENCE_MISSING / LEGAL_REVIEW WHERE ROLE INTERPRETATION IS REQUIRED`.

The applicability work item is executed because factual scope, control existence, missing evidence and Legal Review boundary are explicit. The compliance obligation is not asserted as fully satisfied.

## Required competency domains

Every role operating, reviewing or publishing AI-assisted CAPITAL-AI output must receive role-appropriate coverage of:

1. **Provider profile vs authority** — AI provider/model choice never grants repository, financial, security or compliance authority.
2. **Domain-specific system instructions** — instructions constrain model behavior but cannot override IAM/Governance/financial contracts.
3. **RAG** — retrieval provides context/evidence candidates; retrieval is not proof of grounding.
4. **Grounding** — material claims require support from allowed evidence and independent verification where the control requires it.
5. **Citation** — citations must identify actual supporting sources; the model must not invent references.
6. **Provenance** — source/provider/time/version lineage is distinct from the natural-language explanation.
7. **Human oversight** — model/self-review never substitutes for Human/Owner approval where required.
8. **Financial boundaries** — AI explanations cannot invent or approve prices, scores, ranking, eligibility, OrderIntent, live execution or settlement.
9. **Security** — secrets, credentials, privileged instructions and external/retrieved content require least-privilege/untrusted-input treatment.
10. **Transparency** — AI-generated content must use the application transparency controls appropriate to its surface.
11. **Incident/kill switch** — know when to stop automated operation and escalate through current Security/Governance controls.

## Role profiles

| Role | Minimum emphasis | Current completion evidence |
|---|---|---|
| Owner / Governance | authority hierarchy, legal/applicability gates, Human approvals, risk acceptance | `EVIDENCE_MISSING` |
| Developer / Agent operator | provider/model boundaries, prompt/system instruction limits, RAG/grounding/citation, tests, secrets | `EVIDENCE_MISSING` |
| Security / Compliance | AI-system inventory, risk/reclassification triggers, provenance, audit evidence, incident response | `EVIDENCE_MISSING` |
| Marketing / Content | AI-origin disclosure, synthetic-content policy, no fabricated financial/regulatory claims, brand/content approval | `EVIDENCE_MISSING` |
| Business/research user | interpretation limits, evidence status, uncertainty, no reliance on AI explanation as investment approval | `EVIDENCE_MISSING` |

`EVIDENCE_MISSING` means the repository does not establish attributable Human completion for that role/cohort. It is not a statement that no individual has relevant competence.

## Completion evidence

Human training completion must be recorded outside model-generated assertions with at least:

- role/person or governed role cohort;
- curriculum/control version;
- completion date;
- method/provider;
- acknowledgement/assessment evidence where required;
- refresh due date.

Until this evidence exists, the control status remains `CONTROL DEFINED — HUMAN COMPLETION EVIDENCE REQUIRED`.

## Human/Legal handoff package

To close the remaining COMP-01-D gates, the competent Human/Owner or Legal reviewer should provide only the decision/evidence, not a predetermined conclusion:

1. confirm which CAPITAL-AI systems place the operator in an Article-4-relevant provider/deployer role;
2. identify the governed Human role/cohorts that require role-appropriate literacy measures;
3. retain real completion/acknowledgement/assessment evidence outside model-generated assertions;
4. record any bounded legal interpretation where a listed role/system is out of scope.

Compliance consumes the returned decision/evidence and reassesses independently. It does not fabricate training records or instruct Legal which conclusion to reach.

## Refresh triggers

Refresh literacy material when material changes occur to:

- AI provider/model/capability set;
- intended AI use cases;
- production/autonomy boundaries;
- transparency requirements;
- Security/Compliance policy;
- incident findings;
- applicable legal guidance.

## Non-authority boundary

AI literacy evidence does not authorize a feature, financial decision, deployment or compliance claim. It supports the Human competence/awareness control and remains subordinate to the relevant technical and legal authorities.
