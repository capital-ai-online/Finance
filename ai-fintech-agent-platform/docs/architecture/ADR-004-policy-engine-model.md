# Architecture Decision Record (ADR)
## ADR-004: OPA-Style Policy Engine Model

- **Status**: Approved
- **Date**: 2026-07-06

---

## 1. Context

In global financial trading systems, compliance rules change frequently based on user locations, trade sizes, asset volatilities, and changing state regulations. Coding these rules directly into the primary application codebase (e.g., inside API routes or agent code) creates massive maintenance issues:
- **Frequent code releases**: Changing a trade limit from $1M to $500k would require a full application rebuild and redeployment.
- **Audit difficulties**: Regulators cannot easily verify that security checks are consistently applied when the rules are scattered across multiple microservices.
- **Vulnerability to bypasses**: Developers could accidentally bypass checks in new API routes, opening the system to regulatory breaches.

---

## 2. Decision

We will implement an enterprise **OPA-style (Open Policy Agent) Policy Engine**:
- **Separation of Policy and Application Code**: All security and compliance rules are consolidated into a dedicated, standalone engine within `@fintech-platform/policy-engine`.
- **Pipeline-Based Evaluation**: Incoming requests pass through a sequential pipeline of rules (`RULE_VALUE_LIMIT_CHECK`, `RULE_EXTERNAL_API_RESTRICTION`, `RULE_ASSET_CLASS_RISK_SCORING`, `RULE_HUMAN_IN_THE_LOOP_THRESHOLD`, `RULE_SIMULATION_COMPLIANCE`).
- **Dynamic Configuration**: Administrators can modify policy parameters (such as the human approval threshold) at runtime without rebuilding the application.

---

## 3. Consequences

### Positive Consequences
- **High Agility**: Compliance parameters can be updated instantly at runtime.
- **Consolidated Audit Trails**: All policy decisions, rules evaluated, and risk scores are compiled into a single output object, making it easy to log and audit system compliance.
- **Comprehensive Coverage**: Because the Policy Engine intercepts the ingress path, it is impossible for new routes or agents to bypass global trading rules.

### Negative Consequences
- **Processing Overhead**: Running transactions through a centralized policy pipeline adds a minor delay (typically $< 10\text{ms}$).

---

## 4. Alternatives Considered

### Code-Embedded Validation
- *Concept*: Evaluate transaction limits directly inside express route handlers or within individual agent definitions.
- *Rejection Reason*: Binds compliance policies to the application code, increasing the risk of code duplication and accidental bypasses during future updates.

---

## 5. FinTech Justification

Financial compliance standards (such as BaFin MaRisk and SEC Rule 206) mandate that automated trading platforms enforce strict, consistent pre-trade risk and suitability controls. By centralizing all rules into an OPA-style Policy Engine, the platform provides a single source of truth for all security controls, greatly simplifying compliance reporting and regulatory audits.
