# CAPITAL-AI-COMP — Public Legal Content Gap Review

**Review date:** 2026-09-22  
**Repository baseline at work start:** `main@a328f9cfdb1dba2845aa0e5c2c78e5a286a0e64d`  
**Project:** `CAPITAL-AI-COMP`  
**Relationship:** cross-cutting Compliance; no productive PVC ownership  
**Presentation owner:** `CAPITAL-AI-FE`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Status:** `CONTENT_FILLED / LEGAL_EVIDENCE_GAPS_VISIBLE`

## 1. Scope

This review correlates the new public presentation for:

- `/impressum`;
- `/datenschutz`;
- `/agb`;
- `/faq`;

with the substantive information already present in the CAPITAL-AI repository.

The graphical reference remains `SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d`. Its sample legal text is not treated as evidence. Fictitious or unsupported company, register, licence, hosting, certification, latency or provider claims are not promoted.

## 2. Current content coverage

### Impressum

Already represented in the productive content:

- provider/controller identity and address from `src/privacy/privacyPolicy.ts`;
- direct and support e-mail addresses;
- telephone contact currently rendered in `src/components/ImpressumAgb.tsx`;
- explicit statement that CAPITAL-AI is a project/product designation, not a separate legal entity;
- § 5 DDG heading;
- transparency about free/paid plans and possible referral/partner links;
- no unsupported regulator, licence or certification claim;
- no blanket “non-commercial” statement that would conflict with paid plans.

### Datenschutz

Already represented:

- controller and document version;
- purposes, data categories, legal bases, recipient categories, transfers, retention and technical controls for the documented processing activities;
- account/profile, billing, consent evidence, security/IAM, analytics/cookies, social publishing, alerts, quota and privacy-request processing;
- data-subject rights;
- authenticated request workflow and data export;
- cookie/analytics preference management;
- GA4 consent boundary and currently disabled AdSense state;
- explicit third-country/provider evidence caveat;
- complaint-right notice;
- explicit statement that no external/official GDPR certification is claimed.

### AGB

Already represented:

- provider, scope and contract subject;
- usage rights and security obligations;
- paid tariff / Stripe payment flow;
- repository price baseline and Stripe checkout authority for the concrete charge;
- subscription period, renewal/cancellation framing and customer-portal reference;
- general 14-day withdrawal notice;
- data/analysis-quality boundary;
- privacy/security reference;
- versioning and non-retroactivity statement.

### FAQ

The previous runtime FAQ contained presentation/navigation only. It is now populated from a dedicated Compliance-owned content source with repository-backed answers covering:

- platform purpose and multi-asset scope;
- analysis/advice boundary;
- data/score quality;
- hosting/third-country truth boundary;
- account-data categories;
- documented security controls;
- data-subject rights;
- analytics/cookie controls;
- login route;
- Stripe billing;
- subscription management;
- referral disclosure;
- provider/contact identity;
- certification non-claim.

## 3. Content deliberately rejected from the upstream design fixture

The mirrored upstream `LegalAndFaqPages.tsx` contains visual/sample copy that is not supported by current repository evidence. It must remain presentation evidence only.

Rejected examples include:

- a fictitious “Capital-AI Technologies GmbH” identity;
- a Frankfurt business address not matching the canonical controller record;
- invented register, VAT/W-Id and management data;
- an asserted BaFin/IHK supervisory authority without a proven regulated activity;
- fixed sub-45 ms latency claims;
- blanket Frankfurt/EU-only hosting;
- ISO-27001 / SOC-2 / MiCA-conformity claims without current evidence;
- blanket claims about named exchange/broker connections.

## 4. Remaining evidence / legal-decision gaps

The following data must not be invented. They require Human/Legal or the actual provider/domain owner to return evidence.

| Gap | Why it remains open | Required return |
|---|---|---|
| Provider/business status | Current canonical controller metadata says `Privatperson`, while paid tariffs are documented. The correct business/trade status must be legally confirmed. | Human/Legal/Owner confirms the legally correct provider status and any business designation. |
| Register information | § 5 DDG requires register and registration number when an applicable register entry exists. Current evidence does not establish one. | Confirm “no applicable entry” or provide the actual register and number. |
| VAT ID / Wirtschafts-ID | § 5 DDG requires these numbers if possessed. Current repository evidence does not establish possession/non-possession. | Human/Legal/Owner returns actual status; publish only if applicable. |
| Supervisory authority / regulated profession | Required only where the offered activity is licence-/profession-regulated. Current content correctly makes no licence claim. | Legal applicability decision plus actual authority/professional data if applicable. |
| Consumer dispute resolution | § 36 VSBG can require a website/AGB statement about willingness/obligation to participate; the employee-count exception and any participation duty/willingness are not evidenced. | Human/Legal/Owner decides applicability and supplies the exact statement. |
| Withdrawal implementation | AGB contain a general 14-day notice, but a complete consumer flow can additionally require a correctly parameterised withdrawal instruction/form and handling of requested early performance / expiry cases. | Legal review of the actual order/service flow; publish the applicable instruction/form. |
| Pre-contract order information | For paid consumer distance contracts, exact checkout evidence is needed for total price incl. taxes, essential features, contract duration/termination, technical order steps, correction means, contract-language/storage information as applicable. | Billing/checkout evidence + Legal determination. |
| DPO applicability | Art. 13 GDPR requires DPO contact details where a DPO is applicable. Current evidence does not prove whether one is required/appointed. | Human/Legal privacy determination; provide contact if applicable. |
| Mandatory/optional data provision | Art. 13 GDPR requires information on whether provision is statutory/contractual/required for contract and consequences of non-provision. Current activity registry does not express this systematically per flow. | COMP/Legal mapping based on actual forms and contract flows. |
| Automated decision-making / profiling | Art. 13 GDPR requires Article 22 information where applicable. Product scoring exists, but evidence does not establish whether any personal-data flow triggers Article 22. | Privacy/Legal applicability decision tied to actual personal-data processing. |
| Provider contracts / transfers | DPA/AVV, subprocessors, transfer mechanisms/TIA and actual region evidence remain incomplete. | Existing `REQ-COMP-017 / COMP-GAP-004` owner returns. |
| Binding contract universe | Complete effective customer/provider/partner contract inventory is not evidenced. | Existing `REQ-COMP-031` Human/Legal/provider-owner return. |

## 5. Owner-correct technical handoffs

### OPS

Existing Issue `#1223 — [CAPITAL-AI-OPS] Add /faq to production SPA fallback`.

Observed gap: the client route exists, but direct production navigation still depends on OPS-owned finite SPA fallback / soft-404 routing.

### SEO

Created Issue `#1233 — [CAPITAL-AI-SEO] Add /faq public SEO route and align Impressum metadata to DDG`.

Observed gaps:

- `/faq` absent from `src/lib/routeSeo.ts`;
- `/faq` absent from `scripts/seo/prerender-public-routes.mjs`;
- Impressum SEO/prerender copy still references TMG §5 while productive UI uses DDG §5.

## 6. Legal-reference correlation used for the gap check

Checked against the current official text available on 2026-09-22:

- § 5 DDG — provider information for businesslike digital services;
- GDPR Article 13 — controller/DPO where applicable, purposes/legal basis, recipients, transfers, retention, rights, data-provision consequences and automated-decision information where applicable;
- § 36 VSBG — consumer dispute-settlement information and employee-count exception;
- Article 246a EGBGB and its statutory withdrawal templates for applicable distance consumer contracts.

This repository review records evidence gaps and routing only. It does not replace competent legal advice or manufacture legal applicability conclusions.

## 7. Exit state

`CONTENT_FILLED / LEGAL_EVIDENCE_GAPS_VISIBLE`

Exit evidence for this bounded package:

1. productive legal pages remain on the new FE-owned legal presentation shell;
2. FAQ substantive content is populated from a COMP-owned source;
3. no unsupported upstream sample claim is promoted;
4. remaining Human/Legal/provider evidence gaps are explicit;
5. OPS and SEO technical gaps are owner-correct handoffs rather than foreign-scope implementation.
