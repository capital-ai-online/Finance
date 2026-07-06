# Business Orchestrators Design Specification
## Directed Acyclic Graph (DAG) Workflow Coordination

The **Business Orchestrator** is built on top of a specialized **Workflow Engine** that executes distributed multi-agent operations. Rather than linear scripting, complex transactions are structured as **Directed Acyclic Graphs (DAGs)**, facilitating parallel execution, topological sorting, deterministic retries, and comprehensive rollbacks (transactional compensation).

---

## 1. Directed Acyclic Graph (DAG) Architecture

Each workflow execution is modeled as a set of distinct tasks connected by dependency edges.

```
                  ┌──────────────────┐
                  │ TASK A: Router   │ (Classify request)
                  └────────┬─────────┘
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
        ┌─────────────────┐ ┌─────────────────┐
        │ TASK B: Risk    │ │ TASK C: Compl.  │ (Execute in parallel)
        └────────┬────────┘ └────────┬────────┘
                 │                   │
                 └─────────┬─────────┘
                           ▼
                  ┌──────────────────┐
                  │ TASK D: Executor │ (Perform final transaction)
                  └──────────────────┘
```

---

## 2. Dynamic Workflow Execution Engine

The platform's `WorkflowEngine` implements:
- **Topological Resolution**: It searches the DAG for tasks whose dependencies are completely resolved (`status === "COMPLETED"`). These are queued and executed in parallel.
- **Cycle Prevention**: To protect systems against deadlock, the engine checks for circular dependencies. If no tasks can be executed while some are still pending, the engine stops execution and triggers an error.
- **Exponential Backoff Retries**: Failed tasks have a configurable amount of `retriesRemaining` (defaulting to `3`). On failure, the engine waits for a backoff duration scaled as $Duration = 2^{attempt} \times 100\text{ms}$ before retrying.

---

## 3. Transactional Compensation & Rollback Model

If a critical task fails and exhausts all retries, the workflow enters a `FAILED` state. To ensure data consistency across distributed systems, the engine initiates **Transactional Compensation**:

- During DAG construction, developers can register corresponding **Compensation Tasks** (rollback actions) using `registerCompensation(dag, rollback)`.
- On workflow failure, the engine pops the registered compensation callbacks and executes them in **reverse chronological order**.
- This ensures that if funds were reserved in Step B, they are unlocked if Step D fails.

```
Execution Order:    Step A ──> Step B ──> Step C ──> Step D (FAIL)
                                                        │
Rollback Order:     Step B (Undo) <── Step C (Undo) <───┘
```

---

## 4. Example Orchestration Blueprint

```typescript
import { WorkflowEngine } from "@fintech-platform/workflow-engine";
import { EventBus } from "@fintech-platform/event-bus";

const eventBus = new EventBus();
const engine = new WorkflowEngine(eventBus);

// 1. Initialize DAG
const dag = engine.createDAG("corr_987654321");

// 2. Add Topological Nodes
engine.addTask(dag, {
  id: "route_task",
  agentName: "Router",
  payload: { query: "Reallocate stock holdings to crypto" },
  dependsOn: [],
  retries: 2
});

engine.addTask(dag, {
  id: "risk_check",
  agentName: "Risk",
  payload: { portfolioAssets: [{ symbol: "BTC", weight: 0.8, historicalBeta: 1.2 }] },
  dependsOn: ["route_task"]
});

engine.addTask(dag, {
  id: "compliance_check",
  agentName: "Compliance",
  payload: { traderId: "usr_99", jurisdiction: "EU", assetClass: "CRYPTO" },
  dependsOn: ["route_task"]
});

engine.addTask(dag, {
  id: "execute_trade",
  agentName: "Executor",
  payload: { action: "BUY", symbol: "BTC", amount: 1000, isSimulation: true },
  dependsOn: ["risk_check", "compliance_check"]
});

// 3. Register Compensating Rollback Step
engine.registerCompensation(dag, async () => {
  console.log("Compensating BTC purchase: Releasing held capital reserves.");
});
```
