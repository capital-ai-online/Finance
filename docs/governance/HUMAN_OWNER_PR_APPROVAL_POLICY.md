# HUMAN / OWNER Pull Request Approval Policy

**Authority ID:** `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL`  
**Status:** REQUIRED  
**Version:** `3.0.0`  
**Effective from:** 2026-08-11  
**Updated:** 2026-08-27  
**Repository Owner:** `SvenKulessa`  
**Parent trust root:** `/AGENTS.md`

## Purpose and boundary

This policy details two separate Human/Owner boundaries for Pull Requests targeting `main`: explicit approval before PR or Draft-PR creation and the later Human-only merge decision. It is subordinate to `/AGENTS.md` and cannot create a second repository agent-governance authority.

AI agents may prepare branches, commits, PR materials, evidence and scoped fixes. They MUST NOT create a PR or Draft PR without the exact-snapshot approval defined below, and they MUST NOT self-approve or autonomously merge.

## Current PR / CI state

```text
FINAL MAIN RE-SYNC + OPEN-PR CORRELATION
→ EXACT-SNAPSHOT HUMAN/OWNER PR-CREATION APPROVAL
→ PR OPEN / UPDATE
→ governance / workflow-security checks
→ technical build-and-test according to repository check classification
→ separate Human/Owner merge decision
→ Human Merge
```

M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` is **SUSPENDED / OFF**. Normal PR technical CI does not require an M10 passkey. Historical M10 cutover/evidence does not reactivate the gate automatically.

### M10 reactivation prohibition

M10 MUST NOT become current policy again until then-current `main` demonstrates all of the following:

- no duplicate/ambiguous ADR, ESS, Authority or current-state references in the correlated Governance architecture;
- one validated responsibility boundary between global Governance and Documentary Governance;
- one reconciled README/version-projection/document-hygiene and Version Manager/Release source-of-truth model;
- router-related governance/version references reconciled so they cannot create a second current-state source;
- structural Governance validation and required hosted CI green on the exact candidate head;
- a new explicit Human/Owner reactivation decision.

Reactivation is therefore an architecture/security/governance change, not a documentation toggle.

## Human/Owner PR creation control

1. The gate applies to every Pull Request and Draft Pull Request, regardless of whether creation uses GitHub UI automation, API, MCP, connector, CLI, an agent tool or a trusted workflow.
2. Immediately before approval is requested, current `main` is refreshed, open/new writers are correlated, the branch is synchronized, conflicts are resolved and necessary low-cost validation is repeated.
3. The Owner receives the exact `main` SHA, candidate branch/head SHA, intended scope, correlation outcome and available validation evidence.
4. PR creation requires explicit Human/Owner approval for that reported snapshot. Approval for the task, branch, commits, checks or general continuation is insufficient.
5. Immediately before creation, `main` and candidate head are read again. Any SHA change invalidates the approval and requires repeated correlation/synchronization plus renewed explicit approval.
6. Agents and connectors stop fail-closed before the external PR-create mutation while approval is absent, ambiguous or stale.

PR-creation approval is single-purpose. It never authorizes merge, deployment, production mutation, security weakening or another Pull Request.

## Retired authorization signals

PR-body checkboxes, Files-Viewed state, `💪`/`okay`, labels, reactions, arbitrary review text and successful CI are non-authorizing as Human identity/merge credentials. Historical evidence may retain them as history.

## Human Merge control

1. `MERGE` remains Human/Owner-only.
2. Required CI is technical evidence, never sufficient authorization.
3. The concrete PR requires a separate explicit Human merge decision.
4. Agents/connectors stop before merge.
5. Protected external mutations remain separate and use their own approval controls.

## PR template and evidence

PR metadata records scope, authority, risk, baseline and validation but does not create authority. Minimum creation-gate evidence includes the reported current-main SHA, candidate head SHA, correlation result and explicit Human/Owner creation approval. Minimum merge evidence separately includes final PR head SHA, current-main reconciliation, required final-head checks, unresolved-conflict/review status and the Human/Owner merge decision.

## Owner authentication assurance

GitHub review text does not prove strong authentication. Where a protected action requires WebAuthn/TOTP/break-glass assurance, the corresponding current effective control must be used. The suspended M10 mechanism is never inferred from historical documentation.

## Agent capability restriction

Agents may READ, ANALYZE, PLAN, create scoped branches/commits, prepare PR materials, inspect CI and propose scoped fixes according to current Roadmap/authority and `/AGENTS.md`. They may open a concrete PR or Draft PR only after the exact-snapshot creation gate is satisfied. They stop before Human Merge and may not expand their own authority.

## Canonical references

- `/AGENTS.md` / `AUTH-GOV-AGENT-TRUST-ROOT`;
- `docs/governance/control-catalog.json` / `CTRL-SDLC-PR-CREATE-001`, `CTRL-CI-M10-001` and `CTRL-MERGE-HUMAN-001`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`;
- `docs/architecture/ROADMAP.md`;
- effective Accepted ADRs for the concrete protected scope.

`docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` remains historical/reactivation design evidence while M10 is suspended; it does not activate the gate.
