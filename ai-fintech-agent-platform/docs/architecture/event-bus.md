# Event Bus Design Specification
## Replayable, Schematized FinTech Event Streaming

The **Event Bus** is the central nervous system of the platform. It coordinates communications across all components while acting as an immutable audit recorder. It implements strict regulatory naming guidelines, dynamic wildcard routing, and historical event replay features for security forensics.

---

## 1. Namespace Separation & Regulatory Validation

To comply with enterprise naming protocols, the Event Bus rejects any published event that does not match one of six approved namespaces. This prevents raw developer-designed events from polluting governed financial queues.

### Approved Event Prefixes

| Namespace Prefix | Primary Responsibility | Example Event |
| :--- | :--- | :--- |
| `agent.` | Lifecycle events from individual micro-agents | `agent.risk.started` |
| `workflow.` | Events published by the DAG execution engine | `workflow.dag.completed` |
| `risk.` | Core financial risk warnings | `risk.beta.outlier` |
| `policy.` | Policy engine rulings and human-in-the-loop triggers | `policy.violation.encountered` |
| `audit.` | Direct alerts to corporate or state compliance systems | `audit.alert.compliance` |
| `execution.` | Trade execution status updates from sandboxes | `execution.order.filled` |

*If an event is published with a prefix like `user.action.clicked`, the Event Bus immediately throws an `[EventBus Compliance Violation]` error and stops execution.*

---

## 2. Dynamic Wildcard Routing & Patterns

The Event Bus supports dynamic pattern matching for subscribers. This allows monitoring tools to listen to broad namespaces without needing to register individually for every possible event type.

- **Exact Match**: Subscribing to `workflow.dag.completed` catches only that specific event.
- **Wildcard Prefix Match**: Subscribing to `agent.*` (using `.*`) catches any event starting with `agent.` (e.g., `agent.planner.started`, `agent.executor.completed`, `agent.compliance.failed`).
- **Global Wildcard Match**: Subscribing to `*` captures every event flowing through the system.

---

## 3. Immutable Event History & Playback

The Event Bus archives every processed event in an in-memory chronological sequence. Because events are typed objects, this acts as a **Source of Truth** ledger.

```
       [Event 1] ───> [Event 2] ───> [Event 3] ───> [Event 4]
                                                       │
                                                       ▼
                                         [Query: Replay "agent.*"]
                                                       │
                                                       ▼
                                         [Filtered Replay Sequence]
                                         [Event 2: agent.risk.started]
                                         [Event 3: agent.risk.completed]
```

### The Replay Interface

Developers and compliance auditors can reconstruct historical state by querying the `replay` function:

```typescript
// Replay all compliance-related events since a specific timestamp
const history = eventBus.replay("agent.*", "2026-07-06T06:00:00.000Z");
```

---

## 4. Architectural Safety Benefits

- **Decoupled Architecture**: Agents never communicate directly with other agents. They emit state changes to the Event Bus, allowing the Workflow Engine to coordinate actions without tight code bindings.
- **Auditable Security**: An auditor can subscribe to `*` to stream full system behavior to an off-site logging cluster without modifying a single line of agent code.
- **State Hydration**: If a service crashes, it can replay events using its unique `correlationId` to reconstruct the exact state of active workflows prior to the crash.
