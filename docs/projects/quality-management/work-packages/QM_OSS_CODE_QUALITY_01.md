# QM-OSS-CODE-QUALITY-01 — Open-Source Quality Evidence Convergence

**Project:** `CAPITAL-AI-QM`  
**Folder:** `docs/projects/quality-management/`  
**Owner/PVC:** `CAPITAL-AI-QM / cross-cutting; no productive PVC`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Implementation baseline:** `main@4088582d6b49f1551002022638ee0bcb187c8923`  
**Status:** `IMPLEMENTED_ON_BRANCH / EXACT-HEAD_VALIDATION_PENDING`  
**Authority:** evidence/status only; this document creates no Quality, Security, Governance, merge, release or production authority.

## Owner-directed scope

Fresh Human/Owner direction on 2026-09-21 authorizes this bounded implementation slice:

`Gitleaks → OSV Scanner → real Vitest V8 coverage → Knip/jscpd → Unified Finding Contract`.

The slice extends the existing ESS-0005 Quality Center and existing repository validation topology. It does not replace Semgrep, Trivy, Zizmor, GitGuardian, the Quality Center, repository Governance, or Human/CODEOWNER merge controls.

## Implemented components

| Component | Pin | Evidence | Enforcement |
|---|---|---|---|
| Gitleaks | `8.30.1` + Linux x64 SHA-256 | `artifacts/oss-quality/gitleaks.json` | new PR-range secret finding blocks |
| OSV Scanner | action commit `7f58dd6750d78fc29a900ba64b1a0f946f62fba4` / scanner `2.6.0` | base + head JSON | new dependency vulnerability blocks |
| Vitest V8 coverage | `vitest@4.1.11` + `@vitest/coverage-v8@4.1.11` | `.quality/coverage-summary.json` | missing/incomplete evidence blocks |
| Knip | `6.31.0` | `artifacts/oss-quality/knip.json` | advisory baseline |
| jscpd | `5.0.12` | `artifacts/oss-quality/jscpd/jscpd-report.json` | advisory baseline |
| Unified Finding Contract | `oss-quality-finding/1.0.0` / `oss-quality-evidence/1.0.0` | `artifacts/oss-quality/unified-findings.json` | evidence normalization |

## Execution boundary

The dedicated `.github/workflows/oss-quality-assurance.yml` workflow:

- triggers only for same-repository, non-draft pull requests and only for relevant source/test/dependency/quality paths;
- checks out the exact PR head with persisted credentials disabled;
- grants only `contents: read`;
- does not use `pull_request_target`;
- has no repository write, Actions write, checks write, OIDC, deployment, package, Secret, IAM or production authority;
- compares OSV dependency findings against the exact PR base so only newly introduced vulnerability identities are blocking;
- scans the exact Git commit range with Gitleaks;
- produces real Vitest V8 coverage and then forces the existing Quality Center snapshot to consume it as `AVAILABLE`;
- records Knip and jscpd findings without making legacy maintainability debt an immediate hard blocker;
- fails closed when required scanner or coverage evidence is absent.

## Unified finding identity

Stable finding IDs are derived from:

`tool | rule | path | line | tool-specific identity`

using SHA-256 and are intentionally independent from the commit SHA. The same defect can therefore be correlated across multiple commits while every evidence instance still carries exact `sourceSha` and `baseSha`.

The normalized contract records tool, rule, domain, severity, confidence, file/line, exact source/base identity, new-in-PR state, artifact path, tool version, configuration hash where available, and tool-specific metadata.

## Coverage integration

No permanent coverage dependency is added to `package.json` or `package-lock.json`. The workflow executes an exact ephemeral pair:

`vitest@4.1.11 + @vitest/coverage-v8@4.1.11`

and writes `.quality/coverage-summary.json`.

The existing `CoverageCollector` then reads that file. `repository:quality:snapshot` must generate `.quality/quality-center-report.json` with `coverage.codeCoverage.status=AVAILABLE`. Missing coverage remains `NOT_AVAILABLE`; no synthetic number is permitted.

## Failure policy

Hard failures in this slice:

1. required evidence for any of the five tools is unavailable;
2. a new Gitleaks finding appears in the PR commit range;
3. a new OSV vulnerability identity exists on head but not base;
4. real coverage evidence is absent or incomplete;
5. the existing Quality Center cannot consume the generated coverage evidence.

Knip and jscpd are initially advisory because the repository has not yet established an exact-current-main maintainability baseline. Their findings are preserved in the same evidence contract so a later Ratchet can be introduced without changing finding identity.

## Existing-tool non-duplication

- Semgrep + reviewdog remain owned by the existing OSS code-review path.
- Trivy remains the container/SBOM/CVE authority path.
- Zizmor remains the GitHub Actions security analyzer.
- Existing Quality Center contracts remain the central read-only Quality projection.
- This slice does not modify `.github/workflows/oss-code-review.yml`, avoiding overlap with the active OPS writer on PR #1190.

## Exit gate

The work package reaches `DONE_MAIN` only after:

1. branch/head is re-correlated against then-current `main`;
2. changed-file and semantic overlap are clear;
3. exact-head repository/Governance/Security checks complete truthfully;
4. the new OSS quality workflow itself produces all five evidence sources;
5. generated coverage is visible as real `AVAILABLE` Quality Center evidence;
6. the Unified Finding artifact is bound to the exact head/base pair;
7. Human/CODEOWNER merge occurs under the active repository contract;
8. post-merge readback confirms the implementation on current main.

No branch-only or pending evidence is represented as `PASS`.
