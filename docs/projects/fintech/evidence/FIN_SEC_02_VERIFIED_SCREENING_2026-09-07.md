# FIN-SEC-02 — Verified-screening entitlement wiring

**Project:** `CAPITAL-AI-FINTECH`  
**PVC:** `PVC-16`  
**Finding source:** `S1-R2-06` / `OPS-02-SEC-06` inventory child  
**Authority:** ADR-0034, `subscription-entitlements/1.0.0`, `enforceScreeningQuota()`  
**FINTECH status:** `IMPLEMENTED / EVIDENCE_READY`  
**Security status:** `VERIFICATION REQUESTED` — not `VERIFIED`, not `CLOSED`  
**main SHA at branch start:** `8618326db4d4a5af0fbecd65b83805ea7608109f`  
**Branch:** `agent/fintech-fin-sec-02-verified-screening-20260907`

## Scope implemented

Shared gate `server/middleware/verifiedScreeningEntitlement.ts` reuses the existing screening quota authority. No second scoring or entitlement engine was added.

Gated productive paths:

- `GET /api/registry/assets/verified-scores`
- `GET /api/registry/assets/:symbol/verified-context`
- `GET /api/registry/assets/:symbol/verified-score`
- `GET /api/raw-materials/verified-score/:symbol`
- `GET /api/crypto/list`
- `POST /api/crypto/score`
- `GET /api/crypto/top10`

Already gated before this work:

- `GET|POST /api/crypto-scoring/:symbol` via inline `enforceScreeningQuota()`

Not gated (intentionally outside verified-screening productive score authority):

- registry catalog / quote / macro
- commodity legacy `/analyze` and structural `/score`
- crypto `/analyze` research/enrichment
- chart simulation `/api/charts-scoring`

## Executed tests

- `tests/unit/verifiedScreeningEntitlement.test.ts` — ALLOW paid/within-quota; DENY quota-limit, authentication-required, feature-not-entitled; fail-closed on authority outage; browser `x-subscription-tier` is not a grant.
- `tests/unit/verifiedScreeningRouteWiring.test.ts` — route attachment / non-attachment and reuse of the accepted gate.

## Residual risks

- Market-data composition-root enrichment (`enrichAssetWithCanonicalScore`) remains a presentation/composition path, not a registry verified-score route. Independent Security verification should confirm whether any public market-data response is treated as a productive verified-score alternate route.
- Guest/Free IP-window ALLOW remains the accepted ADR-0034 screening contract; missing identity is not a universal DENY for `verified_screening`.
- `FIN-SEC-03` (Backtest / Monte Carlo / `full_ai_analysis`) is unchanged.

## Verification request

`CAPITAL-AI-SEC` is requested to independently verify the `verified_screening` boundary for S1-R2-06. FINTECH does not self-close the finding.
