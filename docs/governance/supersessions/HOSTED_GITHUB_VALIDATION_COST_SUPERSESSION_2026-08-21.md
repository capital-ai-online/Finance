# Hosted GitHub Validation Cost Supersession — S0–S3

- **Document ID:** `GOV-SUPERSESSION-HOSTED-VALIDATION-COST-2026-08-21`
- **Authority ID:** `AUTH-GOV-HOSTED-VALIDATION-COST-SUPERSESSION-2026-08-21`
- **Version:** `0.2.0`
- **Status:** `PROPOSED / NOT ENABLED`
- **Date:** 2026-08-21
- **Repository baseline:** `main@7d173d3239fdbe31216354fc848f948d517069f6`
- **Evidence:** `docs/evidence/HOSTED_GITHUB_VALIDATION_COST_S0_S3_2026-08-21.md`

## 1. Purpose

This proposal evaluates whether GitHub-hosted Pull Request validation should remain fully hosted,
become risk-selective, or eventually be partially replaced by independently attested pre-PR
evidence. It does **not** activate a CI, ruleset, security, merge or production-control change.

The earlier working branch `agent/hosted-validation-cost-supersession-2026-08-21` was never merged
and therefore never became repository authority. This fresh-main S0–S3 record replaces that working
copy as the implementation branch for the investigation; no second active repository authority is
created.

## 2. Existing authorities remain binding

Until a separate Owner-approved cutover is accepted and merged, all of the following remain in
force:

1. `/AGENTS.md` is the repository trust root and requires independent hosted GitHub checks before
   Human/CODEOWNER merge.
2. ADR-0073 keeps `build-and-test` as the sole repository-hosted technical Required Check.
3. `.github/policies/main-production-protection.expected.json` keeps `build-and-test` and
   `GitGuardian Security Checks` as required checks.
4. M10 Passkey authorization remains `SUSPENDED / OFF`.
5. Human/CODEOWNER merge authority remains separate from CI.
6. Production promotion remains a verified `main` concern: supply-chain provenance/Sigstore,
   `environment: production`, exact-SHA Render deployment and post-deploy identity verification.

## 3. S0 — Cost baseline

### Decision evidence

GitHub's current official pricing reference states that GitHub-hosted Linux 2-core x64 jobs are
metered at **USD 0.006 per minute** outside applicable included allowances and that every job's
minutes/partial minutes are rounded up to the next whole minute.

Official references, retrieved 2026-08-21:

- `https://docs.github.com/en/billing/reference/actions-runner-pricing`
- `https://docs.github.com/en/billing/concepts/product-billing/github-actions`

Therefore this analysis reports **gross metered equivalent**, not the account's net invoice after
included plan allowances, credits or taxes.

Measured representative jobs:

| Evidence | Real elapsed time | Rounded Linux minutes | Gross equivalent |
|---|---:|---:|---:|
| PR #469 full Class-R `build-and-test` #2177 | ~170.6 s | 3 | USD 0.018 |
| PR #469 exact-snapshot reuse `build-and-test` #2178 | ~2.7 s | 1 | USD 0.006 |
| PR #469 P2A ready-for-review sync | ~1.1 s | 1 | USD 0.006 |
| PR #469 Google-Marketing protected-change guard | ~3.0 s | 1 | USD 0.006 |
| PR #460 pre-P1 normal Governance event: Template + Cost Gate + Workflow Security | ~20.4 s + ~2.6 s + ~4.3 s | 3 total | USD 0.018 |

The pre-P1 Governance example is intentionally calculated at **allocated-job level**. A skipped job
does not receive a billed runner minute. Body-only `edited` events already allocated only the
Template job; P1 primarily removes the three-runner fan-out on normal PR events.

### Ten-final-head sample: PR #460–#469

Across the final heads of PR #460 through #469, the GitHub connector exposes:

- 15 successful `CI-Prüfung` runs for 10 final heads;
- repeated full CI on the same exact final head before P0, including #460, #463, #467 and #468;
- multiple Governance runs on several final heads, including 5 on #460, 3 on #461 and 2 each on
  #462–#465;
- path-scoped Google-Marketing guard runs where protected files/workflows were touched.

This is a **run-frequency sample**, not an assertion that every CI run had the same Class-R
runtime. The measured Class-R minute class is therefore used only for normalized scenario
analysis, not to invent exact billing for unmeasured jobs.

### Current normalized cost model after P0/P1/P2

For one new Class-R snapshot:

- full hosted `build-and-test`: approximately 3 rounded Linux minutes;
- consolidated Governance event: one hosted runner instead of up to three allocated runners on a
  normal pre-P1 event;
- Google-Marketing guard: +1 rounded minute **only when its path filter matches**;
- agent ready-for-review sync: +1 rounded minute for that lifecycle event;
- exact repeated Head+Base after a prior PASS: P0 reduces CI from ~3 to ~1 rounded minute.

At 50 new Class-R snapshots per month, `build-and-test` alone is approximately **150 rounded Linux
minutes / USD 0.90 gross metered equivalent**. Adding one one-minute hosted Governance runner per
snapshot yields approximately **200 minutes / USD 1.20**. If every snapshot also matched the
Google-Marketing path set, the normalized total would be approximately **250 minutes / USD 1.50**.
These are workload scenarios, not a prediction of net billed spend.

### S0 conclusion

The dominant avoidable cost pattern was repeated runner allocation, not the USD rate itself.
P0/P1/P2 materially address that pattern. Remaining one-to-three-second specialized jobs still
round to a full minute, so future optimization should preferentially **co-locate cheap static
checks inside an already-running trusted hosted job** rather than globally remove hosted trust
validation.

## 4. S1 — Detection / coverage classification

| Control category | Classification | S1 assessment |
|---|---|---|
| Real PR number/body, current Base/Head identity, current-main ancestry | `UNIQUE_HOSTED_VALUE` | Depends on authoritative GitHub PR state plus trusted-main policy; pre-PR source tests cannot prove the final external PR object. |
| Human/CODEOWNER merge boundary / GitHub event context | `UNIQUE_HOSTED_VALUE` | Must remain external to candidate code and exact-event-bound. |
| Changed-workflow permissions/event/security validation | `UNIQUE_HOSTED_VALUE` | Trusted-main policy plus actual GitHub workflow/event boundary is security-sensitive. |
| Git tree/repository integrity after exact checkout | `REPLACEABLE_WITH_ATTESTED_EVIDENCE` | Deterministic if evidence is independently produced and exact Head+Base-bound. |
| `npm ci` / lockfile / dependency audit | `REPLACEABLE_WITH_ATTESTED_EVIDENCE` | Reproducible; audit evidence additionally needs a freshness contract. |
| TypeScript / lint / static contracts | `REPLACEABLE_WITH_ATTESTED_EVIDENCE` | Deterministic candidate-snapshot checks. |
| Unit/integration tests | `REPLACEABLE_WITH_ATTESTED_EVIDENCE` | No unique GitHub-host requirement shown by S2. |
| Production build / CSP / predeploy readiness | `REPLACEABLE_WITH_ATTESTED_EVIDENCE` | Reproducible with a controlled equivalent Linux toolchain and content-addressed evidence. |
| Docker build / image user/CMD/healthcheck | `REPLACEABLE_WITH_ATTESTED_EVIDENCE` | Replacement must attest builder image/toolchain and exact source/lockfile identity. |
| Exact-snapshot rerun after same workflow+PR+Head+Base already PASS | `REDUNDANT` | P0 real evidence shows safe reuse path without repeating checkout/npm/test/build/Docker. |
| Repository conventions advisory | `ADVISORY_ONLY` | Existing cost gate may pause it; it must not become CI/merge authority. |
| Google-Marketing separate static wiring runner | `REPLACEABLE_WITH_ATTESTED_EVIDENCE` | Its observed ~3 s job mostly proves static wiring already referenced by central CI; preserve invariant but co-location is a strong cost candidate. |
| GitGuardian Security Checks | `UNIQUE_HOSTED_VALUE` | Independent external security control; not replaced by repository unit/build evidence. |
| Main supply-chain provenance / Sigstore | `MAIN_ONLY` | Production-promotion evidence, not a PR-cost-cut candidate. |
| `production` environment / Render exact-SHA / post-deploy identity | `MAIN_ONLY` | Must remain independent of any PR-validation cost supersession. |

## 5. S2 — Failure yield

### Distinct observed findings

**PR #469 — Unit-test failure on intermediate head `29feca606708...`**

- `npm ci`, dependency audit and TypeScript had already passed.
- Unit tests correctly detected legacy M7 assertions that still required the retired four-job
  production topology.
- The defect was genuine and was corrected before merge.
- It was **not hosted-specific**: the same repository unit tests were sufficient to reproduce it in
  any equivalent environment.
- Classification: `TRUE_DEFECT / REPLACEABLE_WITH_ATTESTED_EVIDENCE`.

**PR #462 — canonical PR-body marker failure**

- Trusted-main validation rejected the real PR because the required template marker was absent or
  wrong (`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.4.0`).
- This depended on the actual GitHub PR body plus trusted-main policy.
- Classification: `TRUE_GOVERNANCE_DEFECT / UNIQUE_HOSTED_VALUE`.

**PR #460 — missing mandatory PR-body section**

- Trusted-main validation rejected the real PR because `## 8. Merge-Autorisierung (vereinfacht)`
  was missing.
- This depended on the actual GitHub PR object and prevented a non-conforming governance state.
- Classification: `TRUE_GOVERNANCE_DEFECT / UNIQUE_HOSTED_VALUE`.

### Yield interpretation

The reviewed evidence proves **both** kinds of value exist:

1. deterministic technical findings that can eventually move to independently attested evidence;
2. GitHub-native trust-boundary findings that cannot be replaced by merely running the same tests
   before PR creation.

No sampled evidence requires a global hosted build/test environment solely because it is hosted by
GitHub. Conversely, the real #460/#462 failures prove that removing all hosted validation would
remove a control that has already caught actual governance defects.

Cancelled/concurrency-superseded runs are not counted as defects. No reviewed #469 evidence showed
a runner-infrastructure flake as the root cause.

A statistically meaningful "cost per finding" cannot be inferred from three selected known
failures. For scale only: a pre-P1 normal Governance failure could allocate three sub-minute Linux
jobs (~3 rounded minutes / USD 0.018 gross), whereas the P1 topology can perform the same logical
controls in one hosted runner. That is precisely the class of unique control that should be kept
cheap rather than removed.

## 6. S3 — Decision assessment

Scoring: 5 = strongest fit; 1 = weakest fit. Cost score rewards lower hosted-minute consumption.

| Option | Cost | Exact Head/Base | Independent from candidate code | Detection preservation | Fail-closed / no deadlock | Production isolation | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|
| **A — keep hosted, continue consolidation/dedupe** | 4 | 5 | 5 | 5 | 5 | 5 | **29/30** |
| **B — risk-selective hosted execution; cheap GitHub trust job always, full deterministic suite only where required** | 5 | 5 | 5 | 4 | 4 | 5 | **28/30** |
| **C — replace deterministic PR tests with independent exact-snapshot attestations** | 5 | 5* | 4* | 3* | 3* | 5 | **25/30 target, NOT READY** |
| **D — disable repository-hosted PR validation globally** | 5 | 1 | 1 | 1 | 1 | 4 | **13/30 — REJECT NOW** |

`*` Option C can reach the target scores only after the missing independent attestation trust model,
anti-replay/head-base binding, freshness, negative tests and shadow evidence are implemented.

### S3 selected direction

**Decision recommendation: A now, evolve toward B; do not activate C or D.**

1. Keep `build-and-test` and `GitGuardian Security Checks` required under the current authority.
2. Keep one cheap hosted GitHub trust/governance path because S2 proves unique external-state value.
3. Keep P0 exact-snapshot reuse, P1 runner consolidation and P2 lifecycle fan-out control.
4. Treat deterministic `npm`/TypeScript/unit/build/Docker work as future candidates for independent
   exact-snapshot evidence, but do not let candidate-controlled self-attestation satisfy the
   Required Check.
5. Prefer co-locating path-specific static guards such as Google-Marketing inside an already-running
   trusted hosted job when their domain trigger matches, rather than allocating a separate
   three-second runner.
6. Keep the full hosted path for workflow/security/dependency/runtime/deployment-sensitive changes
   until a replacement has completed shadow comparison and negative testing.
7. Do not modify the main production chain as part of PR-cost optimization.

## 7. Activation gates for any future supersession

No hosted validation may be disabled or replaced until **all** of the following are evidenced on
then-current `main`:

1. explicit replacement trust model and stable authority identity;
2. independent evidence producer — not solely candidate-controlled code;
3. content-addressed binding to exact repository + PR + Head SHA + Base SHA + toolchain;
4. anti-replay and stale-evidence rejection;
5. audit/dependency freshness policy where time-dependent inputs exist;
6. negative tests for wrong PR, wrong Head, wrong Base, stale/replayed evidence and modified
   workflow/security scope;
7. shadow comparison against hosted validation on representative D/C/R/M changes;
8. no loss of trusted-main PR-body/current-main/workflow-security controls;
9. no change to Human/CODEOWNER merge authority;
10. no weakening of GitGuardian or the production main/Sigstore/Render exact-SHA chain;
11. coordinated `AGENTS.md` + ADR-0073 + expected/live ruleset semantic cutover;
12. explicit Human/Owner `ACCEPT` or `MODIFY` after reviewing the semantic diff and rollback plan.

Until those gates pass, this document remains **PROPOSED / NOT ENABLED** and creates no exception to
current hosted validation.

## 8. Next bounded work item after S3

A later S4 may design a **shadow-only independent pre-PR attestation prototype** and a
single-runner consolidation plan for path-specific static guards. S4 must not change Required Checks
or disable hosted CI during its evidence phase.
