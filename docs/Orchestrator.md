# Master Orchestrator Documentation - AIF-CORE

The **Master Orchestrator** (`RawMaterialsOrchestrator`) serves as the central coordination hub of the entire multi-agent raw material scoring system. It manages parallel thread execution, resolves inputs, and triggers the mathematical scoring engine.

---

## 🔄 Execution Flow Architecture

The pipeline executes in five major sequential stages:

```
[UI Trigger / API Call]
         │
         ▼
 1. [Parallel Worker Execution]
    ├─── ClassificationAgent ───► Category, Subclass & Market Type
    ├─── FundamentalsAgent   ───► Geological Abundance & Grades
    ├─── RiskAgent           ───► Supply Chain, ESG & Country Risks
    └─── ValuationAgent      ───► Military & High-Tech Importance
         │
         ▼
 2. [Database Fallback & Parameter Merging]
    └─── Fills remaining fields (extraction costs, infrastructure, etc.)
         │
         ▼
 3. [Central Scoring Execution]
    └─── RawMaterialsScoringService.scoreMaterial()
         │
         ▼
 4. [Confidence & Data Quality Calculations]
    └─── Multi-variable penalty calculation based on missing fields
         │
         ▼
 5. [Traceability Logs Compilation & Payload Return]
```

---

## 🛠️ Performance & Parallelization

By leveraging asynchronous JavaScript orchestration (`Promise.all`), all four underlying agents are executed in **parallel workers**. This maximizes system throughput and decreases API call latency, delivering comprehensive raw material assessments in a fraction of the time.

```ts
// Runs Classification, Fundamentals, Risk, and Valuation Agents in parallel
const [classification, fundamentals, risk, valuation] = await Promise.all([
  this.classificationAgent.analyze(name),
  this.fundamentalsAgent.analyze(name),
  this.riskAgent.analyze(name),
  this.valuationAgent.analyze(name)
]);
```

---

## ⚙️ Isolated Asset Boundary

In accordance with strict platform directives, the orchestration pipeline is **strictly bounded** and applied **exclusively to Raw Materials (Rohstoffe)**. All other financial assets, index trackers, equities, cryptocurrencies, and meme coins bypass this module entirely and remain unimpacted.

---

*Verified under AIF-CORE Platform Specification Version 0.5.4.*
