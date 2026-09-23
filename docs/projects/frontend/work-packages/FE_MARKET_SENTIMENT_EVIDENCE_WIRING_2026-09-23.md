# FE Market Sentiment Evidence Wiring — 2026-09-23

## Authority and routing

- Trust root: `/AGENTS.md@CURRENT_MAIN`
- execution baseline: `main@84137c8d24507523c59cf22d6b888a24329a56e5`
- implementation owner: `CAPITAL-AI-FE` for presentation-only browser wiring
- upstream financial/data authority: `CAPITAL-AI-FINTECH / PVC-09..14`
- existing productive news entitlement: `subscription-entitlements/1.0.0`
- existing crypto sentiment research contract: `crypto-sentiment-research/0.1.0`

The Human/Owner direction on 2026-09-23 requests that Market Sentiment on the website be filled first from existing data sources and existing sentiment scoring contracts. This package does not create a second scoring engine, provider gateway, entitlement path, or financial truth source.

## Resolved current-main state

The new `MarketSentimentPresentation` already rejects local design scores, generated history and neutral fallback values, but it receives no FINTECH projection from the landing composition.

Current data/scoring reality is narrower than the visual surface:

- `/api/news` is the existing governed article-metadata boundary and aggregates Free Crypto News plus GDELT behind the existing server-side newsfeed entitlement;
- article `sentiment` is explicitly a deterministic headline heuristic and presentation metadata only;
- `crypto-sentiment-research/0.1.0` exists as a FINTECH research evaluator, but current provider evidence does not supply the complete governed input vector required for a numeric result;
- therefore converting headline labels into a 0..100 score, filling missing research inputs with defaults, or restoring the historical `50 / Neutral` behavior would be false financial evidence.

## Implemented slice

`MarketSentimentPresentation` now consumes the already-governed `/api/news` transport through `fetchAuthenticatedNews` and projects:

- verified article evidence references;
- provider/source identity;
- published timestamps;
- asset-class categorization already supplied by the server;
- up to five current evidence drivers per visual category;
- the existing heuristic positive/negative/neutral direction strictly as presentation metadata.

The numerical gauge remains fail-closed with `score=null` and `NOT_COMPUTABLE` until an attested FINTECH projection is supplied. An explicitly supplied `projections` prop has precedence over the evidence-only browser projection, so a future FINTECH-owned scoring result replaces the temporary evidence-only view without a second scoring path.

## Visibility / entitlement behavior

Fresh Human/Owner direction on 2026-09-23 disables subscription-tier visibility gating. This FE slice still does not mutate the entitlement middleware itself; owner-correct runtime implementation is carried by `OPS-PUBLIC-VISIBILITY-MODE-20260923` / PR #1324.

After that dependency is merged, the same canonical `/api/news` GET path is read-only visible independent of subscription tier. Market Sentiment therefore receives real evidence for public visibility without creating a second data path. Protected execution remains outside this package.

## Explicit non-goals

- no local or browser-side sentiment score calculation;
- no reuse of archived Design/Frontend fixture scores;
- no heuristic-news-to-FINTECH-score conversion;
- no generated 30-day history;
- no ProviderMatrix/provider mutation;
- no change to `server/routes/marketSentimentRoutes.ts`, which remains outside this slice;
- no change to canonical score, ranking, execution or investment-decision authority.

## Merge dependency

- PR #1324 / `OPS-PUBLIC-VISIBILITY-MODE-20260923` must land before #1323 is treated as fulfilling the "visible for all" product state.
- #1323 remains independently buildable and fail-closed if the dependency has not landed.

## Remaining FINTECH handoff

For a numeric crypto sentiment score to become `READY`, FINTECH must provide governed, evidence-backed values for the current research contract, including polarity, intensity, novelty, credibility, bot probability, source weight, mention intensity and regime adjustment, while preserving evidence references and recency. Existing news metadata alone does not attest those fields.

Other asset classes additionally require an owner-approved, versioned FINTECH sentiment model/contract before this common visual may display a numeric category score.

## Exit evidence

- Market Sentiment reads only the existing authenticated news transport.
- Evidence/source/timestamp/driver metadata can render without local financial scoring.
- Numeric score remains null when the FINTECH input contract is incomplete.
- No neutral/default score or generated history is introduced.
- Upstream-provided FINTECH projections override evidence-only browser projections.
- Public read-only News/Evidence visibility is supplied by the owner-correct OPS dependency; no second FE transport is created.
- Unit regression protects these boundaries.
