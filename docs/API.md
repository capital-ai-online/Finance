# API Specification - Raw Materials Module

This document specifies the REST API endpoints exposed by the AIF-CORE Raw Materials scoring module.

---

## 🗺️ Base URL
All routes are mounted server-side under the base path:
`/api/raw-materials`

---

## 🔌 Endpoint Overview

### 1. `GET /list`
Returns a summary catalog of all pre-registered raw materials with their standard scores.

- **Request**: None
- **Response** (`200 OK`):
```json
[
  {
    "symbol": "CU",
    "name": "Kupfer",
    "category_main": "Metal",
    "category_sub": "Industriemetalle",
    "is_critical": true,
    "score": 71.5
  },
  {
    "symbol": "LI",
    "name": "Lithium",
    "category_main": "Metal",
    "category_sub": "Batteriemetalle",
    "is_critical": true,
    "score": 67.8
  }
]
```

---

### 2. `POST /analyze`
Triggers the full parallel multi-agent orchestrated analysis. Utilizes Gemini model queries.

- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "name": "Kupfer",
  "customInput": {
    "market_liquidity": 80
  }
}
```
- **Response** (`200 OK`):
```json
{
  "raw_material": "Kupfer",
  "classification": {
    "category_main": "Metal",
    "category_sub": "Industriemetalle",
    "market_type": "Börsennotiert (LME)",
    "valuation_mode": "Kritikalität & Strategische Relevanz",
    "confidence": 0.88,
    "reasoning": [
      "Hauptindikatoren für physische Metalle erfüllt.",
      "Identifiziert als strategischer Rohstoff der Energiewende."
    ]
  },
  "scores": {
    "fundamentals": 73,
    "risk": 38,
    "liquidity": 78,
    "strategicValue": 65,
    "final_score": 71.5,
    "market_liquidity": 78,
    "processing_complexity": 72,
    "risk_resilience": 38,
    "strategic_importance": 65
  },
  "weights": {
    "fundamentals": 0.25,
    "risk": 0.25,
    "liquidity": 0.15,
    "processing": 0.15,
    "strategic_value": 0.20
  },
  "data_quality": {
    "level": "high"
  },
  "reasoning": [
    "Überragende strategische und fundamentale Stärke mit exzellenter Resilienz.",
    "[Geologie & Fundamente] Hoher geologischer Reinheitsgrad im südamerikanischen Kupfergürtel.",
    "[Risiko & Kette] Logistik-Engpässe an chilenischen Häfen dämpfen Transporteffizienz.",
    "[Strategie & Relevanz] Unverzichtbarer Kern-Rohstoff für Windkraftanlagen und Elektromobilität."
  ],
  "inputs": {
    "name": "Kupfer",
    "category_main": "Metal",
    "market_liquidity": 80,
    "volatility": 40,
    "trading_volume": 75,
    "ore_grade": 80,
    "tonnage": 70,
    "tonnage_reserve": 80,
    "substitution_potential": 30,
    "recyclability": 60,
    "processing_complexity": 45,
    "infrastructure_availability": 80,
    "extraction_costs": 50,
    "geopolitical_risk": 35,
    "supply_chain_risk": 40,
    "regulatory_risk": 30,
    "esg_risk": 45,
    "producer_concentration": 40,
    "military_importance": 40,
    "industrial_importance": 90
  },
  "metadata": {
    "scoring_version": "v1.0-standard",
    "data_quality": 1.0
  }
}
```

---

### 3. `POST /score`
Performs immediate deterministic mathematical scoring based on manual slider parameters. Extremely fast, skips model call latency.

- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "input": {
    "name": "Kupfer (Sandbox)",
    "category_main": "Metal",
    "market_liquidity": 90,
    "volatility": 20
  }
}
```
- **Response** (`200 OK`): Matches the standard scoring output structure.

---

*Verified under AIF-CORE Platform Specification Version 0.5.4.*
