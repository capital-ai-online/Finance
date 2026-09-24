# OPS — Branch Sync Trust Predicate

- **Work item:** `OPS-BRANCH-SYNC-TRUST-PREDICATE-01`
- **Issue:** #1434
- **Project:** `CAPITAL-AI-OPS`
- **Owner / PVC:** `CAPITAL-AI-OPS / PVC-04`
- **Priority:** P1
- **CURRENT_MAIN baseline:** `ea9fafc03aa9e05ee9e2f801da09c50392cd1ecc`

## Root cause

The canonical branch-sync writer trusted active provider prefixes, but non-provider work branches were either rejected by namespace or compared against the repository owner string. In an organization repository the repository owner is `capital-ai-online`, while legitimate Human/Member PR authors are users, so owner comparison cannot establish trust.

## Bounded repair

The existing `.github/workflows/sync-agent-pr-branches.yml` remains the only branch writer. A pure classifier resolves non-provider trust from:

1. same repository and base `main`;
2. GitHub author association limited to `OWNER|MEMBER|COLLABORATOR`;
3. exactly one canonical `[CAPITAL-AI-<PROJECT>]` title prefix;
4. exactly matching `project:<PROJECT_ID>` label;
5. CURRENT_MAIN project routing and branch slug;
6. canonical project namespace or the already-bounded conventional namespace list.

Provider prefixes remain the existing trusted provider lane and do not project collaborator identity.

Immediately before `update-branch`, the workflow re-reads the full trust snapshot and requires it to be unchanged together with CURRENT_MAIN/head/base/state/convergence generation.

## Exit evidence

- operations/* ALLOW fixtures for OWNER/MEMBER/COLLABORATOR;
- DENY fixtures for NONE/FIRST_TIMER, fork, label mismatch, ambiguous title and unknown namespace;
- existing 422/stacked-PR/current-main generation controls preserved;
- Workflow Security + exact-head CI/Governance PASS;
- Human/CODEOWNER merge.

## Self-healing incident during implementation

- **Root-Cause-ID:** `WORKFLOW_TEXT_REPLACEMENT_TOKEN_CORRUPTION`
- **Observed:** the first branch push produced a workflow startup failure with zero jobs.
- **Cause:** JavaScript `String.replace(source, replacementString)` interpreted the shell-regex suffix `$'` as a replacement token and injected the unmatched source suffix into the generated workflow.
- **Repair:** regenerate from clean CURRENT_MAIN and use callback replacements so replacement content is always literal.
- **Preventive rule:** workflow/text generators must use callback/literal-safe replacement whenever target content may contain `$&`, `$'`, `$`` or `$n`.

## CI contract drift after snapshot hardening

- **Root-Cause-ID:** `BRANCH_SYNC_SNAPSHOT_TEST_CONTRACT_DRIFT`
- **Observed:** focused Vitest job `107816865294` failed only two structural assertions after the workflow moved from `gh pr view` to the stricter REST-backed `pr_snapshot()` helper.
- **Cause:** existing pipeline tests asserted the superseded command implementation rather than the invariant that exact event/dispatch PR numbers are resolved through one canonical live PR snapshot.
- **Repair:** keep the existing test file and update only those assertions to require `pr_snapshot "$EVENT_PR_NUMBER"`, `pr_snapshot "$DISPATCH_PR_NUMBER"`, and its `gh api "repos/$REPO/pulls/$number"` backing read.
- **Autofix classification:** deterministic stale test-contract repair; no runtime/workflow behavior rollback.

## PR static-contract incident

- **Root-Cause-ID:** `PR_BODY_STATIC_CONTRACT_INCOMPLETE`
- **Observed:** superseded PR #1436 passed code/security checks but Governance rejected its structurally canonical v1.8 body because mandatory static metadata was missing.
- **Cause:** the creation body omitted the canonical `Priorität`, complete version metadata and related static traceability fields. The Decision Evidence Reconciler intentionally owns later body mutations and does not rerender a body whose high-level v1.8 structure is already canonical.
- **Repair:** PR #1436 was closed without merge. The same tested branch is recreated from a complete v1.8 static contract; no competing open-body PATCH writer is introduced.
