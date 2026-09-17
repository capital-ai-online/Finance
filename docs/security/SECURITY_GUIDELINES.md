# 🔒 Developer Security Guidelines & Compliance Standards
**Project: CAPITAL-AI**  
**Classification:** Confidential / Internal Developer Scope  
**Role:** `SECURITY_SUBJECT_MATTER_CONSTRAINT`  
**Instruction authority:** `NONE`  
**Repository AI/development trust root:** `/AGENTS.md@CURRENT_MAIN`

This document constrains Security outcomes within its subject-matter scope. It does **not** define Chat/agent execution, task selection, task status, ownership, dependency authority, branch/PR/merge authority, continuation logic or a second DevelopmentChain. Repository-wide AI/development execution semantics resolve only through `/AGENTS.md@CURRENT_MAIN`.

---

## 🛡️ Security Pillars & OWASP Top 10 Governance
CAPITAL-AI is engineered using a **"Security-by-Design"** approach to mitigate risks outlined in the **OWASP Top 10** and enforce compliance with EU data protection regulations (DSGVO).

| Vulnerability Category | Risk Level | Mitigation Architecture |
| :--- | :---: | :--- |
| **A01:2021-Broken Access Control** | High | Standardized JSON Web Tokens (JWT) mapped on PostgreSQL row-level security (RLS) policies. |
| **A02:2021-Cryptographic Failures** | Critical | Strict TLS 1.3 encryption on all channels. Absolute isolation of API keys server-side. |
| **A03:2021-Injection** | High | Parameterized queries using Express/Supabase. Input validation on all endpoints. |
| **A05:2021-Security Misconfiguration** | Medium | Whitelisted CORS configurations, secured cookies, disabled stack traces in client payloads. |

---

## 🛠️ Security Subject-Matter Constraints

### 1. Absolute Secret Isolation (No Frontend Keys)
* Never embed API keys, secrets, or database credentials within the frontend source code. This applies directly to the `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
* Any environment variable used in client-side code must be prefixed with `VITE_` and be non-sensitive (e.g. `VITE_SUPABASE_URL`).
* Private credentials must remain purely on the backend, configured via server-side environment variables (`process.env.MY_SECRET`).

### 2. Defensive API Routing & CORS Whitelisting
* Disable permissive wildcard CORS bindings (`Access-Control-Allow-Origin: *`) in production environments. Explicitly authorize only verified domains.
* Rate limit all public endpoints to protect the system against Denial-of-Service (DoS) attacks and brute-force attempts.

### 3. Graceful Error Suppression & Quiet Payloads
Do not leak server architecture details, directory trees, library versions, or database errors in API response payloads. Log detailed stack traces on the server while returning clean, localized message models to the client.

```typescript
// SECURE CODING PATTERN
try {
  const data = await executeSensitiveQuery();
  res.json({ success: true, payload: data });
} catch (error: any) {
  // Log the complete traceback with full debug info internally
  logger.error("[API Failure] Detailed audit trail:", error.stack);
  
  // Return an abstract, sanitised error string to the user
  res.status(500).json({ error: "Ein interner Verarbeitungsfehler ist aufgetreten." });
}
```

---

## 🔒 Security Proof-of-Concept (PoC) Verification

Every developer must verify their changes against our standard **Security Audit Suite**:

- **Authentication Check**: Sessions must time out after inactivity. Tokens must be stored in secure, HttpOnly, SameSite cookies or properly isolated headers.
- **Webhook Integrity**: Webhooks (such as `/billing/webhook` or `/api/stripe/webhook`) must verify signatures using the exact **raw body buffer**. Handlers must implement replay-attack protection and be idempotent.
- **Input Sanitization**: Scrub all incoming parameters to prevent SQL injection, path traversal (`../` removal), and HTML tag injections (XSS).
