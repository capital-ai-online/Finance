# Classification Agent Documentation - CAPITAL-AI

The **Classification Agent** (`ClassificationAgent`) is a core component of the CAPITAL-AI Raw Materials scoring pipeline. It uses generative AI to analyze the name of a raw material and classify it into its respective taxonomic categories.

---

## 🛠️ Functional Responsibilities

1. **Taxonomy Placement**: Automatically categorizes raw materials into one of the main classes: `Metal`, `Energy`, `Agriculture`, `Industrial`, `Recycling`, or `Unknown`.
2. **Sub-category Detection**: Identifies a precise, industry-standard sub-category (e.g., "Batteriemetalle / Technologie-Metalle", "Edelmetalle").
3. **Market Type Discovery**: Classifies where the commodity is traded, distinguishing between spot markets, centralized exchanges (e.g., LME, CBOT), and specialized OTC contracts.
4. **Valuation Mode Selection**: Sets the correct evaluation mode (e.g., "Kritikalität & Strategische Relevanz" vs. "Standard-Marktbewertung") based on system criticality flags.

---

## 🤖 Model Integration & System Prompts

The agent communicates with the Gemini API (using the `gemini-3.1-pro-preview` model) utilizing strict JSON response schemas to guarantee parsing reliability.

### System Instruction
```text
Du bist der "Classification Agent" der CAPITAL-AI Rohstoff-Bewertungsplattform.
Deine Aufgabe ist es, Rohstoffe präzise zu kategorisieren.
Du musst dich strikt an die folgenden Hauptkategorien halten:
"Metal" (Metalle / kritische Metalle), "Energy" (Energierohstoffe), "Agriculture" (Agrarrohstoffe), "Industrial" (Industrieminerale), "Recycling" (Recycling- & Sekundärrohstoffe) oder "Unknown".
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.
```

### JSON Schema Specification
```json
{
  "type": "OBJECT",
  "properties": {
    "category_main": {
      "type": "STRING",
      "description": "Metal, Energy, Agriculture, Industrial, Recycling, Unknown"
    },
    "category_sub": { "type": "STRING", "description": "Spezifische Unterklasse auf Deutsch" },
    "market_type": { "type": "STRING", "description": "Markttyp, z.B. Börsennotiert (LME), OTC-Handel" },
    "valuation_mode": { "type": "STRING", "description": "Bewertungsmodus, z.B. Kritikalität & ökonomischer Wert" },
    "confidence": { "type": "NUMBER", "description": "Konfidenzlevel zwischen 0.0 und 1.0" },
    "reasoning": {
      "type": "ARRAY",
      "items": { "type": "STRING" },
      "description": "3 prägnante Stichpunkte zur Begründung"
    }
  },
  "required": ["category_main", "category_sub", "market_type", "valuation_mode", "confidence", "reasoning"]
}
```

---

## 🛡️ Robust Fallback Mechanism

If the API key is missing or the external API call fails, the agent falls back to a deterministic local database lookup (`RAW_MATERIALS_DATABASE`). This guarantees **zero-downtime** execution and prevents front-end crashes, complying with strict **CAPITAL-AI Data Integrity** guidelines.

---

*Verified under CAPITAL-AI Platform Specification Version 0.5.4.*
