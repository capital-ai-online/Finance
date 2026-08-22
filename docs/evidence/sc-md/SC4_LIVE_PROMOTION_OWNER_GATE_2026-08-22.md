# SC4 — LIVE Promotion Owner Gate

Status: **OPTION B OWNER-APPROVED / PROMOTION GATES NOT YET COMPLETE**
Date: 2026-08-22

## Owner approval

The Owner explicitly approved:

> Option B — LIVE_SCORING without LIVE_EXECUTION under the documented gates.

The approval permits productive promotion when the required gates are satisfied. It is not a waiver of missing evidence, DQ, audit, backtest or anti-correlation controls.

## State model

1. `LIVE_DATA`: fresh provider evidence may be displayed in production UI.
2. `LIVE_SCORING`: a category model is productive through the existing ScoringModelRegistry/ScoringDispatcher.
3. `LIVE_EXECUTION`: real orders/exchange/custody execution are permitted.

`LIVE_EXECUTION` remains explicitly excluded.

## Approved Option B gates

Before a Meme/DeFi/category challenger may become `LIVE_SCORING`, all of the following must be evidenced for that model/category:

- complete governed identity data for every provider-dependent asset;
- required evidence coverage and freshness/DQ threshold;
- no missing hard gate and no failed hard gate;
- negative/provider-failure/schema-drift tests;
- backtest and out-of-sample validation;
- anti-correlation / duplicate-feature review;
- effective-feature/effective-weight fingerprint;
- dataset/page governance and source/licensing attribution;
- audit/formal-verification evidence mapping where the feature contract requires it;
- zero unresolved critical/high promotion findings.

Missing/stale required evidence remains `NOT_COMPUTABLE` / `BLOCKED` and cannot be bypassed by Owner approval alone.

## Current branch readiness — 2026-08-22

| Gate | State | Reason |
|---|---|---|
| Owner Option-B approval | PASS | Explicitly approved in chat on 2026-08-22 |
| LIVE_EXECUTION blocked | PASS | FT-7+ remains outside this package |
| Free/provider cost policy | PASS (code/policy) | NewsAPI/CoinGlass/LunarCrush/Messari removed from active default; free/keyless stack established |
| GoPlus free security path | PASS (code) | Keyless EVM + Solana adapters with local limit; identity mapping still dataset-dependent |
| Dune free-tier policy | PASS (code) / MANUAL CONFIG | Free-Tier attestation, allowlist and bounded result reads implemented; Owner API key/query IDs still required |
| Kraken/DEX public evidence | PASS (code) / DATASET MAPPING | Public providers implemented; exact market/token identities must be reviewed |
| News evidence | PASS (code) | GDELT metadata projection replaces NewsAPI |
| Dataset/identity registry | OPEN | Registry intentionally contains no guessed contract/mint/market/query identities |
| Social evidence | OPEN | No governed free provider currently promoted; no neutral/synthetic substitute allowed |
| Audit/formal verification | PARTIAL | Sourcify source-bytecode verification added; external audit/formal verification/oracle/exploit evidence still separate/open |
| Backtest/OOS | OPEN | Category-specific promotion evidence not yet complete |
| Full required feature coverage | OPEN | Meme and DeFi research inputs remain incomplete |
| Productive registry promotion | BLOCKED | Conditions above are not all PASS |

## Result

No Meme/DeFi/category challenger is changed to `scoreEligible=true` in this branch yet. Doing so now would violate the approved Option-B condition because the required evidence/backtest/audit gates are demonstrably incomplete.

Once all gates for a specific category turn PASS, the authorized next mutation is a normal versioned ScoringModelRegistry/ScoringDispatcher promotion for that category only. There is no global `forceLive` switch.
