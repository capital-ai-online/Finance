# Architecture Decision Record (ADR)
## ADR-001: Separation of Control Plane and Execution Plane

- **Status**: Approved
- **Date**: 2026-07-06

---

## 1. Context

AI agents are inherently non-deterministic. Their behavior is determined by large language models, dynamic prompts, and real-time market data. In a highly regulated FinTech environment (subject to SEC, BaFin, and MiFID II compliance), executing financial transactions using unconstrained, self-directing agents presents major risks:
- **Financial Outlier Trades**: Agents making rogue purchase orders due to hallucinated insights.
- **Security Breaches**: Dynamic inputs triggering command injections or bypassing internal APIs.
- **Compliance Failures**: Transactions executing in prohibited jurisdictions without human approval.

To guarantee safety, we must isolate functional agent capabilities from regulatory compliance checkplans and operational monitoring.

---

## 2. Decision

We will separate the platform into a dual-layer architecture:
1. **The Control Plane**: Consisting of the **Platform Director** (regulatory gatekeeper) and the **Master Supervisor** (operational monitor). These components execute deterministic TypeScript rules, maintain zero-trust boundaries, and manage gating states.
2. **The Execution Plane**: Consisting of the **Agent Network** (Planner, Risk, Compliance, Executor) and third-party **Plugins**. These components propose trades and perform calculations, but cannot execute orders without explicit clearance from the Control Plane.

---

## 3. Consequences

### Positive Consequences
- **Absolute Regulatory Isolation**: Compliance rules are evaluated in a secure container (Platform Director) outside of the agent runtimes. Even if an agent's code is compromised, it cannot trigger trades that violate global constraints.
- **Clean Audit Logs**: Every decision starts at the Control Plane, ensuring that regulatory checks are documented *before* any money is committed.
- **Fail-Closed Security**: If the execution plane fails or crashes, the control plane immediately shuts down downstream execution channels.

### Negative Consequences
- **Latency Addition**: Intercepting transactions at the Platform Director layer adds a minor processing delay (typically $< 50\text{ms}$).
- **Complexity**: Developers must coordinate services across multiple containers rather than running a monolithic script.

---

## 4. Alternatives Considered

### Monolithic Agent Scripts
- *Concept*: Write trading rules directly inside the agents (e.g., placing risk checkplans in the `ExecutorAgent`).
- *Rejection Reason*: Highly risky. If an agent hallucinated or encountered a runtime error, it could bypass its own checks and dispatch rogue trade requests to live brokers.

---

## 5. FinTech Justification

Regulators require independent compliance audits (e.g., MiFID II Article 17, governing algorithmic trading systems). Decoupling the compliance checking code (Platform Director) from the execution script (Agent Layer) provides clear evidence of independent pre-trade control pipelines, protecting the business from multi-million dollar regulatory fines.
