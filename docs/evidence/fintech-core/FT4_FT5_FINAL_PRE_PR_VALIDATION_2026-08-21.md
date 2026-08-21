# FT-4 / FT-5 Final Pre-PR Validation — 2026-08-21

**Roadmap:** `FT-CORE-CRYPTO-01`  
**ADR:** `ADR-0099`  
**Branch:** `feat/fintech-core-ft4-research-paper-trading-2026-08-21`  
**Final main baseline before this evidence commit:** `7d173d3239fdbe31216354fc848f948d517069f6`  
**Pre-evidence branch head:** `d46873fd48474d8a9c9344a5c1cf43604edcbdb9`

## Final main synchronization gate

- current `main`: `7d173d3239fdbe31216354fc848f948d517069f6`;
- relation immediately before this evidence commit: **50 ahead / 0 behind**;
- merge base: exact current `main`;
- PR #469 CI-/runner-/cost-control changes are inherited from `main` and do not appear as FT-4/FT-5 scope changes;
- no overlapping open PR exists for this branch;
- the TS2678 remediation commit `ea4400c1cd86215c843c200d6c9eee8817d6f8b7` is contained in the branch.

This file is an evidence-only commit. A second main synchronization check is required immediately after it and before PR creation.

## Scope review

The branch diff is limited to:

- FT-4 Paper Trading contracts, deterministic engine and durable workflow/replay boundary;
- the existing FT-3 persistence reader extension required by FT-4;
- one versioned Supabase Paper replay/guard migration already production-verified;
- FT-5 deterministic Risk + Compliance contracts, gates and durable decision-record mapping;
- focused unit/architecture tests;
- directly correlated ADR-0099, roadmap, authority/ADR registries, work claims and evidence.

No Render, Stripe, IAM, productive scoring, exchange, custody, wallet-key, live-routing or settlement implementation is introduced.

## Security / data-integrity review

Verified from the branch sources and existing production evidence:

- Paper Trading requires `operatingMode=PAPER`, uses fictional balances and fixed-point `BigInt` arithmetic;
- replay persists through existing append-only `fintech_core.domain_events`; no parallel ledger or queue is created;
- the Paper replay RPC is `SECURITY INVOKER`, browser-role execution is revoked and `service_role` is the only reader role;
- Paper event guards enforce canonical payload/sequence/causation semantics and uniqueness constraints;
- FT-5 is fail-closed for missing, stale, invalid-provenance or authority-mismatched evidence;
- FT-5 does not accept an LLM/agent as approval authority;
- `executionHandoffEligible=false` remains hard-coded for all FT-5 authorization results;
- binding Risk/Compliance approvals to an OrderIntent remains deferred to FT-6.

## Best-practice / state-of-the-art correlation

Repository evidence records the following reviewed alternatives and sources:

- FT-4: QuantConnect LEAN and NautilusTrader assessed; not integrated because their execution/runtime surface is materially broader than the required typed Paper domain primitive;
- FT-5: OPA and Cedar assessed; not integrated because a second policy runtime/DSL is unnecessary for the current typed deterministic gate;
- regulatory architecture boundary: MiCA record/risk requirements, EBA CASP ML/TF risk-factor guidance, EBA Travel Rule guidance and FATF VA/VASP updates;
- existing GitHub and Supabase/PostgreSQL capabilities are reused instead of introducing another platform dependency.

## Validation status

- scope/diff classification: **PASS**;
- final pre-evidence main relation: **PASS — 0 behind**;
- critical Paper/Risk/Compliance source review: **PASS**;
- existing FT-4 production Supabase transaction/security/advisor verification: **PASS**;
- TS2678 unreachable `STALE` branch remediation: **PASS**;
- manual GitHub CI before PR: **not triggered**, per CI cost/governance policy;
- local checkout execution in the ChatGPT runtime was attempted but unavailable because the runtime could not resolve `github.com`; no result is inferred from that failed environment-only attempt.

Full repository CI remains a **post-PR** gate.
