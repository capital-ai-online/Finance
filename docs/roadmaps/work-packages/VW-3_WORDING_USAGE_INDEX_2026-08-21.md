# VW-3 — Wording Usage Index

**Status:** IMPLEMENTED / MERGED VIA PR #477 / ACTIVE BASELINE ON MAIN
**Authority:** `ESS-0017`

## Scope

- build read-only Message-Key usage evidence;
- scan only explicit stable Message-Key references;
- expose reverse impact by Concept;
- bind observed usages to source path, feature, surface and optional FinTech stage;
- no inferred/fabricated usage and no source mutation.

## Implementation

- `src/platform/Vocabulary/Usage/WordingUsage.ts`
- `src/platform/Vocabulary/Usage/WordingUsageIndex.ts`

## Acceptance

- [x] explicit key scanner
- [x] deterministic sorted usage list
- [x] reverse impact by Concept
- [x] actual source paths only
- [x] no hardcoded-string mass migration before VW-7
- [x] focused unit tests
