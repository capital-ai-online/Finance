# FE Owner-Upload Design Refresh — 2026-09-23

**Project:** `CAPITAL-AI-FE`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Fresh execution baseline:** `main@e3f4ce2b5aaaefd62ec562860e0dc3cafa1c38b2`  
**Branch:** `frontend/owner-upload-design-refresh-20260923`  
**Owner source:** uploaded `FRONTEND-main (1).zip`  
**Archive SHA-256:** `a016e7874436ff17c16621269153923aae11fe1b4009e8a72d002d8af87fbca1`  
**Status:** IMPLEMENTED ON BRANCH / HUMAN MERGE REQUIRED

## Owner direction

Adopt the new graphical FRONTEND generation while applying these explicit constraints:

1. remove the visible `Universe` tab from the public landing navigation;
2. do not promote any source-provided scoring values, ratings, Fear-&-Greed fixtures, synthetic 30-day history or local scoring semantics;
3. productive scoring/data authority remains `CAPITAL-AI-FINTECH / PVC-09..17`;
4. keep the Altcoin Pattern Trooper out of this landing slice and integrate it later into the leading graphic through its existing owner-correct FINTECH read contract.

## Before

- the public Header exposed a direct `/universe` navigation item;
- MarketOverview rendered `asset.aiScore` from the presentation fixture;
- the selected FRONTEND source archive contains a new MarketSentiment visual with hard-coded category scores, generated history and driver text;
- the existing Altcoin Pattern Trooper is already available behind the separate Universe surface through a read-only FINTECH projection.

## Implemented delta

### Graphical adoption

- added a Finance presentation adapter for recognizable asset logos;
- MarketOverview, AllMarkets, AssetDetail and Subclass surfaces use the new logo treatment;
- added the new Fear & Greed / Market Sentiment graphical architecture between KeyPillars and MarketOverview;
- retained the uploaded gauge, sector-switch, history-panel and driver-panel visual concepts.

### Authority boundary

The Sentiment presentation starts fail-closed as `NOT_COMPUTABLE`. It accepts a future `MarketSentimentProjection`, but the landing currently supplies no score payload.

Explicitly not promoted from the archive:

- category score seed values;
- local `getSentimentLevelFromScore` / rating semantics;
- generated 30-day history;
- yesterday/week/month score anchors;
- source driver scores and narrative claims;
- PriceAlert-to-sentiment score coupling;
- any new local Scoring/Decision authority.

The target consumer contract is documented as `crypto-sentiment-research/0.1.0`. A future FINTECH slice may provide attested values and evidence; FE only renders them.

### Universe / Altcoin Pattern Trooper

Only the **visible landing navigation tab** is removed in this slice. The existing `/universe` boundary is preserved so historical/current read-only integration evidence is not destroyed as a side effect.

The Altcoin Pattern Trooper is deliberately **not** moved into the landing now. The deferred target is the owner-designated leading graphic. Its current FINTECH read-only boundary remains unchanged until that separate owner-directed integration is executed.

## Exit gate

- no `/universe` link or `data-public-navigation="universe"` in the public Header;
- no `asset.aiScore` or `asset.aiRating` consumption in MarketOverview or AssetDetail; AssetDetail exposes only the FINTECH scoring-authority boundary;
- new Sentiment UI present with `data-local-scoring="disabled"`;
- no hard-coded sentiment category score table or synthetic history generator in the promoted runtime adapter;
- no CryptoPatternTrooper import in the landing composition;
- source overlay provenance recorded by archive SHA-256;
- focused tests + TypeScript/build + normal Required Checks must pass on the exact PR head.

Human/CODEOWNER merge remains the final repository gate.
