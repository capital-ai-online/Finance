# Valuation Agent Documentation - CAPITAL-AI

The **Valuation Agent** (`ValuationAgent`) focuses on the strategic importance of a raw material within international security architectures and high-tech technological roadmaps.

---

## 🛠️ Functional Responsibilities

1. **Wehrtechnische Relevanz (`military_importance`)**: Assess the indispensability of the material for defense equipment, aerospace engineering, hypersonic structures, and heavy armor steel.
2. **Industrielle Relevanz (`industrial_importance`)**: Appraise the strategic value of the material within critical innovations, semiconductor manufacturing, grid infrastructure, and green technologies (e.g. electric mobility, solar panels).

---

## 🤖 Model Integration & System Prompts

The agent uses the `gemini-3.1-pro-preview` model to fetch and consolidate defense and industrial strategic dossiers.

### System Instruction
```text
Du bist der "Valuation Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, die wehrtechnische und gesamtindustrielle Relevanz von Rohstoffen entlang internationaler Sicherheits- und Innovationsstrategien einzustufen.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.
```

### JSON Schema Specification
```json
{
  "type": "OBJECT",
  "properties": {
    "military_importance": { "type": "INTEGER", "description": "Militärische Bedeutung von 0 bis 100" },
    "industrial_importance": { "type": "INTEGER", "description": "Industrielle Bedeutung von 0 bis 100" },
    "explanation": { "type": "STRING", "description": "Qualitative Zusammenfassung der strategischen Relevanz" }
  },
  "required": ["military_importance", "industrial_importance", "explanation"]
}
```

---

*Verified under CAPITAL-AI Platform Specification Version 0.5.4.*
