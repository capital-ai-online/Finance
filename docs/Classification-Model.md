# Classification Model - AIF-CORE Raw Materials Taxonomy

This document describes the categorization framework and taxonomic classes supported by the AIF-CORE platform.

---

## 🗂️ Unified Categories

The engine strictly maps all materials into **6 main categories** (`CategoryMain`) with corresponding subdivisions:

### 1. Metalle & Kritische Minerale (`Metal`)
- **Edelmetalle**: Gold (AU), Silber (AG), Platin (PT)
- **Batteriemetalle / Technologiemetalle**: Lithium (LI), Kobalt (CO), Nickel (NI), Kupfer (CU)
- **Seltene Erden**: Neodym (ND), Dysprosium (DY)

### 2. Energierohstoffe (`Energy`)
- **Fossile Brennstoffe**: Rohöl (Brent/WTI), Steinkohle, Erdgas
- **Nuklearbrennstoffe**: Uran (U3O8)

### 3. Agrarrohstoffe (`Agriculture`)
- **Nahrungsmittel / Getreide**: Weizen, Mais, Sojabohnen
- **Genussmittel & Fasern**: Kaffee, Baumwolle

### 4. Industrieminerale (`Industrial`)
- **Konstruktion & Chemie**: Quarzsand, Kalkstein, Phosphate

### 5. Recycling- & Sekundärrohstoffe (`Recycling`)
- **Zirkuläre Fraktionen**: Altmetalle (Kupfer-Schrott), Recycling-Kunststoffe

### 6. Sonderklassen (`Unknown`)
- Placeholder and hybrid commodities.

---

## ⚠️ Criticality Determination

A raw material is flagged as **Systemkritisch (Critical)** under any of the following conditions:
1. **Producer Concentration** $> 60\%$ (e.g. Rare Earth element monopolies).
2. **Geopolitical Supply Risk** $> 65\%$.
3. **Substitutability Difficulty** $< 35\%$ (extremely hard to replace in industrial pipelines).

This categorizing logic is fully shared between the **ClassificationAgent** and our internal quantitative fallbacks to preserve absolute consistency.

---

*Verified under AIF-CORE Platform Specification Version 0.5.4.*
