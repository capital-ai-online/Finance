# CAPITAL-AI-FE — News Consumer Strangler Evidence — 2026-09-17

## Scope

- Project: CAPITAL-AI-FE
- Project folder: `docs/projects/frontend/`
- Primary Owner: CAPITAL-AI-FE
- Baseline main: `085299e88e5c0b16bb5d9cb62f7599c607a4aca2`
- Roadmap: FE-CARRY-01 / physical feature migration
- Branch: `agent/frontend-news-consumer-strangler-20260917`

## Correlation

PR #1028 is closed without merge; none of its payload is assumed. The work package is rebuilt from current main.
Open PR #1031 changes only Quality-Management evidence and has no file/namespace writer overlap.
Open PR #1022 is a Governance authority writer and remains non-authorizing until merge. It does not write the News UI paths, but any merge before PR creation or merge-readiness requires authority re-resolution.

## Implementation

The existing productive implementations of `Newsticker`, `RealtimeAiNewsfeed` and the tightly coupled `VerifiedNewsFeed` move into `src/features/news/ui/`. Existing paths under `src/components/` become deprecated compatibility re-exports only. The feature barrel exports the canonical implementations.

No News REST, authenticated transport, entitlement, provider, DATA, FINTECH, scoring or evidence semantics are changed. No synthetic news or financial values are introduced.

## Validation

Focused regression tests are rebound to the canonical implementation paths:
- `tests/unit/newsfeedAuthenticatedTransport.test.ts`
- `tests/unit/newsEvidenceBoundary.test.ts`

Hosted CI / container / governance checks: NOT RUN pre-PR by policy.
Local execution: NOT RUN — connector execution surface does not expose a repository checkout/runtime.

## Exit gate

- one productive implementation per migrated component;
- legacy paths contain compatibility exports only;
- authenticated News transport and server-side entitlement/evidence contracts remain unchanged;
- current-main/open-writer correlation PASS before Draft PR;
- hosted checks evaluated post-PR; NOT RUN is never PASS.
