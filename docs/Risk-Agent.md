# Risk Agent Documentation - CAPITAL-AI

The **Risk Agent** (`RiskAgent`) conducts extensive risk assessments across global raw material supply chains, capturing vulnerabilities, country concentrations, and regulatory hurdles.

---

## 🛠️ Functional Responsibilities

All risk parameters are assessed on a scale of `0` (absolutely risk-free) to `100` (maximal threat or volatility):

1. **Geopolitisches Risiko (`geopolitical_risk`)**: Country-specific political stability in main mining and refining hubs.
2. **Lieferketten-Vulnerabilität (`supply_chain_risk`)**: Physical transport bottlenecks, shipping choke points, and logistics constraints.
3. **Regulatorische Schranken (`regulatory_risk`)**: Dependency on tariffs, export bans, environmental restrictions, or resource nationalism.
4. **ESG-Faktor (`esg_risk`)**: Ecological degradation, carbon intensity of extraction, social criteria compliance, and human rights aspects.
5. **Herstellerkonzentration (`producer_concentration`)**: Aggregated index mapping global production monopolies (e.g., Rare Earth processing hubs).
6. **Preisvolatilität (`volatility`)**: History of sharp and speculative price fluctuations in major mercantile exchanges.

---

## 🤖 Model Integration & System Prompts

The agent uses the `gemini-3.1-pro-preview` model to assess global risk vectors.

### System Instruction
```text
Du bist der "Risk Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, Versorgungsrisiken, Länderrisiken und ESG-bezogene Schwachstellen entlang der globalen Rohstofflieferkette zu analysieren.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.
```

### JSON Schema Specification
```json
{
  "type": "OBJECT",
  "properties": {
    "geopolitical_risk": { "type": "INTEGER", "description": "Geopolitisches Risiko von 0 bis 100" },
    "supply_chain_risk": { "type": "INTEGER", "description": "Lieferkettenrisiko von 0 bis 100" },
    "regulatory_risk": { "type": "INTEGER", "description": "Regulatorisches Risiko von 0 bis 100" },
    "esg_risk": { "type": "INTEGER", "description": "ESG/Umweltrisiko von 0 bis 100" },
    "producer_concentration": { "type": "INTEGER", "description": "Herstellerkonzentration von 0 bis 100" },
    "volatility": { "type": "INTEGER", "description": "Preisvolatilität von 0 bis 100" },
    "explanation": { "type": "STRING", "description": "Kurze qualitative Zusammenfassung der Risikotreiber" }
  },
  "required": ["geopolitical_risk", "supply_chain_risk", "regulatory_risk", "esg_risk", "producer_concentration", "volatility", "explanation"]
}
```

---

## 🛡️ Risk Mitigation Strategy

Risk scores are heavily weighted inside critical commodity configurations to calculate high-security cushions, warning industrial decision-makers of high country-of-origin concentrations.

---

*Verified under CAPITAL-AI Platform Specification Version 0.5.4.*
