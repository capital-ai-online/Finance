# Security Architecture Design Specification
## Zero-Trust Isolation, Input Sanitization, and Boundary Protections

The platform implements a **Zero-Trust Security Architecture** across both its application layer and network boundary layouts. Every container, API route, and internal event-handler is treated as an independent security perimeter, validating every parameter and credential.

---

## 1. Zero-Trust Access & Identity Control

The platform enforces Role-Based Access Controls (RBAC) mapped directly to corporate directories (via OIDC-compliant JWT tokens).

### User Personas & Permissions Matrix

| Role | Permitted Operations | Asset Restrictions | Value Boundaries |
| :--- | :--- | :--- | :--- |
| **Admin** | Full system re-configuration, policy rule changes, trade executions. | No restrictions | Unlimited |
| **Trader** | Proposed rebalance execution, trade creation. | Stocks, Cryptocurrencies (excluding unverified Memecoins) | Up to $1,000,000 |
| **Guest** | Read-only access to dashboards, state tracking, and logs. | None | Prohibited from all actions |

---

## 2. Input Sanitization & Type Boundaries

To protect the platform against injection and prototype pollution attacks, all ingress paths enforce rigid schemas:

- **Zod Schema Compilation**: All route parameters, JSON payloads, and event messages are parsed against strict Zod definitions. Unexpected properties are stripped, and invalid types trigger immediate terminations.
- **Payload Sanitization**: Direct executable scripts, HTML fragments, or shell command characters (e.g., `;`, `&&`, `$()`) are blocked by parsing libraries.

---

## 3. Network Transport Security

To ensure absolute confidentiality and authenticity of trading data across cloud nodes:

- **Enforced SSL Protocol**: The Policy Engine's `RULE_EXTERNAL_API_RESTRICTION` blocks any external connection that does not use SSL (`https://`). Unencrypted HTTP transactions are rejected pre-execution.
- **Container Separation**: The different microservices (API Gateway, Platform Director, Master Supervisor, Dashboard) communicate internally over secured VPC networks. They are isolated from the public internet using private routing tables.

---

## 4. Container-Level Hardening

The Docker container layout is built using best-practice security baselines:

- **Non-Root Execution**: Containers are configured to run as non-root service accounts, restricting read/write permissions strictly to `/tmp` or dedicated logging folders.
- **Port Ingress Restriction**: Port `3000` is the only port exposed externally via Nginx reverse proxies. Ports `3005`, `3100`, and `3015` are bound to local or internal loopbacks, preventing external port scanning.
- **Environment Variable Security**: All API keys (e.g., `GEMINI_API_KEY`) are injected at runtime via secure environment wrappers (e.g., Google Secret Manager), keeping keys out of repository code.
