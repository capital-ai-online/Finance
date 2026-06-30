# 🔍 SEO Checklist & Content Optimization
**Project: Jenova Nexus (AIF-CORE)**
**Focus: Financial Quantitative Analysis Tools**

---

## 🎯 SEO Strategy Objectives

To position Jenova Nexus (AIF-CORE) at the top of organic search results for keywords like "Quantitative Backtesting Tool", "Benjamin Graham Calculator", and "Monte Carlo Portfolio Simulation", without sacrificing performance or styling.

---

## 📋 Comprehensive On-Page SEO Checklist

### 1. Semantic Markup & Hierarchy
- [x] **Single `<h1>` Tag**: Ensure each view or document contains exactly one `<h1>` tag with high-value keywords.
- [x] **Subheading Hierarchy**: Keep subheadings nested correctly (`<h2>` followed by `<h3>` and `<h4>`).
- [x] **Alt Attributes**: Ensure all images/visuals have meaningful, descriptive alternative texts.

### 2. Meta Tags & JSON-LD Structured Data
Ensure the core layout injected in `/index.html` includes rich structured metadata for index bots:

```html
<!-- SEO Metadata -->
<title>Jenova Nexus - High-Performance Quantitative Investment Core</title>
<meta name="description" content="AIF-CORE is a zero-code model-independent quantitative analysis system. Calculate Benjamin Graham DCF, simulate Monte Carlo paths, and run historical backtests." />

<!-- OpenGraph (Social Sharing) -->
<meta property="og:title" content="Jenova Nexus - AIF-CORE Engine" />
<meta property="og:description" content="Secure, high-performance financial analytics and multi-model routing core." />
<meta property="og:type" content="website" />
```

### 3. Core Web Vitals (CWV) & Mobile Speed
Search engines penalize slow websites, especially on mobile networks:
* **Asset Optimization**: Build with Vite to compile optimized static assets.
* **Font Delivery**: Eliminate external CDN requests for Google Fonts. Use local fallback font variables to guarantee instantaneous text rendering.
* **Bundle Budgeting**: Keep bundle sizes minimal by avoiding large dynamic imports and utilizing light chart engines (like Recharts/D3).

---

## 🔑 Key Target Keywords

* `quantitative backtesting tool` (high commercial intent)
* `benjamin graham calculator online` (high informational intent)
* `monte carlo portfolio simulator` (medium intent)
* `dsgvo konforme finanzsoftware` (regional target keyword)
