# 🇪🇺 EU Compliance & Data Privacy Report (AIF-CORE / Jenova Nexus)

This report details the architectural and frontend provisions implemented in **AIF-CORE (Jenova Nexus)** to guarantee compliance with EU digital regulations: German Telemedia Act (**§5 DDG**), General Data Protection Regulation (**EU-DSGVO / GDPR**), Cookie Directives, and the German Accessibility Act (**BFSG / EN 301 549**).

---

## 🏛️ Regulatory Compliance Overview

| Regulatory Body | Standard | Status | Implementation Details |
| :--- | :--- | :---: | :--- |
| **EU-DSGVO** | GDPR (General Data Protection) | ✅ Compliant | Consent logs, local backtests, explicit right-to-be-forgotten option. |
| **DDG §5** | Impressum & Legal Disclosures | ✅ Compliant | Easy access layout via dedicated legal screens. |
| **TDDDG** | Cookie Consent Directive | ✅ Compliant | Zero pre-consent tracking, optional storage preference options. |
| **BFSG** | EN 301 549 (Accessibility) | ✅ Compliant | Clean HTML semantics, Aria roles, high contrast visual styling. |

---

## 🔒 GDPR / DSGVO Implementations (Art. 5–9 & 13–15)

The platform is engineered using a **"Privacy-by-Design"** and **"Privacy-by-Default"** framework:

### 1. Zero External Fonts & Assets Leakages
- [x] **No CDN Webfont Requests**: Google Fonts are not loaded from external Google servers (which leaks EU IP addresses without user consent). Fonts are defined natively using elegant pre-installed system font fallbacks (Inter, system-sans, JetBrains Mono), adhering to current CJEU (EuGH) rulings on GDPR violations.
- [x] **Local Computations**: Graham Score evaluations, intrinsic value calculators, and Monte Carlo iterations are executed locally or via an anonymous server proxy without transferring user PII (Personally Identifiable Information) to unauthorized third-party trackers.

### 2. GDPR Compliance Modules (Art. 13-15, 17, 21)
The application provides a dedicated **Compliance Center** accessible via `/src/components/Datenschutz.tsx` containing:
- **Art. 13/14 Information**: Transparency about data collection methods, processed fields (IP addresses, transaction inputs, subscription tier), and the identity of the data controller (AIFinancial GmbH).
- **Art. 15 Right of Access**: The user profile page allows instant inspection of all collected preference states.
- **Art. 17 Right to Eradication ("Right to be Forgotten")**: Subscriptions can be terminated and completely anonymized upon request through database cascading deletions on Supabase sub-tables.

---

## 📑 German Telemedia Compliance (§5 DDG)

The **Impressum & AGB (Allgemeine Geschäftsbedingungen)** comply with the maximum "2-Clicks-Away" legal precedent:

- **Accessibility**: Available via direct links inside the global app footer and configuration screens.
- **Content Requirements**:
  - Full company legal representation (AIFinancial GmbH).
  - Physical register entry, register number, and sales tax identification number (USt-IdNr.).
  - Direct contact options (email and digital contact options) satisfying high-speed communication mandates.

---

## 🍪 Cookie & Consent Architecture (TDDDG / EinwVO)

The platform rejects intrusive cookie banners and third-party advertising cookie scripts:

- **Strict Necessity**: Only functional, technically necessary identifiers are used (session cookies for keeping subscription checkouts secure or matching Stripe webhooks).
- **Consent Banner**: Realized via an elegant consent module that allows users to enable or disable analytical backtesting logs. No scripts or tracking parameters are loaded prior to user authorization.

---

## ♿ Digital Accessibility Check (BFSG / EN 301 549)

To ensure barrier-free operation for all individuals, the frontend implements:

1. **High Contrast Ratios**: Dark glassmorphism interfaces are rendered with high contrast typography (deep white text over rich slate backings, paired with sharp fluorescent cyber green and cyan highlight accents).
2. **Keyboard Navigability**: Interactive dashboards support standard Tab navigation and focus styles.
3. **Semantic HTML Tags**: Pages use meaningful structural landmarks (`<header>`, `<main>`, `<section>`, `<article>`) with unique HTML ID elements to facilitate screen-readers.
4. **Touch Targets**: All control elements, filter chips, and navigation links have a minimum hit area of **44x44px** to optimize usability on mobile screens.

---

## 📝 Compliance Verification Protocol

To verify on-going EU-compliance before each deployment, run:
```bash
# 1. Validate bundle asset localization (No Google Fonts/CDNs leaked)
grep -rn "fonts.googleapis.com" src/

# 2. Check for potential hardcoded credentials
grep -rn "AI_KEY\|SECRET_KEY\|TOKEN" src/
```
