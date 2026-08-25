# VW-7 — Controlled Wording Migration

**Status:** IMPLEMENTED BASELINE / FIVE CONTROLLED MIGRATIONS COMPLETE ON FINALIZATION BRANCH
**Authority:** `ESS-0017` / `ESS-0017-CONTRACTS`  
**Boundary:** no blind mass replacement; no financial or compliance semantic changes

## Scope

VW-7 establishes the safe migration mechanism for existing hardcoded user-facing wording. It deliberately does not perform a repository-wide blind replacement.

Each migration candidate is explicit and contains:

- stable migration ID;
- exact source path;
- exact current literal;
- canonical Message Key;
- delivery surface;
- `automaticApplyAllowed: false`.

## Initial governed slice

The first migration baseline covers five existing `MarketScreener` strings:

- title;
- contract-separation subtitle;
- start action;
- loading action;
- asset-search placeholder.

Their copy was first captured unchanged in the canonical Message Catalog. The five `MarketScreener` consumers now resolve the same text through their stable Message Keys without semantic copy changes.

## Implementation

- `src/platform/Vocabulary/Messages/migrationMessages.ts`
- `src/platform/Vocabulary/Delivery/browserMessageCatalog.ts`
- `src/platform/Vocabulary/Migration/WordingMigrationPlan.ts`
- `scripts/automation/validateWordingMigration.ts`
- `src/platform/Vocabulary/Tests/wordingMigrationPlan.test.ts`

## Migration states

- `OPEN` — governed hardcoded literal remains and is explicitly queued;
- `MIGRATED` — source references the stable Message Key and the literal is removed;
- `DRIFT` — source/message relationship is ambiguous or broken and blocks closure.

`OPEN` is permitted because migration is intentionally incremental. `DRIFT` fails closed.

## Acceptance

- [x] first real production-copy migration candidates identified
- [x] governed DE/EN Message Keys created before source mutation
- [x] browser-safe resolver provided without Node-only imports
- [x] every candidate is explicit and non-automatic
- [x] drift detection implemented
- [x] no broad regex/string replacement across financial hotpaths
- [x] remaining wording debt is measurable instead of hidden
- [x] all five initial `MarketScreener` candidates resolve stable Message Keys and validate as `MIGRATED`
