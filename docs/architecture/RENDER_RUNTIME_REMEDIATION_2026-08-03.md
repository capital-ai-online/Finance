# CAPITAL-AI — Render Runtime Remediation Evidence

**Date:** 2026-08-03  
**Environment:** Production  
**Render workspace:** `AICapital`  
**Render service:** `Finance` (`srv-d91o1o9o3t8c73edi55g`)  
**Repository / branch:** `SvenKulessa/Finance` / `main`  
**Governing ADR:** ADR-0037  
**Remediation PR:** #78  

## 1. Purpose

This document records the verified production findings from the live Render audit and separates:

1. changes already applied directly to Render;
2. code/IaC changes implemented in PR #78;
3. remaining Render control-plane settings that cannot be mutated by the currently connected Render write API and therefore remain explicitly open until applied and re-verified.

No secret values are documented here.

## 2. Production baseline

Before remediation, the active production deployment was:

- commit: `770f14632086722fa2fe7a7286ce82bfcb90c83c`;
- deploy: `dep-d9o23hoae00c73fli0ag`;
- service plan: Starter;
- region: Frankfurt;
- runtime: Docker;
- instances: 1;
- runtime port observed by Render: 3000;
- `autoDeployTrigger`: `commit`;
- Render `healthCheckPath`: empty.

The service was operational and had ample capacity, but the application background market-data refresh failed once per minute with `SCORE_NOT_COMPUTABLE` for standard crypto assets whose verified historical feature set was unavailable.

## 3. Production changes already applied

### 3.1 Canonical Stripe Price-ID contract

The live Stripe account was read and the active CAPITAL-AI prices were matched to the variable names already used by `server/stripe.ts`.

The following canonical Render environment-variable **keys** were populated with their verified live Stripe Price IDs. Values are intentionally omitted from this document:

- `STRIPE_PRICE_ID_STARTER_MONTHLY`;
- `STRIPE_PRICE_ID_STARTER_YEARLY`;
- `STRIPE_PRICE_ID_PRO_MONTHLY`;
- `STRIPE_PRICE_ID_PRO_YEARLY`;
- `STRIPE_ID_FOUNDER`;
- `STRIPE_PRICE_ID_EXPORT_PDF`.

Existing environment variables were merged, not replaced. No Stripe product, price, customer, subscription, webhook, Supabase row or IAM state was mutated.

Render automatically triggered deploy `dep-d9o2j7p42hec738ihme0` to pick up the environment-variable update. The deploy completed with status `live` against the unchanged production code commit `770f14632086722fa2fe7a7286ce82bfcb90c83c`.

## 4. PR #78 code remediation

### 4.1 Market-data refresh fail-loop

The deterministic crypto scoring engine remains fail-closed: it still refuses to compute a score when there are no verified scoring features.

The remediation is applied at the aggregation boundary instead. When `generateCryptoScores()` returns no finite verified feature for a standard crypto asset, the market-data batch may retain an already finite upstream/base score only as `scoreBasis: heuristic`.

Properties of this fallback:

- no synthetic score is generated;
- a missing/non-finite base score still fails closed;
- the result is never labelled `market-data`;
- one unsupported CMC symbol no longer rejects the complete `Promise.all` market-data refresh batch;
- the No-Demo-Data provenance distinction is preserved.

### 4.2 Render PORT contract

`server.ts` now resolves the listening port from `PORT` and uses 3000 only when no platform port is supplied. Invalid/non-integer/out-of-range values fail at startup rather than silently binding an unintended port.

### 4.3 Stripe diagnostics disclosure

Startup diagnostics no longer output:

- secret/key prefixes;
- key lengths;
- partial Price IDs.

The diagnostic now emits boolean configuration-presence fields only, including canonical monthly/yearly price-key coverage.

### 4.4 Graceful Render shutdown

The HTTP server handle and market-data refresh timer are now retained. On `SIGTERM` / `SIGINT` the process:

1. prevents duplicate shutdown;
2. stops scheduling the periodic market-data refresh;
3. stops accepting new HTTP connections and drains the HTTP server;
4. exits successfully after drain;
5. force-exits after 25 seconds if shutdown cannot complete.

The 25-second application deadline remains below the 30-second Render shutdown window declared in IaC.

### 4.5 Testable runtime helpers

Pure helpers under `server/runtime/renderRuntimeSafety.ts` cover:

- PORT validation;
- finite-score detection;
- bounded heuristic reuse of an existing base score;
- boolean-only Stripe configuration diagnostics.

Unit tests are included under `tests/unit/renderRuntimeRemediation.test.ts`.

## 5. Render IaC reconciliation

`render.yaml` is updated to describe the verified Finance production topology instead of the historical `capital-ai` service name:

- service: `Finance`;
- repo: `SvenKulessa/Finance`;
- branch: `main`;
- runtime: Docker;
- region: Frankfurt;
- plan: Starter;
- instances: 1;
- health path target: `/healthz`;
- auto-deploy target: `checksPass`;
- shutdown-delay contract: 30 seconds;
- canonical Stripe billing environment-key inventory.

This is the repository target state. It is not evidence that every control-plane value has already been changed on the existing Render service.

## 6. Remaining live Render control-plane drift

The connected Render write surface currently supports environment-variable updates and deploy operations, but does not expose a generic service-settings mutation for the existing Docker service. Therefore these verified live values remain open until changed through an authorized Render control-plane operation and re-read afterwards:

| Setting | Verified live value | Target | Status |
|---|---|---|---|
| `autoDeployTrigger` | `commit` | `checksPass` | OPEN |
| `healthCheckPath` | empty | `/healthz` | OPEN |

They MUST NOT be described as fixed merely because `render.yaml` now expresses the target state.

## 7. Post-merge production verification

After PR #78 is approved, merged and deployed, production evidence must verify all of the following:

1. deploy commit equals the merged PR #78 commit;
2. startup succeeds on the Render-provided `PORT`;
3. `/healthz` returns 2xx;
4. no key prefixes, key lengths or partial Price IDs appear in startup logs;
5. canonical Stripe configuration-presence flags are true for the intended plans;
6. `Market Data` startup pre-cache completes;
7. at least two consecutive 60-second background refresh cycles complete without `SCORE_NOT_COMPUTABLE`;
8. a controlled redeploy records `Graceful shutdown initiated` and does not produce an unexplained application crash;
9. Render service settings are re-read and the remaining control-plane drift is closed or retained as an explicitly tracked finding.

## 8. Rollback boundary

The runtime code changes are reverted through the protected GitHub PR/revert process. The Render billing-variable change can be rolled back only by restoring the prior Render environment configuration from trusted operator evidence; secret values must never be copied into repository documentation or PR bodies.

Rollback of governance, health, billing, IAM or deployment controls remains subject to the protected-change rules defined by the CAPITAL-AI architecture.
