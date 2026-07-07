# Platform Director Design Specification
## The Central Regulatory System Brain

The **Platform Director** is the central regulatory system brain of the FinTech platform. Operating as an independent control plane daemon, its primary responsibility is to intercept workflow execution requests, perform security evaluations, apply compliance policy checks, and manage human-in-the-loop validation gates.

---

## 1. System Responsibilities

The Platform Director oversees three core domains:
- **Pre-Execution Interception**: It subscribes to the Event Bus to intercept incoming transactions (`workflow.initiated`) before any scheduling or operational agent allocation happens.
- **Regulatory Decision Governance**: It acts as the orchestrator for the **Policy Engine**, consolidating transaction capital limits, user access structures, and asset risk attributes.
- **Safety Gating & Alert Propagation**: It locks down high-risk workflows ($Score \ge 70$) by publishing regulatory blockages (`policy.violation.encountered`) and routing approval states to compliance supervisors.

---

## 2. Technical Architecture & Interfaces

The Director runs as an isolated daemon process (on Port `3005`). It maintains zero local state, letting it scale horizontally across container clusters.

### Event Processing Logic

```
   [Event Bus]
        │  (workflow.initiated)
        ▼
 ┌──────────────┐
 │ Interceptor  │
 └──────┬───────┘
        │
        ▼
 ┌──────────────┐
 │ Policy Engine│ ── (Evaluate rules)
 └──────┬───────┘
        │
        ├─────────────────────────────┐
        │ [Allowed: true]             │ [Allowed: false OR Score >= 70]
        ▼                             ▼
 ┌──────────────┐              ┌──────────────┐
 │   Publish    │              │   Publish    │
 │policy.approved│             │policy.violat.│
 └──────────────┘              └──────┬───────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │  Broadcast   │
                               │ audit.alert  │
                               └──────────────┘
```

---

## 3. Communication Contract & Event Payloads

### Subscribed Events
- `workflow.initiated`: Dispatched by the API Gateway to request execution.
  ```json
  {
    "id": "evt_abc123xyz",
    "name": "workflow.initiated",
    "correlationId": "corr_987654321",
    "senderId": "api-gateway",
    "payload": {
      "req": {
        "userId": "usr_trader_44",
        "role": "Trader",
        "assetClass": "MEMECOIN",
        "capital": 125000,
        "isSimulation": true
      }
    },
    "timestamp": "2026-07-06T06:50:00.000Z"
  }
  ```

### Published Events
- `policy.approved`: Dispatched when the Policy Engine clears the request.
- `policy.violation.encountered`: Dispatched when the Policy Engine rejects or gates the request.
  ```json
  {
    "id": "evt_pol098qwe",
    "name": "policy.violation.encountered",
    "correlationId": "corr_987654321",
    "senderId": "PlatformDirector",
    "payload": {
      "decision": {
        "allowed": false,
        "riskScore": 85,
        "reason": "Safety violation: Volatile asset MEMECOIN requires Admin credentials.",
        "gatingRequired": false,
        "rulesEvaluated": [
          "RULE_VALUE_LIMIT_CHECK",
          "RULE_EXTERNAL_API_RESTRICTION",
          "RULE_ASSET_CLASS_RISK_SCORING"
        ]
      }
    },
    "timestamp": "2026-07-06T06:50:02.100Z"
  }
  ```

- `audit.alert.compliance`: Emitted on policy violation to warn external compliance systems.

---

## 4. Isolation & Resilience

To maintain perfect regulatory integrity, the Platform Director applies the following safety properties:
- **Immutable Fail-Closed Enforcement**: If the Policy Engine throws an error during evaluation, or if the connection is severed, the Platform Director defaults to a strict **Fail-Closed** state, refusing to publish `policy.approved` and blocking the downstream agents.
- **Asynchronous Audit Trails**: Every decision, positive or negative, is written immediately via the Event Bus and recorded by the Observability module, ensuring a permanent audit trail for international banking authorities (e.g., BaFin, SEC).
