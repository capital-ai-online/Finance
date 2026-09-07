# CAPITAL-AI-DATA — Repository & Runtime Baseline

**Observed baseline:** `main@a6a62e867749efe80fc05aa175a3dc3fdd183d82`  
**Observed open PRs at DATA-11 start:** `#804 CAPITAL-AI-CLIENT GOV-08 Admin Process Graph`, `#810 CAPITAL-AI-FINTECH FIN-SEC-02 verified_screening Gate`  
**Active DATA branch:** `agent/data-11-dq-gate-20260907`

## Coordination baseline

Current main is the merge of PR #811 (S1-R2-11). Open PRs #804 and #810 have no changed-file overlap with `docs/projects/data/**`, `src/platform/MarketData/dataQualityGate.ts` or `ValidatedDataInput.ts`.

S1-R2-11 remains `EVIDENCE_READY` pending independent `CAPITAL-AI-SEC` verification. OPS owns PR/trace tooling.

## Namespace resolution

- `PVC-09` — UAI / Data Ingestion — `CAPITAL-AI-DATA`
- `PVC-10` — Evidence Management — `CAPITAL-AI-DATA`
- `PVC-11` — Data Quality — `CAPITAL-AI-DATA`
- `PVC-12` — Feature Engineering — `CAPITAL-AI-FINTECH`

## Runtime inventory additions

| Concern | Current implementation | Baseline assessment |
|---|---|---|
| DATA exit gate | `dataQualityGate.ts` | Explicit snapshot/evidence → DATA-status table; fail-closed FINTECH export |
| Validated snapshot exit | `ValidatedDataInput.ts` | Consumes the DATA-11 gate for field/aggregate status |
| Evidence identity freshness | `evidenceIdentityFreshness.ts` | S1-R2-11 observer on main after PR #811 |
| Composite DQ + confidence | `CompositeDataQuality.ts` | Mixed; confidence/ranking remain FINTECH-owned and untouched |

## Remaining DATA-11+ findings

1. Source snapshot/evidence vocabularies are mapped, not collapsed.
2. Composite confidence/ranking helpers remain colocated and untouched.
3. Provider paths are only partially homogeneous.
4. Compatibility fallback rows remain non-evidence.
5. Correction-version lineage remains open.
6. S1-R2-11 Security verification remains independent.
