# FE AI Newsfeed — authenticated REST transport restoration

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Primary productive PVC:** `N/A` — Frontend is a presentation/interaction consumer  
**Primary Owner:** `CAPITAL-AI-FE`  
**Upstream DATA owner:** `CAPITAL-AI-DATA / PVC-09..11`  
**Branch:** `agent/frontend-newsfeed-auth-20260916`  
**Start baseline:** `main@bea9373811202aef98f3ad8ffd53dba99d37c453`  
**State:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING`

## Finding

The productive server already mounts the canonical news router as:

```text
/api/news -> realtimeAiNewsfeedEntitlement -> newsRouter
```

`realtimeAiNewsfeedEntitlement` resolves identity through `resolveVerifiedIdentity`, and that resolver accepts only a strict RFC6750 `Authorization: Bearer <Supabase access_token>` credential. This is the intended server-side entitlement boundary and remains unchanged.

The active Frontend consumers were inconsistent with that boundary:

- `VerifiedNewsFeed` requested `/api/news?...` with plain `fetch`;
- `RealtimeAiNewsfeed` requested `/api/news/assets` and `/api/news/sources` with plain `fetch`.

A valid browser Supabase session therefore did not automatically satisfy the protected REST contract. The result could be `401 authentication-required` before the already-wired provider adapters were reached.

## Bounded remediation

A single FE transport helper now:

1. obtains the current Supabase browser session through the existing `supabaseClient`;
2. fails explicitly when Supabase/session lookup is unavailable;
3. attaches the session access token as `Authorization: Bearer ...`;
4. accepts only same-origin paths under `/api/news`, preventing accidental token forwarding to arbitrary URLs;
5. preserves caller `AbortSignal` and other request options.

The article feed and both filter-metadata endpoints consume this helper. No entitlement, IAM, provider, DATA, scoring, ranking, billing or subscription rule changes.

## REST provider coverage

Current-main DATA already contains the complete currently authorized productive Newsfeed REST set:

- `free-crypto-news` -> `cryptocurrency.cv` public/keyless REST article metadata;
- `gdelt` -> GDELT DOC 2.0 keyless article discovery/provenance.

Both are aggregated in `src/features/news/newsRoutes.ts` behind one evidence boundary. `/api/news`, `/api/news/sources` and `/api/news/assets` are already implemented.

`NewsAPI.org` is deliberately **not** restored: the active SC4 evidence policy superseded and removed it. A removed/retired provider, stray environment variable or historical integration is not interpreted as an API that should be reactivated. No paid provider, credential, new entitlement or external mutation is introduced by this slice.

## Supabase correlation

Owner-supplied production dashboard evidence shows:

- Site URL: `https://capital-ai.online`;
- redirect allow-list:
  - `https://capital-ai.online`;
  - `https://capital-ai.online/login?password-recovery=1`;
  - `https://capital-ai.online/login`;
- Google provider configured;
- `Skip nonce checks`: OFF;
- `Allow users without an email`: OFF;
- anonymous sign-ins: OFF;
- email confirmation: ON;
- project callback supplied by Supabase: `https://ryzywoktpmyhwzxmstyu.supabase.co/auth/v1/callback`.

These URLs match current repository behavior: Google OAuth and email confirmation redirect to origin `/`, while password recovery redirects to `/login?password-recovery=1`. No Supabase configuration mutation is required by this repository slice.

The Google Cloud OAuth client itself remains an external provider-side verification surface: it should contain production origin `https://capital-ai.online` as an authorized JavaScript origin and the exact Supabase callback URL as an authorized redirect URI. This branch does not claim that Google-side state as independently verified and performs no Google/Supabase mutation.

## Parallel-writer boundary

Open FE Draft PR #1013 owns 16.08 appearance/Universe presentation surfaces including LandingPage, DashboardNavigation, PublicAnalysisWorkbench and LearningVocabulary. This branch does not modify any of those files. The Newsfeed change is a separate functional transport slice and does not assume or overwrite #1013.

Open FINTECH Draft PR #1012 is likewise not a dependency and no FINTECH file is changed.

## Regression guard

`tests/unit/newsfeedAuthenticatedTransport.test.ts` checks that:

- Supabase session bearer acquisition is present;
- token forwarding is constrained to `/api/news`;
- articles/assets/sources use the authenticated transport;
- the server entitlement/identity gate remains mounted;
- `free-crypto-news` and `gdelt` remain the active authorized REST providers;
- retired `newsapi` is not reintroduced.

## Validation truth

- focused Vitest: `NOT RUN` pre-PR — no dependency-complete repository runner is exposed by the GitHub connector in this chat;
- TypeScript: `NOT RUN` pre-PR;
- full Frontend test suite: `NOT RUN` pre-PR;
- browser/mobile authenticated Newsfeed readback: `NOT RUN` pre-PR;
- hosted CI: deferred until after Draft PR creation under the repository cost/lifecycle policy.

`NOT RUN` is not `PASS`.

## Exit gate

This bounded slice is ready for final current-main/open-writer correlation when:

- all protected Newsfeed REST calls carry the same verified Supabase session token expected by the server;
- no backend entitlement/security boundary is weakened;
- all currently authorized news REST providers remain connected behind the existing evidence boundary;
- no retired/paid provider is silently reactivated;
- no files from the active GOV/FE design package are overwritten.
