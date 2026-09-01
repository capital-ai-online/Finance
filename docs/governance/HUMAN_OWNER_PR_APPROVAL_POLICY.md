# HUMAN / OWNER Pull Request Approval Policy

**Authority ID:** `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL`  
**Status:** REQUIRED  
**Version:** `3.2.0`  
**Effective from:** 2026-08-11  
**Updated:** 2026-09-01  
**Repository Owner:** `SvenKulessa`  
**Parent trust root:** `/AGENTS.md`

## Purpose and boundary

This policy details two separate Human/Owner boundaries for Pull Requests targeting `main`: explicit approval before PR or Draft-PR creation and the later Human-only merge decision. It is subordinate to `/AGENTS.md` and cannot create a second repository agent-governance authority.

AI agents may prepare branches, commits, PR materials, evidence and scoped fixes. They MUST NOT create a PR or Draft PR without the exact-snapshot approval defined below unless an effective explicitly scoped authority conditionally replaces only that approval surface, and they MUST NOT self-approve or autonomously merge.

## Current PR / CI state

```text
FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ EXACT-SNAPSHOT HUMAN/OWNER PR-CREATION APPROVAL OR VALID SCOPED DELEGATION
→ PR OPEN / UPDATE
→ governance / workflow-security checks
→ technical build-and-test according to repository check classification
→ separate Human/Owner merge decision
→ Human Merge
```

The former M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` productive runtime is **RETIRED / OFF** after Human Merge of PR #691. Normal PR technical CI does not require or expect an M10 implementation.

Repository-wide and web-application-wide current-state discovery MUST NOT search for, expect, reconstruct or report missing M10 runtime/router/UI/workflow components as a gap. Historical M10 evidence remains non-authorizing and may be inspected only when an explicit audit/history task requires it.

Any future passkey/PR-CI authorization mechanism is a new separately scoped Human/Owner architecture/security/governance decision. It is not an M10 reactivation backlog.

## Human/Owner PR creation control

1. The gate applies to every Pull Request and Draft Pull Request, regardless of whether creation uses GitHub UI automation, API, MCP, connector, CLI, an agent tool or a trusted workflow.
2. Immediately before approval is requested, current `main` is refreshed, open/new writers are correlated, the branch is synchronized, conflicts are resolved and necessary low-cost validation is repeated.
3. The Owner receives the exact `main` SHA, candidate branch/head SHA, intended scope, correlation outcome and available validation evidence.
4. PR creation requires explicit Human/Owner approval for that reported snapshot unless a current effective scoped delegation explicitly and conditionally replaces only this approval prompt for the exact work/chat/immutable-project-set/current-project context. Approval for the task, branch, commits, checks or general continuation is otherwise insufficient.
5. Immediately before creation, `main` and candidate head are read again. Any SHA change invalidates snapshot-bound approval/delegation correlation and requires repeated correlation/synchronization.
6. Agents and connectors stop fail-closed before the external PR-create mutation while required authority is absent, ambiguous or stale.

PR-creation approval or delegated PR-create authority is single-purpose. It never authorizes merge, deployment, production mutation, security weakening or another unrelated Pull Request.

## Retired authorization signals

PR-body checkboxes, Files-Viewed state, `💪`/`okay`, labels, reactions, arbitrary review text and successful CI are non-authorizing as Human identity/merge credentials. Historical evidence may retain them as history.

## Human Merge control

1. `MERGE` remains Human/Owner-only.
2. Required CI is technical evidence, never sufficient authorization.
3. The concrete PR requires a separate explicit Human merge decision.
4. Agents/connectors stop before merge.
5. Protected external mutations remain separate and use their own approval controls.

## PR template and evidence

PR metadata records scope, authority, risk, baseline and validation but does not create authority. Minimum creation-gate evidence includes the reported current-main SHA, candidate head SHA, correlation result and the applicable explicit Human/Owner creation approval or valid explicitly scoped delegation. Minimum merge evidence separately includes final PR head SHA, current-main reconciliation, required final-head checks, unresolved-conflict/review status and the Human/Owner merge decision.

## Owner authentication assurance

GitHub review text does not prove strong authentication. Where a protected action requires WebAuthn/TOTP/break-glass assurance, the corresponding current effective control must be used. Retired M10 material is not a current authentication mechanism and is never inferred from historical documentation.

## Agent capability restriction

Agents may READ, ANALYZE, PLAN, create scoped branches/commits, prepare PR materials, inspect CI and propose scoped fixes according to current Roadmap/authority and `/AGENTS.md`. They may open a concrete PR or Draft PR only after the applicable creation authority is satisfied. They stop before Human Merge and may not expand their own authority.

## Canonical references

- `/AGENTS.md` / `AUTH-GOV-AGENT-TRUST-ROOT`;
- `docs/governance/control-catalog.json` / `CTRL-SDLC-PR-CREATE-001`, `CTRL-CI-M10-001` and `CTRL-MERGE-HUMAN-001`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`;
- `docs/architecture/ROADMAP.md`;
- effective Accepted ADRs for the concrete protected scope.

`docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` is historical audit/design evidence only. It is not a current implementation prerequisite, discovery target, reactivation plan or authorization mechanism.
