# CAPITAL-AI — Enterprise Google Analytics Provisioner MCP
## Autonomous Implementation Specification for Claude Code

**Document type:** Enterprise Architecture + Autonomous Implementation Prompt  
**Target system:** CAPITAL-AI / `SvenKulessa/Finance`  
**Target branch:** current `main` at execution time  
**Evidence baseline used for this specification:** `9ec92f66b1171dcec57bf7bbca9961833c70597e`  
**Platform version observed:** `0.6.0`  
**Date:** 2026-08-03  
**Primary executor:** Claude Code / Claude Pro Code  
**Architecture class:** Enterprise FinTech / Governance-Controlled MCP Integration  
**Status:** IMPLEMENTATION SPECIFICATION — execution requires repository preflight and approval gates described below

---

# 0. EXECUTION DIRECTIVE FOR CLAUDE CODE

You are acting as the **Senior Enterprise Platform Architect, MCP Engineer, Google Analytics/Tag Manager Integration Engineer, IAM Engineer, Security Engineer, Privacy Engineer, Test Engineer and Documentary Engineer** for CAPITAL-AI.

Your task is to implement a production-grade **Google Analytics Provisioner MCP** inside the existing CAPITAL-AI architecture.

The implementation must:

1. inspect the current repository before changing anything;
2. adopt the existing architecture rather than building a parallel system;
3. preserve the existing IAM, TOTP step-up, EventMesh, Documentary, Traceability, Release and Compliance conventions;
4. use the Google Analytics Admin API for configuration writes;
5. use the Google Tag Manager API for tag/container/workspace/version operations;
6. use the official Google Analytics MCP and/or Google Analytics Data API for read-only post-change verification;
7. use Google OAuth 2.0 with least privilege, offline access only where necessary, secure refresh-token storage and explicit scope escalation;
8. maintain CookieHub as the consent source of truth unless an explicitly accepted ADR decides otherwise;
9. migrate from the current direct `gtag.js` integration to a controlled GTM-based architecture only after preview, consent verification and owner approval;
10. preserve CAPITAL-AI's existing **zero-Google-data-before-consent** privacy posture by using **Basic Consent Mode v2**, not Advanced Consent Mode, unless a later explicit legal/architecture decision changes that posture;
11. create all required code, manifests, tests, ADRs, runbooks, traceability updates and production handoff evidence;
12. never expose OAuth tokens, client secrets, refresh tokens, service credentials or sensitive analytics payloads to browser bundles, logs, MCP responses or documentation;
13. never create duplicate GA4 properties, data streams, GTM containers, tags, custom dimensions or environments if equivalent resources already exist;
14. default all external mutation tools to `dryRun=true`;
15. require an explicit approval artifact plus CAPITAL-AI owner/TOTP step-up for publish, destructive operations and production cutover;
16. fail closed whenever authorization, consent, resource identity, expected fingerprints, configuration state or verification evidence is ambiguous.

Do not merely produce a proposal. Implement the architecture in code and documentation, subject to the mandatory stop conditions and approval gates in this document.

---

# 1. CURRENT CAPITAL-AI BASELINE — DO NOT ASSUME, REVERIFY

Before implementation, inspect the current `main` branch and update this baseline if it has changed.

The evidence baseline used to write this specification currently shows:

- application name: `capital-ai`;
- version: `0.6.0`;
- runtime: Node.js `>=22`;
- frontend: React 19 + Vite;
- backend: Express;
- TypeScript at the root currently approximately `5.8.x`;
- current GA4 integration exists in `index.html`;
- current CookieHub integration exists in `index.html`;
- current GA4 loading is explicitly blocked until CookieHub `analytics` consent is granted;
- `VITE_GA_MEASUREMENT_ID` exists in `render.yaml`;
- current setup documentation exists in:
  - `docs/runbooks/GOOGLE_ANALYTICS_SETUP.md`;
- EventMesh exists as a versioned platform component;
- Traceability exists as a cross-cutting platform component;
- Documentary/Governance exists;
- PlatformDirector currently exposes a decision contract but is not to be falsely treated as a fully implemented runtime decision engine;
- current repository governance requires ADRs for architecture-changing decisions;
- production configuration is hosted on Render;
- Supabase is the database/auth platform;
- existing IAM and owner TOTP step-up controls must be reused for privileged analytics operations.

### Critical current behavior

At the evidence baseline, `index.html`:

- loads CookieHub early;
- conditionally injects `https://www.googletagmanager.com/gtag/js`;
- uses `window.cookiehub.hasConsented("analytics")`;
- sets `ga-disable-<MEASUREMENT_ID>` when consent is absent;
- does not load GA4 without both a configured measurement ID and user analytics consent.

This behavior is a **privacy invariant** until the new implementation proves an equal or stricter result.

---

# 2. WHY THIS CHANGE REQUIRES A NEW ADR

The current runbook intentionally states that Google Consent Mode v2 is not used.

The target architecture changes the following architectural decisions:

- moves tag lifecycle management from direct `gtag.js` injection toward GTM-managed configuration;
- introduces an AI-callable MCP control plane;
- introduces Google OAuth write credentials;
- introduces controlled external configuration mutation;
- introduces automated drift detection and post-deploy verification;
- introduces a split read/write trust model;
- introduces Basic Consent Mode v2 while preserving the existing no-pre-consent-data posture.

Therefore Claude MUST:

1. determine the next free ADR number at execution time;
2. create a new ADR;
3. reference the previous Google Analytics runbook and any affected security/privacy ADRs;
4. document the migration, rollback path, credential model and approval model;
5. set implementation status according to actual completed evidence;
6. never mark the ADR resolved until code, integration tests and production evidence are complete.

Suggested title:

`ADR-XXXX-enterprise-google-analytics-provisioner-mcp.md`

Do not hard-code `ADR-0035` if another ADR has already consumed that number.

---

# 3. TARGET ARCHITECTURE

```text
┌──────────────────────────────────────────────────────────────────────┐
│                         AI / MCP HOST LAYER                          │
│                                                                      │
│  Claude Code / Claude Desktop / approved CAPITAL-AI automation host │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                     MCP stdio (local/dev)
                         OR
                  MCP Streamable HTTP
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│              CAPITAL-AI ANALYTICS PROVISIONER MCP                   │
│                                                                      │
│  Tool Registry │ Resource Registry │ Policy Gate │ Approval Gate    │
│  Idempotency   │ Audit Evidence    │ Drift Engine │ Reconciliation  │
└───────┬─────────────────┬────────────────┬────────────────┬──────────┘
        │                 │                │                │
        ▼                 ▼                ▼                ▼
┌──────────────┐  ┌────────────────┐ ┌───────────────┐ ┌─────────────┐
│ Google OAuth │  │ GA Admin API   │ │ GTM API       │ │ GA Data API │
│ Broker       │  │ WRITE + READ   │ │ WRITE/PUBLISH │ │ READ VERIFY │
└───────┬──────┘  └────────────────┘ └───────────────┘ └──────┬──────┘
        │                                                       │
        │                                                       ▼
        │                                              ┌────────────────┐
        │                                              │ Official GA MCP │
        │                                              │ READ ONLY       │
        │                                              └────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     CREDENTIAL / SECURITY LAYER                      │
│                                                                      │
│ Existing IAM + Owner Role + TOTP Step-Up                            │
│ Encrypted Refresh Tokens │ dedicated encryption key │ audit trail   │
└──────────────────────────────────────────────────────────────────────┘

                          RUNTIME DATA PATH

Browser
   │
   ▼
CookieHub HTML integration
   │
   ├── no analytics consent ──> NO Google tag / NO GA request
   │
   └── analytics consent granted
            │
            ▼
    consent-gated GTM loader
            │
            ▼
        GTM container
            │
            ▼
    Google tag / GA4 events
            │
            ▼
     GA4 production property

                         GOVERNANCE PATH

Analytics Provisioner
   │
   ├── Enterprise Events ──> EventMesh
   ├── Evidence ───────────> Documentary / audit docs
   ├── Requirement links ──> Traceability
   ├── privileged action ──> IAM + TOTP step-up
   └── release/cutover ────> existing Release / production handoff
```

---

# 4. FUNDAMENTAL SEPARATION OF CONTROL PLANE AND DATA PLANE

## 4.1 Control plane

The MCP server is a **configuration control plane**.

It may:

- discover current GA/GTM state;
- create reconciliation plans;
- propose changes;
- apply approved GA Admin API changes;
- prepare GTM workspaces;
- create/modify tags and triggers;
- create GTM container versions;
- publish only after approval;
- verify resulting configuration and telemetry;
- produce drift and compliance reports.

It must never become a general unrestricted Google API proxy.

## 4.2 Data plane

The browser analytics runtime is the **data plane**.

The browser must never receive:

- Google OAuth client secret;
- OAuth refresh token;
- Google Admin API credentials;
- GTM API credentials;
- Supabase service/secret key;
- MCP administrative bearer credentials.

The browser may receive only public configuration such as:

- a GA Measurement ID if still temporarily needed;
- a GTM public container ID;
- CookieHub public domain identifier.

---

# 5. MCP PROTOCOL IMPLEMENTATION

## 5.1 Transport strategy

Support two modes:

### Local development / Claude Code
Prefer **stdio**.

Advantages:

- no public network exposure;
- simplest trust boundary;
- Claude Code can spawn the process locally;
- credential access remains server-side.

### Remote production/staging
Use **Streamable HTTP**.

Do not implement legacy HTTP+SSE as the primary transport.

Mandatory remote protections:

- HTTPS only;
- strict `Origin` validation;
- strict `Host` validation;
- existing CAPITAL-AI CORS policy;
- authenticated MCP calls;
- owner/admin authorization;
- no wildcard origins;
- rate limiting;
- request body limits;
- correlation IDs;
- structured security audit events;
- replay-resistant approval artifacts.

## 5.2 MCP SDK compatibility gate

At implementation time Claude MUST inspect the current official MCP TypeScript SDK.

The 2026 ecosystem is transitioning from the monolithic v1 SDK toward split v2 packages.

The root CAPITAL-AI project currently uses TypeScript ~5.8.x. Do not blindly force a root TypeScript major upgrade.

Perform a compatibility spike:

1. inspect current stable MCP SDK package requirements;
2. inspect CAPITAL-AI TypeScript/build compatibility;
3. if the current stable MCP v2 packages require TypeScript >=6 or otherwise conflict with the root project:
   - isolate the MCP server as a self-contained package under:
     `tools/mcp/analytics-provisioner/`
   - give it its own `package.json`, lockfile strategy and `tsconfig.json`;
   - keep root application TypeScript unchanged unless a separate ADR approves a platform-wide upgrade;
4. if the current stable SDK works cleanly inside the root toolchain, integration inside `src/platform/AnalyticsProvisioner/` is permitted.

Do not depend on beta/preview packages in production without explicitly documenting the exception.

## 5.3 Recommended MCP server identity

```text
name: capital-ai-analytics-provisioner
version: 1.0.0
```

---

# 6. REQUIRED MCP TOOL CATALOG

All tools must use validated schemas and return structured results.

Every mutating tool must support:

```ts
{
  dryRun: boolean;              // default true
  correlationId?: string;
  expectedStateHash?: string;
  approvalId?: string;
}
```

Every mutating result must include:

```ts
{
  changed: boolean;
  dryRun: boolean;
  beforeHash: string;
  afterHash?: string;
  evidenceId: string;
  warnings: string[];
}
```

## 6.1 Discovery / read-only

### `analytics_discover_accounts`
Discover accessible GA accounts.

### `analytics_discover_properties`
Discover existing GA4 properties.

### `analytics_get_property_state`
Read:
- display name;
- time zone;
- currency;
- data retention;
- data streams;
- enhanced measurement state where supported;
- data-redaction settings where supported;
- custom dimensions;
- custom metrics;
- key events;
- Google product links;
- change history if available.

### `analytics_get_data_stream_state`
Read web stream details and Measurement ID.

### `gtm_discover_accounts`
Read accessible GTM accounts.

### `gtm_discover_containers`
Read GTM containers and public container IDs.

### `gtm_get_live_state`
Read current live version, tags, triggers, variables and fingerprints.

### `analytics_read_realtime`
Run a constrained GA Data API realtime report.

### `analytics_read_report`
Run approved read-only reports.

## 6.2 Reconciliation

### `analytics_build_reconciliation_plan`

Input:

- desired-state resource;
- detected current state;
- policy profile.

Output:

- no-op / create / patch actions;
- risk classification;
- required scopes;
- approval requirements;
- rollback strategy;
- expected final state hash.

This tool MUST NOT mutate anything.

### `analytics_validate_reconciliation_plan`

Reject plans that:

- create duplicates;
- weaken consent;
- enable Google Signals without explicit approval;
- enable advertising personalization without explicit approval;
- introduce PII or financial-sensitive analytics fields;
- attempt a destructive delete;
- broaden OAuth scopes unnecessarily;
- publish GTM without a preview and approval.

## 6.3 GA Admin API writes

### `analytics_ensure_property`
Idempotently adopt or create the intended property.

Default behavior:
- discover and adopt an existing matching CAPITAL-AI property;
- never create another property if a valid existing property is found.

### `analytics_ensure_web_stream`
Idempotently adopt or create the production web stream for:

`https://capital-ai.online`

### `analytics_apply_property_settings`
Manage approved settings such as:
- timezone;
- currency;
- retention;
- privacy-preserving configuration.

### `analytics_ensure_custom_dimensions`
Only create dimensions present in the repository allowlist.

### `analytics_ensure_custom_metrics`
Same policy as custom dimensions.

### `analytics_ensure_key_events`
Only approved non-sensitive key events.

### `analytics_update_data_retention`
Default target: minimum retention suitable for the use case, currently 2 months unless the current Google UI/API semantics have changed.

### `analytics_update_data_redaction`
Where supported, enable protective redaction rules.

## 6.4 GTM writes

### `gtm_ensure_workspace`
Create an isolated workspace:

`CAPITAL-AI-AI-Provisioning-<timestamp-or-correlation-id>`

### `gtm_reconcile_google_tag`
Create or update the Google tag / GA4 tag configuration.

### `gtm_reconcile_triggers`
Create only approved triggers.

### `gtm_reconcile_variables`
Create only approved variables.

### `gtm_reconcile_consent_requirements`
Ensure the Google tag cannot fire contrary to the approved CookieHub/Basic Consent Mode policy.

### `gtm_preview_workspace`
Use GTM quick preview/status capability where available.
Must run before container version creation.

### `gtm_create_container_version`
Requires:
- clean workspace status;
- no compiler errors;
- approved plan hash.

### `gtm_publish_container_version`
**HIGH-RISK TOOL**

Mandatory:
- `dryRun=false`;
- owner IAM role;
- fresh TOTP step-up;
- approval ID bound to plan hash and container version;
- matching expected GTM fingerprint;
- successful preview;
- current production consent gate test;
- rollback version recorded.

No automatic fallback publication.

## 6.5 Verification

### `analytics_verify_realtime`
Confirm expected test events after consent.

### `analytics_verify_no_preconsent_requests`
Verify that, before analytics consent, there is:
- no request to `google-analytics.com`;
- no GA measurement request;
- no Google tag request if CAPITAL-AI's strict zero-Google-request privacy policy is retained.

If GTM itself must be loaded from a Google domain before consent, STOP and classify this as a privacy-regression proposal. Do not silently accept it.

### `analytics_verify_postconsent_requests`
Confirm expected requests only after consent.

### `analytics_verify_consent_revocation`
After revocation:
- new analytics events must stop;
- analytics storage must be denied;
- no unauthorized residual tag firing.

### `analytics_detect_drift`
Compare actual GA/GTM state against repository desired state.

Default behavior:
- report only;
- do not auto-fix production drift.

---

# 7. GOOGLE OAUTH 2.0 ARCHITECTURE

There are TWO separate authorization concerns:

1. **MCP caller → CAPITAL-AI MCP server**
2. **CAPITAL-AI MCP server → Google APIs**

Do not mix these credentials.

---

# 8. MCP CALLER AUTHORIZATION

For local stdio mode:
- OS/process trust boundary;
- no network listener;
- never print protocol-invalid data to stdout.

For remote Streamable HTTP mode:
- reuse existing CAPITAL-AI IAM;
- authenticated Supabase session/bearer identity;
- owner/admin role for mutation;
- owner role + fresh TOTP step-up for publish/destructive/high-risk changes;
- map each MCP tool to an internal authorization permission.

Suggested permissions:

```text
analytics.read
analytics.plan
analytics.configure
analytics.gtm.edit
analytics.gtm.version
analytics.gtm.publish
analytics.credentials.manage
analytics.rollback
analytics.audit.read
```

Never authorize based on:
- email allowlists;
- frontend role state;
- editable user metadata;
- MCP self-reported client identity.

---

# 9. GOOGLE API OAUTH CREDENTIAL MODEL

## 9.1 Preferred production flow

Use Google OAuth 2.0 **web-server authorization code flow**.

Requirements:

- authorization code flow;
- exact registered redirect URI;
- cryptographically random `state`;
- server-side callback;
- `access_type=offline` only for profiles that require autonomous operation;
- incremental authorization;
- secure refresh token handling;
- token revocation support;
- refresh-token failure/re-auth flow;
- no token in URL query logs;
- no token in browser storage.

## 9.2 Credential profiles

Implement logical credential profiles.

### Profile A — READ_ONLY

Scopes:

```text
https://www.googleapis.com/auth/analytics.readonly
https://www.googleapis.com/auth/tagmanager.readonly
```

Used for:
- discovery;
- reconciliation;
- drift checks;
- verification.

### Profile B — CONFIGURATOR

Scopes:

```text
https://www.googleapis.com/auth/analytics.edit
https://www.googleapis.com/auth/tagmanager.edit.containers
https://www.googleapis.com/auth/tagmanager.edit.containerversions
```

Used for:
- GA property/stream settings;
- GTM workspace/tag/trigger/variable configuration;
- container version creation.

### Profile C — PUBLISHER

Additional scope:

```text
https://www.googleapis.com/auth/tagmanager.publish
```

Used only for approved GTM publication.

Do NOT request by default:

```text
https://www.googleapis.com/auth/tagmanager.delete.containers
https://www.googleapis.com/auth/tagmanager.manage.users
https://www.googleapis.com/auth/tagmanager.manage.accounts
https://www.googleapis.com/auth/analytics.manage.users
```

unless a later explicit requirement and ADR justifies them.

## 9.3 Optional Analytics-only service account

Google Analytics Admin/Data APIs can support a service account when that service account is explicitly granted access to the Analytics property/account.

If Claude determines a service account materially reduces operational OAuth risk for read-only verification, it may propose:

- service account for read-only GA verification;
- user OAuth for GTM writes/publish.

Do not assume GTM service-account access without verifying current official support and account permissions.

---

# 10. OAUTH TOKEN STORAGE

Never store refresh tokens:
- in source control;
- in `.env.example`;
- in plaintext database columns;
- in browser localStorage/sessionStorage;
- in logs;
- in MCP resources;
- in error messages.

## 10.1 Dedicated encryption key

Create a dedicated key:

```text
GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY
```

Do not reuse:
- TOTP encryption key;
- Stripe secrets;
- Supabase secrets;
- session secrets.

Use authenticated encryption, e.g. AES-256-GCM, with:
- random nonce/IV per encryption;
- auth tag;
- versioned ciphertext envelope;
- key-version field;
- rotation strategy.

## 10.2 Persistence

Preferred within the existing CAPITAL-AI stack:

- encrypted token records in a non-exposed/private Supabase schema;
- service/backend-only access;
- no browser Data API exposure;
- explicit grants;
- security review;
- migration committed to repository.

Suggested logical record:

```ts
interface GoogleOAuthCredentialRecord {
  id: string;
  profile: "READ_ONLY" | "CONFIGURATOR" | "PUBLISHER";
  googleSubject?: string;
  scopes: string[];
  encryptedRefreshToken: string;
  encryptionVersion: number;
  createdAt: string;
  updatedAt: string;
  lastRefreshAt?: string;
  revokedAt?: string;
  lastValidatedAt?: string;
}
```

If the repository does not currently expose a safe private schema pattern, Claude must:
1. inspect Supabase architecture;
2. create a repository migration;
3. run advisors/tests;
4. require explicit production database approval before applying live DDL.

---

# 11. GOOGLE ANALYTICS ADMIN API

Use the Google Analytics Admin API as the authoritative write API for GA configuration.

At minimum support idempotent management of:

- accounts discovery;
- properties;
- web data streams;
- property settings;
- data retention;
- custom dimensions;
- custom metrics;
- key events;
- data redaction where supported;
- enhanced measurement where supported;
- change-history inspection where supported.

Do not use deprecated conversion-event APIs where a current key-event API exists.

Prefer GA API beta/stable endpoints for production functionality.
Alpha endpoints must be isolated behind capability flags and require documentation.

---

# 12. GOOGLE ANALYTICS DATA API / OFFICIAL GOOGLE ANALYTICS MCP

The official Google Analytics MCP is **read-only**.

Treat this as a feature, not a limitation.

Use the read path for independent verification of:
- property visibility;
- realtime activity;
- event presence;
- page views;
- approved metrics;
- post-deploy telemetry.

The write path must remain in the CAPITAL-AI Provisioner through Admin API/GTM API.

Do not attempt to make the official Google Analytics MCP perform configuration mutations.

---

# 13. GOOGLE TAG MANAGER API

Use GTM API v2.

Required lifecycle:

```text
discover
  ↓
get live version/fingerprint
  ↓
create isolated workspace
  ↓
apply tags/triggers/variables
  ↓
workspace status
  ↓
quick preview
  ↓
create container version
  ↓
owner approval + TOTP
  ↓
publish
  ↓
post-publish verification
  ↓
evidence
```

No direct blind mutation of a live GTM container.

## 13.1 Optimistic concurrency

Use GTM fingerprints where supported.

If expected fingerprint differs from current:
- STOP;
- classify as concurrent modification;
- resync;
- rebuild plan;
- require renewed approval if the plan changes.

---

# 14. COOKIEHUB + CONSENT MODE V2

## 14.1 Source of truth

CookieHub remains the source of truth for user consent.

The project currently uses CookieHub directly in HTML.

Do not introduce a second consent system.

## 14.2 Target mode

Use **Google Consent Mode v2 — Basic implementation**.

Privacy invariant:

> No analytics data is sent to Google before the visitor grants the relevant analytics consent.

Do NOT enable Advanced Consent Mode by default.

Advanced mode may send cookieless measurements before consent and therefore changes CAPITAL-AI's current privacy posture.

## 14.3 Consent signals

Where applicable, maintain v2 signals:

```text
analytics_storage
ad_storage
ad_user_data
ad_personalization
```

Default CAPITAL-AI policy:

```text
analytics_storage = denied until analytics consent
ad_storage = denied
ad_user_data = denied
ad_personalization = denied
```

CAPITAL-AI currently has no requirement in this specification to enable ads personalization.

## 14.4 CookieHub automation boundary

Do not invent a CookieHub management API.

At implementation time:
- inspect the current CookieHub plan/docs;
- if a documented API exists and the account has access, implement only documented operations;
- otherwise generate a precise owner runbook for the dashboard step.

Never use browser scraping as an enterprise configuration API.

## 14.5 Migration pattern

Preferred privacy-preserving pattern:

1. CookieHub continues to load first in HTML.
2. CookieHub remains responsible for obtaining consent.
3. GTM is not allowed to produce Google analytics traffic before analytics consent.
4. after analytics consent, load/activate the GTM data plane;
5. GTM manages the Google tag;
6. Consent Mode v2 Basic communicates the consent state without Advanced pre-consent measurement.

If the chosen technical GTM installation causes a request to Google's tag infrastructure before user consent and this conflicts with the documented CAPITAL-AI privacy rule:
- STOP;
- do not publish;
- record the conflict in the ADR;
- retain the current direct consent-gated implementation until an approved alternative exists.

---

# 15. MIGRATION FROM DIRECT GTAG TO GTM

Never run both production tracking paths simultaneously.

## Phase A — discovery only

- read current GA property;
- identify existing web stream;
- identify existing GTM account/container;
- read current CookieHub behavior;
- produce desired-state diff.

No browser code change.

## Phase B — GTM shadow configuration

- create isolated GTM workspace;
- configure Google tag;
- configure approved events;
- preview;
- no publication.

## Phase C — automated privacy tests

Test current and proposed behavior.

Required invariant:

```text
PRE-CONSENT:
google analytics measurement requests == 0
```

## Phase D — approval

Generate immutable evidence:

```ts
{
  planHash,
  currentGaStateHash,
  currentGtmStateHash,
  proposedContainerVersionId,
  consentTestEvidenceId,
  rollbackVersionId,
  createdAt
}
```

Require owner approval + TOTP.

## Phase E — publish and application cutover

- publish approved GTM version;
- replace direct GA loader with approved consent-gated GTM loader;
- ensure only one measurement path remains;
- deploy;
- run post-deploy checks.

## Phase F — deprecate old variable

After one successful release and rollback window:

- deprecate `VITE_GA_MEASUREMENT_ID` if no longer required by runtime;
- introduce `VITE_GTM_CONTAINER_ID` if required;
- update `.env.example`;
- update `render.yaml` placeholders;
- update runbooks.

Never delete rollback support in the same change that first introduces the new path.

---

# 16. ANALYTICS DATA CLASSIFICATION — FINTECH REQUIREMENT

CAPITAL-AI is a FinTech application.

Google Analytics must NOT become a sink for sensitive financial or identity data.

## 16.1 Prohibited parameters

Do not send:

- email address;
- full name;
- phone number;
- postal address;
- Supabase user UUID;
- Stripe customer/subscription IDs;
- OAuth subject IDs;
- access tokens;
- session tokens;
- IAM role identifiers tied to a person;
- portfolio holdings;
- transaction details;
- account balances;
- bank/payment details;
- raw financial-screening inputs;
- user-entered prompts;
- asset watchlists tied to identity;
- exact user financial preferences;
- passwords, MFA/TOTP data;
- IP-derived custom identifiers;
- any value prohibited by Google Analytics policies.

Do not send hashed email as a workaround.

## 16.2 Default approved analytics vocabulary

Start with coarse product analytics only:

```text
page_view
navigation
feature_opened
feature_completed
feature_failed
upgrade_prompt_viewed
subscription_page_viewed
consent_settings_opened
```

For feature names use an allowlist such as:

```text
screening
backtest
monte_carlo
warren_buffett_value_check
security_compliance
profile
billing
```

Do not attach:
- searched symbol;
- portfolio content;
- free-text prompt;
- personal subscription identifiers.

## 16.3 URL sanitation

Before any page location reaches analytics:
- strip query parameters by default;
- strip fragments;
- normalize dynamic IDs;
- block routes containing tokens/callback secrets;
- never record OAuth callback query strings;
- never record password-reset tokens.

---

# 17. TYPED CLIENT ANALYTICS CONTRACT

Create a browser-side analytics façade.

Suggested path:

```text
src/services/analytics/
  analyticsEvents.ts
  analyticsPolicy.ts
  analyticsDataLayer.ts
  analyticsRouteSanitizer.ts
  index.ts
```

Example conceptual contract:

```ts
type AnalyticsEventName =
  | "navigation"
  | "feature_opened"
  | "feature_completed"
  | "feature_failed"
  | "upgrade_prompt_viewed"
  | "subscription_page_viewed"
  | "consent_settings_opened";

type AnalyticsFeature =
  | "screening"
  | "backtest"
  | "monte_carlo"
  | "warren_buffett_value_check"
  | "security_compliance"
  | "profile"
  | "billing";

interface AnalyticsEvent {
  name: AnalyticsEventName;
  feature?: AnalyticsFeature;
  route?: string;
  outcome?: "success" | "failure" | "cancelled";
}
```

The façade must:
- validate event names;
- validate fields;
- strip unknown fields;
- reject PII-like field names;
- push only sanitized events to `dataLayer`;
- do nothing when consent is not granted.

---

# 18. DO NOT MIRROR EVENTMESH PAYLOADS INTO GA

CAPITAL-AI EventMesh contains operational and domain events.

Never forward arbitrary EventMesh payloads to Google Analytics.

Create an explicit adapter if needed:

```text
Enterprise Event
    ↓
AnalyticsExportPolicy
    ↓
allowlisted coarse event
    ↓
dataLayer
```

Default: **no EventMesh → GA export**.

Any mapping must:
- be explicit;
- be documented;
- be tested for sensitive-field exclusion.

---

# 19. DESIRED-STATE CONFIGURATION

Create a repository-controlled desired-state document.

Suggested location:

```text
config/analytics/analytics-desired-state.yaml
```

Example:

```yaml
schemaVersion: "1.0.0"

application:
  name: CAPITAL-AI
  productionUrl: https://capital-ai.online

privacy:
  consentProvider: cookiehub
  consentMode: basic-v2
  zeroGoogleAnalyticsDataBeforeConsent: true
  adsPersonalization: false
  googleSignals: false
  urlQueryCollection: false

ga4:
  adoptExistingProperty: true
  timezone: Europe/Berlin
  currency: EUR
  dataRetentionMonths: 2

gtm:
  adoptExistingContainer: true
  publishRequiresOwnerStepUp: true
  automaticPublish: false

events:
  allowed:
    - navigation
    - feature_opened
    - feature_completed
    - feature_failed
    - upgrade_prompt_viewed
    - subscription_page_viewed
    - consent_settings_opened

prohibitedParameterPatterns:
  - email
  - phone
  - address
  - password
  - token
  - secret
  - user_id
  - customer_id
  - subscription_id
  - portfolio
  - balance
```

This file is the target for reconciliation, not a container for real secrets or external resource tokens.

---

# 20. RECOMMENDED PLATFORM COMPONENT STRUCTURE

Claude must first inspect existing platform naming and manifest conventions.

Preferred structure if compatible:

```text
src/platform/AnalyticsProvisioner/
├── README.md
├── CHANGELOG.md
├── manifest.json
├── component.yaml
├── Contracts/
│   ├── AnalyticsDesiredState.ts
│   ├── AnalyticsPlan.ts
│   ├── AnalyticsEvidence.ts
│   ├── AnalyticsApproval.ts
│   └── AnalyticsDrift.ts
├── Core/
│   ├── AnalyticsProvisioner.ts
│   ├── ReconciliationEngine.ts
│   ├── DesiredStateHasher.ts
│   └── IdempotencyGuard.ts
├── OAuth/
│   ├── GoogleOAuthBroker.ts
│   ├── GoogleScopePolicy.ts
│   ├── GoogleCredentialVault.ts
│   └── GoogleTokenCrypto.ts
├── Adapters/
│   ├── GoogleAnalyticsAdminAdapter.ts
│   ├── GoogleAnalyticsDataAdapter.ts
│   ├── GoogleTagManagerAdapter.ts
│   └── CookieHubConsentAdapter.ts
├── Policies/
│   ├── AnalyticsMutationPolicy.ts
│   ├── AnalyticsPrivacyPolicy.ts
│   ├── AnalyticsEventExportPolicy.ts
│   └── AnalyticsPublishPolicy.ts
├── MCP/
│   ├── createAnalyticsMcpServer.ts
│   ├── registerAnalyticsTools.ts
│   ├── registerAnalyticsResources.ts
│   └── schemas.ts
├── Services/
│   ├── AnalyticsVerificationService.ts
│   ├── AnalyticsDriftService.ts
│   ├── GtmReleaseService.ts
│   └── AnalyticsEvidenceService.ts
├── Events/
│   └── AnalyticsProvisioningEvents.ts
└── Tests/
    ├── reconciliation.test.ts
    ├── privacyPolicy.test.ts
    ├── oauthScopePolicy.test.ts
    ├── mcpTools.test.ts
    └── gtmReleasePolicy.test.ts
```

If MCP SDK compatibility requires an isolated package:

```text
tools/mcp/analytics-provisioner/
```

must wrap/reuse the platform contracts rather than duplicating domain rules.

---

# 21. SERVER ROUTING

Do not expand `server.ts` with a large implementation.

Add focused routers/services.

Suggested:

```text
server/analytics/
  googleOAuthRouter.ts
  analyticsMcpRouter.ts
  analyticsApprovalRouter.ts
```

`server.ts` should only mount the router.

Possible routes:

```text
GET  /api/integrations/google/oauth/start
GET  /api/integrations/google/oauth/callback
POST /api/integrations/google/oauth/revoke

POST /api/analytics/approvals
GET  /api/analytics/approvals/:id

ALL  /mcp/analytics
```

OAuth callback must:
- validate state;
- use exact redirect URI;
- exchange code server-side;
- store refresh token encrypted;
- redirect to a safe application route without tokens.

---

# 22. ENVIRONMENT VARIABLES

Add placeholders only.

Never commit actual values.

Suggested:

```text
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=

GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY=

GOOGLE_ANALYTICS_ACCOUNT_ID=
GOOGLE_ANALYTICS_PROPERTY_ID=
GOOGLE_ANALYTICS_WEB_STREAM_ID=

GOOGLE_GTM_ACCOUNT_ID=
GOOGLE_GTM_CONTAINER_ID=

VITE_GTM_CONTAINER_ID=

ANALYTICS_MCP_ENABLED=false
ANALYTICS_MCP_REMOTE_ENABLED=false
```

Existing during migration:

```text
VITE_GA_MEASUREMENT_ID=
```

Do not remove the existing variable until cutover evidence and rollback requirements are satisfied.

Render values remain external secrets/config and must not be committed.

---

# 23. GOOGLE CLOUD BOOTSTRAP — HUMAN-IN-THE-LOOP

Some steps may require the repository owner to use the Google Cloud / Google Analytics UI.

Claude must distinguish between:

- code/API-automatable actions;
- OAuth consent actions requiring a human;
- Google-account Terms of Service acceptance;
- account/property access grants;
- production publish approval.

Required one-time bootstrap may include:

1. choose/create Google Cloud project;
2. enable:
   - Google Analytics Admin API;
   - Google Analytics Data API;
   - Google Tag Manager API;
3. configure Google Auth Platform/OAuth consent screen;
4. create OAuth web application credentials;
5. register exact redirect URIs;
6. authorize the CAPITAL-AI owner account;
7. grant the account/service identity appropriate Analytics/GTM access.

Claude must generate an exact runbook for any step it cannot legitimately automate.

Do not report a UI-only step as completed unless evidence exists.

---

# 24. GOOGLE OAUTH REDIRECT URI

Production example:

```text
https://capital-ai.online/api/integrations/google/oauth/callback
```

Development redirect URI must be explicitly configured.

Do not use wildcard redirect URIs.

Do not dynamically derive a redirect URI from untrusted request headers.

---

# 25. APPROVAL ARTIFACT

Create a first-class approval contract.

Suggested:

```ts
interface AnalyticsApproval {
  id: string;
  actorUserId: string;
  action:
    | "GA_CONFIG_WRITE"
    | "GTM_VERSION_CREATE"
    | "GTM_PUBLISH"
    | "ROLLBACK";
  planHash: string;
  targetResource: string;
  expectedFingerprint?: string;
  approvedAt: string;
  expiresAt: string;
  stepUpEvidenceId?: string;
  consumedAt?: string;
}
```

Rules:

- short TTL;
- single use;
- bound to actor;
- bound to plan hash;
- bound to target;
- cannot be replayed for a different container version;
- publish requires step-up evidence;
- log consumption.

---

# 26. AUDIT / EVIDENCE MODEL

Every execution creates evidence.

Example:

```ts
interface AnalyticsProvisioningEvidence {
  evidenceId: string;
  correlationId: string;
  operation: string;
  actorUserId?: string;
  target: string;
  dryRun: boolean;
  beforeHash?: string;
  afterHash?: string;
  googleChangeResource?: string;
  gtmWorkspaceId?: string;
  gtmVersionId?: string;
  approvalId?: string;
  result: "NOOP" | "SUCCESS" | "FAILED" | "BLOCKED";
  reasons: string[];
  createdAt: string;
}
```

Do not include:
- raw tokens;
- client secrets;
- sensitive response payloads.

---

# 27. ENTERPRISE EVENTMESH INTEGRATION

Do not directly import EventMesh implementation if current contracts prohibit it.

Follow the existing public interfaces and component rules.

Add versioned enterprise events, after checking naming rules.

Suggested semantic event set:

```text
AnalyticsProvisioningRequested
AnalyticsProvisioningPlanCreated
AnalyticsApprovalRequired
AnalyticsConfigurationApplied
AnalyticsGtmVersionCreated
AnalyticsGtmPublished
AnalyticsVerificationPassed
AnalyticsVerificationFailed
AnalyticsDriftDetected
AnalyticsRollbackRequested
AnalyticsRollbackCompleted
GoogleOAuthCredentialAuthorized
GoogleOAuthCredentialRevoked
```

Before introducing these names:
- inspect EventMesh event catalog;
- avoid duplicates;
- conform to ESS-0001-CONTRACTS and EventMesh naming/version rules;
- update producer/consumer registry;
- add contract tests.

---

# 28. DOCUMENTARY INTEGRATION

The Documentary layer must record:

- architecture decision;
- implementation state;
- external dependency inventory;
- scopes;
- credentials ownership;
- consent model;
- test evidence;
- runbooks;
- production handoff;
- residual risks.

Do not generate documentation that claims live configuration is applied if only repository code exists.

---

# 29. TRACEABILITY

Update/build the traceability chain:

```text
Requirement
   ↓
ADR
   ↓
ESS / contracts
   ↓
Component
   ↓
Code
   ↓
Tests
   ↓
External configuration evidence
   ↓
Production verification evidence
```

Run the repository's traceability build command after implementation.

Any new component manifest must point to:
- ADR;
- contracts;
- tests;
- documentation;
- events.

---

# 30. PLATFORM DIRECTOR BOUNDARY

At the evidence baseline, PlatformDirector is marked `development` and contains a decision contract but not a complete runtime decision engine.

Therefore:

- do not fabricate a runtime PlatformDirector dependency;
- integrate via existing contract/event boundaries if real APIs exist;
- record future PlatformDirector policy ownership in documentation;
- do not claim runtime enforcement by PlatformDirector unless implemented and tested.

The Analytics Provisioner must have its own fail-closed policy enforcement today.

---

# 31. GITHUB AUTOMATION

Claude Code is expected to implement changes through normal Git workflow.

Required workflow:

1. start from current `main`;
2. verify clean working tree;
3. create branch:
   `agent/enterprise-analytics-provisioner-mcp`;
4. implement in small coherent commits;
5. run tests/lint/build;
6. run architecture/traceability checks;
7. prepare a PR;
8. include exact external production steps that remain;
9. do not auto-merge;
10. do not delete old rollback code before production acceptance.

The PR description must explicitly separate:

- repository changes;
- Google external changes;
- CookieHub external changes;
- Render external changes;
- Supabase migration changes;
- steps executed;
- steps pending approval.

---

# 32. GITHUB / CI SECURITY

Do not put Google user refresh tokens into GitHub Actions secrets merely for convenience.

If automated CI read-only validation against Google APIs is later required, prefer:

- short-lived identity;
- Workload Identity Federation where supported;
- separate read-only service identity;
- no publisher scope in CI.

GTM publication must not be triggered by arbitrary pull-request code.

---

# 33. SUPABASE PRODUCTION BOUNDARY

If OAuth credential persistence requires a new database table/schema:

- create migration through existing Supabase migration conventions;
- private/non-exposed schema preferred;
- no public REST exposure;
- explicit privilege grants;
- run security advisors;
- tests;
- document rollback;
- do not use user-editable metadata for authorization.

Do not apply production DDL merely because the migration exists.

Production DDL requires the project's controlled production-handoff process.

---

# 34. RENDER PRODUCTION BOUNDARY

`render.yaml` may contain placeholders for required variables.

Actual values:
- must be configured in Render;
- must never be committed;
- should be described in a production handoff checklist.

After changing any Vite `VITE_*` variable:
- a rebuild/redeploy is required because those values are build-time injected.

Do not claim a runtime configuration change is effective before deployment evidence.

---

# 35. CSP / CORS / SECURITY HEADERS

Inspect the current CSP before adding GTM.

Do not loosen to broad wildcards.

Only add exact required domains to the relevant directives.

Potential domains may include, depending on actual implementation:

```text
https://www.googletagmanager.com
https://www.google-analytics.com
https://*.google-analytics.com
https://cdn.cookiehub.eu
```

Do not add a domain unless network evidence proves it is required.

CORS:
- MCP endpoint must not accept arbitrary origins;
- OAuth callback is server-side;
- Google API calls occur backend-to-backend.

---

# 36. SSR / SPA TRACKING RULES

CAPITAL-AI is a React/Vite SPA.

Implement:
- initial page view after consent;
- virtual page views on SPA route changes;
- sanitized route path;
- no query-string leakage;
- deduplication so initial navigation is not double counted.

Inspect the actual routing architecture first.
Do not assume React Router is installed.

---

# 37. GTM CONFIGURATION POLICY

The AI may create only allowlisted objects.

Default allowlist:

- one Google tag / GA4 configuration;
- page/route tracking;
- approved custom events;
- CookieHub-compatible consent controls;
- no Ads tags;
- no remarketing;
- no Floodlight;
- no custom HTML that exfiltrates data;
- no arbitrary third-party pixels.

Any Custom HTML tag must be blocked by policy unless explicitly approved.

---

# 38. GOOGLE ANALYTICS PRIVACY SETTINGS

Default desired state:

- minimum practical event retention;
- Google Signals disabled unless explicitly approved;
- Ads personalization disabled;
- no Google Ads links unless explicitly approved;
- no user-provided data;
- no Measurement Protocol server-side events by default;
- no PII;
- no financial-sensitive custom dimensions.

If a current external configuration conflicts with these defaults:
- report drift;
- do not silently change until the plan is approved.

---

# 39. MEASUREMENT PROTOCOL

Do not enable by default.

If later required:
- separate ADR;
- separate secret;
- explicit consent mapping;
- server-side event policy;
- duplicate-event controls;
- transaction/event idempotency;
- PII/financial-data review.

The presence of Admin API support for Measurement Protocol secrets is not permission to create one automatically.

---

# 40. DRIFT DETECTION

Desired state is version controlled.

Drift categories:

```text
NONE
BENIGN
CONFIGURATION
PRIVACY
SECURITY
PUBLISH_STATE
UNKNOWN
```

Examples:

- measurement ID changed → CONFIGURATION;
- Google Signals enabled unexpectedly → PRIVACY;
- GTM Custom HTML tag added → SECURITY;
- live GTM version differs from repository evidence → PUBLISH_STATE.

Default response:
- evidence report;
- EventMesh event;
- no automatic repair.

---

# 41. ROLLBACK

Before every GTM publish:
- record current live version;
- record version fingerprint;
- record intended new version;
- record rollback command/API target.

Rollback tool requires:
- explicit action;
- owner TOTP step-up;
- audit event.

Rollback must restore:
- previous GTM live version;
- compatible runtime loader configuration if cutover involved app code.

Do not roll back OAuth or consent state blindly.

---

# 42. OBSERVABILITY

Add structured metrics/logs for the control plane:

```text
analytics_mcp_tool_calls_total
analytics_mcp_tool_failures_total
analytics_google_api_requests_total
analytics_google_api_rate_limit_total
analytics_drift_detected_total
analytics_publish_attempts_total
analytics_publish_blocked_total
analytics_verification_failures_total
```

Never label metrics with:
- email;
- token;
- Google subject;
- raw URL with query;
- asset symbol tied to user behavior.

---

# 43. RATE LIMITING / RETRY

For Google APIs:
- respect quota errors;
- exponential backoff with jitter for retryable failures;
- do not retry authorization failures endlessly;
- do not retry non-idempotent mutation without idempotency/reconciliation guard;
- surface actionable errors.

MCP tool calls:
- enforce existing rate limiter for remote mode;
- stricter limit on write/publish tools.

---

# 44. ERROR MODEL

Use stable error codes.

Suggested:

```text
ANALYTICS_AUTH_REQUIRED
ANALYTICS_INSUFFICIENT_SCOPE
ANALYTICS_RESOURCE_AMBIGUOUS
ANALYTICS_DUPLICATE_RESOURCE_RISK
ANALYTICS_PLAN_STALE
ANALYTICS_APPROVAL_REQUIRED
ANALYTICS_APPROVAL_EXPIRED
ANALYTICS_STEP_UP_REQUIRED
ANALYTICS_GTM_CONFLICT
ANALYTICS_GTM_COMPILER_ERROR
ANALYTICS_CONSENT_REGRESSION
ANALYTICS_PRIVACY_POLICY_VIOLATION
ANALYTICS_VERIFICATION_FAILED
ANALYTICS_DRIFT_DETECTED
ANALYTICS_EXTERNAL_RATE_LIMIT
```

Return safe errors through MCP.
Log sensitive internals only in sanitized server logs.

---

# 45. TEST STRATEGY

## 45.1 Unit tests

Required:

- desired-state hashing;
- reconciliation idempotency;
- duplicate prevention;
- scope policy;
- token encryption/decryption;
- token redaction;
- approval TTL/replay protection;
- publish policy;
- PII field blocker;
- route sanitizer;
- event allowlist;
- GTM fingerprint conflict;
- dry-run behavior.

## 45.2 Contract tests

Required:

- MCP tool schemas;
- EventMesh event contracts;
- platform manifest integrity;
- desired-state schema.

## 45.3 Integration tests

Use fake/stub adapters by default.

Real Google integration tests:
- opt-in only;
- separate non-production resource;
- never publish production.

## 45.4 Browser/E2E privacy test

This is mandatory before production cutover.

Scenario A — fresh visitor, no consent:
- open application;
- do not accept analytics;
- assert no GA measurement;
- assert no unauthorized Google analytics tag request according to chosen strict policy.

Scenario B — analytics consent granted:
- grant analytics;
- assert approved GTM/GA resources load;
- assert one initial page view;
- navigate SPA;
- assert sanitized virtual page view.

Scenario C — revoke consent:
- revoke analytics;
- assert subsequent events are blocked.

Scenario D — returning user:
- stored consent respected;
- no race condition causing lost or premature events.

If Playwright is not present:
- evaluate adding it as a pinned dev dependency;
- document the dependency and keep tests isolated.

---

# 46. BUILD / QUALITY GATES

At minimum run:

```bash
npm run lint
npm test
npm run build
npm run traceability:build
npm run predeploy:check
```

Also run any component-specific tests introduced.

If the MCP package is isolated, run its own:

```bash
npm ci
npm run lint
npm test
npm run build
```

Do not declare success if any mandatory gate fails.

---

# 47. SECURITY NEGATIVE TESTS

Test that:

- anonymous caller cannot use MCP write tools;
- normal user cannot configure GA;
- admin without required permission cannot publish;
- owner without fresh TOTP cannot publish;
- expired approval cannot publish;
- approval for plan A cannot publish plan B;
- refresh token cannot be retrieved via MCP resource;
- logs do not contain OAuth tokens;
- browser bundle does not contain Google client secret;
- unknown event fields are discarded/rejected;
- PII-looking fields are rejected;
- GTM Custom HTML insertion is blocked by default.

---

# 48. DOCUMENTATION DELIVERABLES

Create or update:

```text
docs/architecture/ENTERPRISE_GOOGLE_ANALYTICS_MCP_ARCHITECTURE.md
docs/runbooks/GOOGLE_ANALYTICS_SETUP.md
docs/runbooks/GOOGLE_ANALYTICS_MCP_PROVISIONING.md
docs/runbooks/GOOGLE_ANALYTICS_ROLLBACK.md
docs/security/GOOGLE_OAUTH_TOKEN_SECURITY.md
docs/compliance/GOOGLE_ANALYTICS_CONSENT_EVIDENCE.md
docs/adr/ADR-XXXX-enterprise-google-analytics-provisioner-mcp.md
```

Update:
- ADR index;
- component registry/manifest;
- Documentary references;
- Traceability matrix;
- deployment/environment documentation;
- security/compliance inventory.

---

# 49. README / OPERATOR RUNBOOK CONTENT

The operator runbook must include:

## Connect Google
- required account;
- required APIs;
- redirect URI;
- requested scopes;
- authorization procedure;
- revocation procedure.

## Audit
- run read-only discovery;
- compare desired vs actual;
- inspect drift report.

## Prepare change
- build plan;
- inspect risk;
- create GTM workspace;
- preview.

## Approve
- owner authentication;
- TOTP step-up;
- approval artifact.

## Publish
- version creation;
- publication;
- correlation ID.

## Verify
- consent test;
- realtime test;
- route event test;
- no-PII check.

## Roll back
- restore prior GTM version;
- verify.

---

# 50. EXTERNAL CONFIGURATION EVIDENCE

Store non-secret evidence only.

Suggested:

```text
docs/production/evidence/analytics/
  PRECHECK-<date>.md
  PROVISIONING-PLAN-<correlation-id>.md
  GTM-PREVIEW-<correlation-id>.md
  CONSENT-TEST-<correlation-id>.md
  POSTCHECK-<date>.md
```

Never store:
- OAuth authorization code;
- access token;
- refresh token;
- client secret;
- measurement protocol secret.

---

# 51. IMPLEMENTATION PHASES

## PHASE 0 — PRE-FLIGHT

Claude must:

1. fetch current `main`;
2. identify current latest commit;
3. inspect open PRs;
4. inspect:
   - `package.json`;
   - lockfile;
   - `server.ts`;
   - IAM;
   - TOTP step-up;
   - EventMesh;
   - Traceability;
   - Documentary;
   - Security/Compliance;
   - Release;
   - current GA/CookieHub integration;
   - Render config;
5. determine next ADR number;
6. identify current GA Measurement ID without inventing it;
7. identify whether GTM already exists;
8. produce a short pre-flight evidence document.

STOP if the working tree or branch state is ambiguous.

## PHASE 1 — ADR + DESIRED STATE

- create ADR;
- create desired-state YAML;
- create contracts;
- create component manifest;
- no external mutation.

## PHASE 2 — READ-ONLY CONNECTIVITY

Implement:
- OAuth broker;
- READ_ONLY profile;
- GA Admin read;
- GA Data read;
- GTM read;
- MCP read tools.

Verify account/property/container discovery.

No writes.

## PHASE 3 — RECONCILIATION ENGINE

Implement:
- state normalization;
- desired-state hashing;
- diff;
- policy;
- approval requirements;
- dry-run.

No writes.

## PHASE 4 — GA CONFIGURATION WRITE PATH

Implement Admin API writes behind:
- CONFIGURATOR credentials;
- dry-run;
- approval policy where required;
- audit evidence.

Apply only after plan review.

## PHASE 5 — GTM WORKSPACE WRITE PATH

Implement:
- workspace;
- tags;
- triggers;
- variables;
- preview;
- container version.

Do not publish.

## PHASE 6 — CONSENT + FRONTEND MIGRATION

Implement:
- typed analytics event façade;
- privacy policy;
- consent-gated GTM loader;
- SPA page view tracking;
- old direct gtag path retained only as rollback until cutover.

Ensure no double measurement.

## PHASE 7 — PUBLISH GATE

Add:
- approval artifact;
- owner/TOTP requirement;
- GTM publish tool;
- rollback capture.

## PHASE 8 — PRODUCTION CUTOVER

Only after owner approval:
- publish GTM;
- deploy code;
- validate zero pre-consent data;
- validate post-consent realtime events;
- validate revocation;
- collect evidence.

## PHASE 9 — CLEANUP

After accepted production evidence:
- remove obsolete direct gtag code;
- deprecate obsolete env variable if truly unused;
- update runbook status;
- mark implementation complete only if all acceptance criteria pass.

---

# 52. STOP CONDITIONS

Claude MUST STOP before a production mutation if any of the following occurs:

- multiple plausible GA properties;
- multiple plausible GTM containers;
- missing Google account ownership;
- insufficient scopes;
- OAuth consent not completed;
- unexpected Google API resource;
- privacy policy conflict;
- pre-consent Google analytics traffic;
- GTM workspace/compiler error;
- stale fingerprint;
- missing rollback version;
- missing owner approval;
- missing TOTP step-up;
- failed build;
- failed tests;
- failed traceability;
- failed production verification;
- unreviewed destructive action;
- undocumented external change.

When stopped:
- do not guess;
- produce exact evidence and next required action.

---

# 53. DESTRUCTIVE ACTION POLICY

Default forbidden through MCP:

- delete GA account;
- delete GA property;
- delete data stream;
- delete GTM container;
- delete GTM account;
- manage Google users;
- transfer ownership;
- unlink Google services;
- purge analytics history.

If cleanup is genuinely necessary:
- create separate plan;
- require explicit owner approval;
- require step-up;
- preserve rollback where possible.

---

# 54. NO-DEMO / NO-FAKE-DATA POLICY

Do not:
- fabricate Analytics property IDs;
- fabricate Measurement IDs;
- fabricate GTM IDs;
- fabricate successful realtime events;
- fabricate consent evidence;
- use fake production data as evidence.

Tests may use explicit fixtures labeled as fixtures.

Production evidence must come from real API/runtime responses.

---

# 55. DEPENDENCY MANAGEMENT

Do not guess dependency versions.

At execution time:

```bash
npm view <package> version
```

and consult official package documentation.

Pin dependencies according to repository security policy and commit lockfiles.

Likely capability classes:

- Google APIs Node client / `googleapis`;
- MCP official TypeScript server package(s);
- schema validation (`zod`) if required;
- optional browser test framework.

Do not install redundant libraries when native Node 22 capabilities suffice.

---

# 56. API VERSION POLICY

Google APIs change.

Before implementation:
- inspect latest official Admin API docs;
- use current GA4 APIs;
- avoid deprecated conversion-event APIs;
- inspect GTM API v2;
- inspect current Consent Mode v2 behavior;
- inspect current MCP SDK stable release.

Record the verification date in the ADR.

---

# 57. PRIVACY ACCEPTANCE CRITERIA

All must pass:

- [ ] CookieHub remains consent source of truth.
- [ ] No analytics data goes to Google before analytics consent.
- [ ] Advanced Consent Mode is not enabled by default.
- [ ] `ad_storage` denied by default.
- [ ] `ad_user_data` denied by default.
- [ ] `ad_personalization` denied by default.
- [ ] Analytics event schema contains no PII.
- [ ] Query strings are stripped from route analytics.
- [ ] OAuth callback URLs are excluded from analytics.
- [ ] password-reset URLs are excluded/sanitized.
- [ ] no arbitrary EventMesh payload reaches GA.
- [ ] no financial-sensitive payload reaches GA.

---

# 58. SECURITY ACCEPTANCE CRITERIA

All must pass:

- [ ] Google OAuth client secret server-only.
- [ ] Refresh tokens encrypted at rest.
- [ ] Dedicated token encryption key.
- [ ] OAuth state validation.
- [ ] Exact redirect URI.
- [ ] Incremental scopes.
- [ ] Read/write/publish permissions separated.
- [ ] Remote MCP authenticated.
- [ ] Remote MCP Origin/Host validated.
- [ ] Owner/TOTP required for publish.
- [ ] Approval bound to plan hash.
- [ ] Approval single-use/expiring.
- [ ] no raw token in logs.
- [ ] no secret in MCP tool result.
- [ ] rate limits active.
- [ ] GTM fingerprint concurrency check active.
- [ ] destructive operations blocked by default.

---

# 59. FUNCTIONAL ACCEPTANCE CRITERIA

All must pass:

- [ ] existing GA property discovered/adopted.
- [ ] existing production web stream discovered/adopted.
- [ ] no duplicate GA resources.
- [ ] existing or approved GTM container adopted/created exactly once.
- [ ] desired-state reconciliation is idempotent.
- [ ] dry-run produces deterministic plan.
- [ ] second identical apply produces NOOP.
- [ ] GTM workspace preview passes.
- [ ] container version created from approved workspace.
- [ ] publication requires approval.
- [ ] realtime post-consent event verified.
- [ ] SPA route event verified.
- [ ] consent revocation verified.
- [ ] rollback path verified/documented.

---

# 60. ARCHITECTURE ACCEPTANCE CRITERIA

- [ ] component follows CAPITAL-AI manifest conventions.
- [ ] new ADR exists.
- [ ] EventMesh contracts conform.
- [ ] no forbidden direct EventMesh implementation dependency.
- [ ] Documentary updated.
- [ ] Traceability updated.
- [ ] PlatformDirector limitations truthfully represented.
- [ ] `server.ts` remains thin.
- [ ] no parallel analytics implementation remains after accepted cleanup.
- [ ] build/test/predeploy checks pass.

---

# 61. REQUIRED FINAL CLAUDE REPORT

When complete, return a report with exactly these sections:

## 1. Baseline
- main SHA;
- platform version;
- existing GA/CookieHub state.

## 2. Files changed
Table:
- path;
- purpose;
- architecture owner.

## 3. ADR
- ADR ID;
- decision;
- implementation status.

## 4. MCP
- transport;
- tools;
- resources;
- authorization.

## 5. Google OAuth
- scopes;
- credential profiles;
- token storage;
- outstanding human actions.

## 6. GA Admin
- discovered resource IDs;
- changes applied;
- no-op items.

## 7. GTM
- account/container/workspace/version;
- publish status;
- rollback version.

## 8. Consent
- CookieHub mode;
- Consent Mode type;
- pre-consent evidence;
- post-consent evidence;
- revocation evidence.

## 9. Security
- IAM;
- TOTP;
- token encryption;
- CSP/CORS changes;
- negative tests.

## 10. Tests
Show commands and exact results.

## 11. Traceability
Show updated contracts/events/docs.

## 12. External production actions
Separate:
- Google;
- CookieHub;
- Render;
- Supabase.

## 13. Residual risks
No hidden or implied risks.

## 14. Merge recommendation
One of:
- `READY_FOR_REVIEW`
- `BLOCKED`
- `NOT_READY`

Do not auto-merge.

---

# 62. REFERENCE IMPLEMENTATION FLOW

Conceptual pseudocode:

```ts
const current = await discovery.readCurrentState();

const desired = await desiredState.load();

const plan = reconciliation.build({
  current,
  desired,
  policies: [
    privacyPolicy,
    oauthScopePolicy,
    mutationPolicy,
    publishPolicy
  ]
});

if (plan.hasPrivacyRegression) {
  throw new PolicyError("ANALYTICS_CONSENT_REGRESSION");
}

if (request.dryRun) {
  return plan;
}

approval.assertValid({
  approvalId: request.approvalId,
  planHash: plan.hash,
  actor,
  requiredStepUp: plan.requiresPublish
});

const result = await executor.apply(plan);

const verification = await verifier.verify(result);

if (!verification.passed) {
  await evidence.recordFailure(...);
  throw new VerificationError();
}

await evidence.recordSuccess(...);
return result;
```

---

# 63. REPOSITORY MIGRATION PRINCIPLE

Do not implement a big-bang rewrite.

Preferred PR decomposition if scope becomes too large:

### PR A — control plane foundation
- ADR;
- desired state;
- OAuth read-only;
- read MCP;
- reconciliation;
- tests.

### PR B — GA/GTM write plane
- configurator;
- workspace;
- preview;
- versioning;
- approvals.

### PR C — consent/runtime cutover
- Basic Consent Mode v2;
- consent-gated GTM;
- frontend analytics façade;
- browser tests.

### PR D — production evidence / cleanup
- postchecks;
- old gtag removal;
- documentation completion.

If the repository owner requested one PR, still preserve these as separate commits and explicit review stages.

---

# 64. CURRENT EXTERNAL FACTS TO VERIFY, NOT BLINDLY TRUST

At implementation time Claude should verify these facts against official sources:

1. Google Analytics Admin API supports programmatic GA4 configuration.
2. Creating properties/data streams requires `analytics.edit`.
3. Google Tag Manager API uses dedicated scopes for:
   - editing containers;
   - editing container versions;
   - publishing.
4. official Google Analytics MCP remains read-only.
5. Google Consent Mode v2 contains:
   - `analytics_storage`;
   - `ad_storage`;
   - `ad_user_data`;
   - `ad_personalization`.
6. Basic Consent Mode blocks Google tags and transfers no data before user interaction/consent.
7. Advanced Consent Mode may send measurements without cookies before consent.
8. CookieHub current release supports Consent Mode v2 and a Basic mode.
9. current MCP remote transport recommendation is Streamable HTTP.

If current official documentation contradicts this specification, record the discrepancy in the ADR and follow the current official behavior while preserving CAPITAL-AI's stricter privacy invariant.

---

# 65. AUTHORITATIVE REFERENCES

Use official documentation as primary sources.

## Google Analytics

- Google Analytics Admin API overview  
  https://developers.google.com/analytics/devguides/config/admin/v1

- Google Analytics Admin REST API  
  https://developers.google.com/analytics/devguides/config/admin/v1/rest

- Data stream create / `analytics.edit` scope  
  https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/properties.dataStreams/create

- Google Analytics Data API  
  https://developers.google.com/analytics/devguides/reporting/data/v1

- Official Google Analytics MCP  
  https://developers.google.com/analytics/devguides/MCP

## Google OAuth

- OAuth 2.0 for web-server applications  
  https://developers.google.com/identity/protocols/oauth2/web-server

- OAuth security best practices  
  https://developers.google.com/identity/protocols/oauth2/resources/best-practices

## Google Tag Manager

- GTM API authorization  
  https://developers.google.com/tag-platform/tag-manager/api/v2/authorization

- GTM REST API v2  
  https://developers.google.com/tag-platform/tag-manager/api/reference/rest

- Create tag  
  https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.workspaces.tags/create

- Create container version  
  https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.workspaces/create_version

## Consent Mode

- Consent Mode overview  
  https://developers.google.com/tag-platform/security/concepts/consent-mode

- Configure Consent Mode on websites  
  https://developers.google.com/tag-platform/security/guides/consent

## CookieHub

- Consent Mode v2  
  https://docs.cookiehub.com/installation/consent-mode-v2

- Google Tag Manager integration  
  https://docs.cookiehub.com/installation/google-tag-manager

## MCP

- MCP architecture  
  https://modelcontextprotocol.io/docs/learn/architecture

- MCP SDKs  
  https://modelcontextprotocol.io/docs/sdk

- MCP transport specification  
  https://modelcontextprotocol.io/specification/2025-11-25/basic/transports

- TypeScript SDK documentation  
  https://ts.sdk.modelcontextprotocol.io/

---

# 66. FINAL EXECUTION COMMAND TO CLAUDE

Begin now.

Do not ask for information that can be discovered from:
- the repository;
- Google APIs after OAuth;
- current official documentation;
- existing CAPITAL-AI manifests/runbooks.

Start with **PHASE 0 — PRE-FLIGHT**.

Before any external production mutation, produce the required reconciliation plan and evidence.

Preserve the current consent behavior until the replacement has passed the strict no-pre-consent-data test.

Implement code, tests, manifests, ADRs, documentation and handoff artifacts.

Use fail-closed behavior.

Do not fabricate successful external configuration.

Do not auto-merge.

End with the required final report from Section 61.
