# Supervisor

## Enterprise Component

Status: Implemented (extended 2026-08-16)

Version: 1.2.0

Owner: CAPITAL-AI

---

## Purpose

`supervisor.ts` is the real Supervisor component.

**Implemented:**

- **Task Routing / Tool Selection** — `routeTask()`
- **Execution Control / Retry / Recovery / Self-Healing** — `executeSupervised()`
- **Approved write path** — `executeApprovedSupervisedAction()` (Policy → Approval → Apply → Audit)
- **Agent Provider Chain Observation** (2026-08-16) — ChatGPT, Claude, Grok via `observeAgentProviderChain()`; Google AI Studio/NotebookLM/Gemini = RETIRED
- **Findings** — lightweight findings from failed supervised executions and provider inventory (ESS-0002 spirit; Supervisor does not decide)

**Not implemented:**

- Multi-engine Conflict Resolution (one authoritative engine per asset class)
- Full ESS-0002 Digital Twin / complete finding lifecycle persistence

---

## ESS / ADR

ESS-0001, ESS-0001-CONTRACTS, ESS-0002; ADR-0018, ADR-0051, ADR-0062
