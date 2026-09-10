# OPS Post-#851 Edge / Telemetry / Product Intelligence Evidence

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Supporting PVCs:** `PVC-08 — Production Operations`, `PVC-18 — EventMesh / Traceability`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Security verification:** `CAPITAL-AI-SEC` remains independent  
**Branch:** `agent/operations-edge-telemetry-product-intel-20260910`  
**Branch creation baseline:** `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42`  
**Date:** `2026-09-10`  
**Status:** `IMPLEMENTED_BRANCH / LOCAL_FOCUSED_VALIDATION_PASS / PROVIDER_ACTIVATION_NOT_RUN`

## 1. Correlation

- User-provided historical baseline `8226d522d99623b7a0f4ac2fc4938dabe9bf1d29` was no longer current at execution time.
- Current main was refreshed before branch creation and resolved to `e9b2551a4e2e24c5fed3dac72362b8bf1727bf42`.
- PR #851 is Human-merged and establishes `capital-ai-online/Finance` as the active repository identity.
- PR #852 is Human-merged/terminal.
- PR #855 is Human-merged/terminal.
- Open pull requests at branch creation: none.
- No active changed-file, semantic, namespace or authority writer was identified for this bounded OPS slice.

## 2. Ownership and architecture boundaries

This slice is bounded to OPS implementation/runtime/traceability concerns:

- `PVC-02`: bounded controlled implementation and request-boundary integration;
- `PVC-08`: Render/edge runtime behavior, without Production mutation;
- `PVC-18`: operational trace/evidence correlation, without replacing EventMesh/Traceability.

Not transferred:

- Governance authority remains `CAPITAL-AI-GOV / PVC-05`;
- Security findings and independent verification remain `CAPITAL-AI-SEC`;
- Product/FINTECH/Marketing/Privacy owners retain their domain, consent and product-decision authority;
- `DR-03` remains separate provider-adapter work;
- Render OIDC/OAuth2.1/MCP remains a separate future slice behind fresh Security/Authority correlation.

No second Agent Control Plane, IAM plane, MCP server, telemetry bus, audit store or analytics control plane is introduced.

## 3. Read-only Render correlation

Read-only Render connector evidence for service `Finance` established:

- type: public `web_service`;
- branch: `main`;
- runtime: Docker;
- region: Frankfurt;
- instances: 1;
- direct Render origin: `https://finance-7clq.onrender.com`;
- inbound IP allowlist: `0.0.0.0/0`;
- Auto Deploy: `off`;
- health check: `/healthz`.

This means a direct-origin caller can reach the Render service independently of the public Cloudflare path. Cloudflare-looking forwarding headers alone are therefore insufficient origin authentication.

No Render setting, secret, deploy, domain, allowlist or environment variable was changed.

## 4. Repository implementation

### Edge trust

`src/platform/Security/edgeTrust.ts` adds a dependency-free Cloudflare→Render provenance contract:

- canonical public host validation;
- HTTPS forwarding validation;
- `CAPITAL_AI_EDGE_TRUST_SECRET` minimum-length requirement;
- constant-time comparison against `x-capital-ai-edge-token`;
- syntactic `CF-Connecting-IP` validation;
- supported `CF-Ray` validation;
- explicit trust state/reason without exposing the secret.

`src/platform/Security/rateLimiter.ts` now accepts Cloudflare visitor identity only when the edge contract is trusted. Otherwise it falls back to the direct Express/socket peer and does not trust raw `X-Forwarded-For`.

`server/middleware/cors.ts` reuses the same canonical public-host list to avoid a second host policy.

### Existing telemetry extension

`src/platform/Telemetry/traceContext.ts` validates W3C `traceparent` v00 and rejects malformed, all-zero and unsupported-version input.

`server/logger.ts` keeps the existing logger authority and adds only correlation metadata:

- `traceId`;
- inbound `parentSpanId`;
- `traceFlags`;
- `edgeRayId`;
- `edgeTrust`;
- `edgeTrustReason`.

None of these fields grants identity, capability, policy, approval or execution authority.

### Product Intelligence

`src/platform/Telemetry/productIntelligence.ts` adds a vendor-neutral aggregate event contract.

It explicitly rejects identity/credential/request-content property names, rejects non-scalar nested payloads at runtime even if a caller bypasses TypeScript, and does not contain any outbound exporter or vendor SDK. Product Intelligence is evidence/data only and cannot grant entitlement, alter scoring, mutate billing, bypass consent or select an AI/provider execution path.

## 5. Focused negative validation

| Check | Result | Evidence |
|---|---|---|
| isolated TypeScript compile of Edge Trust, rate limiter and Telemetry contracts | `PASS` | local `tsc 5.8.3`; no diagnostics after harness-only Node type stubs |
| changed TypeScript syntax/transpile diagnostics | `PASS` | all 9 changed/new TS test/runtime files transpile without TypeScript syntax diagnostics |
| trusted canonical Cloudflare→Render request | `PASS` | valid host + HTTPS + secret proof + IP + Ray accepted |
| direct `finance-7clq.onrender.com` spoof with Cloudflare-looking headers | `PASS` | rejected as `invalid-host`; client identity falls back to direct peer |
| missing/mismatched edge secret proof | `PASS` | rejected; visitor IP not trusted |
| malformed client IP / Ray / forwarded proto | `PASS` | rejected fail-closed |
| valid W3C v00 traceparent | `PASS` | trace/parent-span/flags parsed |
| malformed/all-zero/unsupported-version traceparent | `PASS` | returns `null` |
| Product Intelligence identity/credential/request-content properties | `PASS` | rejected for email/user/session/authorization/token/request-body/query families |
| Product Intelligence nested arbitrary payload via runtime type bypass | `PASS` | rejected at runtime before event creation |
| non-`product.*` event namespace | `PASS` | rejected |
| Product Intelligence immutability | `PASS` | event/context/properties frozen |
| repository-native `vitest` focused test | `NOT-RUN` | GitHub connector surface has no repository checkout/dependency tree |
| repository `npm run lint` | `NOT-RUN` | same execution-surface limitation |
| repository `npm test` | `NOT-RUN` | same execution-surface limitation |
| repository `npm run build` / predeploy | `NOT-RUN` | reserved for full repository/hosted validation; no PR yet |
| Cloudflare provider configuration | `NOT-RUN` | explicitly outside current authorization |
| Render environment/allowlist/deploy mutation | `NOT-RUN` | explicitly outside current authorization |
| Production deployment/probe | `NOT-RUN` | explicitly outside current authorization |

The first isolated compile attempt was inconclusive because the scratch harness lacked repository Node type definitions and a copied `redaction.ts`; it was not counted as a repository/code failure. The harness was corrected without changing repository semantics, then the scoped compile and behavior checks passed.

## 6. Activation gate

Repository implementation alone must not be interpreted as production activation.

Before a future deployment of strict edge trust:

1. separately authorize and provision a high-entropy shared edge secret in Render and the Cloudflare origin request path without exposing it to client-side code or repository evidence;
2. verify readback/negative direct-origin behavior, then consider stronger origin restriction (for example provider-supported inbound restrictions or authenticated origin mechanisms) under its own Security/Production review.

Render OIDC/OAuth2.1/MCP is not part of this activation gate and remains a separate future slice.

## 7. Remaining PR gate

Immediately before PR creation:

- refresh current main;
- refresh open PRs/active writers;
- compare main to branch head;
- re-correlate changed-file and semantic/authority overlap;
- record exact immutable `main_sha` and `branch_head_sha`;
- run all currently available local/repository checks and label unavailable checks `NOT-RUN`;
- obtain the exact Human `PR erstellen: freigegeben` approval for that snapshot.

This evidence does not authorize PR creation or merge.
