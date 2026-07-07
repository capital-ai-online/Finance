# Architecture Decision Record (ADR)
## ADR-002: Dedicated Master Supervisor Daemon

- **Status**: Approved
- **Date**: 2026-07-06

---

## 1. Context

In a distributed multi-agent system, tracing active workloads and detecting node failures is highly complex. If an agent crashes mid-transaction (e.g., during a portfolio rebalancing operation), the system can hang, locking up user funds in intermediate states.

To prevent this, we need a centralized system monitor capable of:
- Tracking active concurrent executions.
- Intercepting agent exceptions.
- Routing conflict-resolution commands (e.g., re-running a failed task on a backup node).

---

## 2. Decision

We will deploy a dedicated operational daemon, the **Master Supervisor**, running on Port `3100`. The Master Supervisor acts as a system monitor:
- It maintains real-time metrics on running workloads by tracking Event Bus signals.
- It catches agent failures (`agent.*.failed`) and automatically triggers conflict-resolution flows (`workflow.conflict.resolved`), switching operations to healthy redundant nodes.
- It is physically decoupled from the regulatory **Platform Director** to isolate operational failover handling from compliance checks.

---

## 3. Consequences

### Positive Consequences
- **High Availability**: If an individual micro-agent container panics or timeouts, the Supervisor detects it within seconds and switches execution, maintaining system availability.
- **Accurate Telemetry**: Provides real-time metrics on concurrency, and logs detailed diagnostic alerts for support teams.
- **Improved Performance**: Decouples monitoring from the main API Gateway, keeping the gateway responsive under high load.

### Negative Consequences
- **Additional Container**: Requires running and maintaining an extra container in the orchestration cluster.
- **Network Overhead**: Emitting heartbeat and status events across the cluster increases internal network traffic.

---

## 4. Alternatives Considered

### Direct Gateway Monitoring
- *Concept*: Have the API Gateway track running workloads and handle timeouts internally.
- *Rejection Reason*: Binds the Gateway to operational state management. If the API Gateway crashed, all tracking data would be lost, leaving orphaned transactions in downstream systems.

---

## 5. FinTech Justification

Financial services must guarantee operational resilience and service continuity under extreme market conditions (Basel III Operational Risk frameworks). Establishing a dedicated Master Supervisor ensures that operational faults (timeouts, out-of-memory errors) are contained, resolved, and documented immediately, preventing service outages and protecting client capital.
