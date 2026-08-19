# SC-2 Crypto List + Top10 Registry Consumer Evidence — 2026-08-19

**SPT:** `SC-MD-SPT-0001`  
**Work Package:** `SC-2`  
**Phase:** B — crypto consumer migration  
**Branch:** `agent/sc2-crypto-list-top10-registry-consumers`  
**Baseline:** `main@5976e4d2eb1c0d11303322b027b8be42e261583a`  
**Authority:** ADR-0087 + SC-MD-SPT-0001  
**Status:** IMPLEMENTED — PR/CI PENDING

## 1. Purpose

This increment migrates the remaining productive Crypto ranking consumers `GET /api/crypto/list` and `GET /api/crypto/top10` onto the same UAI + `ScoringModelRegistry` authority already landed for `POST /api/crypto/score` in PR #421.

The change deliberately stops before SC-2 Phase C: the existing verified technical scorer remains the domain executor and no parallel dispatcher is introduced.

## 2. Before

After PR #421, `/api/crypto/score` already resolved a UAI identity and canonical champion before executing `evaluateVerifiedCryptoTechnicalScore()`. `/api/crypto/list` and `/api/crypto/top10` still called the verified scorer directly.

Consequences of that remaining gap:

- two productive Crypto consumers could execute without registry authorization;
- their scoring lineage used the bare asset symbol instead of the UAI `crypto:<SYMBOL>` identity;
- their responses did not expose the selected registry model metadata;
- a future registry change could affect `/score` while `/list` and `/top10` silently continued the old route-local execution path.

## 3. Implemented controls

### 3.1 Registry-backed UAI identity

For assets originating from `assetRegistry`, both routes call `resolveCryptoScoreExecution()` with `source: 'registry'`, preserving identity provenance while normalizing to the same stable UAI `crypto:<SYMBOL>` identifier.

### 3.2 Registry authorization before executor invocation

For every asset, resolution occurs before `evaluateVerifiedCryptoTechnicalScore()`.

Execution is allowed only for the canonical champion when:

- `executorKey` equals `verifiedCryptoTechnicalScoring.evaluateVerifiedCryptoTechnicalScore`;
- evidence policy is `verified-required`;
- result contract is `scoring-integrity/1.0.0`;
- no canonical-result adapter is still required.

No challenger/legacy fallback is added.

### 3.3 Fail-closed list behavior

If registry resolution fails, `/api/crypto/list` returns the asset as `SCORE_NOT_COMPUTABLE` without invoking the scoring executor or any market-data scoring acquisition. The failure stays inside a complete `CanonicalScoreResult` envelope with UAI `assetId`, zero coverage, no fabricated providers/evidence and the registry-resolution reason.

### 3.4 Fail-closed Top10 behavior

If registry resolution fails, `/api/crypto/top10` excludes the affected asset before scoring. It cannot become ranking-eligible through a fallback path.

### 3.5 Model lineage

Successful `/list` and `/top10` results now carry:

- UAI `assetId`;
- `modelRegistry` metadata;
- lineage model ID/version/alias/lifecycle;
- executor key;
- feature/result contract versions;
- evidence policy.

## 4. Preserved invariants

- score weights and deterministic Crypto score mathematics unchanged;
- ranking formula and Top10 eligibility thresholds unchanged;
- verified history/snapshot acquisition unchanged;
- Data Quality and evidence gates unchanged;
- no `scoreImpact` or `rankingImpact` activation;
- no MarketData provider-routing or `executionPriceEligible` change;
- no Gemini traffic or ResearchEvidence promotion;
- Gemini Shadow remains disabled;
- no Render, Supabase or Stripe mutation;
- no Phase-C dispatcher in this increment.

## 5. Negative-test intent

Tests cover:

1. registry-origin assets preserve `source='registry'` and stable UAI `crypto:<SYMBOL>` identity;
2. incompatible executor binding yields a canonical `SCORE_NOT_COMPUTABLE` result;
3. `/list` resolves the registry before invoking verified scoring and exposes UAI/model metadata;
4. `/top10` resolves the registry before invoking verified scoring and excludes unresolved assets;
5. existing `/score` tests remain intact, providing regression coverage for the first consumer.

Full repository TypeScript/unit/build validation is deferred to GitHub CI until after PR creation under the repository cost policy.

## 6. Main/open-PR correlation before implementation

Baseline was frozen at `main@5976e4d2eb1c0d11303322b027b8be42e261583a`, the Human merge commit of PR #421.

Open PR review at branch start:

- PR #423 changes only `docs/evidence/m10/M10_SHADOW_ASSURANCE_PROBE_2_2026-08-19.md` — no overlap.
- PR #414 changes privacy/legal/runtime files but none of the SC-2 route, scoring, roadmap or document-registry paths claimed here — no overlap.

A second branch-vs-main correlation is required immediately before PR readiness/merge, per repository governance.

## 7. Enterprise / FinTech benchmark — verified 2026-08-19

The April 17, 2026 Federal Reserve/OCC/FDIC Revised Guidance on Model Risk Management is used as the current enterprise model-risk benchmark. It emphasizes intended model use, model inventory, documentation, governance/controls, validation and ongoing monitoring. The guidance states that its model-risk principles apply to traditional statistical/quantitative and non-generative/non-agentic AI models; therefore the architectural pattern is directly useful for a deterministic scoring estate even though no claim of supervisory applicability to CAPITAL-AI is made.

This increment advances those principles by making all three productive Crypto scoring/ranking consumers depend on the same versioned model authority and execution lineage rather than route-local model choice.

NIST AI RMF 1.0 remains a voluntary supplementary benchmark for lifecycle governance, inventory and traceability. NIST currently states that AI RMF 1.0 is under revision; no later final framework version is assumed.

## 8. Exit to Phase C

After Human merge of this increment and final main correlation, all three productive Crypto score consumers (`/score`, `/list`, `/top10`) will share UAI + registry authorization. The next SC-2 step is then Phase C: introduce one canonical scoring dispatcher as the only productive model-execution entry and remove direct route imports of domain scoring engines without changing scoring mathematics.
