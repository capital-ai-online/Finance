# HUMAN / OWNER Pull Request Approval Policy

**Authority ID:** `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL`  
**Status:** REQUIRED  
**Version:** `4.0.0`  
**Effective from:** Human Merge of the introducing governance change  
**Updated:** 2026-09-15  
**Repository Owner:** `SvenKulessa`  
**Parent trust root:** `/AGENTS.md`

## Purpose and boundary

This policy defines the Human/Owner boundary for Pull Requests targeting `main` after the PR has been created. It evolves the same stable authority from pre-create Human approval to correlation-gated automated PR creation followed by Human/Owner review and Human/CODEOWNER-only merge.

AI agents may prepare scoped branches, commits, validation evidence, PR metadata and the Pull Request or Draft Pull Request itself when the pre-create correlation gate defined below passes. They MUST NOT self-approve, self-merge, enable auto-merge, release, deploy or perform a protected external mutation merely because PR creation is permitted.

For Human-readable work, the controlling development context remains:

`Project Value Chain / PVC -> project Roadmap -> applicable ADR -> applicable ESS -> code/tests/evidence`.

Machine-readable registries and stable IDs support integrity and traceability; they do not replace that Human-readable navigation model.

## Current PR / CI state after activation

```text
FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ PRE-CREATE CORRELATION GATE
→ AUTOMATED DRAFT PR CREATION FOR PASS
→ POST-PR HUMAN/OWNER REVIEW / APPROVAL BOUNDARY
→ governance / workflow-security checks
→ technical build-and-test according to repository check classification
→ FINAL PR-HEAD / CURRENT-MAIN CORRELATION
→ separate Human/CODEOWNER merge decision
→ Human Merge
→ SUCCESSOR ROADMAP PR MAY START FROM NEW CURRENT MAIN
```

The former M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` productive runtime remains **RETIRED / OFF** after Human Merge of PR #691. Normal PR technical CI does not require or expect an M10 implementation.

Repository-wide and web-application-wide current-state discovery MUST NOT search for, expect, reconstruct or report missing M10 runtime/router/UI/workflow components as a gap. Historical M10 evidence remains non-authorizing and may be inspected only when an explicit audit/history task requires it.

## Correlation-gated automated PR creation

After this version is effective through Human Merge, a separate Human approval prompt before PR or Draft-PR creation is not required.

A PR creation surface — GitHub workflow, API, MCP, connector, CLI or agent tool — may create the bounded PR only after all of the following are true:

1. Current Project, project folder, Primary PVC and Primary Owner are resolved from then-current canonical project mapping.
2. The applicable project Roadmap item or explicit Owner scope is resolved and remains bounded.
3. The branch is a fresh scoped branch created from a known current-main baseline and has been synchronized with then-current `main` before creation.
4. Current `main`, branch head and merge base are read immediately before the create mutation.
5. Open Pull Requests and active writers are re-read.
6. Changed-file, semantic, namespace, authority, ownership and security overlap is correlated fail-closed.
7. Any required pre-create validation is current and truthful. `NOT RUN` is never represented as `PASS`; validation that is intentionally post-PR is reported as `NOT RUN` / pending hosted checks rather than fabricated pre-create evidence.
8. The intended PR title conforms to the current project/client naming rule.
9. The current-main canonical PR template can be rendered completely before the external create mutation.
10. The final create-correlation result is `PASS`.

If any required authority, ownership, correlation or create-safety fact is missing, stale, conflicting or unresolved, creation is `BLOCKED`.

The pre-create evidence is a **correlation record**, not an approval credential. It binds at minimum the current `main` SHA, branch-head SHA, merge base, deterministic changed-file set, intended title, project/PVC/Owner/Roadmap scope, material overlap result and the truthful validation status available at creation time.

PR creation does not authorize merge, deployment, release acceptance, production mutation, security weakening or another unrelated Pull Request.

## Ordered automated Roadmap PR lane

Automated Roadmap execution MUST preserve predecessor order so that later work cannot silently depend on an unintegrated predecessor.

For one ordered automated Roadmap execution lane:

1. At most one not-yet-integrated automated PR is active at a time.
2. A successor PR is not created while its predecessor remains open and unmerged.
3. After the predecessor is Human/CODEOWNER-merged, the successor starts from the resulting then-current `main`, repeats Project/PVC/Owner/Roadmap resolution and all pre-create correlation, and receives its own fresh scoped branch.
4. If the predecessor is closed without merge, the successor MUST NOT assume its payload. The queue is recomputed from then-current `main` and the Roadmap before new implementation proceeds.
5. If unrelated Human or parallel work changes `main` between ordered PRs, the successor is correlated against that new state; creation order does not waive overlap review.
6. Stacked unmerged dependency branches MUST NOT be used as a substitute for this serial integration rule unless a later explicit Human/Owner authority replaces this exact sequencing rule.

This makes the automated creation order and intended integration order deterministic while minimizing avoidable changed-file, semantic, namespace, authority and baseline correlations created by the automation itself.

## Post-create Human/Owner boundary

Human authority begins at the created Pull Request rather than at a separate pre-create approval prompt.

The created PR MUST expose enough information for Owner review, including:

- project, folder, Primary PVC and Primary Owner;
- source and target project identity where relevant;
- bounded Roadmap/work-package scope and exit gate;
- branch and PR-head identity;
- current-main baseline used for pre-create correlation;
- materially relevant changed files and implementation summary;
- correlation result and known open risks;
- required hosted checks and truthful `NOT RUN` / pending states;
- the explicit Human/CODEOWNER merge boundary.

The Owner may request changes, reject/close the PR, approve review readiness or merge after the final merge correlation and required checks. No exact chat phrase is required merely to create the PR after this version is effective.

## Main and branch-head drift

Before PR creation, any `main` or branch-head movement makes prior correlation stale and requires fresh correlation against the exact state that will be used for creation.

After PR creation, any PR-head or `main` movement that is material to merge readiness makes the previous pre-merge correlation stale. The final PR-head/current-main correlation MUST be repeated before Human merge readiness is asserted.

Changed-file overlap is a correlation trigger, not automatic proof of safety or failure. Same-file, same-symbol/API/schema, authority/control, dependency/configuration and namespace overlap require stronger semantic review. Uncertainty blocks the protected step rather than being converted to `PASS`.

## Human Merge control

1. Every merge into `main` MUST originate from a Pull Request targeting `main`; direct-to-`main` edits and merge paths that bypass the PR boundary remain prohibited.
2. `MERGE` remains Human/Owner-only. Agents, chats, connectors and delegated execution sessions do not perform the merge or enable auto-merge.
3. Immediately before the Human merge decision, the current `main` SHA and current PR-head SHA MUST be re-read and the PR MUST be correlated against then-current `main`.
4. Final correlation covers merge-base/current-main drift plus relevant changed-file, semantic, namespace, authority, security and concurrent-writer conflicts.
5. If `main` or the PR head changed after the last valid pre-merge correlation, that correlation is stale and MUST be repeated.
6. Required CI is technical evidence, never sufficient authorization. Required final-head checks and unresolved conflict/review status remain part of merge evidence where applicable.
7. The concrete PR requires a distinct Human/CODEOWNER merge decision.
8. Protected external mutations remain separate and use their own approval controls.

## Canonical PR body and evidence

Every creation surface MUST read `.github/pull_request_template.md` from then-current `main` and preserve its complete required structure, template version marker, production-baseline governance IDs and Human/CODEOWNER merge boundary. Unresolved placeholders block creation.

For an agent branch with exactly one new `.ai/work-claims/*.json` claim, the trusted agent Draft-PR workflow/rendering path is preferred where available. For an authorized connector/API path without a new claim, claim-only fields use justified `N/A`; no claim is invented solely for PR creation.

The PR body and correlation evidence do not create merge authority.

## Bootstrap / activation boundary

**No self-bootstrap:** the Pull Request introducing version `4.0.0` MUST itself obey the PR-creation approval rules effective on then-current `main` before Human Merge. Candidate branch semantics cannot authorize their own PR creation.

Only after Human/CODEOWNER Merge may this post-create Owner model govern later PR-creation flows. Until then, the effective `3.4.0` pre-create Approval Envelope remains controlling for the introducing PR.

## Retired pre-create approval surface after activation

After version `4.0.0` becomes effective:

- the canonical `PR-CREATION APPROVAL` chat block is no longer a required pre-create authorization surface;
- the exact phrase `PR Erstellung : Freigegeben` is no longer required before future PR creation;
- `APPROVAL_STILL_VALID` / `REAPPROVAL_REQUIRED` are retained only as historical/helper compatibility vocabulary and MUST NOT be treated as active future create credentials;
- Approval Envelope fingerprints, reactions, labels, checkboxes, reviews and successful CI remain non-authorizing for merge;
- old approval helpers may remain temporarily for historical compatibility but MUST NOT be invoked by the effective trusted PR-create path.

## Owner authentication assurance

GitHub review text does not by itself prove strong authentication. Where a protected action requires WebAuthn/TOTP/break-glass assurance, the corresponding then-current effective control must be used. Retired M10 material is not a current authentication mechanism.

## Agent capability restriction

Agents may READ, ANALYZE, PLAN, create scoped branches/commits, prepare PR materials/evidence and, after this version is effective, create the bounded PR or Draft PR when the final pre-create correlation gate is `PASS`. They stop before Human Merge and may not expand their own authority.

## Canonical references

- `/AGENTS.md` / `AUTH-GOV-AGENT-TRUST-ROOT`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`;
- affected project `ROADMAP.md`;
- applicable accepted ADRs and active ESS;
- `docs/governance/control-catalog.json` / `CTRL-SDLC-PR-CREATE-001`, `CTRL-SDLC-CHAT-HANDOFF-001`, `CTRL-CI-M10-001` and `CTRL-MERGE-HUMAN-001`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`;
- `.github/workflows/open-agent-draft-pr.yml`;
- `.github/pull_request_template.md`.

`docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` remains historical audit/design evidence only. It is not a current implementation prerequisite, discovery target, reactivation plan or authorization mechanism.
