# GoPlus Production Credential Activation and Rollback — 2026-08-24

**Status:** ACTIVE OPERATIONS RUNBOOK  
**Scope:** Render workspace `AICapital`, web service `Finance` (`srv-d91o1o9o3t8c73edi55g`)  
**Credential name:** `GOPLUS_API_KEY`  
**Security authority:** `docs/security/P1A_GOPLUS_TRANSACTION_SIMULATION_THREAT_MODEL_2026-08-24.md`

## Boundary

`GOPLUS_API_KEY` is a server-only compatibility name for the already-issued Bearer access token expected by the GoPlus Transaction Simulation API. It is not a browser variable, raw GoPlus `app_key`, raw `app_secret`, wallet key or execution credential.

The credential activates only the existing research/evidence transport. It does not construct routes, sign or broadcast transactions, create orders, approve risk, promote a model or enable FT-7 live execution.

## Verified activation state

| Check | Evidence |
|---|---|
| Target identity | Owner-approved workspace `AICapital` and service `Finance` |
| Secret placement | Entered by the owner as `GOPLUS_API_KEY`; value not read, copied, logged or committed |
| Browser exposure | No `VITE_*` variable and no client-side propagation |
| Latest observed service deploy | `dep-da6dick9v7es73cdejn0`, commit `1a2af9070c05dc1ecea128c149d40bbdeca16a33`, state `live` |
| Current verified main | `a0a1caf9f5da703f48fb1dc65244009d2ed79cf2`; production commit is an ancestor with `17` commits of undeployed main drift |
| Auto-deploy authority | Remains off; no second deployment authority introduced |
| Log inspection | No observed `GOPLUS`, `GoPlus` or `NOT_CONFIGURED` error in the inspected deploy logs; intermittent unrelated news-evidence 503 completions are recorded separately below |
| Functional provider call | Not claimed; no productive route invoked the provider during this verification |

A healthy deployment proves service availability, not provider correctness or token freshness. Four intermittent post-deploy 503 completions (00:07Z–00:09Z) correlated by router-local path and approximately eight-second duration with the news-evidence fail-closed `NO_DATA` path; no GoPlus marker was present and later requests succeeded. This code/timing correlation is an inference rather than a captured upstream trace and does not validate or invalidate the GoPlus token. Productive model-promotion gates in the threat model remain open.

## Fail-closed operational checks

1. Confirm the exact Render workspace and service identity before any environment mutation.
2. Confirm the variable name is exactly `GOPLUS_API_KEY` and is not exposed through a `VITE_*` prefix.
3. Never paste the value into GitHub, issues, PR bodies, logs, screenshots or evidence.
4. With no credential, the provider must return `NOT_CONFIGURED` before transport and must not synthesize PASS/FAIL.
5. With an expired or rejected credential, transport/application failure remains non-computable research evidence.
6. A provider response never grants scoring, risk, order or execution authority.

## Rotation procedure

Rotation is a protected external mutation and requires an explicit Owner instruction for the exact target.

1. Obtain a newly issued GoPlus Bearer access token through the approved provider account process.
2. In Render workspace `AICapital`, open service `Finance` and replace only `GOPLUS_API_KEY`.
3. Do not disclose or compare plaintext token values in chat or repository evidence.
4. Verify the resulting deployment reaches `live` and retains the expected main commit identity.
5. Inspect relevant logs for authentication/configuration failures without logging request authorization headers.
6. When a governed functional route is available, perform a separately authorized read-only known-safe simulation smoke test.
7. Revoke the previous token at the provider after the new token is verified, if provider controls support revocation.

## Rollback procedure

Rollback is also a protected external mutation and requires Owner approval unless responding under an already-authorized incident procedure.

Triggers include suspected disclosure, wrong credential type, repeated authentication rejection, unexpected provider behavior or incorrect target service.

1. Reconfirm target `AICapital / Finance / srv-d91o1o9o3t8c73edi55g`.
2. Remove or replace `GOPLUS_API_KEY` in Render; never restore a suspected compromised value.
3. Verify the service returns to `live`.
4. Verify GoPlus-backed evidence fails closed as `NOT_CONFIGURED` or source unavailable and never becomes PASS.
5. Confirm unrelated market-data, scoring, order and execution paths remain unchanged.
6. Revoke/rotate the affected token in the GoPlus provider account where available.
7. Record only timestamps, target identity, outcome and deploy/evidence identifiers—never the token.
8. If code rollback is also required, use a fresh branch from current `main`, Human-reviewed revert PR and normal CI/merge gates.

## Remaining promotion gates

Credential presence is necessary but insufficient for productive model use. Route-authority verification, token lifecycle/SLA, governed universe coverage, freshness policy, calibration, schema monitoring, corroboration and explicit model-promotion approval remain required. FT-7 real execution remains independently blocked.
