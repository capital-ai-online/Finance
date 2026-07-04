# 🇪🇺 EU-Compliance & Regulatory Audit Report (CAPITAL-AI)
**Project: CAPITAL-AI (Capital AI)**  
**Auditor:** Compliance & Regulatory Lead  
**Classification:** Public / Audit-Ready  
**Stand:** 2026-06-30 (Gerichtsfeste Fassung inkl. EinwVO & BFSG)  

---

## 🏛️ Regulatory Compliance Matrix

| Regulatory Standard | Legal Framework | Status | Implementation Details |
| :--- | :--- | :---: | :--- |
| **EU-DSGVO** | GDPR (Data Privacy) | 🟢 Compliant | Zero-tracking pre-consent, complete database anonymization options, whitelisted backend proxy API streams. |
| **DDG § 5** | Legal Disclosures (Impressum) | 🟢 Compliant | Easily accessible legal footer links satisfying BGH "2-Clicks" precedents. |
| **EinwVO (01.04.2025)**| Consent Recording | 🟢 Compliant | Revisionssichere protocolling of analytical preferences in database schemas. |
| **BFSG (28.06.2025)** | Accessibility (EN 301 549) | 🟢 Compliant | Accessible markup, Aria landmarks, high contrast styling, tap target area >= 44px. |

---

## 🔒 1. General Data Protection Regulation (DSGVO / GDPR)

Our application is built on a **"Privacy-by-Design"** and **"Privacy-by-Default"** framework:

### 1. Zero External Assets Leakage (CJEU Google Fonts Precedent)
In compliance with the CJEU (EuGH) ruling on data leakage, the frontend completely eliminates external Google Fonts and CDN calls:
* Webfonts are compiled locally and delivered directly from our isolated server container. No user IP addresses are leaked to third-party tracking services prior to consent.
* All icons and graphics are packaged inside the source files using lightweight SVG components.

### 2. GDPR Verification Modules (Art. 13-15 & 17)
* **Transparency**: Clear disclosures about processed connection parameters, transaction metadata, and subscription tiers.
* **Access**: Users can inspect and download their profile data instantly.
* **Right to be Forgotten**: Subscription termination automatically triggers cascading deletions on relational PostgreSQL user tables, removing all PII records permanently.

---

## 🍪 2. Cookie Consent & Protocolling (TDDDG / EinwVO)

The platform enforces strict cookie guidelines and rejects intrusive analytical trackers:
- **Strict Necessity**: Only functional session identifiers required for Stripe checkout or user login are set by default.
- **Analytical Opt-In**: Users must explicitly opt-in to analytical logs. No analytical scripts are loaded prior to consent.
- **Consent Logs**: Every consent action is recorded with a cryptographically secure timestamp to satisfy legal burden-of-proof requirements.

---

## ♿ 3. Accessibility & Usability (BFSG / EN 301 549)

In compliance with the German **Barrier-Free Accessibility Act (BFSG)**:
1. **High Contrast Aesthetic**: Glassmorphism overlays are matched with high-contrast text ratios (white text over dark slate cards with cyber green and gold indicators).
2. **Keyboard Focus Navigability**: Interactive dashboards support standard keyboard tab orders with active visual focus indicators.
3. **Semantic Landmarks**: Standard landmark tags (`<header>`, `<main>`, `<section>`, `<article>`) are used systematically to allow seamless screen-reader navigation.
4. **Touch Target Dimensions**: All clickable controls, toggle chips, and drawers have a minimum tap area of **44x44px** to ensure mobile accessibility.

---

## 🔌 4. Enterprise Interface & API Audit
To ensure absolute data integrity and compliant communication flows, our **API Audit Protocol** enforces:
* **Server-to-Server Kapselung**: All data streams from external providers (CoinGecko, Stooq, Stripe) run purely through secure backend proxies. The client browser never communicates directly with a third-party server.
* **Input Parameter Scrubbing**: Strict sanitizer checks on the backend to filter out parent directory traversals (`../`) and malicious SQL injections.
* **Silent Traceback Logging**: Server errors write full stack trace details to isolated system logs while delivering abstract error structures to the user.
