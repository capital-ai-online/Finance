# COMP-FINREG-01 — Financial Regulatory Perimeter & Public-Content Review

**Canonical identity:** `COMP-FINREG-01-FINANCIAL-REGULATORY-PERIMETER-20260922`  
**Project:** `CAPITAL-AI-COMP`  
**Canonical project folder:** `docs/projects/compliance/`  
**Baseline:** `main@a503cea6b4ff9c72f8cf2a35113ab7a537922574`  
**Evidence refresh:** `2026-09-25` — MiFID II Article 17 / MiCAR-BaFin / DORA evidence slice materialized  
**State:** `ACTIVE_FROM_HUMAN_OWNER_DIRECTION / LEGAL_REVIEW_REQUIRED`  
**Priority:** `P1 — PRE-PUBLIC-PROMOTION LEGAL GATE`  
**Authority:** `/AGENTS.md@CURRENT_MAIN`  
**Primary requirement:** `REQ-COMP-038`  
**Correlated requirements:** `REQ-COMP-022`, `REQ-COMP-023`, `REQ-COMP-031`, `REQ-COMP-037`, `REQ-COMP-039`  
**Execution model:** specialization of existing `COMP-08 → COMP-01..07`; this package does not create a ninth Compliance workstream or a new legal authority.

## 1. Purpose

Perform a source-backed, product-surface-specific regulatory-perimeter review of CAPITAL-AI's current financial analysis, scoring, ranking, recommendation-like, crypto and referral functionality before those surfaces are treated as legally cleared for public promotion.

The package converts the already-existing `REQ-COMP-038 = UNKNOWN` Legal/Scope gate into one bounded, executable Compliance assessment package.

It does **not** decide the legal classification itself. Where interpretation is required, the only valid outcome is a documented Human/Legal decision based on the factual product inventory assembled here.

## 2. Ownership and PVC relationship

- `CAPITAL-AI-COMP` is cross-cutting and owns no productive `PVC-*` stage.
- Compliance owns requirement/applicability research, factual claim review, evidence sufficiency, finding normalization and owner-correct handoff.
- Human/Legal owns the legal classification of regulated activity, licence/registration requirements and jurisdictional applicability.
- `CAPITAL-AI-FINTECH / PVC-15..17` supplies factual scoring, decision-support, portfolio and ranking semantics and owns later technical remediation in that productive domain when required.
- `CAPITAL-AI-FE` owns presentation-only remediation for customer-facing wording/labels after the legal/product decision.
- `CAPITAL-AI-OPS` owns provider/runtime/payment/deployment evidence only where the resulting classification requires it.
- `CAPITAL-AI-SEC` independently verifies security/resilience controls where a regulated regime or separate Security authority makes them applicable.
- No regulatory conclusion transfers productive ownership into Compliance.

## 3. Fresh factual review on CURRENT_MAIN

### 3.1 Public legal wording

Current public legal/FAQ content:

- states that CAPITAL-AI is a project/product designation and does not claim a BaFin licence or external regulatory approval;
- states that calculation and analysis tools do not replace individual advice or the user's own risk assessment;
- avoids unsupported claims such as “BaFin regulated”, “MiCA compliant”, “DORA compliant”, ISO certification or supervisory approval;
- discloses that referral/partner links may create benefits or commissions.

**Assessment:** `PARTIALLY_ALIGNED / LEGAL_PERIMETER_NOT_RESOLVED`.

The current disclaimer is useful claim-boundary evidence but is not by itself evidence that a functionality falls outside financial-services regulation.

### 3.2 Enterprise Scorer / public preview

Current repository evidence shows:

- `src/features/crypto/ui/PublicCryptoScoringPreview.tsx` is the public scorer projection and progresses to the canonical scorer;
- `src/features/crypto/ui/CryptoScoringEnterprise.tsx` can present a score, rank eligibility, a decision state and a trade setup;
- the trade setup model contains long/short direction plus entry range, stop-loss levels and take-profit levels;
- repository evidence records the Enterprise Scorer as directly executable from the public analysis sideboard.

**Regulatory review trigger:** instrument-specific decisions and concrete entry/exit/stop/target levels may have recommendation-like characteristics. Whether they are an investment recommendation, personal recommendation, crypto-asset advice or neither depends on the actual instrument, presentation, personalization, intended audience and surrounding business model.

**State:** `REQUIRES_LEGAL_CLASSIFICATION`.

### 3.3 Ranking Board / Top & Worst / BUY & SELL presentation

Current `src/features/screening/ui/RankingBoard.tsx`:

- renders `Ranking Board · Top & Worst 3`;
- exposes `Top 3 Best` and `Top 3 Worst`;
- presents backend-authoritative rank/order;
- maps sufficiently evidenced bullish pattern direction to visible `BUY` and bearish direction to visible `SELL`.

The surface is documented as directly executable in the public analysis sideboard.

**Regulatory review trigger:** public information that explicitly or implicitly proposes a particular investment decision, expresses an investment proposal or gives an opinion on present/future value can enter the EU Market Abuse Regulation investment-recommendation perimeter even where it is not personalized investment advice.

**State:** `REQUIRES_MAR_AND_WPIG_CLASSIFICATION`.

### 3.4 Legacy chart simulation recommendation semantics

`server/routes/legacyScoringCompatibilityRoutes.ts` contains the explicit non-production endpoint `/api/charts-scoring`.

The route is correctly marked:

- `simulation-only`;
- `scoreEligible=false`;
- `productionScoring=false`;
- not admitted into ranking, eligibility, snapshots or alerts.

However, its response vocabulary still maps a simulation score to:

- `STRONG BUY`;
- `BUY`;
- `HOLD`;
- `SELL`;
- `STRONG SELL`.

Repository evidence also indicates that the intended Frontend migration is to remove productive consumers of this compatibility endpoint.

**Regulatory review trigger:** “simulation-only” is an engineering boundary, not automatically a legal safe harbour for recommendation wording if the output remains reachable or distributed to users.

**State:** `REACHABILITY_AND_LEGAL_CLASSIFICATION_REQUIRED`.

### 3.5 Portfolio allocation engine

`src/platform/FinTechCore/Portfolio/DeterministicPortfolioAllocator.ts` can calculate:

- target weights;
- allocation deltas;
- rebalance-required state;
- `BUY` / `SELL` side.

The implementation currently fails closed outside `RESEARCH` or `PAPER` operating modes.

**Assessment:** current technical gate materially reduces immediate productive exposure, but any future user-facing/live promotion is a mandatory `COMP-08` reclassification trigger because discretionary portfolio management and personal recommendations have separate regulatory definitions.

**State:** `CONDITIONAL_TRIGGER / NO_PRODUCTIVE_PROMOTION_WITHOUT_REVIEW`.

### 3.6 Referral / remuneration

Current legal/FAQ content allows partner/referral links and acknowledges that benefits or commissions may arise.

**Regulatory review trigger:** if remuneration/referral is connected to a recommendation-like output, specific instrument, issuer, trading venue, broker or crypto service, generic affiliate disclosure may be insufficient. The exact relationship must be correlated against conflicts-of-interest, inducement, recommendation-disclosure and crypto-service rules.

**State:** `REMUNERATION_MAPPING_REQUIRED`.

## 4. External regulatory source baseline — checked 2026-09-22

These external sources are legal/regulatory inputs only. Applicability remains product-/entity-/jurisdiction-specific and requires competent Legal interpretation.

### 4.1 WpIG / BaFin — investment services and personal recommendations

Official source:

- WpIG § 2: https://www.gesetze-im-internet.de/wpig/__2.html
- BaFin MaComp: https://www.bafin.de/SharedDocs/Downloads/DE/Rundschreiben/dl_rs_0518_MaComp_fassung_juni_2023.pdf
- BaFin Robo-Advice background: BaFin Journal 08/2017, “Robo-Advice – Automatisierte Anlageberatung in der Aufsichtspraxis”.

Relevant perimeter:

- investment advice is a personal recommendation concerning transactions in specific financial instruments when based on the investor's personal circumstances or presented as suitable for that investor and not made solely through public/information-distribution channels;
- portfolio management is separately regulated;
- the WpIG also recognises the creation/dissemination of investment-strategy recommendations or investment recommendations under MAR as a securities ancillary service;
- for regulated robo-advice, a disclaimer cannot replace the required suitability process when the actual customer experience creates advice.

**CAPITAL-AI consequence:** a “no personal advice” statement cannot be used as the legal classification mechanism. Actual product behavior and personalization must be inventoried.

### 4.2 MAR / Delegated Regulation (EU) 2016/958 — public investment recommendations

Official sources:

- Regulation (EU) No 596/2014 (MAR): https://eur-lex.europa.eu/eli/reg/2014/596
- Delegated Regulation (EU) 2016/958: https://eur-lex.europa.eu/eli/reg_del/2016/958/oj?locale=de

Relevant perimeter:

- MAR defines information recommending or suggesting an investment strategy broadly enough to include direct investment proposals and opinions about present/future value or price intended for distribution channels or the public;
- Article 20 requires objective presentation and disclosure of interests/conflicts;
- Regulation 2016/958 requires, where applicable, separation of facts from interpretations/estimates, source transparency, identification of forecasts/targets and assumptions, timestamps, and conflict disclosures.

**CAPITAL-AI consequence:** public `BUY/SELL`, `Top/Best/Worst`, target levels or instrument-specific decision labels require a dedicated MAR assessment even if they are not personalized.

### 4.3 MiCAR / BaFin — crypto-asset services

Official sources:

- Regulation (EU) 2023/1114 (MiCAR): https://eur-lex.europa.eu/eli/reg/2023/1114
- BaFin Kryptowerte-Dienstleistungen: https://bafin.de/DE/unternehmen-maerkte/erlaubnis-registrierung/geschaefte-krypto/kryptowerte-dienstleistungen/kryptowerte-dienstleistungen.html

Relevant perimeter:

- MiCAR establishes authorization requirements and exemptions for crypto-asset service providers;
- Article 66 requires CASPs, when in scope, to act honestly, fairly and professionally and provide fair, clear and non-misleading information with risk warnings;
- Article 81 imposes suitability requirements on advice/portfolio management on crypto-assets, including knowledge/experience, investment objectives, risk tolerance, financial situation and loss-bearing ability;
- advice-related requirements also address independence, costs/benefits and suitability reporting.

**CAPITAL-AI consequence:** current crypto scoring/trade-setup surfaces require explicit classification before CAPITAL-AI can state that they are outside, inside, compliant with, or authorised under MiCAR.

### 4.4 DORA

Official source:

- Regulation (EU) 2022/2554 (DORA): https://eur-lex.europa.eu/eli/reg/2022/2554/oj

Relevant perimeter:

- DORA directly applies to the listed financial entities, including investment firms and authorised CASPs;
- therefore DORA must not be inferred merely because a product is called “FinTech”, but it becomes a mandatory consequence assessment if a WpIG/MiCAR entity classification is established;
- DORA-related contractual obligations can also become relevant in an ICT-provider relationship with regulated financial entities.

**CAPITAL-AI consequence:** retain `REQ-COMP-022 = REQUIRES_LEGAL_REVIEW`; do not create a DORA implementation backlog before entity/activity classification.

### 4.5 AML / GwG

Official source:

- GwG § 2: https://www.gesetze-im-internet.de/gwg_2017/__2.html

The GwG lists, among others, Wertpapierinstitute and crypto-asset service providers as obliged entities, subject to the exact statutory scope/exceptions.

**CAPITAL-AI consequence:** AML/KYC requirements are a downstream classification consequence; they are not activated merely by financial analysis functionality.

### 4.6 § 34f GewO / non-BaFin permission perimeter

Official source:

- § 34f GewO: https://www.gesetze-im-internet.de/gewo/__34f.html

For certain financial-investment brokerage/advice activities that fall within statutory WpIG/KWG exemptions, a permit under § 34f GewO may instead be required from the competent authority.

**CAPITAL-AI consequence:** “not BaFin-regulated” is not equivalent to “no permission requirement”. The competent Legal review must evaluate alternative regulatory/permission routes where relevant.

## 5. Main findings

### FINREG-FIND-A — Disclaimer is not a regulatory classification

**Evidence:** current legal wording disclaims individual advice; current product includes recommendation-like outputs.

**Required disposition:** classify actual functionality under WpIG/MAR/MiCAR rather than treating the disclaimer as an exemption.

**Status:** `LEGAL_REVIEW_REQUIRED`.

### FINREG-FIND-B — Public recommendation-like semantics require a MAR assessment

**Evidence:** public Ranking Board with `Best/Worst`, visible `BUY/SELL`, scorer decisions and concrete trade levels.

**Required disposition:** determine for each financial-instrument surface whether it produces or disseminates an investment recommendation or other information recommending/suggesting an investment strategy.

**Status:** `LEGAL_REVIEW_REQUIRED`.

### FINREG-FIND-C — Crypto advice/CASP perimeter is unresolved

**Evidence:** public crypto scoring and concrete trade-setup presentation exist; no MiCAR authorisation claim is made.

**Required disposition:** determine whether any crypto surface constitutes advice on crypto-assets or another crypto-asset service; if yes, establish the exact authorization/organizational/suitability/disclosure consequences before productive promotion.

**Status:** `LEGAL_REVIEW_REQUIRED`.

### FINREG-FIND-D — Referral conflict mapping is incomplete

**Evidence:** partner/referral remuneration is permitted by current public content; the exact linkage between remuneration and instrument/service recommendations is not inventoried.

**Required disposition:** create an exact remuneration/conflict map covering partner, broker, exchange, issuer and platform relationships per recommendation surface.

**Status:** `EVIDENCE_MISSING / LEGAL_REVIEW_REQUIRED`.

### FINREG-FIND-E — Conditional downstream regimes must remain conditional

**Evidence:** `REQ-COMP-022` DORA and AML/permission consequences depend on the primary entity/activity classification.

**Required disposition:** no DORA, GwG, §34f or other regulated-entity PASS/FAIL/implementation status is inferred until the primary perimeter decision exists.

**Status:** `FAIL_CLOSED_CONDITIONAL`.

## 6. Work plan

### Slice 0 — Exact financial-output surface inventory

**Owner:** `CAPITAL-AI-COMP` assessment; FINTECH/FE provide facts.  
**Output:** one inventory row per customer-facing or externally distributed financial output with:

- route/component/API;
- asset/instrument type;
- public vs authenticated vs internal;
- live/verified vs research/paper/simulation;
- score/rank/decision output;
- `BUY/SELL/HOLD` or equivalent directional semantics;
- entry/target/stop levels;
- whether user circumstances, profile, holdings, objectives, risk tolerance or subscription state influence the output;
- whether the output is described/presented as suitable for a user;
- provider/issuer/broker/exchange/referral relationship;
- direct or indirect remuneration/conflict;
- distribution channel and audience.

**Exit:** no material recommendation-like surface remains unclassified as a factual product surface.

### Slice 1 — WpIG / WpHG / MAR legal-perimeter packet

**Owner:** Human/Legal decision; COMP prepares evidence packet.  
**Inputs:** Slice 0 + WpIG § 2 + MAR Article 3/20 + Regulation 2016/958 + BaFin robo-advice/MaComp material.

Required decision per surface:

- `PERSONAL_RECOMMENDATION_CANDIDATE`;
- `PUBLIC_INVESTMENT_RECOMMENDATION_CANDIDATE`;
- `NEUTRAL_INFORMATION / RESEARCH`;
- `OUT_OF_SCOPE_WITH_REASON`;
- `NOT_ASSESSED / MORE_FACTS_REQUIRED`.

For every positive/conditional classification, record required licence/registration, conduct, suitability, conflict, disclosure, record-keeping and competence consequences.

**Exit:** competent written disposition for every identified financial-instrument recommendation-like surface.

### Slice 2 — MiCAR crypto perimeter packet

**Owner:** Human/Legal decision; COMP prepares evidence packet; FINTECH provides crypto semantics.

Required decision:

- whether each crypto asset is within MiCAR or another instrument regime;
- whether each service is advice on crypto-assets, portfolio management, another CASP service, neutral research, or otherwise out of scope;
- whether any exemption applies;
- required authorisation/registration and service scope;
- Article 66 conduct/marketing/risk-information obligations where applicable;
- Article 81 suitability, competence, cost/benefit, independence/remuneration and suitability-report requirements where applicable.

**Exit:** no public crypto recommendation-like surface is promoted with an unresolved MiCAR classification.

### Slice 3 — Conditional consequence matrix

Only after Slice 1/2 legal classification:

- DORA Article-2 entity/activity scope;
- GwG obliged-entity scope;
- §34f GewO or other alternative permission paths;
- record-retention/audit obligations;
- complaints handling;
- conflicts/inducements/referral controls;
- contractual/provider requirements;
- appropriate regulator/authority disclosure in the Impressum if legally required.

**Exit:** each downstream regime is either evidence-backed applicable, evidence-backed not applicable, or explicitly held for Legal Review.

### Slice 4 — Public legal/content reconciliation

**Owner:** `CAPITAL-AI-COMP` content assessment; `CAPITAL-AI-FE` implements visual wording only if handed off.

Review and, only after Slice 1/2 decisions, update as applicable:

- Impressum regulatory/supervisory-authority fields;
- FAQ “keine Anlageberatung” wording;
- AGB financial-analysis/risk wording;
- recommendation methodology/source/timestamp disclosures;
- interests/conflicts/remuneration disclosures;
- crypto risk/service disclosures;
- licence/registration statements;
- public claims such as “Research”, “Scoring”, “Best/Worst”, “BUY/SELL”, “Trade Setup”, “Entry”, “Take Profit”, “Stop Loss”.

**Guardrail:** do not publish “not regulated”, “BaFin-regulated”, “BaFin-approved”, “MiCA-compliant”, “DORA-compliant” or equivalent without exact competent evidence.

### Slice 5 — Owner-correct remediation handoffs

After legal classification only:

- `CAPITAL-AI-FINTECH / PVC-15..17`: change/disable/segregate decision, ranking, trade-setup, portfolio or personalization semantics;
- `CAPITAL-AI-FE`: customer-facing terminology/disclosure changes without changing financial semantics;
- `CAPITAL-AI-OPS`: licensing/provider/payment/contract/runtime evidence or operational controls within its canonical scope;
- `CAPITAL-AI-SEC`: independent security/resilience verification;
- Human/Legal: final regulated-activity and jurisdictional decision.

No foreign implementation is performed by this COMP package.

## 6A. Evidence implementation refresh — 2026-09-25

Canonical evidence pack: `../evidence/COMP_FINREG_01_MIFID17_MICAR_DORA_EVIDENCE_2026-09-25.md`.

- MiFID II Article 17 / RTS 6: `MIFID17_CONDITIONAL_TRIGGER_NOT_CURRENTLY_EVIDENCED`; current main has no productive Broker/Order/Execution path and FT-7+ remains unauthorised. This is not a legal exemption.
- MiCAR/BaFin: `MICAR_SERVICE_CLASSIFICATION_REQUIRED / NO_CASP_OR_EXEMPTION_ASSERTION`; Article 66 and Article 81 evidence families are defined and activate only after competent service classification.
- DORA: `REQ-COMP-022` remains Human/Legal held; the evidence pack maps management, ICT risk, incident, resilience-test, ICT-third-party/register/exit and recovery evidence.
- `REQ-COMP-032 / COMP-GAP-007` remains open and is not converted into a DORA PASS.

Any new automated order initiation/generation/routing/execution invalidates the current MiFID-17 trigger disposition and requires fresh classification before promotion.

## 7. Interim fail-closed release rule

Until Slice 1 and Slice 2 have a competent disposition:

1. no public statement may claim a regulatory exemption, approval, licence or compliance status;
2. no new recommendation-like semantics may be added to public surfaces without re-triggering this package;
3. no personalization of recommendation-like outputs by user profile, objectives, risk tolerance, financial situation or holdings may be promoted as release-ready;
4. no referral/affiliate relationship may be described as harmless or conflict-free without the exact relationship being assessed;
5. any future live portfolio allocation, order routing or execution path is a new material `COMP-08` trigger and requires fresh FINTECH/Legal/Security correlation.

This is a release-evidence guard, not a legal conclusion or a second product authority.

## 8. Required evidence

The package cannot reach exit on documentation assertions alone. Required evidence:

- exact CURRENT_MAIN SHA;
- complete Slice-0 surface inventory;
- route/reachability evidence for public/authenticated/internal surfaces;
- actual output examples/screenshots or DOM/API evidence for recommendation-like labels;
- personalization/input dependency map;
- asset/instrument classification inputs;
- remuneration/referral/partner relationship map;
- competent Legal classification with date, scope and assumptions;
- licence/registration evidence if a regulated service is established;
- required disclosure/control matrix for each applicable regime;
- owner-correct remediation returns;
- independent verification where Security/QM is applicable;
- public legal-content readback after any approved wording changes.

## 9. Acceptance criteria

This work package reaches `FINREG_PERIMETER_EVIDENCE_READY` only when:

1. every material `BUY/SELL/HOLD`, `Best/Worst`, rank, decision, entry, stop-loss, take-profit and target-allocation surface is inventoried;
2. public vs personalized delivery is explicitly distinguished;
3. financial instruments and crypto-assets are legally routed to the correct regime rather than grouped under one generic “FinTech” label;
4. WpIG/MAR classification is competently decided for financial-instrument surfaces;
5. MiCAR classification is competently decided for crypto surfaces;
6. DORA/GwG/§34f and other downstream regimes remain conditional until their trigger is established;
7. referral/remuneration conflicts are inventoried and dispositioned;
8. the public legal pages do not rely on a disclaimer to prove non-regulation;
9. no unverified supervisory authority, licence, certification or exemption claim is published;
10. every required productive change is handed to its canonical owner with exact exit evidence;
11. unresolved legal questions remain `REQUIRES_LEGAL_REVIEW` rather than being converted to PASS;
12. Human/CODEOWNER merge remains required for repository changes.

## 10. Completion semantics

`FINREG_PERIMETER_EVIDENCE_READY` means the Compliance factual/evidence packet is complete enough for a competent decision and all resulting remediations are routed.

It does **not** mean:

- BaFin approval;
- a licence or exemption;
- MiCAR authorisation;
- DORA compliance;
- AML compliance;
- legal advice;
- blanket regulatory compliance.

Those statuses may only be stated when independently and competently evidenced for the exact entity, service, jurisdiction and time period.
