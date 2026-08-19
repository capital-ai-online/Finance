# HUMAN / OWNER Pull Request Approval Policy

**Authority ID:** `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL`  
**Status:** REQUIRED  
**Version:** `2.0.0`  
**Effective from:** 2026-08-11  
**Updated:** 2026-08-19  
**Repository Owner:** `SvenKulessa`  
**Parent trust root:** `/AGENTS.md`

## Purpose and boundary

This policy details the Human/Owner merge boundary for Pull Requests targeting `main`. It is subordinate to the repository-wide Agent Trust Root in `/AGENTS.md` and MUST NOT create a second global agent-governance authority.

AI agents may prepare branches, commits, PRs, evidence and scoped fixes. They MUST NOT self-approve or autonomously merge.

## Current PR / CI state

The current Owner-directed state after the M10 recovery is:

```text
PR OPEN / UPDATE
→ governance / workflow-security checks
→ technical build-and-test according to repository check classification
→ Human/Owner merge decision
→ Human Merge
```

M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` is **SUSPENDED / OFF**. Normal PR technical CI does not require an M10 passkey. Historical M10 cutover/evidence does not reactivate the gate automatically.

A future M10 reactivation requires a new explicit Owner decision, architecture/security impact review and validated fail-closed implementation before it becomes current policy.

## Retired authorization signals

The following are historical/non-authorizing and MUST NOT be reintroduced as implicit CI or merge authority:

- PR-body Owner checkboxes as authorization gates;
- Files-Viewed as a machine authorization signal;
- current-head `💪` / `okay` review rituals;
- labels, reactions or arbitrary review text as Owner authentication;
- a successful build/test result as merge authorization.

Historical PRs and Evidence may retain references to these mechanisms.

## Human Merge control

1. `MERGE` remains Human/Owner-only.
2. CI success is necessary technical evidence where required, but never sufficient authorization.
3. The concrete PR must receive a separate explicit Human merge decision.
4. Agents and connector clients stop before merge unless a future Accepted authority explicitly changes that boundary with equivalent or stronger assurance.
5. Protected external mutations remain separate from repository merge and require their applicable Owner/Control-Plane authorization.

## PR template and evidence

The canonical PR template records scope, authority, risk, baseline, validation and Human Merge requirements. PR-body metadata is evidence, not an authority source.

Minimum merge evidence is:

- final PR head SHA;
- current `main` reconciliation;
- required technical/governance checks on the final head;
- unresolved-review/conflict status;
- Human/Owner merge decision;
- resulting merge commit after the Human performs the merge.

## Owner authentication assurance

GitHub review text does not prove passkey/device binding. Where a protected action requires WebAuthn, TOTP, break-glass or other strong Owner authentication, the corresponding effective control/runbook must be used. The suspended M10 PR-CI mechanism is not inferred from historical documentation.

## Agent capability restriction

AI agents may READ, ANALYZE, PLAN, create scoped branches/commits, open/update authorized PRs, inspect CI and propose scoped fixes according to the effective Roadmap/mandate and `/AGENTS.md`.

AI agents MUST STOP before Human Merge and may not expand their own authority.

## Canonical references

Current authority is resolved through:

- `/AGENTS.md` / `AUTH-GOV-AGENT-TRUST-ROOT`;
- `docs/governance/control-catalog.json` / `CTRL-MERGE-HUMAN-001`;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`;
- effective Accepted ADRs for the concrete protected scope.

`docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` is retained as historical/reactivation design evidence while M10 is suspended; it does not itself activate the gate.