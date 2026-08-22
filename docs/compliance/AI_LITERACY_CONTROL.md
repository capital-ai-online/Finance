# AI Literacy Control

**Status:** CONTROL DEFINED — HUMAN COMPLETION EVIDENCE REQUIRED  
**Date:** 2026-08-22  
**Owner:** Security & Compliance / CAPITAL-AI Owner  
**Parent authorities:** ESS-0019 · ADR-0096

## Purpose

Define the repository-side control supporting role-appropriate AI literacy. This document does not fabricate attendance/completion evidence and does not certify legal compliance by itself.

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

| Role | Minimum emphasis |
|---|---|
| Owner / Governance | authority hierarchy, legal/applicability gates, Human approvals, risk acceptance |
| Developer / Agent operator | provider/model boundaries, prompt/system instruction limits, RAG/grounding/citation, tests, secrets |
| Security / Compliance | AI-system inventory, risk/reclassification triggers, provenance, audit evidence, incident response |
| Marketing / Content | AI-origin disclosure, synthetic-content policy, no fabricated financial/regulatory claims, brand/content approval |
| Business/research user | interpretation limits, evidence status, uncertainty, no reliance on AI explanation as investment approval |

## Completion evidence

Human training completion must be recorded outside model-generated assertions with at least:

- role/person or governed role cohort;
- curriculum/control version;
- completion date;
- method/provider;
- acknowledgement/assessment evidence where required;
- refresh due date.

Until this evidence exists, the control status remains `CONTROL DEFINED — HUMAN COMPLETION EVIDENCE REQUIRED`.

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
