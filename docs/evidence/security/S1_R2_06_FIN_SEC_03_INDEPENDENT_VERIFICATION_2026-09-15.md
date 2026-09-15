# S1-R2-06 / FIN-SEC-03 — Independent Security Verification — 2026-09-15

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Primary productive PVC:** `N/A — cross-cutting Security verification`  
**Affected productive owner:** `CAPITAL-AI-FINTECH / PVC-15 — Domain Analysis / Executor`  
**Work item:** `S1-R2-06 / FIN-SEC-03`  
**Repository baseline:** `main@fd854e01843bdfd1ff84154dc6c8a63e79f2ba7b`  
**Working branch:** `agent/security-fin-sec-03-independent-verification-20260915`  
**Authority:** `/AGENTS.md`, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `CTRL-SEC-BOUNDED-REMEDIATION-001`, `ADR-0034`, `ESS-0006 v1.2.0`  
**State:** `SECURITY_NEGATIVE_TESTS_MATERIALIZED / EXECUTION_PENDING`

## 1. Objective and assurance boundary

Independently verify the FINTECH/PVC-15 owner return from Human-merged PR #929 without treating owner implementation evidence as Security verification.

The bounded Security invariants are:

1. protected Backtest execution requires a verified bearer identity and a server-resolved entitled subscription tier;
2. forged browser tier state cannot authorize Backtest;
3. Monte Carlo requires a fresh server-side quota decision before every user-triggered simulation and cannot use the removed automatic/bypass trigger;
4. `full_ai_analysis` requires both an available productive model executor and a server-authoritative entitlement/quota ALLOW before execution;
5. missing/invalid identity, entitlement denial, quota exhaustion, entitlement-authority failure and executor/provider unavailability fail closed;
6. shadowed compatibility residue does not become an earlier alternate route around the canonical protected route.

This Security slice does not change plan semantics, FINTECH executor behavior, billing, Supabase data, Stripe data, IAM/provider permissions or Production state.

## 2. Current-main and ownership correlation

The pass started from `main@fd854e01843bdfd1ff84154dc6c8a63e79f2ba7b` after fully re-reading `/AGENTS.md`, canonical project/PVC mapping, the Security project surface/Roadmap, the FINTECH Roadmap, Accepted ADR-0034 and ESS-0006 v1.2.0.

At branch creation there were no open Pull Requests. `CAPITAL-AI-FINTECH / PVC-15` remains the productive owner of Domain Analysis / Executor semantics. `CAPITAL-AI-SEC` owns independent Security testing and may materialize bounded negative tests/evidence without acquiring FINTECH ownership.

PR #929 is merged owner implementation evidence. Its `IMPLEMENTED / EVIDENCE_READY / SECURITY_VERIFICATION_REQUESTED` status is input to this verification, not a Security PASS.

## 3. Current implementation correlation

### Backtest

Current `server/routes/historyRoutes.ts` mounts `backtestEntitlement` on `/api/backtest-history` before `orchestrator.handle('Backtest Download')` and before `assetRegistry.getHistory(...)`.

The entitlement path resolves identity through `resolveVerifiedIdentity(req)`, reads the persisted subscription tier through `getSubscription(identity.userId)`, and evaluates the canonical ADR-0034 `backtest` entitlement. No browser-visible tier header participates in that decision.

### Monte Carlo

Current `server/entitlements.ts` exposes `/monte-carlo/authorize`, which delegates to `evaluatePaidAnalysisAccess(req, 'monte_carlo')`.

The canonical quota path resolves verified identity and server subscription state, then uses the `monte_carlo` rolling-window quota. The browser consumer calls the authorize endpoint via `authFetch()` before simulation. The former `runSimulation(true)` / `bypassTrigger` automatic path is absent from the current consumer source.

### full_ai_analysis

Current `server/routes/portfolioReviewRoutes.ts` first requires a configured Anthropic or OpenAI executor, then resolves `full_ai_analysis` access, and only after ALLOW invokes `generateStructuredWithFallback(...)`.

Missing providers, null provider result and executor exceptions return `503 / FULL_AI_ANALYSIS_UNAVAILABLE`. Entitlement-authority exceptions independently return `503 / entitlement-authority-unavailable` through the shared paid-analysis decision boundary.

The canonical application-route mount precedes the later inline compatibility residue in `server.application.ts`, preserving the canonical protected route as the first matching execution boundary.

## 4. Independent Security regression added

`tests/unit/securityFinSec03IndependentVerification.test.ts` is a Security-owned negative-test surface using the current production modules with only external identity/subscription/quota provider calls mocked.

The suite covers:

- missing bearer -> Backtest `401 authentication-required`, before subscription lookup;
- syntactically valid but provider-rejected forged bearer -> Backtest `401`, before subscription lookup;
- forged browser `x-subscription-tier=Enterprise` + server `Starter` -> Backtest `403`;
- forged browser `x-subscription-tier=Free` + server `Pro` -> Backtest `200`;
- Pro Monte Carlo server quota ALLOW -> `200` and canonical one-per-day quota parameters;
- exhausted Monte Carlo quota -> `429 quota-limit-reached`;
- server entitlement-authority failure for `full_ai_analysis` -> `503 entitlement-authority-unavailable`;
- Backtest route ordering keeps the gate before provider/history execution;
- Monte Carlo consumer requires server authorization and contains neither `runSimulation(true)` nor `bypassTrigger`;
- full-AI provider guard -> entitlement decision -> productive executor order;
- missing/failed full-AI executor remains `503` fail-closed;
- canonical application-route mount precedes later inline compatibility residue.

The tests do not replace provider/Production E2E evidence and do not authorize external mutation.

## 5. Validation truth

### Executed in this pass

- current-main SHA readback;
- complete `/AGENTS.md@current-main` read;
- current project/PVC/Owner mapping read;
- current Security README/Roadmap read;
- current FINTECH Roadmap and PR #929 readback;
- ADR-0034 and ESS-0006 v1.2.0 readback;
- current paid-analysis middleware/quota/Backtest/full-AI route source correlation;
- current Monte-Carlo wiring correlation;
- open-PR inventory readback (`0` open at branch creation);
- independent Security negative-test source materialization on a fresh Security branch.

### Not run / not claimed yet

- focused Vitest execution for the newly authored Security suite: `NOT RUN`;
- repository-wide TypeScript: `NOT RUN`;
- full unit suite: `NOT RUN`;
- Production build: `NOT RUN`;
- hosted GitHub PR CI: `NOT RUN` before PR creation;
- live Production route replay with real entitled/unentitled identities: `NOT RUN`;
- Stripe/Supabase/IAM/Billing/Provider mutation: `NOT PERFORMED / NOT AUTHORIZED`.

`NOT RUN` is not represented as PASS.

## 6. Security disposition

Current disposition after source correlation and test materialization:

```text
OWNER IMPLEMENTATION: IMPLEMENTED / EVIDENCE_READY
INDEPENDENT SECURITY TEST CONTRACT: MATERIALIZED
INDEPENDENT SECURITY TEST EXECUTION: NOT RUN
PRODUCTION / PROVIDER E2E: NOT RUN
S1-R2-06 FIN-SEC-03 SECURITY DISPOSITION: VERIFICATION_PENDING
```

No `VERIFIED` or `CLOSED` claim is made before the independent test suite executes successfully and any required hosted/runtime evidence is correlated to the exact PR/runtime identity.

## 7. Exit-gate continuation

The next Security gate is to execute the new focused negative-test suite under the repository-governed PR/hosted-check lifecycle, then correlate its exact head against current main.

Only after successful independent execution may Security assess whether the repository-level FIN-SEC-03 portion of S1-R2-06 can move to `VERIFIED_REPOSITORY`, while Production/provider E2E remains separately classified where applicable.
