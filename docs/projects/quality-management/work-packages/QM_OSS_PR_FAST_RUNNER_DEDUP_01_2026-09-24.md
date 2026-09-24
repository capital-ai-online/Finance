# QM-OSS-PR-FAST-RUNNER-DEDUP-01

**Project:** CAPITAL-AI-QM  
**Owner:** CAPITAL-AI-QM independent assurance  
**Authority:** `/AGENTS.md@CURRENT_MAIN`  
**Requested:** 2026-09-24  
**State:** IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED  
**Implementation branch:** `agent/quality-oss-pr-fast-runner-dedup-20260924` from `main@332861e4ae19f80c3bdc15dccf3733cdc52c265f`

## Problem

The optional PR_FAST OSS assurance currently allocates one GitHub-hosted runner merely
to decide whether a second runner is applicable. Irrelevant pull requests therefore
consume a runner job even though no OSS scan is needed, while relevant pull requests
pay for both the classifier and the scanner job.

This is structurally expensive for private-repository billing because job execution
minutes are rounded at job granularity. Faster commands alone cannot remove the cost
of an unnecessary second job.

## Bounded change

The existing `.github/workflows/oss-quality-assurance.yml` remains the single PR_FAST
quality workflow.

- GitHub-native `pull_request.paths` filters cover the same relevant repository
  surfaces previously recognized by the scope job.
- The dedicated `OSS quality PR scope` job is removed.
- The existing exact-head assurance job runs directly for eligible non-draft,
  same-repository PRs.
- Gitleaks, base/head OSV comparison, normalized finding contract and blocking
  new-regression semantics are unchanged.
- `oss-quality-deep-assurance.yml` retains daily full coverage/maintainability
  evidence and is not moved back into every PR.

## Safety boundary

This slice does not modify Required Check membership, CI build/test selection,
Container Security, PR Governance, Render deployment, Human/CODEOWNER merge authority
or productive runtime. Path filtering controls only this optional PR_FAST assurance.

## Exit evidence

1. The fast workflow has exactly one hosted Ubuntu job.
2. Irrelevant paths do not start the optional PR_FAST workflow.
3. Relevant code/test/dependency/quality-workflow paths continue to start it.
4. Gitleaks and OSV remain exact PR-range/base-head evidence.
5. Workflow security and exact-head checks pass before Human/CODEOWNER merge.
