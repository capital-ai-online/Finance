# Scoring Model - CAPITAL-AI Raw Materials Engine

This document outlines the mathematical models, dynamic weights, and formula implementations used inside the centralized CAPITAL-AI **Scoring Engine** (`RawMaterialsScoringService`).

---

## 📐 Scoring Formula & Dimensions

The global score is computed on a scale of **0 to 100**, aggregated across **5 core dimensions**:

$$Score_{Final} = \sum_{d \in Dimensions} Score_{d} \times Weight_{d}$$

Where the active scoring configurations map as follows:

| Dimension | Key Identifier | Description | Standard Weight (v1.0) | Critical Weight (v1.2) |
| :--- | :--- | :--- | :---: | :---: |
| **Markt & Liquidität** | `liquidity` | Volatilität, physisches Handelsvolumen, Börsenaktivität | 15% | 10% |
| **Fundamentaldaten** | `fundamentals` | Vorkommen, Reichweite, Erzgehalt, Substituierbarkeit, Recycling | 25% | 20% |
| **Gewinnung & Komplexität** | `processing` | Raffinationsaufwand, Infrastruktur, Förderkosten | 15% | 15% |
| **Risiko & Resilienz** | `risk` | Geopolitik, Lieferkette, Zölle, ESG-Konformität, Konzentration | 25% | 35% |
| **Strategische Relevanz** | `strategicValue` | Wehrtechnische und zukunftsindustrielle Bedeutung | 20% | 20% |

---

## 🧮 Sub-Score Calculations

### 1. Markt & Liquidität
Calculates standard trading liquidity based on exchange listings and trading volumes:
$$Score_{Liquidity} = \frac{Liquidity_{Market} + Volume_{Trading}}{2}$$

### 2. Fundamentaldaten
Aggregates geological abundance, depletion rates, recyclability, and substitution difficulties:
$$Score_{Fundamentals} = \frac{Grade_{Ore} + \frac{Tonnage + Tonnage_{Reserve}}{2} + Substitution_{Potential} + Recyclability}{4}$$

### 3. Gewinnung & Komplexität
Assesses mechanical extraction friction. Lower complexity and costs yield higher positive scores:
$$Score_{Processing} = \frac{(100 - Complexity_{Processing}) + Availability_{Infra} + (100 - Costs_{Extraction})}{3}$$

### 4. Risiko & Resilienz
Aggregates supply chain bottlenecks. Low risks result in higher score contributions:
$$Score_{Risk} = \frac{Risk_{Geopolitical} + Risk_{SupplyChain} + Risk_{Regulatory} + ESG_{Friction} + Concentration_{Producer} + Volatility}{6}$$
$$Contribution_{Risk} = 100 - Score_{Risk}$$

### 5. Strategische Relevanz
Measures critical applications:
$$Score_{Strategic} = \frac{Importance_{Military} + Importance_{Industrial}}{2}$$

---

## 🛡️ Missing Data & Confidence Penalty

When data points are missing, the engine gracefully handles them to prevent crashing, applying a penalty:
- **Data Quality Rating**:
  $$\text{Ratio}_{Missing} = \frac{\text{Missing Fields}}{\text{Total Fields (18)}}$$
  - $\text{Ratio}_{Missing} \le 15\% \to$ **High** quality
  - $\text{Ratio}_{Missing} \le 35\% \to$ **Medium** quality
  - $\text{Ratio}_{Missing} \le 60\% \to$ **Low** quality
  - $\text{Ratio}_{Missing} > 60\% \to$ **Unknown** quality

- **Confidence Score**:
  $$Confidence = \max(0.15, BaseConfidence - (MissingCount \times 0.04))$$

---

*Verified under CAPITAL-AI Platform Specification Version 0.5.4.*
