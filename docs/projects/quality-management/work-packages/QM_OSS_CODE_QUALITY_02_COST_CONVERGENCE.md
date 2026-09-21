# QM-OSS-CODE-QUALITY-02 — Runner-Minute Cost Convergence

**Project:** `CAPITAL-AI-QM`  
**Folder:** `docs/projects/quality-management/`  
**Owner/PVC:** `CAPITAL-AI-QM / cross-cutting; no productive PVC`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@9c8a3e80c4451ed0b6ea45f368175604608f6f4b`  
**Parent:** `QM-OSS-CODE-QUALITY-01`  
**Status:** `IMPLEMENTED_ON_BRANCH / EXACT-HEAD_VALIDATION_PENDING`  
**Authority:** Quality evidence/cost remediation only; no merge, release, deployment or productive PVC authority.

## Trigger and reproduced root cause

Fresh Owner feedback on 2026-09-22 reports that `OSS Quality Assurance` consumes too many GitHub Actions runner minutes and can become a multi-minute PR bottleneck.

Current-main and historical run evidence reproduce the structural cause:

- PR #1191 original OSS Quality job: approximately 3:05 wall-clock;
- recent successful PR samples #1239/#1240: approximately 2:54–2:59;
- full Vitest V8 coverage alone: approximately 108–125 seconds;
- coverage runs the entire ~519-file test corpus again although normal CI already performs test validation;
- Knip and jscpd are advisory/global measurements and are not part of the current Required Check set;
- current Required Checks do not include `OSS Quality Assurance`.

The user-observed >5-minute experience can therefore be amplified by reruns/synchronizations, but no >5-minute claim is required for this remediation: the duplicated full-coverage execution is independently proven waste.

## Intended topology

### PR_FAST

`.github/workflows/oss-quality-assurance.yml` remains an exact-head, read-only Pull Request lane and retains only:

1. Gitleaks commit-range secret regression scan;
2. OSV base/head dependency vulnerability comparison;
3. Unified Finding normalization;
4. fail-closed enforcement for missing fast evidence, new secrets and new dependency vulnerabilities;
5. compact 7-day artifact retention.

It intentionally does **not** run:

- `npm ci`;
- full Vitest coverage;
- Knip;
- jscpd;
- Quality Center snapshot generation.

Target: one exact-head fast lane should complete materially below the prior 2:54–2:59 sample range; exact-head workflow evidence is the acceptance source.

### DEEP_BASELINE

`.github/workflows/oss-quality-deep-assurance.yml` runs once daily on current `main` and may also be manually dispatched for diagnosis. It owns:

- full Vitest V8 coverage;
- Knip maintainability evidence;
- jscpd duplication evidence;
- Unified Finding normalization;
- existing Quality Center coverage projection;
- 14-day deep artifact retention.

This converts per-PR repeated global analysis into one bounded daily global baseline.

## Unified Finding semantics

Bundle schema advances to `oss-quality-evidence/1.1.0` and records an explicit execution profile:

- `PR_FAST`;
- `DEEP_BASELINE`;
- `FULL` compatibility profile.

Tool status gains `NOT_APPLICABLE`. This is required so a deliberately deferred deep tool is never reported as PASS and never confused with `NOT_AVAILABLE`.

- `NOT_APPLICABLE`: intentionally outside the selected profile;
- `NOT_AVAILABLE`: required in this profile but evidence missing/invalid;
- `PASS/FINDINGS`: tool actually executed with valid evidence.

## Security and authority preservation

The remediation does not weaken existing Required Checks. Gitleaks and OSV remain per-PR fail-closed. The heavy tools being moved were not Required Checks and did not enforce a coverage or duplication threshold; they measured availability/global state only.

Both workflows remain:

- `permissions: {}` at workflow scope;
- job-scoped `contents: read` only;
- no `pull_request_target`;
- immutable action SHA pins;
- no repository writes;
- no OIDC;
- no deployment, Render, IAM, billing, secret or database authority.

## Cost expectation

Using the observed recent samples, removing the 108–125 second coverage pass plus per-PR `npm ci`, Knip and jscpd should eliminate the majority of OSS-Quality runner time from each code PR. The daily deep lane converts that global cost from “once per PR head/synchronization” to “at most once per day plus explicit diagnostics”.

No numeric saving is represented as PASS until exact-head workflow readback is available.

## Dependencies / overlap

Open PRs were correlated against CURRENT_MAIN before branch creation. No open PR currently writes either OSS Quality workflow, the Unified Finding contract, the normalizer or the QM work-package files. OPS PR #1225 remains owner-correct and limited to preflight/runner telemetry and PR-validation planning; this QM remediation does not modify those files.

## Exit evidence

1. branch contains then-current main and has no writer overlap;
2. repository TypeScript/tests remain green;
3. changed-workflow security validation passes for both workflow files;
4. PR-fast exact-head run executes Gitleaks + OSV and does not execute full coverage, Knip, jscpd or `npm ci`;
5. PR-fast evidence explicitly records deep tools as `NOT_APPLICABLE`;
6. deep workflow is schedule-bound to one daily main run plus manual diagnostic dispatch;
7. deep workflow retains real coverage/Knip/jscpd + Quality Center projection;
8. exact-head PR-fast runtime is materially lower than the observed ~2:54–2:59 recent baseline;
9. Human/CODEOWNER merge and post-merge CURRENT_MAIN readback complete.

No pending workflow is reported as PASS.
