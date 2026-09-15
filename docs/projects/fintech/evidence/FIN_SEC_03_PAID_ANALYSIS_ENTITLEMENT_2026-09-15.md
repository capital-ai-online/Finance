# FIN-SEC-03 — Paid Analysis Entitlement Boundary — 2026-09-15

**Project:** `CAPITAL-AI-FINTECH`  
**PVC:** `PVC-15 — Domain Analysis / Executor`  
**Finding source:** `S1-R2-06 — entitlement authority`  
**Authority:** `/AGENTS.md@current-main`, ADR-0034, `subscription-entitlements/1.0.0`  
**FINTECH status:** `IMPLEMENTED / EVIDENCE_READY`  
**Security status:** `VERIFICATION REQUESTED` — not `VERIFIED`, not `CLOSED`  
**Correlation baseline:** `main@833b0184c9b61d2341a22f434b408b1cc0416def`  
**Branch:** `agent/fintech-fin-sec-03-analysis-entitlement-20260915`

## 1. Scope and invariant

FIN-SEC-03 closes the FINTECH-owned paid-analysis authorization gap without creating a second entitlement authority and without changing ADR-0034 business semantics.

The protected capabilities remain defined by the existing canonical plan contract:

- `backtest`: Free/Starter denied; Pro/Enterprise allowed;
- `monte_carlo`: Free/Starter denied; Pro one execution per rolling day; Enterprise unlimited;
- `full_ai_analysis`: Free preview-only and therefore denied for protected execution; Starter one execution per rolling day; Pro/Enterprise unlimited.

Browser-visible subscription state is not authorization. Every protected execution decision resolves from a verified server identity plus persisted subscription state and, where applicable, the canonical server quota path.

## 2. Backtest boundary

Productive compatibility execution is now:

```text
BacktestEngine / PortfolioBacktester / Charts
→ authFetch('/api/backtest-history?...')
→ backtestEntitlement
→ resolveVerifiedIdentity(req)
→ getSubscription(identity.userId)
→ canUseFeature('registered', tier, 'backtest')
→ ALLOW / DENY
→ only after ALLOW: orchestrator + assetRegistry.getHistory(...)
```

Evidence:

- `server/middleware/paidAnalysisEntitlement.ts` supplies the shared paid-analysis decision and fail-closed middleware;
- `server/quota.ts` implements `enforceBacktestEntitlement()` using the existing verified identity and persisted subscription authority;
- `server/routes/historyRoutes.ts` mounts `backtestEntitlement` before `orchestrator.handle('Backtest Download')` and before registry/provider history execution;
- all current `/api/backtest-history` browser consumers use the existing bearer-aware `authFetch()` transport.

No direct browser tier header can produce an ALLOW decision.

## 3. Monte Carlo boundary

Monte Carlo no longer executes automatically or through a client-only trigger bypass.

```text
User-triggered Monte Carlo action
→ authFetch POST /api/entitlements/monte-carlo/authorize
→ evaluatePaidAnalysisAccess('monte_carlo')
→ resolveVerifiedIdentity(req)
→ persisted subscription tier
→ enforceMonteCarloQuota()
→ canonical rolling quota / unlimited decision
→ ALLOW / DENY
→ only after ALLOW: local stochastic calculation
```

`src/components/MonteCarloDetailed.tsx` deliberately has no automatic `runSimulation(true)` effect and no `bypassTrigger` path. A fresh server decision is required for each user-triggered execution.

The existing repository Supabase migration already includes `monte_carlo` in `public.user_quota` / `consume_user_quota`; FIN-SEC-03 does not add or apply production DDL.

## 4. `full_ai_analysis` productive executor binding

`POST /api/portfolio-review` in the canonical extracted application router is the productive financial-domain `full_ai_analysis` executor for this slice.

The execution order is fail-closed:

```text
/api/portfolio-review
→ require configured Anthropic and/or OpenAI productive model executor
→ evaluatePaidAnalysisAccess('full_ai_analysis')
→ verified identity + persisted subscription + canonical quota
→ generateStructuredWithFallback(...)
→ structured portfolio analysis result
```

If no productive provider exists, all configured providers fail, or the executor throws, the route returns `503 FULL_AI_ANALYSIS_UNAVAILABLE`. The extracted productive route no longer fabricates a deterministic heuristic review as a substitute for an unavailable AI executor.

A later legacy inline `/api/portfolio-review` declaration remains in `server.application.ts` as compatibility residue. Current application composition mounts `registerApplicationRoutes(...)` and its extracted portfolio-review router first, so the canonical protected handler has precedence. `tests/unit/finSec03PaidAnalysisWiring.test.ts` records that route-order invariant. Retirement of the shadowed legacy declaration is separate decomposition debt and is not used as productive FIN-SEC-03 authority.

The existing repository Supabase migration already includes `full_ai_analysis` in the quota-kind constraint; no production database mutation is performed by this work package.

## 5. Existing Buffett authority preserved

FIN-SEC-03 does not change the Warren Buffett business entitlement contract or its server authorization API. The existing `/api/entitlements/warren-buffett/authorize` authority and bearer-aware consumer remain intact.

## 6. Test artifacts

Focused regression artifacts are prepared and source-correlated:

- `tests/unit/paidAnalysisEntitlement.test.ts`
  - authoritative Backtest ALLOW;
  - forged browser-tier header cannot override server DENY;
  - authentication / feature / quota DENY status mapping;
  - entitlement-authority exception fails closed with 503;
  - middleware DENY does not call `next()`;
  - middleware continues only after ALLOW.
- `tests/unit/finSec03PaidAnalysisWiring.test.ts`
  - reuses canonical subscription/quota authority and existing DB quota kinds;
  - Backtest gate precedes history/provider execution;
  - every current Backtest compatibility consumer uses bearer-aware transport;
  - Monte Carlo requires fresh server authorization and has no automatic/bypass execution;
  - `full_ai_analysis` is bound to the real structured provider executor and fails closed;
  - canonical extracted route precedes the legacy inline compatibility residue.
- `tests/unit/subscriptionEntitlements.test.ts`
  - exact Backtest, Monte Carlo and `full_ai_analysis` ADR-0034 plan matrix.
- existing `tests/server/domainDecompositionPhase32.contract.test.ts` compatibility literals are preserved by keeping the canonical `router.get('/api/backtest-history'...)` route form and unchanged registry/range/source semantics.
- existing `tests/server/analysisRouteExtraction.contract.test.ts` expectations remain satisfied at source level: extracted portfolio review, structured provider chain, Anthropic/OpenAI, no Gemini.

## 7. Validation truth

Executed/read back in this ChatGPT GitHub-connector session:

- exact current-main SHA and full `/AGENTS.md` correlation;
- project/PVC/Owner and FINTECH Roadmap correlation;
- ADR-0034 plan/entitlement semantics;
- open-PR and changed-file overlap correlation;
- branch/main compare after synchronization: merge base equals `main@833b0184c9b61d2341a22f434b408b1cc0416def`, branch is `0 behind`;
- source-level readback of the paid-analysis middleware, quota functions, route ordering, all current compatibility consumers and focused regression test definitions;
- source-level compatibility review against the existing domain-decomposition and analysis-route extraction contracts.

Not run / not claimed as PASS in this connector session:

- focused Vitest execution;
- full Vitest suite;
- TypeScript `tsc --noEmit` / `npm run lint`;
- production build;
- hosted GitHub CI (no workflow run exists for this branch before PR creation);
- Production runtime entitlement verification;
- Supabase/Stripe/provider mutation.

`EVIDENCE_READY` here means the scoped implementation plus reproducible positive/negative test artifacts and correlation evidence are prepared for the normal pre-PR/hosted and independent Security verification stages. It does **not** mean the unexecuted checks passed, and it does not self-close S1-R2-06.

## 8. FIN-12 vs FIN-17 P1 reprioritization

Re-correlation against the same current main produces one next FINTECH P1 slice: **`FIN-17 — Ranking / Decision Support`**.

Reasoning:

1. DATA has already materialized `ValidatedDataInput` and explicitly handed PVC-12 consumption to FINTECH; FIN-12 is therefore unblocked but remains a downstream mapping/integration package rather than a newly discovered authority bypass.
2. FIN-17 has a current productive authority split: `src/platform/Ranking/CrossAssetRanking.ts` already provides a FINTECH backend ranking implementation, while the productive `RankingBoard` still sorts READY score rows and derives Top/Worst slices locally in the Frontend.
3. The current trust-root ranking invariant requires backend ordering and forbids a Frontend-local ranking authority. Closing that live authority split is narrower and more immediate than broadening the DATA-to-feature mapping in the same next slice.
4. FIN-12 remains P1 and follows after FIN-17 unless then-current main or DATA/Security evidence changes the queue.

**Next P1:** `FIN-17`  
**FIN-12 disposition:** `P1 / NEXT AFTER FIN-17 RECORRELATION`.

## 9. Verification request

`CAPITAL-AI-SEC` is requested to independently verify FIN-SEC-03 as part of `S1-R2-06`, including positive/negative execution evidence and fail-closed behavior. FINTECH reports only `IMPLEMENTED / EVIDENCE_READY`; it does not report `VERIFIED` or `CLOSED`.
