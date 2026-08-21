# Hosted GitHub Validation Cost — S0–S3 Evidence

- **Date:** 2026-08-21
- **Branch:** `agent/hosted-validation-cost-s0-s3-2026-08-21`
- **Baseline:** `main@7d173d3239fdbe31216354fc848f948d517069f6`
- **Scope:** GitHub-hosted PR validation cost, detection value and supersession readiness
- **Mutation:** none

## A. PR #469 merge and production verification

PR #469 was merged at `2026-08-21T08:39:11Z`.

Identity correlation:

- final PR head: `5c778f47dc11aa5880aceed6e8bc64845d016d1a`;
- final PR-head tree: `19bcf32b03fc3975211f45b17cbb62d3a86b758a`;
- merge/main commit: `7d173d3239fdbe31216354fc848f948d517069f6`;
- main merge tree: `19bcf32b03fc3975211f45b17cbb62d3a86b758a`.

The identical tree proves that current main contains the exact final repository content of PR #469.

Render read-only evidence for service `Finance` in workspace `AICapital`:

- deployment ID: `dep-da40v08jo6nc73deaprg`;
- deployed commit: `7d173d3239fdbe31216354fc848f948d517069f6`;
- deploy start: approximately `2026-08-21T08:42:41.8Z`;
- live: `2026-08-21T08:43:43.7Z`;
- merge -> deploy start: approximately 3m31s;
- merge -> live: approximately **4m33s**;
- runtime version: `0.6.0`;
- no error-level log entries observed in the deployment window.

A CoinGecko HTTP 429 occurred in runtime data retrieval and immediately fell back to Binance; this
was not a deployment failure.

## B. Official metering basis

Official GitHub documentation retrieved 2026-08-21 states:

- Linux 2-core x64 standard hosted runner: `USD 0.006/min`;
- each job's partial minutes are rounded up to the next whole minute.

Sources:

- `https://docs.github.com/en/billing/reference/actions-runner-pricing`
- `https://docs.github.com/en/billing/concepts/product-billing/github-actions`

All dollar values below are **gross metered equivalents** before plan allowances/credits/taxes.

## C. Representative measured jobs

### C1. PR #469 full Class-R validation

Workflow run `#2177`, job `build-and-test`:

- start evidence: approximately `2026-08-21T08:27:05.4Z`;
- final cleanup: approximately `2026-08-21T08:29:56.1Z`;
- elapsed: approximately 170.6 seconds;
- rounded Linux metering class: **3 minutes**;
- gross equivalent: **USD 0.018**.

The run passed npm install/audit, TypeScript, unit tests, production build, CSP,
production-config/deployment readiness, Docker hardening and Docker image validation.
Main-only P2B provenance/deployment steps correctly remained unavailable on a PR event.

### C2. PR #469 P0 exact-snapshot reuse

Workflow run `#2178` reused prior run `#2177` for the same PR, Workflow ID, Head SHA and Base SHA.
Checkout/scope/npm/test/build/Docker were skipped.

- elapsed: approximately 2.7 seconds;
- rounded Linux metering class: **1 minute**;
- gross equivalent: **USD 0.006**;
- normalized saving versus repeating measured Class-R validation: approximately **2 rounded Linux
  minutes / USD 0.012** per exact duplicate event.

### C3. PR #469 P2A ready-for-review sync

The single-PR sync evaluated #469 and GitHub returned 422 because the branch was already current.
No second branch mutation was produced.

- elapsed: approximately 1.1 seconds;
- rounded Linux metering class: **1 minute**;
- gross equivalent: **USD 0.006**.

### C4. Google-Marketing protected-change guard

Observed PR #469 job:

- elapsed: approximately 3.0 seconds;
- rounded Linux metering class: **1 minute**;
- gross equivalent: **USD 0.006**.

The job performs a checkout plus static wiring checks. It deliberately does not duplicate npm/test
or build work. Its extremely low CPU time but full-minute rounding makes it a strong future
**co-location** candidate, not evidence for removing the protected invariant.

### C5. Pre-P1 Governance normal event — PR #460

One normal pre-P1 Governance failure allocated three Linux runners:

| Job | Observed duration class | Rounded minutes |
|---|---:|---:|
| PR template contract | ~20.4 s | 1 |
| Cost gate | ~2.6 s | 1 |
| Workflow security/scope | ~4.3 s | 1 |
| **Total** | | **3** |

This is the runner-rounding problem P1 addresses. A body-only edit is different: unused Governance
jobs were skipped and did not allocate runners.

## D. Ten-final-head run-frequency sample

Final PR heads sampled: #460, #461, #462, #463, #464, #465, #466, #467, #468, #469.

Observed patterns:

| PR | CI runs on final head | Governance runs on final head | Notable result |
|---|---:|---:|---|
| #460 | 2 | 5 | two full successful CI runs; Governance failures + later passes |
| #461 | 1 | 3 | one Governance failure |
| #462 | 1 | 2 | one Governance failure |
| #463 | 2 | 2 | duplicate successful CI |
| #464 | 1 | 2 | Google-Marketing guard also triggered |
| #465 | 1 | 2 | repeated Governance events |
| #466 | 1 | 0 exposed by commit-run query | single CI on final head |
| #467 | 2 | 0 exposed by commit-run query | duplicate successful CI |
| #468 | 2 | 0 exposed by commit-run query | duplicate successful CI |
| #469 | 2 | connector does not expose a final-head Governance run | second CI is P0 reuse, not full rerun |

The commit-run connector exposes 15 successful CI runs across 10 final heads. The sample is intended
to prove event/run duplication patterns; it is not used to claim identical duration for every run.

## E. S2 failure evidence

### E1. PR #469 — genuine but replaceable technical finding

Intermediate head `29feca6067089bbdcfecb812ea535ba443b654b7`, CI run #2176:

- M10-OFF path passed;
- cost control passed;
- checkout/scope/repository integrity passed;
- `npm ci` passed;
- production dependency audit passed;
- TypeScript passed;
- unit tests failed;
- later build/Docker work correctly skipped.

Root cause: legacy M7 assertions still referenced the deliberately retired separate
`supply-chain-attestation` / `verify-deployment-identity` job topology. The test contracts were
updated to assert the preserved P2B security semantics instead. Final head then passed unit tests.

This is a true defect, but no evidence shows that GitHub hosting was necessary to detect it.

### E2. PR #462 — genuine hosted trust-boundary finding

Governance rejected the actual PR body because it did not contain the then-current required marker
`CAPITAL_AI_PR_TEMPLATE_VERSION: 1.4.0`. The validator was loaded from trusted current main and
read the real external PR object.

This is not equivalent to candidate-side self-validation before PR creation.

### E3. PR #460 — genuine hosted trust-boundary finding

Governance rejected the actual PR body because mandatory section
`## 8. Merge-Autorisierung (vereinfacht)` was missing. Again, trusted-main policy validated the
actual GitHub PR object.

## F. Detection classification summary

- `UNIQUE_HOSTED_VALUE`: authoritative PR body/number/Base/Head/current-main relation, Human/CODEOWNER
  boundary, changed-workflow/event/permission trust, independent GitGuardian.
- `REPLACEABLE_WITH_ATTESTED_EVIDENCE`: deterministic git integrity, npm/lock/audit with freshness,
  TypeScript/lint/contracts, unit/integration, production build/CSP/predeploy, Docker with controlled
  builder identity, Google-Marketing static wiring guard.
- `REDUNDANT`: exact same Workflow+PR+Head+Base after an earlier successful PASS.
- `ADVISORY_ONLY`: repository-conventions advisory.
- `MAIN_ONLY`: supply-chain/Sigstore, production environment, Render exact-SHA and post-deploy
  identity.

## G. S3 outcome

**Do not globally disable GitHub-hosted PR validation.**

Current evidence supports:

1. **A now:** preserve current required hosted `build-and-test` + GitGuardian while keeping the
   P0/P1/P2 cost controls from PR #469.
2. **Evolve toward B:** always retain a cheap hosted GitHub trust-boundary check; reduce full
   deterministic suites by risk class only when equivalent evidence is independently attestable.
3. **C research only:** an exact Head+Base-bound independent pre-PR attestation may later replace
   deterministic test/build work after shadow/negative evidence.
4. **D rejected now:** global hosted disablement would violate current authorities and remove
   already-proven hosted-only governance detection.

No workflow, ruleset, `AGENTS.md`, Required Check or production control is changed by this evidence
branch.
