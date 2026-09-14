# CAPITAL-AI-SEC — Canonical Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Folder:** `docs/projects/security/`  
**Role:** cross-cutting Security requirements, findings, bounded remediation and independent verification  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 folded; S1-R2-06 independent inventory and PR #918 branch verification added  
**Baseline:** `main@627f46b8164a13f8d635d92dc1a9c6a87fae741b`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated 2026-09-13 archive content and non-terminal S1-R2 / SEC-SOTA items are represented here. Detail documents under `docs/roadmaps/` and `docs/evidence/security/` remain evidence only and are not a second execution source.

## PR #900 / #901 work packages

### SEC-CARRY-01 — Existing non-terminal Security backlog
Carry forward every non-terminal SEC-SOTA, auth lifecycle, verification, finding/risk, supply-chain and provider-evidence item.

### SEC-PR900-01 — Security document consistency
Synchronize Security projections against current authority and implementation evidence. Preserve historical evidence dates; do not rewrite old results as new verification.

### SEC-PR900-02 — SEC-SOTA-04 focused verification
Continue the existing materialized verification slice. Produce reproducible dispositions/routing for V3/V4/V6/V8/V16. V5 file-handling and V10 OAuth/OIDC remain applicability-open. V17 N/A remains baseline-scoped only. `ASVS5-V12-TRANSPORT-EVIDENCE` is routed to OPS/PVC-08.

**Exit:** every reviewed requirement has evidence-backed status or concrete owner return; no full ASVS conformance is inferred.

### SEC-PR900-03 — SEC-AUTH-LIFECYCLE
Re-correlate ESS-0020/ADR-0064/registry, native MFA, Legacy-TOTP, purpose-bound step-up and recovery against then-current implementation/provider evidence. Historical provider counts are not current state.

### SEC-PR900-04 — Independent owner-return verification
Verify returned evidence for CORS composition, CSP/COOP, method gates, application MFA paths, AuthN/AuthZ audit coverage, route/object/field authorization, ULS entitlement lineage, supervisor behavior, recovery/RPO/RTO, strict CSP and demo billing isolation.

### SEC-PR900-05 — CodeQL/PostHog/security-provider boundaries
Verify roles, least privilege, data minimization, provider permissions and separation from authority.

### SEC-PR900-06 — Prompt/MCP trust findings
Verify F01/F06 prompt/history provenance returns and F04 external MCP effective grants/session/read-only boundaries with live/effective evidence where applicable.

## Absorbed open Security work (from 2026-09-13 archive + S1)

| ID | Owner | State | Next gate |
|---|---|---|---|
| SEC-SOTA-01 | SEC | `DONE_MAIN` | ledger only |
| SEC-SOTA-02 inventory | mixed owners | historical routed findings; re-correlate before remediation | see F01–F06 |
| SEC-SOTA-03 aggregate | SEC | `VERIFIED_MAIN / CLOSED` | ledger only |
| SEC-SOTA-04 ASVS 5.0 matrix | SEC + owners | `MATRIX_INVENTORIED / VERIFICATION_OPEN` | chapter dispositions; V5/V10 open; V12 transport → OPS |
| SEC-VERIFY-R2-04 / S1-R2-04 fatal-process | OPS PVC-04/08 | `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN` | deployed supervisor/restart/readiness |
| SEC-VERIFY-ULS-001 | OPS PVC-08 | `PARTIAL / NOT VERIFIED` | provider identity + independent SEC re-verification |
| SEC-AUTH-LIFECYCLE | GOV/Human + OPS evidence | `OPEN / CLARIFY`; ESS-0020 `PROPOSED` | no unilateral lifecycle mutation |
| SEC-COMP-CRA-01 | COMP first | COMP applicability | SEC supplies technical evidence only after COMP scope |
| S1-R2-03 Node control-plane 24.20.0 | OPS PVC-06 | `OPEN / PARTIAL` | converge engines/policy; exact-head CI |
| S1-R2-05 Stripe redirect boundary | OPS PVC-02 | `OPEN / PR918_VERIFIED_BRANCH / PRODUCTION_VERIFY_OPEN` | Human/CODEOWNER merge then exact deployed negative open-redirect verification |
| S1-R2-06 entitlement authority | OPS parent; FINTECH/DATA children | `ACTIVE / INVENTORY_REVERIFIED / PARTIAL_BRANCH_REMEDIATION` | PR #918 screening alias fix remains off-main; Buffett bearer consumer fix on Security branch; FIN-SEC-03 Backtest/Monte Carlo/full_ai_analysis remain owner-open |
| S1-R2-07 recovery / RPO / RTO | OPS PVC-08 | `OPEN / UNVERIFIED` | measured restore drill |
| S1-R2-08 leaked-password | OPS PVC-08 | `OWNER-ACCEPTED / TIER EXCEPTION` | reassess if provider tier changes |
| S1-R2-09 strict CSP promotion | OPS PVC-08 | `PARTIAL / REPORT-ONLY` | ADR-0040 promotion evidence |
| S1-R2-10 demo billing isolation | OPS PVC-08 | `MERGED / POST-DEPLOY VERIFY PENDING` | production cannot reach DEV simulation |
| S1-R2-11 evidence identity/freshness | DATA PVC-10 | `MERGED / VERIFY PENDING` | deterministic current/stale/wrong-identity |
| SEC-SOTA02-F01 prompt-injection trust | FINTECH PVC-15 + CLIENT | `CONFIRMED / OWNER_ROUTED` | malicious retrieved-instruction + history-role-spoof DENY |
| SEC-SOTA02-F02 Draft-PR dispatch gate | DOC PVC-03 | `CONFIRMED / OWNER_ROUTED` | stop at approval-ready handoff |
| SEC-SOTA02-F03 mutation audit | DOC PVC-03 | `CONFIRMED / OWNER_ROUTED` | durable authorization/outcome evidence |
| SEC-SOTA02-F04 external MCP host | OPS PVC-02 | `EVIDENCE_GAP / OWNER_ROUTED` | effective host grant/session/read-only readback |
| SEC-SOTA02-F05 stale provider docs | GOV PVC-05 | `CONFIRMED / OWNER_ROUTED` | current Trust Root wording |
| SEC-SOTA02-F06 chat history provenance | CLIENT PVC-01 + FINTECH | `EVIDENCE_GAP / OWNER_ROUTED` | attested session/history + negative tests |

### S1-R2-06 verification delta — 2026-09-14

Independent Security re-correlation is recorded in `docs/evidence/security/S1_R2_06_ENTITLEMENT_INDEPENDENT_VERIFICATION_2026-09-14.md`.

- `verified_screening`: server authority exists; confirmed case/trailing-slash alias remediation is independently verified on PR #918 exact head but remains off-main and not Production-verified.
- `realtime_ai_newsfeed`: current repository boundary resolves verified principal plus server subscription state and fails closed; Production verification remains separate.
- `pdf_compliance_export`: authenticated server ledger path remains the repository reference boundary; Production verification remains separate.
- `buffett_value_check`: server authority exists; the remaining bearer-less Frontend consumer transport is a cleanly separable bounded Security fix using existing `authFetch` and does not alter entitlement semantics.
- `backtest`, `monte_carlo`, `full_ai_analysis`: remain `FIN-SEC-03` owner work under `CAPITAL-AI-FINTECH / PVC-15`; this Security slice does not implement that foreign business/domain architecture.

S1-R2-06 is **not** `VERIFIED` or `CLOSED` as a whole.

`EVIDENCE_READY != VERIFIED`. Implementation and verification remain separate steps. PR #905 (license identity) is Human-merged on current main.

## Dependencies
Productive owners CLIENT/OPS/DATA/FINTECH; GOV normative decisions; COMP legal judgments; QM exact-snapshot evidence.

## Project exit gate
One active SEC roadmap; no unresolved critical readiness finding is silently closed; every assessed requirement is reproducible or explicitly routed; dated 2026-09-13 SEC archive is deleted.
