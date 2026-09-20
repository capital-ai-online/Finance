# Auto-Merge Safety Contract — Implementation Evidence

**Date:** 2026-09-20
**Project:** CAPITAL-AI-GOV
**Baseline:** `main@24850d31cc503b28b1ff786b377826733bf9671f`
**Branch:** `agent/governance-auto-merge-safety-contract-20260920`
**Status:** IMPLEMENTED_BRANCH / VALIDATION_PENDING

## Provider readback before mutation

- Repository: `capital-ai-online/Finance`, private, organization-owned.
- Repository auto-merge capability: enabled (`allow_auto_merge=true`).
- Active production ruleset remains present; no ruleset mutation is part of this slice.
- Open PR #1163 declares Human/CODEOWNER merge and Auto-Merge: No, so it is not migrated or armed by this slice.

## Contract properties

The trust root is versioned in place rather than creating a parallel authority. Auto-merge becomes an opt-in, fail-closed PR state. Exact-head/current-base correlation, zero-behind synchronization, terminal required checks, Security/Compliance/domain evidence, production/provenance evidence and overlap correlation are mandatory before arming.

Protected classes remain Human-gated: P0, Security, Governance/control-plane, IAM, Secrets, database/schema/migrations, Production runtime/deployment, protected recovery, branch/ruleset protection, merge-authority changes, AGENTS.md changes and this contract itself.

Any head/base movement invalidates eligibility. Missing, skipped, pending, stale or ambiguous evidence cannot be promoted to PASS. Auto-merge arming cannot bypass checks or fall back to direct merge.

## Activation boundary

This PR changes the repository trust root and is therefore itself `HUMAN_MERGE_REQUIRED`. The contract has no authority until Human/CODEOWNER merge places it on `CURRENT_MAIN`. SH-02.7 may not use auto-merge before that activation point.

Hosted validation is pending until checks execute against the final PR head.
