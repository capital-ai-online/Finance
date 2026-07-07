# Policy Engine Design Specification
## Enterprise OPA-Style Policy & Compliance Guardrails

The **Policy Engine** is the platform's primary security check. Heavily inspired by Open Policy Agent (OPA), it decouples security policy logic from business application code. It evaluates transaction safety metrics pre-execution, ensuring that agent proposals comply with corporate limits, cryptographic protocols, and risk tolerances.

---

## 1. Compliance Rule Inventory

The engine implements five core rules, evaluated sequentially on every request:

### A. Value Limit Validation (`RULE_VALUE_LIMIT_CHECK`)
- **Objective**: Limit financial exposures based on credentials.
- **Rules**:
  - Transactions $> \$1,000,000$ increment the risk score by `45`. They are rejected outright if the user's role is not `Admin` or `Trader`.
  - Transactions $> \$100,000$ increment the risk score by `25`.

### B. Protocol Validation (`RULE_EXTERNAL_API_RESTRICTION`)
- **Objective**: Enforce network transport security.
- **Rules**: If the transaction payload contains external connection requests, the destination URL **MUST** use SSL (`https://`). Non-SSL URLs (`http://`) trigger an immediate policy rejection, bypassing further checks.

### C. Dynamic Asset Risk Scoring (`RULE_ASSET_CLASS_RISK_SCORING`)
- **Objective**: Score assets dynamically based on volatility.
- **Rules**:
  - `MEMECOIN` asset classes automatically add `50` points to the risk score.
  - `CRYPTO` asset classes add `25` points.
  - `STOCK` asset classes add `10` points.

### D. Human-in-the-Loop Gating (`RULE_HUMAN_IN_THE_LOOP_THRESHOLD`)
- **Objective**: Halt risky execution paths for manual inspection.
- **Rules**: If the accumulated risk score reaches or exceeds the threshold of `70`, the decision flags `gatingRequired: true`. This suspends the workflow and directs a notification to the compliance desk.

### E. Safety Mode Compliance (`RULE_SIMULATION_COMPLIANCE`)
- **Objective**: Prevent accidental live-market orders.
- **Rules**: The platform forces simulated executions. Any operation proposing live order dispatch (`action: "transact"`) is rejected unless the context explicitly enables simulation (`isSimulation: true`).

---

## 2. Policy Evaluation Contract

### Input Context Payload Schema
```json
{
  "type": "governance_intercept",
  "payload": {
    "amount": 250000,
    "assetClass": "MEMECOIN",
    "externalEndpoint": "https://api.vetted-broker.com/v1"
  },
  "context": {
    "userId": "usr_9921",
    "role": "Trader",
    "isSimulation": true
  }
}
```

### Output Decision Schema
```json
{
  "allowed": true,
  "riskScore": 75,
  "reason": "Pre-execution risk score is 75, which meets or exceeds the critical threshold of 70. Human supervisor action requested.",
  "gatingRequired": true,
  "rulesEvaluated": [
    "RULE_VALUE_LIMIT_CHECK",
    "RULE_EXTERNAL_API_RESTRICTION",
    "RULE_ASSET_CLASS_RISK_SCORING",
    "RULE_HUMAN_IN_THE_LOOP_THRESHOLD",
    "RULE_SIMULATION_COMPLIANCE"
  ]
}
```

---

## 3. Dynamic Scoring & Flow Control

The Policy Engine accumulates risk scores additively. The total score is capped at `100`.

```
[Start Evaluation] ──> [Value Limit Check] ──> [Protocol Check] ──> [Asset Risk Scoring]
                                                                          │
                                                                          ▼
[Issue Decision] <── [Gating Logic Check] <── [Simulation Check] <── [Accumulate Score]
```

- **Early Return**: If a critical safety boundary is breached (e.g., non-SSL API call), the engine returns immediately, avoiding unnecessary computation.
- **Dynamic Configuration**: The approval threshold (defaulting to `70`) can be changed dynamically by administrators via `setApprovalThreshold(threshold)`.
