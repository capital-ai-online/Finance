# HUMAN / OWNER Pull Request Approval Policy

**Authority ID:** `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL`  
**Status:** REQUIRED  
**Version:** `2.1.0`  
**Effective from:** 2026-08-11  
**Updated:** 2026-08-19  
**Repository Owner:** `SvenKulessa`  
**Parent trust root:** `/AGENTS.md`

## Purpose and boundary

This policy details the Human/Owner merge boundary for Pull Requests targeting `main`. It is subordinate to `/AGENTS.md` and cannot create a second repository agent-governance authority.

AI agents may prepare branches, commits, PRs, evidence and scoped fixes. They MUST NOT self-approve or autonomously merge.

## Current PR / CI state

```text
PR OPEN / UPDATE
→ governance / workflow-security checks
→ technical build-and-test according to repository check classification
→ Human/Owner merge decision
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

## Retired authorization signals

PR-body checkboxes, Files-Viewed state, `💪`/`okay`, labels, reactions, arbitrary review text and successful CI are non-authorizing as Human identity/merge credentials. Historical evidence may retain them as history.

## Human Merge control

1. `MERGE` remains Human/Owner-only.
2. Required CI is technical evidence, never sufficient authorization.
3. The concrete PR requires a separate explicit Human merge decision.
4. Agents/connectors stop before merge.
5. Protected external mutations remain separate and use their own approval controls.

## PR template and evidence

PR metadata records scope, authority, risk, baseline and validation but does not create authority. Minimum merge evidence includes final PR head SHA, current-main reconciliation, required final-head checks, unresolved-conflict/review status and the Human/Owner merge decision.

## Owner authentication assurance

GitHub review text does not prove strong authentication. Where a protected action requires WebAuthn/TOTP/break-glass assurance, the corresponding current effective control must be used. The suspended M10 mechanism is never inferred from historical documentation.

## Agent capability restriction

Agents may READ, ANALYZE, PLAN, create scoped branches/commits, open/update authorized PRs, inspect CI and propose scoped fixes according to current Roadmap/authority and `/AGENTS.md`. They stop before Human Merge and may not expand their own authority.

## Canonical references

- `/AGENTS.md` / `AUTH-GOV-AGENT-TRUST-ROOT`;
- `docs/governance/control-catalog.json` / `CTRL-CI-M10-001` and `CTRL-MERGE-HUMAN-001`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`;
- `docs/architecture/ROADMAP.md`;
- effective Accepted ADRs for the concrete protected scope.

`docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` remains historical/reactivation design evidence while M10 is suspended; it does not activate the gate.
