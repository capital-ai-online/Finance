# CAPITAL-AI AI / FinTech Regulatory Control Matrix — 2026-08-19

**Document ID:** COMPLIANCE-AI-FINTECH-CONTROL-MATRIX-2026-08-19  
**Status:** GOVERNANCE BASELINE — applicability requires factual/legal classification  
**Owner:** CAPITAL-AI Owner / Security & Compliance  
**Review date:** 2026-08-19

> This matrix is an engineering/compliance traceability artifact, not legal advice. It deliberately separates **source requirement**, **applicability**, **repository evidence**, and **gap**. `TBD` must not be interpreted as compliant or non-applicable.

## Source baseline

| Framework | Status | Official source |
|---|---|---|
| Regulation (EU) 2024/1689 — EU AI Act | binding EU law where applicable; staged application | https://eur-lex.europa.eu/eli/reg/2024/1689/oj |
| Regulation (EU) 2022/2554 — DORA | binding EU law for financial entities in scope; applies since 2025-01-17 | https://eur-lex.europa.eu/eli/reg/2022/2554/oj |
| ISO/IEC 42001:2023 | voluntary/certifiable AI management-system benchmark unless contractually required | https://www.iso.org/standard/42001 |
| NIST AI RMF 1.0 | voluntary risk-management benchmark | https://www.nist.gov/itl/ai-risk-management-framework |
| NIST AI 600-1 GenAI Profile | voluntary GenAI profile / companion to AI RMF | https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence |

## A. Applicability register

| ID | Question | Current repo evidence | State | Required next evidence |
|---|---|---|---|---|
| APP-AI-01 | Is CAPITAL-AI an AI Act `provider`, `deployer`, importer/distributor, or several roles per AI system? | provider/model routing and application AI use are documented, but no canonical legal-role register exists | **TBD** | AI-system inventory + role classification per use case |
| APP-AI-02 | Does any CAPITAL-AI use case fall into an AI Act prohibited or high-risk category? | financial reasoning/scoring exists; no canonical Annex III / Art. 6 classification record found | **TBD** | use-case-by-use-case classification with rationale |
| APP-AI-03 | Are Art. 50 transparency duties triggered for user-facing AI interaction or synthetic content? | user-facing AI chat exists; provider attribution/evaluation exists | **LIKELY RELEVANT — verify scope/exceptions** | UI disclosure and synthetic-content inventory |
| APP-AI-04 | Has Art. 4 AI literacy been operationalized for staff/agents operating AI systems? | no canonical AI-literacy training/evidence register found in reviewed governance set | **GAP** | role-based training/control evidence |
| APP-DORA-01 | Is the operating legal entity a `financial entity` within DORA Art. 2 scope? | repository is FinTech/investment oriented; legal entity/regulatory status is not established by repo governance | **TBD** | legal-entity and regulated-activity classification |
| APP-DORA-02 | If DORA applies, which ICT services support critical or important functions? | provider/control-plane/deployment dependencies exist; no canonical DORA critical-function register found | **TBD** | business-service + ICT dependency register |
| APP-ISO-01 | Is ISO/IEC 42001 certification a target or only an internal benchmark? | AIMS-like controls exist but no certification decision | **BENCHMARK** | Owner decision on certification scope |

## B. EU AI Act control mapping

| Control | Requirement theme | Repository evidence | Assessment | Gap / action |
|---|---|---|---|---|
| AI-ACT-04 | Art. 4 AI literacy | ESS-0019 defines provider-neutral roles/capabilities | 🟡 | create role-based AI-literacy curriculum, completion evidence and periodic refresh |
| AI-ACT-05 | prohibited practices screening | security/governance policies prohibit self-authority and unsafe mutation, but not a canonical Art. 5 use-case screen | 🟡 | add prohibited-practice checklist to AI-system onboarding |
| AI-ACT-06 | high-risk classification | no canonical AI-system risk classification against Art. 6 / Annex III | 🔴 | create AI-system inventory + legal risk-class field |
| AI-ACT-09 | risk management for high-risk systems, if applicable | ESS-0019 risk classes, negative tests, DevelopmentChain controls | 🟡/🟢 architecture | bind controls to each legally classified AI system |
| AI-ACT-10 | data/data-governance obligations for high-risk systems, if applicable | evidence/grounding and data-integrity rules exist | 🟡 | dataset provenance/quality/bias records per in-scope system |
| AI-ACT-11 | technical documentation, if applicable | ADR/ESS/roadmap/evidence structure strong | 🟢 foundation | produce system-specific technical file when applicability established |
| AI-ACT-12 | logging/record keeping, if applicable | runtime AI evaluations exist; durable sink added by ADR-0086 branch | 🟡 | production migration + retention/access policy + integrity verification |
| AI-ACT-13 | transparency/instructions, if applicable | prompt/model governance exists | 🟡 | user/deployer instructions and limitation disclosure per system |
| AI-ACT-14 | human oversight, if applicable | Human Merge, no agent self-approval, capability boundaries | 🟢 governance foundation | map named human oversight measures per AI system |
| AI-ACT-15 | accuracy/robustness/cybersecurity, if applicable | tests, fail-closed paths, provider routing, security gates | 🟡/🟢 | system-specific metrics, thresholds and monitoring evidence |
| AI-ACT-50 | transparency for certain AI systems | AI chat is user-facing; current response path exposes governance IDs but not a canonical AI-interaction disclosure control | 🟡 | verify UI disclosure; inventory synthetic content and machine-readable marking obligations |

## C. DORA control mapping — conditional on scope

**Applicability gate:** none of the rows below may be marked legally `COMPLIANT` until `APP-DORA-01` resolves that DORA applies to the operating entity/activity.

| Control | DORA theme | Repository evidence | Engineering readiness | Gap if DORA applies |
|---|---|---|---|---|
| DORA-05 | governance / management-body responsibility | Human/Owner authority, DevelopmentChain, Accepted ADR governance | 🟢 foundation | formal management-body role/evidence depends on legal entity structure |
| DORA-06 | documented ICT risk-management framework | security, IAM, control plane, incident/runbook/evidence architecture | 🟡/🟢 | consolidate into canonical DORA ICT-risk framework and annual review record |
| DORA-08 | identification / asset & dependency awareness | repo/service/provider inventories distributed across architecture docs | 🟡 | canonical ICT asset, information asset and dependency inventory |
| DORA-09/10 | protection, prevention, detection | CI/security checks, least privilege, audit and monitoring controls | 🟢 foundation | control-owner/effectiveness evidence mapped to services |
| DORA-11/12 | response/recovery, backup/restoration | rollback, incident and break-glass runbooks | 🟢 foundation | business-service RTO/RPO + tested recovery evidence if in scope |
| DORA-13 | learning/evolving | evidence-driven roadmaps and governance reviews | 🟡/🟢 | formal lessons-learned and annual framework review cycle |
| DORA-17..23 | ICT incident management/reporting | incident evidence exists | 🟡 | classification/reporting timelines and competent-authority workflow if in scope |
| DORA-24..27 | resilience testing / TLPT | negative testing and CI extensive | 🟡 | risk-based test programme; TLPT applicability and independent tester controls if required |
| DORA-28..30 | ICT third-party risk | provider-neutral control plane and external-service controls | 🟡 | register of information, criticality, contractual clauses, concentration/exit strategy |

## D. ISO/IEC 42001 AIMS benchmark

| AIMS capability | Current state | Gap |
|---|---|---|
| scope/context | 🟡 distributed across repo/roadmaps | one canonical AIMS scope and interested-party register |
| leadership/accountability | 🟢 Human/Owner authority strong | formal objectives/review cadence |
| AI risk/opportunity process | 🟢 ESS-0019 + risk classes | legal/use-case classification integration |
| competence/awareness | 🟡 | AI-literacy evidence programme |
| documented information | 🟢 | authority cleanup + lifecycle completeness |
| operational controls | 🟢 | durable runtime evidence rollout |
| performance evaluation | 🟡/🟢 | management-review KPI pack and internal-audit schedule |
| continual improvement | 🟡/🟢 | CAPA/nonconformity register linked to governance score |

## E. NIST AI RMF / GenAI Profile benchmark

| Function | Repository alignment | Next hardening |
|---|---|---|
| GOVERN | strong: ESS/ADR/Owner/capability governance | AI-system inventory, role/legal applicability, training evidence |
| MAP | partial: provider/use-case architecture exists | impact/context inventory per AI use case and affected stakeholders |
| MEASURE | growing: evaluations, grounding, tests, governance evidence | durable measurements, bias/quality metrics, thresholds and retention |
| MANAGE | strong engineering controls | formal residual-risk acceptance and control-effectiveness review |

## F. Evidence rules

1. A framework reference is not evidence of compliance.
2. A repo control is not legal applicability proof.
3. `TBD` fails closed for claims such as `DORA compliant`, `AI Act compliant`, `ISO 42001 certified`.
4. Voluntary NIST/ISO alignment may be stated only with the exact mapped controls/evidence; certification must never be implied without certification evidence.
5. This matrix is reviewed whenever a new AI use case, regulated activity, legal entity, material provider or protected production capability is introduced.
