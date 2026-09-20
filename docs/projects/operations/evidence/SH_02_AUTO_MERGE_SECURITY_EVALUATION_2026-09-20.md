# SH-02 Automated Merge Security Evaluation — 2026-09-20

**Project:** `CAPITAL-AI-OPS`  
**Scope:** Self-Healing Pull Requests  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Observed CURRENT_MAIN:** `7c087994f8569028b05102dd426323f7a571ddad`  
**Current decision:** `NOT_AUTHORIZED / NOT_ENABLED`

## Observed repository state

GitHub repository readback for `capital-ai-online/Finance` reports:

- `allow_auto_merge=false`;
- merge commits are enabled;
- rebase and squash merge are disabled;
- update-branch is enabled;
- the repository is private and organization-owned.

The current trust root is stricter than the provider feature state. It states that the final Pull Request merge is the sole mandatory Human Owner action and explicitly prohibits agents/automation from self-merging or enabling auto-merge. Green CI, automated reviews, labels or metadata cannot create merge authority.

Therefore this SH-02.4 slice MUST NOT enable GitHub auto-merge, merge a PR, weaken rulesets or reinterpret successful checks as authorization.

## Security-conformant future option

A future automated merge mechanism is technically feasible only after a separately reviewed Governance change explicitly changes the merge-authority contract. The safest target is **Human-authorized automatic merge execution**, not autonomous agent merge authority:

```text
exact PR head
 -> required trusted checks PASS
 -> required CODEOWNER/Human review PASS
 -> stale approval invalidation / latest-push protection
 -> conversations resolved
 -> current-main / merge-queue revalidation
 -> Security/Compliance/domain gates PASS
 -> Human explicitly arms merge for the exact PR/head
 -> GitHub performs the merge when all provider-enforced requirements remain satisfied
 -> post-merge production correlation
```

In that model, the Human delegates only the final mechanical execution after all provider-enforced conditions are satisfied; the agent still cannot approve its own work or broaden the merge policy.

### Required controls before any future activation

1. **Trust-root change first.** `/AGENTS.md` must explicitly distinguish Human merge authorization from GitHub's mechanical merge execution. Until then, automatic merge remains prohibited.
2. **Repository setting.** Auto-merge must be enabled at repository level only after the Governance change is Human/CODEOWNER-merged.
3. **Required reviews.** Require Human/CODEOWNER approval; automation/bots do not satisfy the Human authorization requirement.
4. **Stale-head protection.** Dismiss stale approvals and/or require approval of the most recent reviewable push so an approved head cannot silently change.
5. **Required status checks.** Require the canonical Governance, CI, Security and other scope-derived checks from expected trusted apps; no synthetic status may substitute for hosted execution.
6. **No bypass.** Admin/bypass identities used by automation must not bypass the merge policy for ordinary SH PRs.
7. **Current-main freshness.** The exact head/base relationship must be revalidated immediately before merge. If Merge Queue is adopted, CI must also support the `merge_group` event and verify the queued synthetic merge commit.
8. **Protected-scope exception.** Changes to `AGENTS.md`, merge/security workflows, IAM, Security/Compliance authority, secrets, billing, DNS, protected recovery or equivalent trust-boundary files should remain manual-merge-only unless a separately stronger policy is approved.
9. **Independent Security evidence.** A Self-Healing implementation cannot self-award Security acceptance. Required independent findings remain blocking.
10. **Post-merge verification.** The existing Production↔CURRENT_MAIN correlation remains mandatory after the merge and failures enter Self-Healing drift handling rather than being hidden.

## Current conclusion

No auto-merge setting or merge capability is changed by SH-02.4.

The current secure operating model remains:

```text
automatic implementation/validation/self-healing
 -> Human/CODEOWNER final merge
 -> automatic post-merge production correlation
 -> automatic SH package continuation handoff
```

This preserves the current trust root while removing idle pauses between successfully merged Self-Healing slices.
