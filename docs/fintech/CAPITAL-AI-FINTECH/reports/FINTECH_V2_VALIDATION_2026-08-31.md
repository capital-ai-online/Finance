# CAPITAL-AI-FINTECH V2 — Validation Report — 2026-08-31

## Baseline

| Field | Value |
|---|---|
| main_sha_at_start | `0f5d4f23841ef3824dec8447f700de0cd9614f16` |
| branch | `fintech/capital-ai-fintech-v2-ownership-20260831` |
| open_prs_at_start | 0 |
| candidate_sha | resolve after final main correlation |
| PR | NOT CREATED |

## Core validation

| Check | Result | Evidence / note |
|---|---|---|
| one ScoringModelRegistry | PASS | one current `ScoringModelRegistry.ts`; duplicate/ambiguous canonical scope guards exist |
| one productive ScoringDispatcher | PASS | current SPT/ADR-0087 chain retained |
| one CanonicalScoreResult family | PASS | `scoring-integrity/1.1.0` current + explicit legacy migration boundary |
| no synthetic/neutral missing-evidence fallback | PASS | unavailable score values remain null / fail closed |
| asset classes derived from repository | PASS | six scoreable UAI classes; bond bounded |
| productive Domain Executors mapped | PASS/PARTIAL | four productive executor responsibilities; bond bounded scope |
| provider support does not grant score authority | PASS | ProviderMatrix remains upstream capability/evidence inventory |
| DATA/DQ bypass absent from target design | PASS DESIGN | DATA handoff required for full ownership migration |
| one productive Ranking authority | PARTIAL | backend ranking assets exist; consolidation target explicit; FE-local ordering remains |
| no frontend scoring/ranking duplication | FAIL CURRENT / HANDOFF | RankingBoard locally sorts READY scores; separate FE PR required |
| V2 VC-12..17 unique FINTECH assignment | TARGET PASS / CANONICAL BLOCKED | current SPT/QM stage numbering conflicts |
| EventMesh handoff explicit | PASS DOCUMENTATION | OPS handoff registered |
| Frontend boundary explicit | PASS DOCUMENTATION | FE handoff registered |
| Quality boundary explicit | PASS DOCUMENTATION | QM handoff registered; exact CAPITAL-AI-QM path not found |
| Security/Compliance boundary explicit | PASS DOCUMENTATION | SEC/COMP handoffs registered |

## Architecture conflict: VC numbering

Current canonical financial SPT/QM projection uses:

- VC-12 Domain Executor;
- VC-13 CanonicalScoreResult;
- VC-14 Confidence/DQ;
- VC-15 Ranking comparability;
- VC-16 Ranking/Eligibility/SLO;
- VC-17 EventMesh/Traceability/Supervisor;
- VC-18 Delivery.

V2 target requests:

- VC-12 Feature Engineering;
- VC-13 Scoring Models;
- VC-14 Scoring Orchestration;
- VC-15 Domain Executor;
- VC-16 Canonical Scoring;
- VC-17 Ranking/Decision Support;
- VC-18 OPS EventMesh/Traceability.

Because current-main authority and QM projection disagree with target numbering, this FinTech-only branch records target ownership and handoffs but does not silently renumber foreign/runtime projections.

Status: `P1 — CROSS-PROJECT SEMANTIC MIGRATION REQUIRED`.

## Ranking assessment

### Reusable backend authority candidates

- `src/services/ranking.service.ts`: current productive crypto ranking/eligibility;
- `src/platform/Ranking/contracts.ts`: canonical cross-asset ranking contract;
- `src/platform/Ranking/CrossAssetRanking.ts`: deterministic canonical-result ranking with lineage/comparability/governance gates.

### Current duplicate consumer behavior

`src/features/screening/ui/RankingBoard.tsx` filters READY results, sorts score values and creates Top/Worst groups in the browser.

Under V2 this is not accepted as the final boundary. It is recorded as:

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]`.

No FE file is modified in this branch because `execute_foreign_work=false` and `one_project_scope_per_pr=true`.

## Asset/model coverage

| Metric | Value |
|---|---:|
| scoreable asset classes | 6 |
| full productive class routes | 5 |
| partial class routes | 1 (bond benchmark yield) |
| scoring model descriptors | 10 |
| canonical champion descriptors | 4 |
| challenger descriptors | 6 |
| productive executor responsibilities | 4 |

## Handoff status

| Handoff | Status |
|---|---|
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09..VC-11]` | OPEN |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]` | OPEN |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]` | OPEN / P1 |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-QM | VC-12..VC-18]` | OPEN / P1 |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-SEC | VC-12..VC-17]` | REFERENCE REQUIRED |
| `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-COMP | VC-12..VC-17]` | REFERENCE REQUIRED |

## Findings

### P0

None newly introduced or proven unresolved by this FinTech-only consolidation.

### P1

1. FE-local RankingBoard ordering violates V2 consumer-only target.
2. V2 VC-number semantics conflict with current canonical SPT/QM projection.
3. DATA validated-input ownership needs an explicit cross-project contract before V2 stage migration is canonical.
4. Ranking runtime consolidation must reuse existing ranking components; cross-asset impact must not be enabled without reviewed compatibility/evidence gates.

### P2

1. Exact `CAPITAL-AI-QM` project path/structure not present on baseline; parity cannot be VERIFIED.
2. Provider capability mapping is static/repository-based; live health/entitlement is not inferred.
3. Legacy CanonicalScoreResult 1.0 boundaries should migrate only through explicit compatibility work.

### P3

Automated ownership/stage/consumer drift checks after V2 cross-project migration stabilizes.

## Scope integrity

This branch is intended to contain only:

- `docs/fintech/CAPITAL-AI-FINTECH/**`;
- bounded updates to current financial SPT/master roadmap that reference the FinTech ownership migration.

It must not contain:

- FE runtime changes;
- QM runtime changes;
- DATA provider/DQ runtime changes;
- OPS EventMesh runtime changes;
- credential/secret changes;
- model promotion;
- production ranking-impact activation.

## PR gate

Before PR creation:

1. re-read exact current `main`;
2. re-read open PRs;
3. compare branch vs main and inspect changed files;
4. correlate stage/authority/ranking changes;
5. repeat cheap validation;
6. report exact candidate SHA;
7. obtain explicit Human/Owner PR-creation approval for that exact snapshot.

No PR or Draft PR may be created before that approval.