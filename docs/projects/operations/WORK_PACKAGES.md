# CAPITAL-AI-OPS Work Packages

**Project:** `CAPITAL-AI-OPS`  
**Status:** ACTIVE BACKLOG / NON-AUTHORIZING  
**Correlation baseline:** `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42`  
**Correlation date:** `2026-09-10`  
**Open PR baseline:** none at branch creation; PR #851/#852/#855 are merged/terminal

## Current owner-directed package

| Priority | Package | PVC | Scope | Exit evidence / current disposition |
|---:|---|---|---|---|
| Owner-directed | `OPS-POST851-EDGE-01` Cloudflare→Render Edge Trust | primary `PVC-02`; supporting `PVC-08` | fail-closed origin provenance before trusting Cloudflare visitor identity; no provider write | ACTIVE_BRANCH — repository control + negative tests; provider activation separate |
| Owner-directed | `OPS-POST851-OBS-01` Telemetry correlation extension | primary `PVC-02`; supporting `PVC-18` | extend existing logger/Telemetry with validated W3C context and edge provenance | ACTIVE_BRANCH — no second logger/collector/audit plane |
| Owner-directed | `OPS-POST851-PI-01` Product Intelligence contract | primary `PVC-02`; supporting `PVC-18` | vendor-neutral aggregate-safe product event schema; no identity/PII/vendor export | ACTIVE_BRANCH — consumer ownership unchanged |
| Blocked follow-up | `OPS-POST851-ID-02` Render OIDC/OAuth2.1/MCP | `PVC-02` | execution-host identity and external MCP/OAuth assurance only after Security/Authority re-correlation | BLOCKED / NOT_IN_CURRENT_SLICE |

### Package coherence

`EDGE-01`, `OBS-01` and `PI-01` are one coherent repository slice because they share a single bounded request/evidence boundary:

```text
trusted edge provenance
→ existing request telemetry correlation
→ optional aggregate-safe Product Intelligence event contract
```

They do not add provider execution, deployment authority, IAM authority, consent authority or a new telemetry/control plane.

## Edge-Trust contract

The current Render service is publicly reachable through its `onrender.com` origin and currently permits inbound traffic from `0.0.0.0/0`. Therefore caller-supplied Cloudflare-looking headers cannot be considered sufficient origin authentication.

Repository contract:

- trusted public hosts are centralized once and reused by CORS/edge validation;
- `x-forwarded-proto` must be `https`;
- `CAPITAL_AI_EDGE_TRUST_SECRET` must be provisioned separately and contain at least 32 characters;
- `x-capital-ai-edge-token` must match the configured secret using constant-time comparison;
- `CF-Connecting-IP` must be a syntactically valid IP address;
- `CF-Ray` must match the supported Ray-ID shape;
- failures do not trust `X-Forwarded-For` or attacker-selected `CF-Connecting-IP`;
- fail-closed fallback uses direct peer identity;
- secret/header values are never emitted to telemetry.

Provider configuration, secret creation/rotation, Cloudflare Transform/Origin Rule changes, Render env mutation, origin allowlist changes and Production deployment are excluded.

## Telemetry contract

Reuse only:

- `server/logger.ts` as current Logger Authority;
- `src/platform/Telemetry` as vendor-neutral Operational Telemetry contract;
- ADR-0059 accepted audit/W3C correlation semantics;
- existing deployment identity and redaction.

Current additions:

- `parseTraceParent()` accepts only W3C version `00`;
- malformed/all-zero/future-version inputs return `null`;
- inbound parent span is represented as `parentSpanId`, not falsely promoted to a locally created span;
- edge Ray ID and edge trust state are correlation metadata only;
- no external OpenTelemetry dependency/collector is added.

## Product Intelligence contract

Allowed:

- `product.*` event namespace;
- aggregate purposes: feature adoption, funnel, experiment, feedback, reliability;
- bounded scalar event properties;
- technical service/environment/version/commit/trace correlation.

Denied:

- user/session/IP identity;
- e-mail/phone/contact identifiers;
- authorization/cookies/tokens/secrets/passwords;
- prompts/request bodies/query content;
- nested arbitrary payloads;
- vendor SDK/export;
- implicit analytics consent;
- product/financial decision authority.

Vendor export is a separate future adapter owned by the applicable Product/Marketing/Privacy path.

## Security-priority packages retained

| Priority | Package | PVC | Current disposition |
|---:|---|---|---|
| P1 | `OPS-08-SEC-07` Recovery / RPO / RTO | `PVC-08` | recovery harness on main; deterministic evaluator fresh re-intake + operational evidence + Security verification open |
| P1 | `OPS-06-SEC-03` Node Control-Plane Convergence | `PVC-06` | BLOCKED_BY_AUTHORITY_CONFLICT |
| P1 | `OPS-02-SEC-06` Entitlement Capability Inventory | `PVC-02` | PARENT EVIDENCE READY / RETURN-ONLY |
| P1 | `OPS-04-SEC-04` Fatal Process Handling | `PVC-04` | IMPLEMENTED_ON_MAIN / repository verification present / post-deploy evidence open |
| P1 | `OPS-02-SEC-05` Stripe Redirect Boundary | `PVC-02` | IMPLEMENTED_ON_MAIN / EVIDENCE_READY / Security verification open |
| P2 | `OPS-08-SEC-09` Strict CSP Promotion | `PVC-08` | WAITING_FOR_EVIDENCE |
| P2 | `OPS-08-SEC-10` Billing Isolation | `PVC-08` | WAITING_FOR_EVIDENCE |

The current owner-directed package does not close, downgrade or absorb these Security findings.

## Core OPS packages

| Priority | Package | PVC | Current disposition |
|---:|---|---|---|
| P1 | `OPS-02-A` Controlled Implementation Inventory | `PVC-02` | ACTIVE / recurring |
| P1 | `OPS-04-A` Supervisor Ownership & Gap Closure | `PVC-04` | PARTIAL |
| P1 | `OPS-06-A` Version Boundary & Drift | `PVC-06` | BLOCKED at current Node authority boundary |
| P1 | `OPS-07-A` Release Evidence Contract | `PVC-07` | OPEN |
| P1 | `OPS-08-A` Production Handoff & Recovery | `PVC-08` | OPEN / PARTIAL |
| P1 | `OPS-18-A` EventMesh/Traceability Coverage | `PVC-18` | OPEN / PARTIAL |
| P2 | `OPS-02-CI-01` Build/Test Cost & Scope Reduction | `PVC-02` | PLANNED |
| P2 | `OPS-08-B` Reliability & Capacity Baseline | `PVC-08` | OPEN |
| P2 | `OPS-18-B` Traceability Freshness | `PVC-18` | OPEN |

## DR-03 — Provider Adapter / Execution Integration

| Priority | Package | PVC | Scope | Current disposition |
|---:|---|---|---|---|
| queued | `DR-03` Provider Adapter / Execution Integration | primary `PVC-02`; supporting `PVC-04`, `PVC-18` | smallest productive provider-adapter boundary behind existing IAM/policy/audit/trace gates | `BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE` |

DR-03 remains separate. The Post-#851 package does not:

- add or activate provider adapters;
- modify provider profiles/grants;
- create a second Agent Control Plane;
- enable remote skill loading;
- create an MCP server;
- perform Release/Production mutation.

## SEC-SOTA-02 handoff

Security remains owner for threat analysis/findings/independent verification.

- `F04` external MCP/connector host assurance is the only directly relevant later OPS/PVC-02 host-evidence dependency in this package family.
- Any installation, connection, OAuth, permission, secret or external host mutation requires separate Human authorization.
- The current repository slice does not claim Security closure.
- Other SEC-SOTA-02 findings remain with their routed productive owners.

## Package rules

1. One bounded coherent work package per fresh compliant branch.
2. Security-relevant implementation may become `IMPLEMENTED`/`EVIDENCE_READY`; `VERIFIED/CLOSED` remains Security-owned.
3. Foreign productive work is handed off rather than absorbed.
4. Runtime/provider mutation is never implied by repository code or documentation.
5. Lower-precedence roadmap text does not override Accepted ADR/ESS authority.
6. Closed/unmerged PRs and absent branches are historical input only.
7. Product Intelligence cannot become IAM, entitlement, scoring, billing or consent authority.
8. Telemetry cannot replace EventMesh, Traceability or durable audit evidence.
9. External edge identity is untrusted until the repository edge-proof contract succeeds.
10. Render-OIDC/OAuth2.1/MCP remains a separate future slice.

## Current terminal references

| Work | Current result |
|---|---|
| PR #720 fatal process handling | merged |
| PR #729 User Lifecycle OPS closeout | merged |
| PR #743 GOV-03 / DR-02B | merged foreign dependency |
| PR #776 recovery harness | merged |
| PR #794 GOV-07 OPS evidence return | merged |
| PR #802 RPO evaluator | closed/unmerged |
| PR #828 qs 6.16.0 | merged/deployed/terminal |
| PR #833 cleanup | closed/unmerged |
| PR #851 repository identity | merged |
| PR #852 Security policy/dependabot | merged |
| PR #855 GitGuardian API health | merged |

## Exit gate for current package

- branch starts at exact then-current `main`;
- no open PR changed-file/semantic/authority writer at creation;
- Edge Trust negative tests cover direct-origin spoof, missing/mismatched proof and malformed edge metadata;
- trace tests cover malformed/all-zero/unsupported versions;
- Product Intelligence tests reject identity/credential/request-content fields and non-product namespaces;
- local validations are explicitly recorded as PASS/FAIL/NOT-RUN;
- no provider write and no Production mutation occurs;
- final main/head snapshot is re-correlated before PR approval;
- PR creation remains separately Human-approved.
