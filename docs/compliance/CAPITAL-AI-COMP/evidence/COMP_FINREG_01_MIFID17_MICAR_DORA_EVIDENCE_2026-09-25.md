# COMP-FINREG-01 — MiFID II Article 17, MiCAR/BaFin and DORA Evidence Pack — 2026-09-25

**Document ID:** `DOC-COMP-FINREG-MIFID17-MICAR-DORA-EVIDENCE-20260925`  
**Project:** `CAPITAL-AI-COMP`  
**Canonical work package:** `COMP-FINREG-01-FINANCIAL-REGULATORY-PERIMETER-20260922`  
**Baseline:** `main@a503cea6b4ff9c72f8cf2a35113ab7a537922574`  
**Role:** compliance evidence / applicability input / non-authorizing  
**Status:** `EVIDENCE_IMPLEMENTED / LEGAL_SCOPE_HELD`  
**Authority:** `/AGENTS.md@CURRENT_MAIN`

> This artifact does not declare CAPITAL-AI, its operator, or any product surface compliant with, authorised under, exempt from, or outside MiFID II, MiCAR, WpIG or DORA. It separates factual repository evidence from legal applicability and routes unresolved legal conclusions to Human/Legal.

## 1. Current factual perimeter

The assessed baseline contains financial and crypto analysis, scoring, ranking and recommendation-like presentation. It also contains research-only risk and portfolio components.

Current repository evidence does **not** establish a productive live trading/execution capability:

- `docs/runbooks/CRYPTO_EVIDENCE_OWNER_CONFIGURATION_2026-08-22.md` states `LIVE_EXECUTION / FT-7+` is not authorised and requires a separate decision/project for exchange/broker/custody adapters, real-money orders, IAM/step-up authorisation, pre-trade controls, reconciliation and incident/kill-switch runbooks.
- `docs/architecture/ORCHESTRATORS_AND_SCORING_ENGINES.md` states that the current evaluator can return triggers/recommended actions but has no Broker/Order/Risk-Policy/Runtime mutation authority.
- `docs/evidence/sc-md/SC3_CRYPTO_MEME_DEFI_ORCHESTRATOR_SCORING_2026-08-22.md` records `executionEligible=false` and no order/broker/runtime mutation.
- `docs/projects/fintech/work-packages/FIN_TIER3_4_LIVE_TRANSPORT_2026-09-25.md` explicitly introduces no provider trading/account stream, order capability or execution path.

This boundary is the key factual input for the MiFID II Article 17 trigger assessment below. It is not a legal exemption.

## 2. Official source baseline

Checked 2026-09-25:

- MiFID II, Article 17: https://eur-lex.europa.eu/eli/dir/2014/65/oj
- Consolidated MiFID II: https://eur-lex.europa.eu/eli/dir/2014/65/2024-03-28/eng
- RTS 6 / Delegated Regulation (EU) 2017/589: https://eur-lex.europa.eu/eli/reg_del/2017/589/oj
- MiCAR / Regulation (EU) 2023/1114: https://eur-lex.europa.eu/eli/reg/2023/1114/oj
- BaFin Kryptowerte-Dienstleistungen: https://www.bafin.de/DE/unternehmen-maerkte/erlaubnis-registrierung/geschaefte-krypto/kryptowerte-dienstleistungen/kryptowerte-dienstleistungen.html
- DORA / Regulation (EU) 2022/2554: https://eur-lex.europa.eu/eli/reg/2022/2554/oj
- BaFin DORA: https://www.bafin.de/DE/Aufsicht/DORA/DORA_node.html
- BaFin IKT-Drittparteienrisiko: https://www.bafin.de/DE/Aufsicht/DORA/Management_IKT_Drittparteienrisikos/Management_IKT_Drittparteirisikos_node.html
- BaFin Dokumentationsanforderungen DORA: https://www.bafin.de/SharedDocs/Downloads/DE/Anlage/dl_anlage_DORA_Dokumentationsanforderungen_1.pdf

## 3. MiFID II Article 17 / RTS 6 trigger assessment

MiFID II Article 17 applies to an investment firm engaging in algorithmic trading. The MiFID II definition turns on algorithms automatically determining individual order parameters such as initiation, timing, price, quantity or order management with limited or no human intervention.

| Trigger fact | Current evidence | Evidence state |
|---|---|---|
| CAPITAL-AI/operator is an authorised/in-scope investment firm | Not established by repository evidence | `LEGAL_REVIEW_REQUIRED` |
| Product automatically initiates/generates/routes/executes orders in financial instruments | Productive execution path not evidenced; FT-7+ explicitly blocked | `NOT_EVIDENCED_ON_BASELINE` |
| Direct electronic access to a trading venue is provided | No current evidence | `NOT_EVIDENCED_ON_BASELINE` |
| HFT technique is operated | No current evidence | `NOT_EVIDENCED_ON_BASELINE` |
| Research/scoring produces directional outputs | Yes | `EVIDENCED`, but not equivalent to Article-17 algorithmic execution |

**Current engineering disposition:** `MIFID17_CONDITIONAL_TRIGGER_NOT_CURRENTLY_EVIDENCED`.

This is a factual trigger disposition only, not a legal exemption.

### 3.1 Evidence family if Article 17 becomes applicable

| Evidence family | Required proof | Current CAPITAL-AI state |
|---|---|---|
| Governance/accountability | named algorithm owner, approval authority, risk/compliance separation, change approval | partial general governance; no regulated trading governance packet |
| Development/testing methodology | design, testing, performance, recordkeeping and approval method | general CI/testing exists; no Article-17 trading-algorithm methodology |
| Conformance testing | correct interaction with trading venue/DMA systems and market-data flows | `NOT_APPLICABLE_TO_CURRENT_NO_EXECUTION_PATH` |
| Separate test environment | production-separated algorithm test environment | no regulated execution environment to assess |
| Controlled deployment limits | instrument/order/value/position/venue limits | research limits exist; not production trading-policy evidence |
| Annual self-assessment/validation | Article-17/RTS-6 assessment, validation report, remediation | not established |
| Stress testing | stressed order-flow/market-condition testing | not established for live execution |
| Kill functionality | immediate cancellation of unexecuted orders | no productive order path; current research kill model is not this control |
| Market-abuse surveillance | automated order/transaction monitoring and alerting | not established for live trading |
| Pre-trade controls | price collars, max value/volume/messages, risk/credit limits, throttles | not established for live trading |
| Real-time monitoring | independent monitoring and alerts/remediation | general telemetry exists; no Article-17 trading monitoring evidence |
| Post-trade controls/reconciliation | exposure monitoring, complete order/trade records and reconciliation | no productive trade path; not established |

Any new Exchange/Broker/Trading-Venue adapter or automated order initiation/generation/routing/execution must trigger fresh `REQ-COMP-038` classification before promotion.

## 4. MiCAR / BaFin evidence implementation

Current crypto scoring and trade-setup surfaces remain recommendation-like and require service classification. The repository does not establish CASP status or a MiCAR exemption.

For each crypto-facing surface record: exact asset/regime, route/API, audience, research/live status, service semantics, personalisation inputs, suitability presentation, provider/exchange/broker/referral relationship, remuneration/conflicts and costs.

### Article 66 family if CASP scope applies

Evidence must cover honest/fair/professional conduct, fair/clear/non-misleading information, risk information, conflicts/remuneration treatment, client communications/complaints for the service and exact authorisation/service scope.

### Article 81 family if advice/portfolio management applies

Evidence must cover client knowledge/experience, investment objectives, risk tolerance, financial situation, loss-bearing capacity, independent/non-independent advice, costs/benefits/remuneration treatment, suitability outcome/report, competence and reconstructable record identity/version/time.

**Current state:** `MICAR_SERVICE_CLASSIFICATION_REQUIRED / NO_CASP_OR_EXEMPTION_ASSERTION`.

BaFin's current crypto-service authorisation information states that an applicant must also demonstrate DORA compliance requirements in the authorisation application. A positive CASP path therefore creates a direct dependency on the DORA evidence family below.

## 5. DORA evidence implementation

DORA applicability remains a Human/Legal scope decision under `REQ-COMP-022`.

| Question | Current state |
|---|---|
| Is the operating entity within DORA Article 2? | `LEGAL_REVIEW_REQUIRED` |
| Is a MiCAR CASP authorisation path established? | `NOT_ESTABLISHED` |
| Is CAPITAL-AI an ICT third-party provider to an in-scope financial entity? | `FACTUAL_CONTRACT_SCOPE_REQUIRED` |

| DORA evidence family | Required evidence | Current repository state |
|---|---|---|
| Governance / management body | responsibility, oversight, skills/training and approval | `PARTIAL_FOUNDATION`; regulated-entity management evidence absent |
| ICT risk-management framework (Arts. 5-15) | framework, assets, protection/detection, response/recovery, learning, communications | `PARTIAL_FOUNDATION`; no scope-confirmed DORA framework |
| Asset/dependency/criticality inventory | ICT/information assets, services, dependencies, critical functions | inventories exist; DORA criticality register not established |
| ICT incident management/reporting (Arts. 17-23) | classification, evidence, escalation and reporting records | incident architecture exists; DORA reporting workflow not established |
| Resilience testing (Arts. 24-27) | risk-based programme, findings/remediation, TLPT applicability | CI/security testing exists; not equivalent to a DORA programme |
| ICT third-party risk (Arts. 28-30) | contracts, risk, concentration, criticality, monitoring, exit | partial provider/contract evidence; full DORA evidence absent |
| Register of information | complete ICT third-party contractual register in required structure | `EVIDENCE_MISSING` |
| Continuity / backup / recovery | BIA-aligned plans and measured recovery evidence | recovery harness exists; measured RPO/RTO/integrity remains open |
| Continuous improvement | lessons learned, deficiencies, remediation and management review | general control loops exist; DORA-scoped evidence not established |

The existing `REQ-COMP-032 / COMP-GAP-007` remains open: at least two successful scheduled backup evidence records, measured DB RPO `<=24h`, one isolated restore with integrity match, measured DB RTO `<=60 min`, then independent Security verification.

BaFin also highlights the DORA information register for ICT contractual relationships and exit strategies for ICT services supporting critical or important functions. Current provider/vendor inventories must not be relabelled as that register without field/contract/criticality/subcontracting/exit verification.

**Current state:** `DORA_APPLICABILITY_HELD / ENGINEERING_EVIDENCE_PARTIAL / NO_COMPLIANCE_ASSERTION`.

## 6. Owner-correct handoffs

| Correlation | Target | Required return | Gate |
|---|---|---|---|
| `COMP-FINREG-MIFID17-LEGAL` | Human/Legal | investment-firm/activity classification and Article-17 applicability | no compliance/exemption claim before return |
| `COMP-FINREG-MICAR-LEGAL` | Human/Legal | per-surface MiCAR service/CASP/exemption classification | no CASP/licensing/exemption claim before return |
| `COMP-FINREG-FINTECH-FACTS` | CAPITAL-AI-FINTECH / affected PVC-09..17 | scoring/recommendation/personalisation/execution facts; preserve no-execution boundary unless separately authorised | no foreign COMP implementation |
| `COMP-FINREG-DORA-LEGAL` | Human/Legal | DORA entity/activity applicability | no blanket DORA status |
| `COMP-FINREG-DORA-OPS` | CAPITAL-AI-OPS / PVC-08 after positive scope | operational ICT/incident/recovery/third-party evidence | only after positive scope |
| `COMP-FINREG-DORA-SEC` | CAPITAL-AI-SEC | independent verification of applicable controls | verification only |

## 7. Claim rules

1. No surface may state MiFID II compliant, MiCAR compliant, BaFin approved/regulated, DORA compliant, CASP or an equivalent exemption/approval claim without exact competent evidence.
2. "Not investment advice" does not determine regulatory classification.
3. Research-only or `executionEligible=false` is engineering-boundary evidence, not a legal exemption.
4. A future productive order path invalidates the current MiFID-17 trigger disposition and requires reclassification before promotion.
5. A positive MiCAR CASP/advice classification activates the relevant MiCAR conduct/suitability evidence and, where applicable, DORA evidence.
6. DORA engineering controls remain partial until legal applicability and operational evidence are both established.
