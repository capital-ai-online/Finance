# 🧪 Test Plan & Quantitative Finance Engine (QA Perspective)
**Project: CAPITAL-AI (Capital AI)**  
**Auditor:** QA & Quantitative Analysis Lead  
**Status:** Certified & Production Ready  

---

## 🎯 QA Methodology & Test Suite
Our Quality Assurance framework ensures that all algorithmic calculations, DCF models, and multi-factor scorings are mathematically robust, resilient to edge-case anomalies, and strictly conform to the **No-Demo-Data Policy**.

---

## 📊 1. Quantitative Finance & Stock Scoring Engine (Warren Buffett Style)
We evaluate stocks as long-term business owners rather than short-term momentum traders, utilizing fundamental financial metrics:

### 📈 Fundamental Scoring Framework:
1. **ROIC (Return on Invested Capital)**: Stable and superior return rate over a 3-year trailing period (Weight: **20%**).
2. **ROE (Return on Equity)**: Must exceed **15%** consistently (Weight: **15%**).
3. **Debt-to-Equity (D/E)**: Must be below **0.5** to verify strict conservative capital structures (Weight: **15%**).
4. **FCF (Free Cash Flow)**: Must represent consistent, non-volatile growth (Weight: **15%**).
5. **Operating Margin**: High and stable or improving margins indicating a strong brand (Weight: **10%**).
6. **Revenue Growth 3Y**: Positive and constant trailing growth (Weight: **10%**).
7. **P/E Ratio (Price-to-Earnings)**: Fair valuation check; avoids over-hyped speculative sectors (Weight: **10%**).
8. **Moat-Qualität**: Qualitative assessment of pricing power, switching costs, and brand equity (Weight: **5%**).

### 🔢 Consolidated Buffett Score Classes:
* **90 – 100**: Very High Quality (Strong Buy Candidates)
* **75 – 89**: High Quality (Tradeable Watch)
* **60 – 74**: Good Quality (Observe / Hold)
* **0 – 59**: Not Buffett-Typical (Strict Reject)

---

## 🔍 2. Trading Pattern Engine & Microstructure Analysis
For market entry and exit timing, our pattern recognition system checks technical and structural formations across 4 main classifications:

### A. Bullish Reversal Patterns (Kurswirkung: Bullish)
* **Double Bottom** (Qualitätsklasse: 5)
* **Inverse Head and Shoulders** (Qualitätsklasse: 5)
* **Cup and Handle** (Qualitätsklasse: 5)
* **Falling Wedge** (Qualitätsklasse: 4)
* **Hammer / Bullish Engulfing** (Qualitätsklasse: 3)

### B. Bearish Reversal Patterns (Kurswirkung: Bearish)
* **Double Top** (Qualitätsklasse: 5)
* **Head and Shoulders** (Qualitätsklasse: 5)
* **Rising Wedge** (Qualitätsklasse: 4)
* **Shooting Star / Bearish Engulfing** (Qualitätsklasse: 3)

### C. Continuation Patterns (Kurswirkung: Continuation)
* **Bull Flag / Bear Flag** (Qualitätsklasse: 5)
* **Bull Pennant / Bear Pennant** (Qualitätsklasse: 5)
* **Ascending / Descending Triangle** (Qualitätsklasse: 4)

### D. Neutral & Consolidation Patterns (Kurswirkung: Neutral)
* **Symmetrical Triangle** (Qualitätsklasse: 3)
* **Volatility Squeeze / Coil Compression** (Qualitätsklasse: 4)

---

## 🧪 3. Mathematical Formula Test Scenarios

To avoid critical system failures in high-frequency computational environments, developers must run the following verification checks:

### 1. Graham Formula Safe Boundaries:
* **Test Case**: Input `EPS <= 0` or negative trailing values.
* **Expected Outcome**: The formula must catch the negative input gracefully, bypass square root calculations of negative values, and output a standardized safe floor value rather than returning `NaN` or a division by zero error.

### 2. Monte Carlo Iteration Limits:
* **Test Case**: Compute value-at-risk (VaR) with `Standard Deviation <= 0` or extremely high drift.
* **Expected Outcome**: The simulator must clamp standard deviation bounds, validate output array lengths, and verify that the geometric Brownian motion paths remain statistically plausible.

```python
# TEST IMPLEMENTATION PATTERN
def test_graham_safe_boundaries():
    eps = -2.5
    growth_rate = 1.2
    # The calculation must clamp negative inputs and handle gracefully
    result = calculate_graham_value(eps, growth_rate)
    assert result >= 0.0
    assert not math.isnan(result)
```

---

## 🛑 Critical QA Deployment Checklist
- [ ] **React Hooks Isolation**: State updates are never called directly within the component rendering body to prevent infinite re-renders.
- [ ] **Stable Dependency Keys**: `useEffect` dependencies must only contain primitive keys (strings, numbers, booleans) or heavily memoized objects.
- [ ] **Touch Target Check**: Hit surfaces on all touch targets must be at least **44x44px** to align with BFSG accessibility guidelines.
- [ ] **Dynamic Array Guards**: Every client-side response mapping must be guarded with `Array.isArray(data)` to prevent client crashes.
