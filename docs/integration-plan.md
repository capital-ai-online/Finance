# Enterprise Integration Plan: Quantitative Market Screening Orchestrator

## Document Overview
- **Author**: Senior Enterprise Software Architect & Quality Auditor
- **Target Platform**: AIF-CORE Platform (Version 0.5.0 Beta-Phase)
- **Status**: Ready for Implementation (Approved)
- **Last Modified**: 2026-07-01

This document outlines the technical architecture for integrating the modular workflow layers and skill files into the AIF-CORE web application. This integration bridges the high-fidelity quantitative analysis engine with the real-time orchestrator, preserving audit trails, strict compliance, and high fault-tolerance.

---

## 1. File Classification

Below is the classification of the six enterprise workflow assets provided for integration:

| File Name | Layer Role | Purpose | Dependencies | Output Artifacts |
| :--- | :--- | :--- | :--- | :--- |
| **`market_data_validation_layer.skill.md`** | Layer 1: Validation | Input validation, schema enforcement, and data freshness validation. | Raw Market Feeds | `validation_status`, `data_quality_score`, `issue_list`, `normalized_payload`, `validation_audit_trail` |
| **`market_scoring_audit_layer.skill.md`** | Layer 2: Scoring & Audit | Signal scoring, indicator weight validation, risk penalties, and score explanations. | Layer 1 Outputs | `final_score`, `score_breakdown`, `ranking_position`, `explanation_trace`, `score_audit_trail` |
| **`market_reporting_orchestration_layer.skill.md`** | Layer 3: Reporting | Compiling audit logs into Markdown reports, JSON outputs, and developer roadmaps. | Layer 2 Outputs | `markdown_report`, `json_report`, `roadmap_md`, `quality_summary`, `workflow_status` |
| **`market_screening_orchestration.py`** | Pipeline Engine | Core Python implementation of validation, scoring, and markdown generation. | `dataclasses`, `typing`, `json`, `pathlib` | `market_screening_report.md`, `market_screening_report.json` |
| **`market_screening_orchestration.json`** | Metadata Definition | Defines pipeline steps, event definitions, and expected artifacts. | None | Orchestrator manifest |
| **`market_screening_orchestration.yml`** | Workflow Automation | Declarative GitHub Action definition to run automated checks on commit. | GitHub Runner, Python 3.10 | Automated CI/CD execution & reporting |

---

## 2. Workflow Mapping & Event Flow

The system processes incoming data in a strict pipeline. State transitions are event-driven, ensuring absolute auditability.

```
       [Raw Data Source]
               │
               ▼
┌──────────────────────────────┐
│  Stage 1: Data Validation    │ ──(Rejected)──► [data.rejected] / Terminate
│  (Completeness & Freshness)  │
└──────────────┬───────────────┘
               │ (Validated)
               ▼
       [data.validated]
               │
               ▼
┌──────────────────────────────┐
│    Stage 2: Scoring Engine   │ ──(Mismatched)─► [score.rejected] / Escalate
│  (Weight Sums & Indicators)  │
└──────────────┬───────────────┘
               │ (Approved)
               ▼
       [score.approved]
               │
               ▼
┌──────────────────────────────┐
│  Stage 3: Reporting & QA     │ ──(Audit Trail)─► [report.completed] / Cache
│  (Markdown & Roadmap Gen)    │
└──────────────┬───────────────┘
               │
               ▼
      [workflow.completed]
```

### Detailed Execution Stages:
1. **Validation Stage (Layer 1)**: Enforces schema correctness. Rejects fields with missing key values, negative prices, or timestamps exceeding 15 minutes of max age.
   - **Trigger Event**: Raw ingestion webhook.
   - **Emitted Events**: `data.validated` (on success), `data.rejected` (on invalid critical field), `data.needs_review` (on warnings).
2. **Scoring Stage (Layer 2)**: Re-calculates mathematical components based on weighted indicators (trend, momentum, volume, liquidity, volatility, structure, regime, risk). Sum of weights must equal `1.0` (100%).
   - **Trigger Event**: `data.validated`.
   - **Emitted Events**: `score.approved` (score calculations within parameters), `score.rejected` (weight sum mismatch or negative final scores when prohibited), `score.review_required`.
3. **Reporting Stage (Layer 3)**: Aggregates results of the previous layers and generates actionable executive outputs.
   - **Trigger Event**: `score.approved`.
   - **Emitted Events**: `report.completed`, `roadmap.completed`, `workflow.completed`.

---

## 3. Web Application Integration

### Project Directory Structure Map:
The skill files and core scripts should be placed according to the structured directories below:

```
/
├── docs/
│   └── integration-plan.md                     # This Integration Plan
├── src/
│   ├── components/
│   │   ├── MarkdownOrchestrator.tsx            # Renders Markdown & Workflow Logs
│   │   └── OrchestratorPanel.tsx               # System performance & API stats panel
│   └── lib/
│       └── skills/                             # Enterprise-grade validation assets
│           ├── market_data_validation.skill.json
│           ├── market_scoring_audit.skill.json
│           └── market_reporting_orchestration.skill.json
├── server.ts                                   # Express backend handler & REST proxy
└── server/
    └── workflows/
        ├── market_screening_orchestration.py   # Python execution engine
        └── market_screening_orchestration.json # Pipeline config schema
```

### Execution Protocol:
1. **Backend Integration (`server.ts`)**:
   - The Express application acts as the control plane.
   - Exposes `/api/orchestrator/execute-screening` to run the validation, scoring, and reporting pipeline.
   - Launches the Python daemon or executes the script using a secure child process (`spawn`), passing JSON payloads directly to `stdin` and capturing `stdout` to avoid raw shell injection vectors.
2. **Frontend Orchestrator (`MarkdownOrchestrator.tsx`)**:
   - Interacts with `/api/orchestrator/execute-screening`.
   - Renders active workflow state, execution durations, and step statuses in real-time.
   - Dynamically loads and renders generated markdown files (`market_screening_report.md`) through the custom Markdown rendering component.

---

## 4. Execution Contract

### Input JSON Schema (`market_screening_orchestration.json`):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MarketScreeningInput",
  "type": "object",
  "required": ["symbol", "market", "timeframe", "timestamp", "price", "volume", "source_id", "calculation_version"],
  "properties": {
    "symbol": { "type": "string" },
    "market": { "type": "string", "enum": ["crypto", "stock", "forex"] },
    "timeframe": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "price": { "type": "number", "minimum": 0.00001 },
    "volume": { "type": "number", "minimum": 0 },
    "source_id": { "type": "string" },
    "calculation_version": { "type": "string" },
    "score_components": {
      "type": "object",
      "required": ["trend", "momentum", "volume", "liquidity", "volatility", "structure", "regime", "risk"],
      "properties": {
        "trend": { "type": "number", "minimum": 0, "maximum": 1 },
        "momentum": { "type": "number", "minimum": 0, "maximum": 1 },
        "volume": { "type": "number", "minimum": 0, "maximum": 1 },
        "liquidity": { "type": "number", "minimum": 0, "maximum": 1 },
        "volatility": { "type": "number", "minimum": 0, "maximum": 1 },
        "structure": { "type": "number", "minimum": 0, "maximum": 1 },
        "regime": { "type": "number", "minimum": 0, "maximum": 1 },
        "risk": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    }
  }
}
```

### Output JSON Schema:
```json
{
  "type": "object",
  "required": ["validation", "score", "workflow_status"],
  "properties": {
    "validation": {
      "type": "object",
      "required": ["status", "data_quality_score", "issues", "normalized_payload"],
      "properties": {
        "status": { "type": "string", "enum": ["pass", "review", "fail"] },
        "data_quality_score": { "type": "number", "minimum": 0, "maximum": 100 },
        "issues": { "type": "array" }
      }
    },
    "score": {
      "type": "object",
      "required": ["final_score", "breakdown", "ranking_position", "trace"],
      "properties": {
        "final_score": { "type": "number", "minimum": 0, "maximum": 100 }
      }
    },
    "workflow_status": { "type": "string", "enum": ["completed", "failed"] }
  }
}
```

### High-Availability Error Handling & Fallback Strategy:
- **Rate-Limiting Fallback (Resource Exhaustion)**: In case the LLM or API gateway throws an error (e.g., `429 RESOURCE_EXHAUSTED`), the backend automatically bypasses AI text completion and utilizes a high-fidelity quantitative fallback. It reads the local database cache (`assetRegistry`), extracts volatility and price momentum metrics, and fills the template deterministically.
- **Circuit Breaker**: If the Python executor fails due to environment issues, the system catches the panic state and executes a pure TypeScript implementation of the validation and scoring algorithms to keep the dashboard responsive.

---

## 5. Quality & Security Checks

1. **DSGVO/GDPR Data Privacy Mandate**:
   - Personally Identifiable Information (PII) including client IP addresses, emails, and transaction IDs MUST be masked, obfuscated, or anonymized in all diagnostic logs.
   - Log files saved under `/uploads/logs/` or emitted via server events must redact user contexts using SHA-256 salts.
2. **Calculation Integrity**:
   - **Weight Sum Target**: The scoring script validates that the weights array sum equals `1.0`. Any deviation of `> 1e-6` raises an immediate `weight_sum_error`.
   - **Lower Bound Guard**: Ensures final scores never fall below `0` even when risk penalties are high.
3. **Audit Trail Logging**:
   - Each run records a detailed trace inside `explanation_trace` and outputs `validation_audit_trail` and `score_audit_trail`.
   - Saved report outputs (`market_screening_report.json`) are version-pinned and cryptographically hashed for immutability verification.

---

## 6. Implementation Recommendations

- **Modular Boundaries**: Maintain clear boundaries. Never combine the validation, scoring, and reporting logics into one single script. Each layer must run independently and output its structured intermediate payload.
- **Naming Conventions**:
  - Event schemas: Use dot notation (`<entity>.<status>`), e.g., `data.validated`, `score.approved`.
  - Report folders: Save outputs to `/uploads/reports/` using a standardized prefix: `screening_report_${symbol}_${timestamp}.json`.
- **Versioning Strategy**: Pin the integrated core framework to **Version 0.5.0 (Beta-Phase)**. This version representation must be consistent across components and user-facing dashboards.

---

## 7. Final Deliverables & Integration Roadmap

### Executive Summary:
This architecture represents an enterprise-grade quantitative workflow system. By combining layer-based declarative skill markdown contracts with robust runtime engines, AIF-CORE guarantees calculation fidelity, auditability, and immediate disaster recovery even under extreme service outages.

### Risk Register:
- **API Rate Limits (High Probability, Low Impact)**: Handled gracefully via local quantitative fallback loops.
- **Python Subprocess Latency (Low Probability, Medium Impact)**: Mitigated by asynchronous background job queues and TypeScript-based in-memory execution fallbacks.
- **CORS / Network Interruptions (Medium Probability, High Impact)**: Solved by server-side proxying and absolute path resolution relative to workspace root.

---

## Technical Integration Action Checklist

- [x] Create the technical Integration Plan `/docs/integration-plan.md`.
- [ ] Save the Layer 1-3 Markdown skills under `/src/lib/skills/`.
- [ ] Add the python orchestration script `/server/workflows/market_screening_orchestration.py`.
- [ ] Integrate the `/api/orchestrator/execute-screening` route into the Express `server.ts` server.
- [ ] Bind execution metrics and reports display directly into the React `MarkdownOrchestrator` component.
- [ ] Run build verification and automated tests using `compile_applet` and the linter.
