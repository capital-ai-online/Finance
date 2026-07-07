# Architecture Decision Record (ADR)
## ADR-003: Replayable Event Bus Topology with Strict Schemas

- **Status**: Approved
- **Date**: 2026-07-06

---

## 1. Context

Multi-agent coordination requires low-latency, event-driven communications. However, traditional event-streaming architectures (such as standard message brokers) often treat messages as transient packets. In a FinTech system, this model is insufficient because:
- **No audit trails**: Once an event is delivered, its history is lost, preventing retrospective reviews.
- **No schema discipline**: Any developer could publish unformatted messages, polluting queues and breaking downstream agent inputs.
- **Difficult forensic debugging**: Developers cannot easily reconstruct the system state in a sandbox when debugging order execution anomalies.

---

## 2. Decision

We will implement a custom, schema-validated, replayable **Event Bus** system:
- **Approved Namespace Prefixes**: The Event Bus will reject any event that does not belong to the approved prefixes: `agent.`, `workflow.`, `risk.`, `policy.`, `audit.`, or `execution.`.
- **Immutable Historical Archive**: The Event Bus stores all successfully published events in a sequential archive.
- **Forensic Playback**: The Bus exposes a `replay(pattern, sinceTimestamp)` API to extract and replay specific events for debugging or compliance audits.

---

## 3. Consequences

### Positive Consequences
- **Strict Regulatory Governance**: Incorrectly formatted or rogue events are blocked at the entry point of the messaging system.
- **Deterministic Troubleshooting**: Developers can extract precise historical sequences to replay trade calculations and reproduce bugs.
- **Audit Compliance**: Regulators can query the Event Bus sequence to verify that compliance checks were completed before a trade was executed.

### Negative Consequences
- **Memory Footprint**: Keeping events in memory can consume significant RAM over time. To prevent memory exhaustion, we cap the in-memory buffer to the most recent `100,000` events.

---

## 4. Alternatives Considered

### Unstructured Message Queues
- *Concept*: Use standard RabbitMQ or NATS Core without namespace validation.
- *Rejection Reason*: Bypasses pre-execution compliance checks, leaving the platform vulnerable to unformatted data payloads and architectural drift.

---

## 5. FinTech Justification

Regulators require financial transactions to be auditable and reproducible (e.g., MiFID II RTS 25, requiring high-precision clock synchronization and transaction tracking). The replayable Event Bus creates a permanent, chronologically ordered transaction record, helping compliance teams reconstruct trading activity and prove adherence to security rules.
