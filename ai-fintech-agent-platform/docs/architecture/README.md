# AI Agent FinTech Orchestration Platform V2
## Core Architecture Overview & System Design

This directory contains the formal architectural, design, and regulatory compliance specifications for the enterprise-grade AI Agent FinTech Orchestration Platform V2. The platform is designed to govern, coordinate, validate, and audit distributed, multi-agent automated financial trading and portfolio rebalancing workflows with absolute zero-trust integrity.

---

## 1. System Topology & Architecture Diagram

The platform utilizes a dual-layer control plane consisting of the **Platform Director** (regulatory intercept and policy brain) and the **Master Supervisor** (operational monitor, orchestrator, and resilience router). This architecture decouples functional agent intelligence from compliance and governance guardrails.

```
                  ┌────────────────────────────────────────┐
                  │          API Gateway (Port 3000)       │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │       Platform Director (System Brain)  │◄─── [Policy Engine]
                  │              (Port 3005)               │    (OPA Evaluation)
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │     Master Supervisor (Health Monitor) │◄─── [Observability / Spans]
                  │              (Port 3100)               │    (Immutable JSONL Tracing)
                  └───────────────────┬────────────────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        ▼                           ▼
             ┌─────────────────────┐     ┌─────────────────────┐
             │  Replayable Event   │     │   Plugin Sandbox    │
             │   Bus (InMemory)    │     │       System        │
             └──────────┬──────────┘     └──────────┬──────────┘
                        │                           │
         ┌────────┬─────┴─────┬────────┐            ├─> [Custom Tax Plugin]
         ▼        ▼           ▼        ▼            └─> [Whitelabel Broker]
      [Router] [Planner]  [Risk]  [Compliance]
```

---

## 2. Platform Execution Flow

The typical lifecycle of a transaction runs through five highly governed phases:

1. **Ingress & Interception**:
   - The user triggers an action (e.g., portfolio rebalancing or trade proposal) at the **API Gateway**.
   - The Gateway publishes `workflow.initiated` to the **Event Bus**.
   - The **Platform Director** intercepts the event immediately prior to scheduling any tasks.

2. **Policy Verification (OPA)**:
   - The **Platform Director** passes the transaction metadata to the **Policy Engine**.
   - The Engine evaluates the rules in a strict pipeline:
     - `RULE_VALUE_LIMIT_CHECK`
     - `RULE_EXTERNAL_API_RESTRICTION`
     - `RULE_ASSET_CLASS_RISK_SCORING`
     - `RULE_HUMAN_IN_THE_LOOP_THRESHOLD`
     - `RULE_SIMULATION_COMPLIANCE`
   - If the risk score matches or exceeds `70`, the workflow is flagged as `gatingRequired` and suspended.
   - If a violation occurs, the transaction is rejected, and `policy.violation.encountered` is emitted.

3. **Orchestration & Workflow Generation**:
   - For permitted flows, the **Master Supervisor** translates the request into a **Directed Acyclic Graph (DAG)** workflow.
   - The DAG tasks are mapped to individual agents:
     - `RouterAgent` (Semantic routing and task classification)
     - `PlannerAgent` (Step decomposition and execution checklists)
     - `RiskAgent` (Volatilities, Beta calculations, VaR limits)
     - `ComplianceAgent` (Jurisdiction controls, licensing, MiFID II checklist)
     - `ExecutorAgent` (High-fidelity risk-isolated execution sandbox)

4. **Fault-Tolerant Execution**:
   - Tasks execute asynchronously, honoring topological dependency constraints.
   - If an agent task fails, the **Workflow Engine** executes up to 3 retries with exponential backoff.
   - If all retries are exhausted, the engine initiates **Transactional Compensation**—executing registered rollbacks in reverse order.
   - Concurrently, the **Master Supervisor** intercepts agent failure signals (`agent.*.failed`) and triggers operational hot-swaps or active failovers.

5. **Post-Audit Logging**:
   - The **Observability** framework records structural telemetry spans into the `/logs/audit/` directory.
   - The files are encoded as immutable line-delimited JSON (`.jsonl`) files tracking durations, contexts, errors, and parameters.

---

## 3. FinTech Compliance Model

The platform complies natively with regulatory standards (e.g., MiFID II, SEC Rule 206, and Basel III) using four key strategies:

- **Immutable Historical Traceability**: Every transition publishes structured events on the Event Bus. The historical archive cannot be manipulated or destroyed by the executing agents.
- **Dynamic Risk-Based Gating**: High-volatility products (such as meme tokens or unverified cryptocurrencies) incur immediate risk additions (+50 points) forcing supervisor reviews.
- **Hard-Coded Legal Boundaries**: Non-SSL endpoints, unencrypted calls, and live transactional paths (unless simulation is enabled) are permanently blocked inside the core engine.
- **Fail-Silent Containment**: Agent anomalies, plugin bugs, and system-level panics are contained inside specialized execution sandboxes, preventing cascade failures in critical banking systems.

---

## 4. Documentation Index

To explore the architecture further, please refer to:
- [Platform Director Specification](platform-director.md)
- [Master Supervisor Specification](master-supervisor.md)
- [Business Orchestrators Specification](business-orchestrators.md)
- [AI Agent Layer Specification](ai-agent-layer.md)
- [Event Bus Specification](event-bus.md)
- [Policy Engine Specification](policy-engine.md)
- [Plugin System Specification](plugin-system.md)
- [Observability & Audit Specification](observability.md)
- [Security Architecture Specification](security-architecture.md)
- [Deployment Architecture Specification](deployment-architecture.md)
- [Data Flow Specification](data-flow.md)
- [Sequence Diagrams](sequence-diagrams.md)
- [Architecture Decision Records (ADRs)](README.md#architecture-decision-records-adrs)

### Architectural Decision Records (ADRs)
- [ADR-001: Control Plane Decoupling](ADR-001-control-plane.md)
- [ADR-002: Master Supervisor Operational Isolation](ADR-002-master-supervisor.md)
- [ADR-003: Replayable Event Bus Topology](ADR-003-event-bus-choice.md)
- [ADR-004: OPA-Style Policy Engine Design](ADR-004-policy-engine-model.md)
- [ADR-005: Zero-Trust Plugin Sandbox Model](ADR-005-plugin-security-model.md)
