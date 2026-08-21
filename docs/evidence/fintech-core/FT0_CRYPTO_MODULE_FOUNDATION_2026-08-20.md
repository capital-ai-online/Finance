# FT-0 Evidence — FinTech Core Crypto Module 01 Foundation

**Evidence-ID:** `FT0-CRYPTO-MODULE-FOUNDATION-2026-08-20`  
**Date:** 2026-08-20  
**Branch:** `feat/fintech-core-crypto-module-01`  
**Base:** `main@f1dff495fe792a4d4a26a3513f0525b4974bd349`  
**Roadmap:** `FT-CORE-CRYPTO-01`  
**ADR:** `ADR-0098` (`proposed`)  
**Work Claim:** `FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`

## Implemented in this foundation slice

- dedicated branch created from exact current-main baseline at branch creation time;
- exclusive work claim created;
- complete FT-0..FT-9 implementation roadmap created;
- ADR-0098 proposed for the FinTech Core / Crypto Module 01 authority boundary;
- `FinTechCore` generic workflow/operating-mode contracts introduced;
- Crypto analysis-profile contracts introduced without replacing the existing canonical `CryptoCategory` taxonomy;
- source-defined L1/L2/DeFi/RWA/NFT/Stablecoin/Exchange-Token/GameFi/AI-DePIN profile weights captured as non-authorizing research configuration;
- Meme and generic profiles remain `PENDING_EVIDENCE` instead of receiving invented formulas;
- Pattern groups, source start weights and initial pattern catalog introduced;
- Pattern Evidence and asset/profile/timeframe/regime-specific reliability contracts introduced;
- stablecoin and pattern-validation defaults explicitly marked `RESEARCH_DEFAULT_NOT_PRODUCTION_POLICY`;
- OrderIntent contract requires separate risk/compliance approval states and `SIDE_EFFECTING` classification;
- operating-mode guard denies real execution in RESEARCH, PAPER and EMERGENCY;
- unit tests added for category/profile, pattern, operating-mode and approval invariants.

## Preserved authorities

No existing productive scoring path was modified.

The following remain authoritative and unchanged in this slice:

```text
ScoringModelRegistry
  -> ScoringDispatcher
  -> CanonicalScoreResult
```

`CryptoOrchestrator` remains research/enrichment-only and `scoreEligible=false`.

No changes were made to:

- `src/platform/Scoring/**`
- `src/orchestrator/cryptoOrchestrator.ts`
- `src/services/classification.service.ts`
- `src/services/classificationAdapter.ts`
- Supervisor runtime routing
- Compliance runtime policy
- EventMesh runtime
- Supabase schema/data/functions
- Render service/environment/deploy state

## Parallel-work correlation

At the implementation checkpoint:

- PR #457 modifies Quality Center/Validator/package orchestration files; no direct path overlap with this FT-0 slice.
- PR #458 modifies verified asset display/market data and ADR-0097; no direct path overlap with this FT-0 slice.
- ADR-0097 is already occupied by PR #458, therefore this branch provisionally uses ADR-0098.
- ADR registry/document-registry mutation is intentionally deferred until the mandatory final main/open-PR namespace reconciliation before PR creation, avoiding conflicting edits with PR #458's `docs/adr/registry.json` change.

## Supabase evidence

Read-only inspection confirmed:

- project `AIFINANCIAL` is healthy in `eu-west-1`;
- PostgreSQL 17 is active;
- `public.outbox_jobs` exists;
- `public.agent_audit_events`, `public.score_snapshots`, `public.ai_governance_evaluations` exist;
- `pgmq 1.5.1` is installed.

Decision for this slice: no database mutation and no new queue. FT-3 must first design/review the durable `fintech_core` schema and determine whether existing `outbox_jobs` remains sufficient or whether a later pgmq convergence decision replaces—not duplicates—the queue authority.

Security advisor observation is tracked as unrelated baseline evidence: leaked-password protection is currently disabled. This branch does not change Auth configuration.

## Render evidence

Read-only inspection confirmed the production service:

- service: `Finance`
- runtime: Docker
- region: Frankfurt
- branch: `main`
- auto deploy: off
- live deploy at checkpoint: `f1dff495fe792a4d4a26a3513f0525b4974bd349`

Decision for this slice: no Render mutation or deploy.

## Static validation status

- GitHub branch compare after first five files: branch ahead of its base and `0` behind.
- Changed paths were confined to new FinTech-Core work-claim/docs/code/tests.
- New tests reside under `tests/unit`, which is discovered by the existing `vitest run` repository test script.
- Direct overlap with PR #457/#458: none at this checkpoint.
- No dependency added.
- No GitHub Actions workflow changed.
- No expensive GitHub CI triggered.

### Not yet executed

A connector-only implementation surface does not provide the repository runtime required to execute local `tsc`/Vitest in this session. Therefore the following are **not claimed as PASS**:

- TypeScript compile/lint
- Vitest execution
- production build
- repository quality execution
- GitHub CI

These remain mandatory validation gates before merge readiness. Expensive GitHub CI must only run after PR creation and the repository's applicable authorization gate.

## Next implementation step

Continue FT-0/FT-1 with:

1. Core Module Registry and immutable Crypto module descriptor;
2. Workflow state-machine contract and allowed transition tests;
3. category profile resolver with explicit primary/secondary evidence semantics;
4. authority-boundary structural tests preventing FinTech Core from importing domain scoring executors directly;
5. final FT-0 documentary synchronization;
6. only after local/static validation: mandatory final main sync and ADR/document-registry namespace reconciliation before any PR.
