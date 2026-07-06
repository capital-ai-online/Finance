# Platform Architectural Design Specification

This document details the software design, sequence diagrams, and interface boundaries of the AI Agent FinTech Orchestration Platform V2.

## Distributed Workflow Topology

Every transaction starts at the **API Gateway**, is validated by the **Policy Engine** pre-execution, and then fans out across specialized micro-agents:

```
        [User Trigger]
              │
              ▼
       ┌──────────────┐
       │ API Gateway  │
       └──────┬───────┘
              │ (Orchestrate)
              ▼
     ┌──────────────────┐      (OPA Check)      ┌────────────────┐
     │Master Supervisor ├──────────────────────>│ Policy Engine  │
     └────────┬─────────┘                       └────────────────┘
              │ (Event Driven Loops)
              ▼
    ┌───────────────────┐
    │     Event Bus     │
    └─┬───┬───┬───┬───┬─┘
      │   │   │   │   │
      │   │   │   │   └──> [ComplianceAgent]  (MiFID II audit checks)
      │   │   │   └──────> [RiskAgent]        (Beta, Drawdowns, Value-at-Risk)
      │   │   └──────────> [ExecutorAgent]    (Simulated execution)
      │   └──────────────> [PlannerAgent]     (Workflow checkpoints)
      └──────────────────> [RouterAgent]      (Semantic classification)
```

## Immutable Event Logging & Traceability

1. **Correlation IDs**: Every workflow execution creates a unique `correlationId` tracking tag. This header is propagated through every single event published to the `EventBus` and trace spans added by the agents.
2. **Deterministic Replays**: The `EventBus` archives events in sequence. By matching timestamps and routing keys, developers or regulators can replay exact historical trading or rebalancing streams.
3. **Structured Span Auditing**: Spans track latency, memory utilization, and parameter inputs, storing JSONL logs in the `/logs/audit` directory.
