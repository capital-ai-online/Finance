# Security, Policy, & Governance Model

The platform enforces strict Zero-Trust boundaries and mathematical limits on all AI actions to guarantee legal, secure, and resilient execution.

---

## 🔒 Security Principles

1. **Zero-Trust Input Sanitization**: All incoming requests are parsed against rigid schemas using `Zod`. Inputs that contain script tags or unexpected attributes are rejected immediately.
2. **Cryptographic Identity Checks**: API routes require authorization headers containing signed JSON Web Tokens (JWT). The gateway introspects OIDC-compliant claims (`role: Admin | Trader | Guest`).
3. **Asset Boundary Separation**: Highly volatile asset requests (such as meme tokens) automatically increment the transaction's baseline risk rating by `50` points.

---

## 🛡 OPA-Style Rule Definitions

Our Policy Engine intercepts all workflow execution. The rules evaluate:

| Code identifier | Risk Impact | Condition | Outcome |
| :--- | :--- | :--- | :--- |
| `RULE_VALUE_LIMIT_CHECK` | High | Transaction exceeds $1,000,000 | Allowed only for specific roles (`Trader`/`Admin`). |
| `RULE_EXTERNAL_API_RESTRICTION` | Critical | Target endpoint is non-SSL (`http://`) | Absolute rejection. |
| `RULE_ASSET_CLASS_RISK_SCORING` | Variable | High-risk tokens (e.g. Memecoins) | Risk incremented. |
| `RULE_HUMAN_IN_THE_LOOP_THRESHOLD`| Block / Suspension | Total risk score $\ge 70$ | Triggers `human.approval.required` suspension. |

---

## 📈 Human-in-the-Loop Gating Protocol

When the aggregate pre-execution risk reaches or exceeds `70`, the master supervisor suspends automatic dispatch.

```
[Agent Action Proposed] ──> [Scored: Risk 75] ──> [Policy Suspends] ──> [Alerts supervisor]
                                                                                │
[Completed Action Execution] <── [Trader Submits Signed Approval] <─────────────┘
```

The suspension state publishes a replayable `workflow.suspended.human_gate` event, which can be monitored by a compliance dashboard for live authorization or rejection.
