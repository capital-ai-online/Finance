# CAPITAL-AI-DATA — Repository & Runtime Baseline

**Observed baseline:** `main@2a6dfc5246672decd14cd8d0ace8dc2c4db94455`  
**Observed open PRs at DATA-12 start:** `#813 CAPITAL-AI-DOC WP-DOC-07 Closeout und GOV-DOC-006 Validator`  
**Active DATA branch:** `agent/data-12-provenance-20260907`

## Coordination baseline

Current main is the Human merge of PR #812 (DATA-11 gate) after #811 (S1-R2-11), #810 (FINTECH) and #804 (CLIENT). Open PR #813 is Documentary-only and has no overlap with `src/platform/MarketData/**` or `docs/projects/data/**`.

## Runtime inventory additions

| Concern | Current implementation | Baseline assessment |
|---|---|---|
| Provenance lineage | `dataProvenanceLineage.ts` | Required identity/evidence/timestamp/correlation envelope; handoff mutation fails closed |
| DATA exit gate | `dataQualityGate.ts` | Merged via PR #812 |
| Evidence identity freshness | `evidenceIdentityFreshness.ts` | Merged via PR #811; Security verification still independent |
