# FIN-SENT-02 — Existing Evidence Sentiment Attestations — 2026-09-24

## Routing

- Trust root: `/AGENTS.md@CURRENT_MAIN`
- Baseline at slice start: `main@31625df9bf114e689ec359fc5e8aecafc5a7026d`
- Project: `CAPITAL-AI-FINTECH`
- Owner/PVC: `CAPITAL-AI-FINTECH / PVC-09..14`
- Upstream contract: `sentiment-feature-contract/1.0.0`
- Projection: `market-sentiment-projection/1.0.0`
- Research evaluator: `crypto-sentiment-research/0.1.0`

## Goal

Close only those missing Sentiment feature attestations that can be reproduced from already governed current evidence paths. Missing provider facts remain explicit and must not be replaced with heuristics, provider routing priority, simulations or neutral defaults.

## Evidence correlation

Current runtime evidence supports:

- GDELT and Free Crypto News / cryptocurrency.cv article metadata with stable evidence references and publication timestamps;
- an existing fixed server-side news evidence window;
- current verified market evidence separately through the canonical MarketData / VerifiedAssetDisplay path.

Current runtime evidence does **not** establish:

- a governed NLP polarity/intensity provider;
- a publisher/source credibility or source-trust score;
- a governed social bot-probability provider;
- a complete governed sentiment-to-market-regime compatibility result.

ProviderMatrix role/priority is routing metadata, not source credibility. The theoretical market-sentiment shock route is simulation only. Existing `MarketRegime` and verified market facts are not silently converted into `regimeAdjustment` without a dedicated governed compatibility mapping.

## Implemented attestations

### Novelty

Method: `news-exact-headline-novelty/1.0.0`

- input: verified article evidence inside the 24h window;
- normalized headline: Unicode NFKC, lowercase, URL/punctuation removal and whitespace collapse;
- value: `1 / exact-normalized-headline-cluster-size`;
- evidence refs: every evidence observation in that exact cluster;
- semantic boundary: exact duplicate uniqueness only; no semantic-NLP novelty claim.

### Mention Intensity

Method: `news-evidence-count-24h/1.0.0`

- input: unique verified article evidence references inside the fixed 24h window;
- normalization: `min(1, uniqueEvidenceCount / 20)`;
- the saturation count is explicit and versioned;
- evidence refs: the complete observed 24h evidence set;
- the browser `?limit=` parameter is not a feature/scoring input.

## Still unavailable

The following required fields remain unattested and therefore keep the projection fail-closed:

- `polarity`;
- `intensity`;
- `credibility`;
- `botProbability`;
- `sourceWeight`;
- `regimeAdjustment`.

The route continues to emit `scoreCandidate=false`. A numeric Market Sentiment score is therefore still forbidden.

## Protected boundaries

- no headline heuristic promotion;
- no FinBERT claim without a real integrated provider;
- no ProviderMatrix priority → credibility/sourceWeight conversion;
- no market-price-change → regimeAdjustment shortcut;
- no AI shock-simulation result as financial evidence;
- no new provider gateway;
- no second scoring engine/dispatcher;
- no CanonicalScoreResult/ranking/execution mutation;
- no default or neutral score.

## Exit evidence

- predecessor FIN-SENT-01 coordination claim released;
- deterministic feature adapter is pure and network-free;
- stale/future/invalid/ref-less evidence produces no derived attestation;
- route evaluates a fixed server-side evidence set independent of presentation limit;
- only novelty and mentionIntensity receive evidence-backed attestations;
- scoreCandidate remains false while the six required feature gaps remain;
- focused unit/static boundary tests PASS;
- repository exact-head required checks PASS;
- Human/CODEOWNER merge.
