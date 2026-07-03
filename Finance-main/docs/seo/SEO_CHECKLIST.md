# 🔍 SEO Checklist & Technical Discovery Guide
**Project: AIF-CORE (Jenova Nexus)**  
**Target Focus:** Quantitative Financial Calculators & Stock Screener Platform  

---

## 🎯 Organic Discovery Goals
To secure organic placements for keywords like "Benjamin Graham DCF Calculator", "Quantitative Stock Screening Tool", "DSGVO-konforme Finanzsoftware", and "Monte Carlo Portfolio Simulation", without adding bloated, slow CDNs or breaking visual constraints.

---

## 📋 Technical On-Page SEO Checklist

### 1. Semantic Hierarchy & Landmarking
- [x] **Strict `<h1>` Constraint**: Exactly one `<h1>` header tag per view containing the primary keyword.
- [x] **Subheading Layout**: Maintain logical subheading nesting (`<h2>` followed by `<h3>` then `<h4>`).
- [x] **Aria Alt Texts**: Provide clear alt values and descriptors for all SVG elements and custom canvas charts.

### 2. Microdata & JSON-LD Structure
Our main entry points incorporate optimized microdata schemas in `/index.html` to assist search bots during indexing:

```html
<!-- SEO Metadata -->
<title>AIF-CORE - Advanced Quantitative Financial Analysis Core</title>
<meta name="description" content="Calculate Benjamin Graham DCF, simulate Monte Carlo paths, and evaluate asset scoring models. AIF-CORE provides zero-code, fully DSGVO-compliant quantitative investment analytics." />

<!-- OpenGraph (Social Metadata) -->
<meta property="og:title" content="AIF-CORE - Quantitative Financial Core" />
<meta property="og:description" content="Secure, high-performance financial analytics and intelligent multi-model routing." />
<meta property="og:type" content="website" />
```

### 3. Page Loading Speed (Core Web Vitals)
Search engines actively penalize slow websites:
* **Zero Webfont CDNs**: Eliminate all external webfont server requests (like Google Fonts) to comply with CJEU privacy precedents and guarantee near-instantaneous text rendering via system fallbacks.
* **Asset Bundling**: Package static assets through Vite with code-splitting, tree-shaking, and lightweight charts (D3/Recharts) to keep initial bundles below performance limits.

---

## 🔑 Primary Targeted Keywords

* `quantitative investment screener` (commercial intent)
* `benjamin graham calculator online` (informational intent)
* `monte carlo portfolio simulator` (medium intent)
* `dsgvo konforme trading software` (regional focus)
