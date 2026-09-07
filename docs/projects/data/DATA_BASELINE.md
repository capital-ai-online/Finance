# CAPITAL-AI-DATA — Repository & Runtime Baseline

**Observed baseline:** `main@51bf529f003dfa47462c16ecbe10ae3b095547a4`  
**Observed open PRs at resync:** `#804 CAPITAL-AI-CLIENT GOV-08 Admin Process Graph`  
**Active DATA branch:** `agent/data-s1-r2-11-main-sync-20260907`  
**Superseded working branch:** `agent/data-s1-r2-11-evidence-identity-20260907` — behind current main after PR #809; replaced by the current-main sync branch

## Coordination baseline

Current main at DATA-10 resync is `51bf529f003dfa47462c16ecbe10ae3b095547a4` (merge of PR #809). Open PR #804 has no changed-file overlap with `docs/projects/data/**` or `src/platform/MarketData/evidenceIdentityFreshness.ts`. Merged PR #809 changed only Frontend billing/ULS files.

Security PR #631 remains the source of the S1-R2-11 routing. Security verification remains external to DATA. OPS owns any future PR/trace/DevelopmentChain tooling remediation, including `scripts/pr/updatePrProductionBaseline.mjs`.

## Namespace resolution

Current main defines:

- `PVC-09` — UAI / Data Ingestion — `CAPITAL-AI-DATA`;
- `PVC-10` — Evidence Management — `CAPITAL-AI-DATA`;
- `PVC-11` — Data Quality — `CAPITAL-AI-DATA`;
- `PVC-12` — Feature Engineering — `CAPITAL-AI-FINTECH`.

`PVC-*` is organizational project routing only. Existing technical financial `VC-*` identifiers under `SC-MD-SPT-0001` remain unchanged.

## Security correlation

- `S1-R2-11 — Evidence identity and stale-state automation`;
- target `CAPITAL-AI-DATA` / `PVC-10`;
- DATA implementation/evidence status `EVIDENCE_READY`;
- Security verification remains independent and is not closed by DATA.

## Runtime inventory

| Concern | Current implementation | Baseline assessment |
|---|---|---|
| Evidence DQ | `evidenceQualityContracts.ts` | Asset-class-neutral evidence/freshness/provenance admissibility contract |
| Evidence identity freshness | `evidenceIdentityFreshness.ts` | S1-R2-11 observation evaluator; current/stale/refresh/retry against immutable identity |
| Evidence identity | `CryptoEvidenceIdentityRegistry.ts` | Crypto-specific domain identity map; not retired by this package |

## Data-integrity findings still open outside this package

1. Snapshot and evidence DQ vocabularies are not yet one DATA status contract.
2. UAI identity and downstream scoring contracts remain physically colocated.
3. Composite DQ still contains confidence/ranking helpers owned by FINTECH.
4. Provider paths are only partially homogeneous.
5. Compatibility fallback rows remain non-evidence.
6. Correction-version lineage remains an architecture gap.
7. S1-R2-11 DATA evidence is ready; independent Security verification remains open.
8. Quality Management must remain outside the productive DATA hot path.

## Migration posture

- return Security evidence without self-setting `VERIFIED/CLOSED`;
- route PR/trace tooling remediation to OPS rather than absorbing it into DATA;
- no synthetic fallback during migration;
- hand off scoring/confidence/ranking work instead of modifying it in DATA.
