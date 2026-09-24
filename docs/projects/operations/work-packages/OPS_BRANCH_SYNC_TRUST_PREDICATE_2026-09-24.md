# OPS — Branch Sync Trust Predicate

- **Work item:** `OPS-BRANCH-SYNC-TRUST-PREDICATE-01`
- **Issue:** #1434
- **Project:** `CAPITAL-AI-OPS`
- **Owner / PVC:** `CAPITAL-AI-OPS / PVC-04`
- **Priority:** P1
- **CURRENT_MAIN baseline:** `ba77d1899d4b739dc495621aa2e86c07a44a19e4`

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
