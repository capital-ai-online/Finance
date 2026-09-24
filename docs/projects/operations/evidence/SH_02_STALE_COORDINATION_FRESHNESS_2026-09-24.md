# SH-02 Stale Coordination Freshness Evidence — 2026-09-24

**Baseline:** `main@c06a907ab42bb118133951a27e77f154c8c4cba0`  
**Project:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-08` with `PVC-02/PVC-18` support  
**Classification:** repository coordination freshness / non-runtime evidence

## Repository-wide stale-state correlation

The stale-state review distinguishes current mutable projections from historical evidence. Older SHAs, archived reports, prior PR evidence and production ancestry are not stale merely because they are older than CURRENT_MAIN.

| Class | Current mechanism | Result |
|---|---|---|
| Current-state ROADMAP/TASK_REGISTER baseline | `controlPlaneFreshnessRules.mjs` + Current-State Baseline Autofix | Existing bounded SH-1 lane; no duplicate implementation |
| PR stale head/base | canonical branch synchronization / exact-head checks | Existing convergence path |
| PR Decision/Evidence drift | single PR Decision Evidence Reconciler | Existing bounded single writer |
| stale test expectation after intentional contract change | `REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT` | Existing registered repair path only when allowlisted |
| active/exclusive claim after terminal work | `validateWorkClaim.mjs` detects lifecycle inconsistency | Detection exists; automatic repository-wide release remains held |
| legacy/superseded current runtime reference | AGENTS implementation-integrity invariant + current guards/tests | owner-correct remediation only |
| historical evidence containing old SHA/owner/state | provenance | `HISTORICAL_EVIDENCE_VALID`; no mutation |
| healthy older Production below cadence boundary | merge-cadence resolver | `NOT_STALE_EXPECTED_LAG / DEPLOYMENT_QUEUED` |
| foreign-owner stale projection | ownership resolver | `FOREIGN_OWNER_HANDOFF_REQUIRED` |

## Exact stale OPS findings repaired in this slice

| Finding | Before | Provider evidence | After |
|---|---|---|---|
| OPS-SC-01 | policy-homogeneity claim `active/exclusive` | PR #1147 merged `f0c14ed…` | `released/non-exclusive` |
| OPS-SC-02 | baseline-evidence-handoff claim `active/exclusive` | PR #1360 merged `8a173021…` | `released/non-exclusive` |
| OPS-SC-03 | merge-cadence-runtime claim `active/exclusive` | PR #1338 merged `72a22038…` | `released/non-exclusive` |
| OPS-SC-04 | public-visibility claim `active/exclusive` | PR #1324 merged `f6575396…` | `released/non-exclusive` |
| OPS-SC-05 | SH-02.11 retry-safe activation claim `active/exclusive` | PR #1330 merged `f4b00e7c…` | `released/non-exclusive` |

## Foreign-owner evidence

Open PR #1363 is `CAPITAL-AI-GOV / PVC-05`. Its rendered header contains generation-sensitive cadence presentation that can become stale while the machine-readable evidence is refreshed. This review does not mutate that PR or GOV code. The owner-correct requirement is to keep the single PR Decision Evidence/renderer path responsible for generation-bound presentation.

## Self-Healing integration decision

`DETECT_ONLY / EXISTING_ARCHITECTURE_REUSED / NO_NEW_ACTION`

A stale work claim is a repository work-graph/projection freshness condition. Detection can reuse current coordination validation. Automatic mutation is intentionally not enabled until a single owner-safe claim writer and refreshed generation-bound SEC/QM assurance exist.

This avoids:
- a second stale-healing engine;
- a second PR/claim writer;
- branch-absence-as-terminal-state false positives;
- foreign-owner mutation;
- invalidating SH-02.10 assurance by silently extending its 17-scenario generation.

## Exit evidence

The branch must prove:
1. all five exact claims read back as `released` and `exclusive=false`;
2. their exact terminal PR and merge SHA are preserved;
3. no Self-Healing runtime/fault-suite file changed;
4. no files overlap open GOV PR #1363;
5. CURRENT_MAIN ancestry is rechecked before PR creation;
6. hosted checks are reported truthfully; missing/skipped checks are never PASS.
