# Auto-Merge Safety Contract — Implementation Evidence

**Date:** 2026-09-20
**Project:** CAPITAL-AI-GOV
**Baseline:** `main@e86955225887bb7f34036c175ad1da89b8aec14d`
**Branch:** `agent/governance-auto-merge-safety-contract-20260920`
**Status:** IMPLEMENTED_BRANCH / REVALIDATION_PENDING

## Provider readback before mutation

- Repository: `capital-ai-online/Finance`, private, organization-owned.
- Repository auto-merge capability: enabled (`allow_auto_merge=true`).
- Active production ruleset remains present; no ruleset mutation is part of this slice.
- PR #1163 is already merged. Open PRs #1165 and #1166 have no changed-file overlap with this governance slice; neither is migrated or armed by this contract.

## Contract properties

The trust root is versioned in place rather than creating a parallel authority. Auto-merge becomes an opt-in, fail-closed PR state. Exact-head/current-base correlation, zero-behind synchronization, terminal required checks, Security/Compliance/domain evidence, production/provenance evidence and overlap correlation are mandatory before arming.

Protected classes remain Human-gated: P0, Security, Governance/control-plane, IAM, Secrets, database/schema/migrations, Production runtime/deployment, protected recovery, branch/ruleset protection, merge-authority changes, AGENTS.md changes and this contract itself.

Any head/base movement invalidates eligibility. Missing, skipped, pending, stale or ambiguous evidence cannot be promoted to PASS. Auto-merge arming cannot bypass checks or fall back to direct merge.

## Activation boundary

This PR changes the repository trust root and is therefore itself `HUMAN_MERGE_REQUIRED`. The contract has no authority until Human/CODEOWNER merge places it on `CURRENT_MAIN`. SH-02.7 may not use auto-merge before that activation point.

Hosted validation is pending until checks execute against the final PR head.

## Validation repair

The first hosted validation exposed two stale projections rather than a defect in the fail-closed contract itself: the v1.7 PR body used a non-canonical decision status, and five unit assertions plus `CTRL-MERGE-HUMAN-001` still encoded the superseded absolute auto-merge prohibition. This remediation keeps direct agent self-merge prohibited, preserves protected Human-gated classes, updates the active control projection, and updates only the tests that verify that changed governance semantic. Revalidation remains required on the final head.
