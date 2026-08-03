# CAPITAL-AI — Google Marketing MCP Architecture
## Claude Implementation Profile, decoupled from ESS-0014

**Document type:** Implementation Architecture / Claude Code Handoff  
**Normative authority:** ESS-0014 + ESS-0014-CONTRACTS  
**Related ADR:** ADR-0035  
**Date:** 2026-08-03  
**Status:** IMPLEMENTATION PROFILE — not a replacement for ESS/IAM authority

---

## 0. Executive Directive

This document instructs Claude Code how to implement the Google Marketing integration without making Claude part of the trust root.

Claude MUST treat ESS-0014 as normative and this document as an implementation profile.

Claude MUST NOT:

- invent or grant OWNER privileges;
- bypass CAPITAL-AI TOTP step-up;
- create self-approved rollback artifacts;
- grant service-account capabilities;
- downgrade CookieHub, Consent Mode, CSP or protected-change controls without an explicit approved protected-change flow;
- turn an official read-only Google MCP into an undocumented mutation proxy.

---

## 1. Target Architecture

```text
                       GOVERNANCE / TRUST ROOT

              Human CAPITAL-AI OWNER + TOTP Step-up
                          |
                          v
                Approval / Delegation Plane
                          |
             +------------+-------------+
             |                          |
             v                          v
     Human OWNER action          Service Account Grant
                                      + one-time OWNER
                                      approval for rollback


                           MCP HOST LAYER

        Claude Code / Claude Desktop / approved automation
                          |
             MCP / controlled local adapter
                          |
                          v
              CAPITAL-AI Google Marketing Gateway

      +-------------------+--------------------------+
      |                   |                          |
      v                   v                          v
  Policy Gate         IAM/Grant Gate            Approval Gate
      |                   |                          |
      +-------------------+--------------------------+
                          |
                    Dry-run Planner
                          |
             +------------+-------------+
             |                          |
             v                          v
       READ / EVIDENCE              WRITE CONTROL
             |                          |
   +---------+---------+       +--------+---------+
   |                   |       |                  |
   v                   v       v                  v
GA Analytics MCP   Google Ads MCP  GA Admin API   GTM API
(read-only)        (read-only)      / Ads API      / AdSense API
```

---

## 2. Component Boundary

Suggested implementation root:

```text
server/googleMarketing/
├── principals/
│   ├── principalResolver.ts
│   ├── serviceAccountGrantStore.ts
│   └── approvalStore.ts
├── policy/
│   ├── protectedChangeClassifier.ts
│   ├── marketingPolicyGate.ts
│   └── impactDisclosure.ts
├── mcp/
│   ├── googleAnalyticsReadAdapter.ts
│   ├── googleAdsReadAdapter.ts
│   └── toolRegistry.ts
├── providers/
│   ├── gaAdminAdapter.ts
│   ├── gtmAdapter.ts
│   ├── googleAdsWriteAdapter.ts
│   └── adsenseAdapter.ts
├── drift/
│   ├── fingerprint.ts
│   └── reconciler.ts
├── audit/
│   └── marketingAudit.ts
└── types.ts
```

Do not create these files merely to satisfy the tree. Implement only when functionality and tests are supplied.

---

## 3. Official Google MCP Read Plane

### Google Analytics MCP

Use the official Google Analytics MCP/Data API toolset for reporting, metadata, realtime reports and compatibility checks.

Treat as read-only.

### Google Ads MCP

Use the official Google Ads MCP for customer discovery, GAQL reporting and resource metadata.

Current documented release is read-only and supports OAuth 2.0 or service-account authentication. Do not infer write capabilities.

### Rule

Provider MCP output is evidence/context. It does not constitute CAPITAL-AI approval to mutate provider state.

---

## 4. Mutating Google APIs

Where provider configuration must be changed, implement explicit adapters against the authoritative API:

- GA4 configuration -> Google Analytics Admin API;
- Tag/container lifecycle -> Google Tag Manager API;
- Google Ads writes -> Google Ads API, only after a specific write capability is approved;
- AdSense supported management/reporting operations -> AdSense Management API;
- browser consent -> CookieHub + Google Consent Mode, never an AI-side direct override.

Every adapter method must declare:

```ts
risk: 'read' | 'write' | 'publish' | 'destructive';
requiredCapability: GoogleMarketingCapability;
dryRunDefault: true;
```

---

## 5. Human OWNER Flow

```text
Request mutation
  -> resolve Supabase identity
  -> checkAdminAccess(... OWNER_ONLY_ROLES)
  -> if protected/publish/destructive: requireStepUp()
  -> produce dry-run + impact disclosure
  -> ask for explicit confirmation
  -> create short-lived approval
  -> re-check live fingerprint
  -> apply
  -> verify provider state
  -> audit + traceability
```

An approval must not be reusable across changed fingerprints.

---

## 6. Service Account Flow

### Principal model

Service accounts are separate machine principals. Never store `iam_role='owner'` for a service account.

### Grant administration

Only a Human OWNER with fresh TOTP step-up can:

- create grant;
- change scope;
- change capability;
- extend expiry;
- revoke grant;
- issue a one-time rollback approval.

### Runtime flow

```text
service account credential
  -> verify principal
  -> resolve active grants
  -> exact capability check
  -> resource scope check
  -> expected fingerprint check
  -> if rollback: consume one-time OWNER approval
  -> execute
  -> audit
```

No self-delegation and no transitive delegation.

---

## 7. Protected Rollback UX/API Contract

For interactive Claude flows, before any protected rollback Claude MUST return an impact summary and obtain explicit confirmation.

Required warning classes:

```text
PRIVACY:       consent behavior may change
ANALYTICS:     measurements/history continuity may change
ADS:           monetization/ad serving may stop or change
SECURITY:      CSP/XSS attack surface may increase
COMPLIANCE:    audit/traceability/CMP evidence may become invalid
RUNTIME:       production/AMP/SEO behavior may regress
```

The prompt must include the exact protected resources and intended diff.

Headless service accounts replace the interactive question only with a matching one-time OWNER Approval Artifact created after the same impact disclosure.

---

## 8. Strict CSP Implementation

### Required server behavior

1. Generate cryptographically random nonce for every HTML response.
2. Attach nonce to `res.locals` or equivalent request context.
3. Set Strict CSP header using that nonce.
4. Read the built `dist/index.html` as a template.
5. Replace only the dedicated nonce placeholder with the request nonce.
6. Do not let `express.static` serve `index.html` directly, because that would bypass nonce injection.
7. Send dynamic HTML.

AdSense-compatible script core:

```text
script-src 'nonce-{nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:
object-src 'none'
base-uri 'none'
```

CookieHub explicit endpoints remain present in the relevant directives.

### Nonce requirements

- crypto-grade randomness;
- >=128-bit entropy;
- unique per HTML response;
- no static env var nonce;
- no shared global nonce;
- same nonce in CSP and script tags for one response.

---

## 9. Current HTML Hooks

The HTML template uses `__CSP_NONCE__` as server-replaced placeholder.

Protected scripts:

- CookieHub SDK;
- `/cookiehub-init.js`;
- AdSense async loader;
- AMP Auto Ads extension loader;
- `/google-analytics-consent.js`;
- Vite/React module entry.

Claude must preserve these hooks unless a protected change is explicitly approved.

---

## 10. CookieHub / Consent

CookieHub remains source of truth.

CAPITAL-AI target consent state:

```text
analytics_storage   <- analytics consent
ad_storage          <- marketing consent
ad_user_data        <- marketing consent
ad_personalization  <- marketing consent
```

The implementation must maintain the application's Basic Consent Mode privacy posture: no Google analytics/marketing data collection before the required consent state.

Do not independently set Google defaults to granted.

---

## 11. AdSense Runtime

The standard non-AMP AdSense loader remains the browser integration for the React/Vite application.

Do not assume that inserting the AMP extension into a non-AMP SPA activates AMP Auto Ads.

AdSense CSP tests must verify:

- loader is not CSP blocked;
- child scripts trusted through strict-dynamic can execute;
- generated ad frames/resources are not broken by overly narrow frame/img/connect rules;
- consent behavior remains compliant.

---

## 12. AMP Runtime

The repository currently contains AMP Auto Ads hooks in the base markup because they were explicitly requested.

Before classifying AMP as operational, Claude must implement or locate a valid AMP document/route and run AMP validation.

Recommended separation:

```text
/             -> React/Vite non-AMP SPA
/amp/...      -> valid AMP document(s), if the product actually requires AMP
```

If no valid AMP route is introduced, document the hooks as dormant/non-operative and do not claim AMP monetization success.

---

## 13. Persistence Model (Target)

Suggested tables/concepts; exact Supabase implementation requires production handoff and migration review:

```text
marketing_service_accounts
marketing_capability_grants
marketing_change_approvals
marketing_change_audit
marketing_resource_fingerprints
```

Security rules:

- service-role/server access only for machine credential material;
- no browser write access;
- RLS fail-closed;
- owner identity always derived from verified bearer session;
- grant mutation requires OWNER + step-up;
- secrets encrypted at rest using dedicated key material.

Do not apply production Supabase migrations from a development-only environment without the established production handoff.

---

## 14. MCP Tool Surface

Read tools:

```text
google_marketing.list_accounts
google_marketing.analytics.report
google_marketing.ads.report
google_marketing.resource_metadata
google_marketing.drift.inspect
```

Planning tools:

```text
google_marketing.plan_change
google_marketing.explain_impact
google_marketing.preview_csp
```

Mutating tools:

```text
google_marketing.apply_change
google_marketing.publish_change
google_marketing.rollback_change
```

Owner delegation tools:

```text
google_marketing.service_account.grant
google_marketing.service_account.revoke
google_marketing.approval.issue
```

The final names may follow repository naming contracts, but semantics must remain separate.

---

## 15. Tool Authorization Matrix

| Operation | OWNER | Service Account | Additional gate |
|---|---:|---:|---|
| read/report | yes | `read` grant | none beyond identity/grant |
| plan/dry-run | yes | `plan` grant | none beyond identity/grant |
| apply non-destructive | yes | `apply` grant | approval according to risk |
| publish | OWNER + step-up | `publish` grant | owner-approved publish artifact |
| rollback | OWNER + step-up | `rollback` grant | explicit impact + one-time OWNER approval |
| grant/revoke service rights | OWNER + step-up | never | human OWNER only |
| rotate privileged credentials | OWNER + step-up | `credentials.rotate` if scoped | approval + audit |

---

## 16. Fingerprint / Drift Model

Every controlled Google resource has a normalized fingerprint. Mutation request supplies `expectedFingerprint`.

If live fingerprint differs:

```text
DENY -> regenerate plan -> redisclose impact -> reapprove
```

Never apply a stale plan.

---

## 17. Audit Events

Before registering new events, check ESS-0013 Event Catalog for semantically equivalent events.

Desired semantics:

```text
ProtectedChangeRequested
ProtectedChangeDenied
ProtectedChangeApproved
ProtectedChangeApplied
ProtectedChangeVerified
ServiceAccountGrantChanged
GoogleMarketingDriftDetected
```

Event payloads contain references/fingerprints, never secrets.

---

## 18. Implementation Phases for Claude Code

### Phase A — Preflight

- read current main;
- verify ADR/ESS registry;
- verify CookieHub/GA/AdSense runtime;
- verify IAM + Step-up implementation;
- identify existing Event/Traceability contracts;
- run tests/build baseline.

### Phase B — CSP

- implement per-response nonce;
- dynamic HTML template injection;
- CookieHub explicit CSP targets;
- strict-dynamic AdSense-compatible policy;
- add CSP tests;
- verify CookieHub regression.

### Phase C — Protected Change Gate

- implement classifier;
- impact disclosure;
- owner/step-up authorization;
- approval artifact;
- fingerprint check;
- audit.

### Phase D — Service Accounts

- implement separate principal/credential model;
- capability grant store;
- OWNER-only grant management;
- one-time rollback approval;
- tests.

### Phase E — Google MCP Federation

- wire official Analytics MCP read plane;
- wire official Ads MCP read plane;
- build provider write adapters only where required;
- preserve dry-run default.

### Phase F — Production Evidence

- CookieHub banner;
- consent gating;
- CSP violation report;
- AdSense serving check;
- nonce uniqueness;
- owner denial matrix;
- service-account denial matrix;
- traceability update;
- ADR completion decision.

---

## 19. Stop Conditions for Claude

Stop before write if:

- requested operation is protected and impact confirmation is absent;
- requester is not authorized;
- Step-up is missing;
- service grant is missing/expired;
- rollback approval is missing/used/expired;
- live fingerprint drifted;
- provider API scope is ambiguous;
- operation requires a production-only Supabase/Google/Render configuration change without production handoff;
- tests would be bypassed rather than fixed.

---

## 20. Provider Baseline — Verify Again at Execution Time

As of 2026-08-03:

- Google Analytics MCP exposes reporting/read capabilities and cannot edit Analytics configuration;
- Google Ads MCP current release is read-only and supports OAuth 2.0 or service account authentication;
- Google AdSense CSP guidance supports Strict CSP with a random nonce and `strict-dynamic` because AdSense domains change;
- CookieHub requires its documented script/style/connect hosts, including `cookiehub.net` and `cdn.cookiehub.eu` in `connect-src` since CookieHub 2.8.4.

Claude MUST re-check provider documentation before production cutover.

---

## 21. Definition of Implementation Complete

Do not mark complete until:

- repository build/tests pass;
- Strict CSP nonce works in production-like runtime;
- CookieHub still renders;
- GA remains consent-gated;
- AdSense is not CSP-blocked;
- service accounts cannot self-elevate;
- non-OWNER human cannot rollback;
- OWNER rollback requires Step-up and explicit impact confirmation;
- service-account rollback requires scoped grant + one-time OWNER approval;
- audit/traceability evidence exists;
- production handoff is documented.
