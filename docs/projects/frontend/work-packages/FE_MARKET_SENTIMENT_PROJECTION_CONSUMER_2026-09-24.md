# FE-SENT-02 — Market Sentiment FINTECH Projection Consumer — 2026-09-24

## Routing

- Trust root: `/AGENTS.md@CURRENT_MAIN`
- Baseline: `main@6be29d46879ad413084a5e3027ac3adc77ce6f9b`
- Project: `CAPITAL-AI-FE`
- Relationship: cross-cutting presentation consumer; no productive PVC ownership
- Upstream owner: `CAPITAL-AI-FINTECH / PVC-09..14`
- Dependency: Human-merged PR #1332 (`market-sentiment-projection/1.0.0`)

## Goal

Bind the merged read-only FINTECH endpoint `GET /api/news/sentiment-projection` to the existing Market Sentiment `projections` consumption path without calculating or repairing financial truth in the browser.

## Implementation

The Market Sentiment presentation now performs two independent reads:

1. `/api/news?limit=20` remains the evidence-only fallback for all categories.
2. `/api/news/sentiment-projection?limit=20` is accepted only when it matches:
   - `market-sentiment-projection/1.0.0`;
   - `sentiment-feature-contract/1.0.0`;
   - category `KRYPTO`;
   - authority `RESEARCH_CONTEXT_ONLY`;
   - `scoreEligible=false`;
   - `executionEligible=false`;
   - a valid status/score relationship.

The effective projection precedence is:

`evidence fallback < FINTECH endpoint projection < explicit projections prop`.

A `READY` numeric score is displayed only when the FINTECH endpoint itself returns a finite numeric score. `NOT_COMPUTABLE` and `SOURCE_UNAVAILABLE` must carry `score=null`; malformed payloads are rejected and fall back to the existing evidence-only presentation.

## Protected boundaries

- no browser/local sentiment calculation;
- no headline heuristic promotion;
- no default or neutral score;
- no frontend completion of missing FINTECH features;
- no mutation of ScoringDispatcher, CanonicalScoreResult, ranking or execution authority;
- no frontend promotion of `scoreEligible` or `executionEligible`.

## Coordination

Open FE PR #1348 changes only `Header.tsx`, its claim metadata and a version projection test. It has no changed-file overlap with this slice.

The stale FE predecessor claim from Human-merged PR #1323 is released in this slice before reusing the same presentation path.

The FINTECH claim from Human-merged PR #1332 remains foreign-owner stale coordination evidence and is not mutated by this FE package. It should be released by the next FINTECH owner-correct slice.

## Exit evidence

- exact endpoint path is consumed;
- contract/version/authority guards are enforced before mapping to the UI projection interface;
- current evidence fallback remains available;
- explicit upstream `projections` prop retains highest precedence;
- malformed or non-attested projection payloads cannot create a numeric score;
- focused regression test protects the endpoint binding and no-local-scoring boundary;
- required exact-head repository checks PASS;
- Human/CODEOWNER merge.
