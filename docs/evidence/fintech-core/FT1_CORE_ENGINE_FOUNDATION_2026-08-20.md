# FT-1 Evidence — FinTech Core Engine Foundation

**Evidence-ID:** `FT1-CORE-ENGINE-FOUNDATION-2026-08-20`  
**Date:** 2026-08-20  
**Branch:** `feat/fintech-core-crypto-module-01`  
**Current synchronized main:** `a8d384154ff2eb1bfe74108eb4a4119cbab2a040`  
**Roadmap:** `FT-CORE-CRYPTO-01`  
**ADR:** `ADR-0098` (`proposed`, registered in branch ADR registry)  
**Work Claim:** `FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`

## Main / Open-PR synchronization gate

The branch was originally created from `main@f1dff495fe792a4d4a26a3513f0525b4974bd349`.

During FT-0, PR #457 was merged and moved main to:

`a8d384154ff2eb1bfe74108eb4a4119cbab2a040`

Correlation findings:

- PR #457 changed Quality Center/Validator/build-quality artifacts and introduced `FintechValueChainQualityProjection`.
- The projection is explicitly read-only/non-authorizing and does not change market data, classification, scoring, confidence, ranking, eligibility, provider routing, release or deployment authority.
- There was no direct path overlap with the FinTech Core branch.
- The FinTech Core branch was merged with the PR #457 main tree through a two-parent sync commit.
- Post-sync compare: `0 behind` current main.

Open PR correlation after PR #457 merge:

- PR #458 remains the only observed open PR.
- Its current changed-file set contains verified-asset display/market-data/UI/evidence work and `docs/governance/document-registry.json`.
- Its current changed-file set does not contain `docs/adr/registry.json` or an ADR-0098 file.
- PR #458 body still contains an ADR-0097 reference, but the current diff does not allocate ADR-0098.
- ADR-0098 is therefore registered in this branch with authority ID `AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`.
- `docs/governance/document-registry.json` is intentionally not modified in this checkpoint because PR #458 modifies that same canonical registry. Its required `DOC-ADR-0098`/roadmap/evidence entries must be additively reconciled at the next mandatory main/open-PR gate rather than creating an avoidable parallel JSON conflict now.

## FT-1 implemented code

### Immutable module topology

`src/platform/FinTechCore/CoreModuleRegistry.ts`

- constructor-bound module set;
- duplicate module IDs rejected;
- no runtime register/mutate API;
- exact module resolution can be requested by module ID;
- unsupported asset class/mode fails closed;
- ambiguous implicit routing fails closed.

### Crypto Module 01

`src/platform/FinTechCore/Modules/Crypto/CryptoCoreModule.ts`

- module ID: `fintech-core.crypto`;
- module version: `fintech-core.crypto/0.1.0`;
- asset class: `crypto` only;
- supported FT-1 modes: `RESEARCH`, `PAPER` only;
- `GUARDED_LIVE` and `PRODUCTION` are intentionally not exposed by the module registry.

### Deterministic workflow state machine

`src/platform/FinTechCore/Runtime/WorkflowStateMachine.ts`

- initial state is `CREATED`;
- deterministic transition map;
- caller-provided transition timestamps for replay determinism;
- monotonic sequence counter;
- `WAITING_FOR_APPROVAL` can resume to `RUNNING`;
- `COMPLETED`, `REJECTED`, `FAILED`, and `EMERGENCY_STOPPED` are terminal;
- reopening a terminal run is rejected; replay/retry must later use a new `runId` plus durable causation evidence.

### Core Engine

`src/platform/FinTechCore/CoreEngine.ts`

- resolves module capability from `FinTechCoreModuleRegistry`;
- prepares a workflow in `CREATED`;
- starts it through the deterministic state machine into `RUNNING`;
- has no market-provider, scoring-executor, Supabase, exchange, custody or deployment side effects.

### Default composition

`src/platform/FinTechCore/index.ts`

- exports the versioned contracts and FT-1 components;
- creates the default immutable registry with Crypto Module 01;
- exposes the side-effect-free `finTechCoreEngine` instance.

### Documentary component metadata

- `src/platform/FinTechCore/README.md`
- `src/platform/FinTechCore/manifest.json`

The manifest records FT-1 as foundation-only and marks live execution, durable financial persistence, risk/compliance execution adapters and exchange/custody adapters as blocked areas.

## Tests introduced

- `tests/unit/fintechCoreModuleRegistry.test.ts`
  - research/paper resolution;
  - live-mode denial;
  - unsupported asset class denial;
  - duplicate ID rejection;
  - ambiguous routing rejection.

- `tests/unit/fintechCoreWorkflowStateMachine.test.ts`
  - initial deterministic state;
  - sequence progression;
  - approval wait/resume;
  - terminal-state protection;
  - emergency stop;
  - missing timestamp rejection.

- `tests/unit/fintechCoreEngine.test.ts`
  - research prepare/start;
  - guarded-live/production denial;
  - wrong asset-class denial.

- `tests/architecture/fintechCoreAuthorityBoundary.test.ts`
  - foundation code must not directly reference productive crypto domain scorers;
  - no direct Supabase client or Kraken client in the foundation;
  - Crypto Module 01 remains research/paper-only.

## Protected existing authorities

The following remain unchanged and authoritative:

```text
UAI
 -> verified evidence / feature contract
 -> ScoringModelRegistry
 -> ScoringDispatcher
 -> Domain Executor
 -> CanonicalScoreResult
```

Quality remains read-only/non-authorizing evidence.

Supervisor, Governance, IAM, Compliance policy, Release and Deployment authorities are not replaced by FinTech Core.

## External platforms

No Supabase mutation was performed.

No Render mutation or deploy was performed.

No exchange, wallet or custody integration was introduced.

## Validation status

Static repository evidence:

- branch is based on the current main merge base and reports `0 behind` after the FT-1 changes;
- all new runtime paths are under `src/platform/FinTechCore/**`;
- no existing Scoring, MarketData, Supervisor, Compliance, Quality or application runtime file is modified by FT-1;
- no dependency or GitHub Actions workflow is changed;
- ADR-0098 is present in `docs/adr/registry.json` on the branch;
- no expensive GitHub CI was triggered before PR creation.

Not claimed as executed/PASS in this connector-only checkpoint:

- TypeScript compile/lint;
- Vitest execution;
- production build;
- repository quality execution;
- governance control-plane execution;
- GitHub CI.

## Roadmap state after this checkpoint

### FT-0

Implemented:

- branch/work claim/roadmap;
- proposed ADR-0098;
- ADR registry entry;
- FinTech Core and Crypto contract versions;
- category profile contracts;
- pattern evidence/reliability contracts;
- operating-mode contracts;
- authority boundary tests.

Remaining before FT-0 merge-readiness:

- additive document-registry reconciliation after PR #458/main correlation;
- executable local/static repository checks;
- final pre-PR main/open-PR sync.

### FT-1

Implemented foundation:

- `FinTechCoreEngine`;
- `FinTechCoreModuleRegistry`;
- `FinTechCoreModule` contract;
- `WorkflowContext`;
- `DomainEvent`;
- `DecisionRecord`;
- `OrderIntent` contract;
- deterministic workflow state machine;
- Crypto Module 01 registration;
- explicit `RETRY_SAFE` vs `SIDE_EFFECTING` contract;
- research/paper-only module capability boundary.

Still deliberately deferred:

- Supervisor runtime routing to FinTech Core;
- category evidence resolver runtime composition (FT-2A);
- productive scoring adapter composition behind ScoringDispatcher (FT-2B);
- pattern detection runtime (FT-2C);
- durable Supabase workflow state (FT-3);
- all live financial side effects.
