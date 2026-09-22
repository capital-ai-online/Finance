# SEC Issue #1230 — Trust-Root Convergence Evidence

**Project:** `CAPITAL-AI-SEC`  
**Issue:** #1230  
**Correlation ID:** `GOV-POLICY-CONTRACT-CONVERGENCE-20260922`  
**Fresh baseline:** `main@aee799282298596a5f2d9140a4e805edf52783a0`  
**Branch:** `security/issue-1230-current-main-convergence-20260922`  
**State:** `IMPLEMENTED_BRANCH / HOSTED_VALIDATION_PENDING`

## Observed drift

Fresh CURRENT_MAIN readback confirmed that `.github/SECURITY.md` and `docs/security/ARCHIVE_RETENTION_SANDBOX_THREAT_MODEL_2026-08-22.md` still named the retired standalone DevelopmentChain execution policy as current authority.

## Remediation

Both active Security surfaces now resolve repository execution exclusively through `/AGENTS.md@CURRENT_MAIN`. Accepted ADR/ESS/Security contracts remain subject-matter constraints, and `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` remains traceability-only.

No Security reporting, incident, secret handling, verification, protected-mutation or Human/CODEOWNER boundary is weakened.

## Regression

`tests/unit/securityTrustRootConvergence.test.ts` fails if either target reintroduces the removed standalone DevelopmentChain policy as current execution authority.

Hosted CI remains `PENDING` until the PR head is evaluated; no unexecuted check is represented as PASS.
