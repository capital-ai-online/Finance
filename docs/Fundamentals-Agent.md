# Fundamentals Agent Documentation - CAPITAL-AI

The **Fundamentals Agent** (`FundamentalsAgent`) is responsible for conducting the physical, geomechanical, and supply abundance analysis of a given raw material.

---

## 🛠️ Functional Responsibilities

The agent evaluates key geological availability parameters, scoring them from `0` (critically low or depleted) to `100` (abundantly high):

1. **Erzgehalt (`ore_grade`)**: The average concentration of mineral within the ore body. High purity is scored closer to 100.
2. **Abbau-Volumen (`tonnage`)**: The current global yearly mining or extraction volume.
3. **Bekannte Reserven (`tonnage_reserve`)**: Calculated lifetime and abundance of global unmined reserves under current economic conditions.
4. **Substituierbarkeit (`substitution_potential`)**: How easily the material can be replaced by other metals or chemicals in core industrial applications (100 = trivial to substitute, 0 = entirely unique).
5. **Recyclingfähigkeit (`recyclability`)**: The degree of circularity. 100 representing metals that can be recycled infinitely without loss of properties.

---

## 🤖 Model Integration & System Prompts

The agent uses the `gemini-3.1-pro-preview` model to compile intelligence on geomechanical mines and reserves.

### System Instruction
```text
Du bist der "Fundamentals Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, die physische Verfügbarkeit, geologische Beschaffenheit und Kreislauffähigkeit von Rohstoffen quantitativ und qualitativ zu bewerten.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.
```

### JSON Schema Specification
```json
{
  "type": "OBJECT",
  "properties": {
    "ore_grade": { "type": "INTEGER", "description": "Erzgehalt von 0 bis 100" },
    "tonnage": { "type": "INTEGER", "description": "Fördervolumen von 0 bis 100" },
    "tonnage_reserve": { "type": "INTEGER", "description": "Reservenreichweite von 0 bis 100" },
    "substitution_potential": { "type": "INTEGER", "description": "Substituierbarkeit von 0 bis 100" },
    "recyclability": { "type": "INTEGER", "description": "Recyclingfähigkeit von 0 bis 100" },
    "explanation": { "type": "STRING", "description": "Kurze qualitative Begründung der geologischen Fundamentaldaten" }
  },
  "required": ["ore_grade", "tonnage", "tonnage_reserve", "substitution_potential", "recyclability", "explanation"]
}
```

---

## 🛡️ Fallback Strategy

When running in offline or fallback modes, standard geological coefficients derived from historical survey records of the US Geological Survey (USGS) and Federal Institute for Geosciences and Natural Resources (BGR) are loaded dynamically.

---

*Verified under CAPITAL-AI Platform Specification Version 0.5.4.*
