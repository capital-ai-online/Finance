# Vocabulary Final Release Evidence — 2026-08-24

**Status:** PR #531 RESYNCED AND HUMAN-MERGE GATED; GOPLUS CREDENTIAL ACTIVE; WIKI POST-MERGE GATED  
**Verified-main baseline at resync (2026-08-25):** `a0a1caf9f5da703f48fb1dc65244009d2ed79cf2`  
**Branch:** `agent/vocabulary-final-vw7-wiki-goplus-2026-08-24`  
**Pull request:** #531

## Repository closure

- PR #524 and PR #525 are merged and their Work Claims are released with merge evidence.
- Work Claim lifecycle governance from PR #526 and the merged delivery chain through PR #530 are contained in the verified main baseline.
- PR #531 contains that baseline through merge commit `a1556d6eaaa16dffb9c1918c61ce8b6555341bc0`; the resulting comparison was `33 ahead / 0 behind` before this evidence refresh.
- The 13-file net scope has no direct file overlap with the currently open PR #532.
- The five governed VW-7 `MarketScreener` candidates resolve through stable browser-safe Message Catalog keys; the migration state remains `5 MIGRATED / 0 OPEN / 0 DRIFT`.
- Vocabulary remains the canonical, dependency-free wording control plane; no second registry, scoring authority, execution authority, persistence authority or event authority was introduced.
- Hosted exact-head checks and the atomically rendered production baseline remain authoritative in PR #531; historical workflow run IDs are deliberately not frozen in this repository evidence.

## GoPlus production activation

| Evidence | Result |
|---|---|
| Render workspace | `AICapital` |
| Render service | `Finance` (`srv-d91o1o9o3t8c73edi55g`) |
| Credential | `GOPLUS_API_KEY` entered by the owner; value not read, copied or stored in Git |
| Latest observed deploy | `dep-da6e5vgn74is73eqn04g` |
| Deployed commit | `a0a1caf9f5da703f48fb1dc65244009d2ed79cf2` |
| Deploy state | `live` |
| Production → verified main drift | `0` commits; production and verified main are identical |
| Auto-deploy | `off`; no second deployment authority introduced |
| GoPlus log correlation | No observed `GOPLUS`, `GoPlus` or `NOT_CONFIGURED` error in the inspected logs |
| Provider authority | Research/evidence only; no route construction, signing, broadcasting or live-execution permission |
| Functional invocation | Not claimed: the production route has not invoked the provider during this verification |
| Operations / rollback | `docs/runbooks/GOPLUS_PRODUCTION_CREDENTIAL_ACTIVATION_2026-08-24.md` |

Telemetry on the preceding deploy `dep-da6dick9v7es73cdejn0` contained four intermittent HTTP 503 completions between 00:07Z and 00:09Z with router-local paths `/` and `/sources`, followed by successful requests. Code/timing correlation points to the news-evidence router's explicit fail-closed `NO_DATA` response after the shared 8-second provider bound; this is an inference, not a captured upstream trace. The events had no GoPlus marker, do not correlate with the 13-file PR #531 scope and are therefore not attributed to Vocabulary or `GOPLUS_API_KEY`.

The original P1-A threat model points to the dedicated post-merge credential activation and rollback runbook; repository rollback and secret rotation remain deliberately separate.

## Wiki publication gate

The repository Wiki is initialized. Publication is intentionally not claimed before merge: the generated projection is exact-commit-bound and must be rendered and pushed only after PR #531 is human-merged, from the resulting main commit. The Wiki remains a generated, non-authoritative projection.

## Remaining controlled sequence

1. Keep PR #531's production baseline and hosted checks bound to its exact current head.
2. Human/CODEOWNER merge.
3. Render and publish the deterministic Wiki projection from the resulting exact main commit.
4. Record the Wiki commit and canonical URL as post-merge evidence.
