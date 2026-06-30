# 🔒 Security Architecture & Guidelines (Security Perspective)
**Project: Jenova Nexus (AIF-CORE)**
**Classification: Confidential / Internal**

---

## 🛡️ Security Pillars & Governance

AIF-CORE adheres strictly to the **OWASP Top 10** standards and **EU-DSGVO** data minimization mandates. Every data flow is audited, encrypted, and isolated to protect proprietary code, algorithmic strategies, and personal investor information.

---

## 🔒 Threat Mitigation Matrix

| Attack Vector | Threat Level | Mitigation Strategy | Implementation Details |
| :--- | :---: | :--- | :--- |
| **A01:2021-Broken Access Control** | High | Role-based database querying on backend layers. | Supabase row-level security combined with short-lived JWT signatures. |
| **A02:2021-Cryptographic Failures** | Critical | Absolute isolation of secrets; TLS enforcement on all routes. | Private keys (Stripe, Supabase, Gemini) are strictly bound server-side. |
| **A03:2021-Injection** | High | SQL parameterization and schema-level validation. | Prevention of dynamic query concatenation on Drizzle/Postgres tables. |
| **A05:2021-Security Misconfiguration** | Medium | Secure headers configuration, CORS whitelist restriction. | Disable permissive wildcard cors (`*`) in production. |

---

## 🛠️ Operational Rules & Guidelines

### 1. Zero Client-Side Secret Leakage
Never, under any circumstances, reference private credentials on the client side. Any API that utilizes the `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` must be encapsulated within secure, server-side Express routes (`/api/*`).

### 2. Sandbox Constraints
All execution of external tools or custom user scripts must run within isolated sandboxes. For our development environment, Node limits, CORS constraints, and iframe isolation are configured to prevent cross-origin script executions.

### 3. Graceful Error Suppression
Do not expose internal code stacks, file system paths, or raw database connection strings in client-visible error payloads. Always log full trace information on the server while returning clean, sanitized HTTP status codes and abstract warnings to the client:

```typescript
// SECURE PATTERN
try {
  const result = await databaseQuery();
} catch (error: any) {
  logger.error("[DB Failure] Detailed log with trace:", error.stack);
  res.status(500).json({ error: "Ein interner Datenbankfehler ist aufgetreten." });
}
```

---

## 🔎 Security Hardening Verification
Before compiling or merging updates:
1. Ensure all new environment variables are documented in `.env.example` without values.
2. Run `npm run lint` and verify type compliance to prevent buffer vulnerability paths.
3. Confirm that no CDN scripts or external fonts are imported dynamically, preserving IP anonymity.
