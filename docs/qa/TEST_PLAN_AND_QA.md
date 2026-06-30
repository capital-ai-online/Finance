# 🧪 Test Plan & Quality Assurance (QA Perspective)
**Project: Jenova Nexus (AIF-CORE)**
**Coverage Goal: > 85% Statement Coverage**

---

## 🎯 QA Objectives & Methodology

The goal of the AIF-CORE Quality Assurance program is to verify the mathematical accuracy of investment calculators, backtesting models, and robust error resilience across all major network conditions.

---

## 📋 Core Test Scenarios

### 1. Mathematical Accuracy Tests
- **Graham Formula**: Verify that the Intrinsic Value check handles zero or negative EPS values gracefully, defaulting to safe boundaries rather than returning `NaN` or dividing by zero.
- **Monte Carlo Calculations**: Validate that simulated paths remain within reasonable statistical limits (standard deviation, geometric drift, volatility bounds) and that output arrays match expected shapes.

### 2. Network & API Resilience Tests (The "No-Demo-Data" Mandate)
- **Downstream Failures**: Test the system behavior when the CoinGecko API or Stooq CSV streams are simulated to fail (429 Rate Limits, 503 Outages).
- **Fallback Verification**: Ensure that the server automatically switches to the dynamic high-fidelity cache or simulates fluctuations smoothly, and that the UI logs a warning without crashing.

---

## ⚙️ Automated Testing Architecture

We utilize Jest/TypeScript for unit and integration testing, paired with Playwright for complete browser-level end-to-end (E2E) testing.

```
       [Unit Tests]             [Integration Tests]             [E2E Tests]
       - Formula Math           - Express API Proxies           - Authentication Flows
       - Caching Routines       - Webhook Ingestion             - Dynamic Backtest Charting
```

---

## 🛑 Critical QA Checklists

### 🔄 State & Re-render Prevention Checklist
- [x] **No Infinite Hook Re-renders**: Verify that state updates are never called directly in React component bodies.
- [x] **Stable Hook Dependencies**: Ensure that objects or functions are omitted from `useEffect` dependency arrays unless memoized with `useMemo` or `useCallback`.
- [x] **Null/Array Check**: Confirm that all frontend components mapping server responses have robust safeguards against undefined, null, or invalid data types (`Array.isArray(data)`).

### 📱 Responsive Compatibility Checklist
- [x] **Touch Target Area**: Ensure that mobile navigation buttons, action chips, and close drawers have a minimum tap area of **44x44px**.
- [x] **Bento Grid Reflow**: Test page rendering at `320px`, `768px`, and `1440px` widths to guarantee appropriate column wraps.
