# EQUITY P1-B PIT Filing Evidence — 2026-09-03

**Task:** `FIN-12-EQ-P1B`  
**Project:** `CAPITAL-AI-FINTECH`  
**Branch:** `feat/equity-orchestrator-p1b-pit-filing-2026-09-03`  
**Initial branch base:** `main@adba446e8c17676d1064f9a687970c23cb9aa279`  
**Final pre-PR main sync:** `main@0c595dc4f07fc279eabec272ca6046967f3b83e8`  
**Historical design evidence:** closed/unmerged PR #511 and deleted August P1-B branch; neither is current authority  
**Status:** `IMPLEMENTED_PENDING_PR_CI`

## Reconciliation

The August P1-B remote branch no longer existed on 2026-09-03. Its last reachable implementation commit `d53966a71b354623f8c6ee727ddc79570b10bd09` was therefore treated only as implementation evidence.

A new branch was created directly from then-current `main@adba446e8c17676d1064f9a687970c23cb9aa279`. Equity-only code/tests were selectively restored. Shared files were not restored from August: current-main `TraditionalAssetScoring`, `traditionalHistoryFallback`, registry, dispatcher, DQ, IAM and deployment state remain authoritative.

During the mandatory pre-PR gate, PR #727 merged and advanced `main` to `f9e282d87c353f7b108f3637b1bf3028871852cc`. #727 changes only Governance roadmap/validator/test files and has no P1-B overlap. After PR creation, PR #725 Lifecycle Security Integration merged and advanced `main` again to `0c595dc4f07fc279eabec272ca6046967f3b83e8`. #725 changes only lifecycle-security evidence/test and had already been classified as semantically orthogonal. The P1-B branch is rebuilt on this latest main tree before accepting any exact-head CI result.

Open PR #726 changes only SEO documents and does not overlap Equity/SEC/FINTECH P1-B files or authorities.

Current-main already contains the shared Traditional `observedAt` provenance hardening, so P1-B does not modify the Traditional scoring path.

## Net implementation scope

### Added runtime/evidence

- `server/secEdgarCompanyFacts.ts`
- `server/equitySecEvidenceBridge.ts`
- `server/equitySecComparableEvidence.ts`
- `server/equityResearchRuntime.ts`
- `server/equityP1bResearchRuntime.ts`

### Added FINTECH feature contracts

- `EquityModelContracts.ts`
- `EquityFeatureComposer.ts`
- `EquityFilingDerivedMetrics.ts`
- `EquityComparableFilingMetrics.ts`
- `EquityFilingFeatureComposer.ts`

### Bounded shared changes

- `.env.example`: non-secret `SEC_EDGAR_USER_AGENT` only;
- `src/platform/Scoring/index.ts`: exports only;
- `docs/projects/fintech/TASK_REGISTER.md`: bounded FIN-12 child traceability.

### Regression/negative tests

- model/family/correlation contract;
- feature composer and cross-provider rejection;
- filing-derived metrics and period mismatch;
- comparable-period metrics;
- SEC CompanyFacts PIT/context/amendment selection;
- P1-A/P1-B server-only runtime boundaries;
- productive registry boundary.

## Value-chain evidence

| PVC / VC | Owner | P1-B behavior | Authority effect |
|---|---|---|---|
| PVC-09 / VC-06 | DATA | SEC CompanyFacts read-only acquisition | no new router authority |
| PVC-10 / VC-07 | DATA | CIK/accession/filedAt/period/unit provenance | consumes existing evidence contract |
| PVC-11 / VC-07 | DATA | PIT/context/duration/freshness admissibility | consumes existing DQ contract |
| PVC-12 / VC-09 | FINTECH | versioned Equity research feature transformation | bounded new FINTECH implementation |
| PVC-13+ / VC-10+ | FINTECH | unchanged | no registry/dispatcher/canonical-score promotion |

## Data-integrity controls

- `filedAt <= evaluatedAt` is the hard information-availability boundary.
- Reporting period end is never treated as knowledge time.
- Latest reporting period wins before same-period filing/amendment recency.
- Quarter/YTD/annual duration mismatches fail closed.
- Missing facts do not become zero.
- SEC and vendor evidence for the same economic signal are superseded rather than stacked.
- FCF/EPS vendor conversion remains same-provider/same-observation only.
- Capital Allocation cannot be manufactured from dividend yield alone.
- All Equity weights remain zero and `researchCompositeScore` remains null.

## Validation state before PR / current PR head

- fresh branch from current main at implementation start: PASS;
- mandatory resync after PR #727: PASS;
- mandatory resync after PR #725: PASS, target main `0c595dc4f07fc279eabec272ca6046967f3b83e8`;
- open-PR changed-file/semantic correlation (#726): PASS, no overlap;
- net diff / scope review: PASS;
- shared-authority preservation review: PASS;
- local dependency-complete TypeScript/Vitest: NOT EXECUTABLE in isolated runner because `github.com` DNS cannot be resolved;
- hosted GitHub CI: exact-head evidence only; superseded head runs are not accepted.

## Promotion boundary

P1-B is research-only and non-authorizing. Productive admission remains blocked until peer/sector normalization, robust outlier policy, point-in-time OOS validation, empirical correlation analysis and explicit Owner promotion approval are complete.
