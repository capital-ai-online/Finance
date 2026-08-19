# SC-2 A1/A2 Consolidation Baseline — 2026-08-19

**SPT:** SC-MD-SPT-0001  
**Branch:** `agent/a1-a2-scoring-consolidation`  
**Base commit:** `345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`  
**Scope:** A1 Architecture Freeze / Parallel-Path Inventory + A2 UAI / Model Registry foundation

## 1. Verified baseline

The current repository already has strong fail-closed primitives, but they are not yet the sole architecture:

- `scoringIntegrity.ts` requires provider identity/evidence by default and returns unavailable/null score states when the gate is not ready.
- `verifiedCryptoTechnicalScoring.ts` accepts only verified history/snapshot providers and emits `CanonicalScoreResult`; simulated/bootstrap observations are not score evidence.
- `traditionalAssetScoring.ts` rejects simulated history and uses verified fallbacks, but returns its own `TraditionalAssetScoringResult` contract.
- commodity and sovereign benchmark evidence scoring are implemented inside registry routing and therefore mix transport/orchestration with model execution.
- `cryptoOrchestrator.ts` can still combine agent-derived or caller-adjusted factors with the older Base/DeFi score path. That is a parallel scoring semantic and must not survive the consolidation exit.

## 2. Entry-point inventory and disposition

| Entry / engine | Evidence state | Result / selection state | A1 disposition |
|---|---|---|---|
| `POST /api/crypto/score` | verified providers only | CanonicalScoreResult | CANONICAL — migrate selection into registry |
| `GET /api/crypto/list` | verified providers only | canonical + ranking | CANONICAL — same dispatcher as score |
| `GET /api/crypto/top10` | verified providers only | canonical + ranking | CANONICAL — same dispatcher as score |
| `POST /api/crypto/analyze` | mixed market + AI/user factors | Base/DeFi selection in orchestrator | RESEARCH/MIGRATION REQUIRED — no alternative canonical finance score |
| `scoring.service.ts` | live history only for generated market seed, but accepts finite supplied factors | Base/DeFi | LEGACY EXECUTOR — no direct public selection after cutover |
| `cryptoScoringService.ts` | deterministic math; evidence responsibility upstream | 9-factor crypto result | KEEP AS EXECUTOR behind verified adapter |
| Meme score service/direct route | separate contract | direct | MIGRATION REQUIRED |
| Raw Materials orchestrator | AI agent factors + deterministic math | own pipeline | MIGRATION REQUIRED; research must be separated from verified evidence scoring |
| `TraditionalAssetScoringService` | verified history/fundamentals | own result contract | CANONICAL INPUTS, RESULT ADAPTER REQUIRED |
| Commodity evidence scoring | verified TwelveData evidence | route-local result | CANONICAL INPUTS, EXECUTOR EXTRACTION + RESULT ADAPTER REQUIRED |
| Sovereign benchmark yield scoring | exact/verified EODHD mapping | route-local result | CANONICAL for approved benchmark yields only |
| Individual/general bond scoring | mandatory evidence incomplete | intentionally unavailable | BLOCKED by ADR-0022 |

## 3. Architecture freeze

From this branch onward, no new scoring capability may introduce:

1. a new asset identity schema outside UAI;
2. model selection outside ScoringModelRegistry;
3. an externally visible numeric score without the canonical evidence/data-quality gate;
4. a new result contract for public scores instead of adapting to CanonicalScoreResult;
5. LLM/agent output as substitute for authoritative market/fundamental/on-chain evidence;
6. fallback from a missing canonical model to a legacy/challenger model.

## 4. Initial model-registry map

| Registry key | Alias | Assets | Evidence | Adapter debt |
|---|---|---|---|---|
| `crypto-technical-provenance@0.6.3` | champion | crypto | verified-required | none for result contract |
| `traditional-scoring@2.1.0` | champion | stock/forex/index | verified-required | CanonicalScoreResult adapter |
| `commodity-evidence-scoring@1.0.0` | champion | commodity | verified-required | extraction + canonical adapter |
| `sovereign-benchmark-yield-scoring@1.0.0` | champion | government benchmark yields | verified-required | extraction + canonical adapter |

The registry is metadata/routing only. It does not calculate scores and therefore does not become a new parallel scoring engine.

## 5. State-of-the-art / enterprise alignment

The chosen direction matches current enterprise model-governance patterns:

- a central model registry with immutable versions, deployment aliases and metadata/lineage;
- promotion/selection controlled independently from individual callers;
- explicit model-risk lifecycle and outcome validation rather than hidden fallbacks;
- evidence/provenance separated from catalog identity;
- fail-closed behavior on unsupported or ambiguous routing.

For CAPITAL-AI this is applied to both ML/AI-assisted components and deterministic financial scoring models. SC-8 remains responsible for walk-forward/outcome/drift evidence.

## 6. Gemini boundary

ADR-0072 remains in force. A future Gemini evaluation may target Research/Evidence Discovery, structured extraction or source discovery, but must be introduced through a new ADR and the same acquisition/evidence architecture. Restoring a key alone must never restore the retired Gemini scoring/agent architecture.

## 7. Validation planned on this branch

- UAI normalization/identity tests;
- model registry deterministic resolution tests;
- ambiguity and unsupported-instrument fail-closed tests;
- first real consumer wiring through `/api/crypto/score` without changing score math;
- full repository type/test CI through the PR workflow when the work package reaches PR state;
- final branch-vs-main compare before PR creation/review.
