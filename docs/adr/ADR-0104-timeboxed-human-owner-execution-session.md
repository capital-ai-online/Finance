# ADR-0104 — Timeboxed Human Owner Execution Session

**Authority ID:** `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`  
**Version:** `1.0.0`  
**Status:** `OWNER-DECIDED / EFFECTIVE ONLY AFTER HUMAN MERGE`  
**Date:** `2026-09-01`  
**Decision Owner:** CAPITAL-AI Human Owner  
**Execution surface:** ChatGPT / GPT-5.6 Sol / GitHub Connector plus explicitly connected execution providers  
**Duration:** `PT8H` from the Human Merge timestamp of the Pull Request that introduces this ADR  
**Expiry:** automatic; `merge_timestamp + PT8H`  
**Project scope:** repository-wide across every canonical `docs/projects/<project>/` owner domain resolved from then-current `main`  
**Supersession type:** temporary, scope-limited, self-expiring  

## 1. Human Owner decision

The Human Owner authorizes one time-boxed execution session in this chat. The Human Owner remains the Human principal. The ChatGPT execution surface does **not** become a Human identity, CODEOWNER, merge principal or independent authority.

For the active session window, the Human Owner delegates repository execution coordination across canonical project boundaries to the session executor so that work may continue in one chat without creating project-to-project Handoff Contracts or separate Handoff Pull Requests solely because ownership/PVC routing changes.

This delegation exists to remove coordination-only PR churn, not to remove technical validation, auditability, rollback discipline or high-impact protected-action controls.

## 2. Activation and expiry

This ADR is non-authorizing on a feature branch. It becomes effective only when the Human Owner merges the Pull Request containing the final correlated candidate into `main`.

Activation instant:

```text
SESSION_START = Human Merge timestamp of the introducing PR
SESSION_END   = SESSION_START + PT8H
```

At `SESSION_END`, every temporary permission and every supersession edge in this ADR expires automatically without a follow-up PR. The ADR remains historical evidence after expiry and must not be interpreted as continuing authority.

If the introducing PR is closed without merge, this session never activates.

## 3. Temporary supersession edges

For the active eight-hour window only, this ADR supersedes the following requirements **only to the stated extent**:

### 3.1 `CTRL-SDLC-CHAT-HANDOFF-001` — `FOREIGN_PROJECT_HANDOFF`

Temporary replacement:

- crossing from one canonical project/PVC owner domain into another does not require `REFERRED_NOT_EXECUTED`;
- the executor does not need to stop productive work merely because the next step belongs to another project folder;
- `[CROSS_PROJECT_HANDOFF -> ...]` blocks and copyable target-project prompts are optional traceability aids rather than execution gates;
- no project-to-project Handoff Contract or Handoff PR is required solely for owner/PVC routing inside this Human-supervised session.

The `POST_PR_HANDOFF` trigger remains active unless separately superseded by a higher effective authority.

### 3.2 Project-local foreign-execution prohibitions

Non-authorizing project README/roadmap statements such as “may not execute foreign PVC stages” are temporarily subordinate to this ADR for execution routing only. Domain semantics, security invariants, financial contracts, independent verification roles and ownership of final acceptance remain unchanged.

### 3.3 Coordination ownership

During the session, one chat may read, analyze, implement, validate and correlate work across multiple canonical project folders without generating an intermediate governance handoff artifact between each project transition.

This is an execution-routing supersession, not a permanent change to the repository project architecture.

## 4. Mutations authorized by the session

The active session is standing Human Owner authorization for **ordinary, reversible engineering mutations** that are necessary to execute owner-directed work and that remain within existing product/domain authorities.

Examples include:

- branch/file/code/document/test/configuration mutations on scoped branches;
- creation, update and closure of non-protected coordination artifacts;
- non-destructive environment/configuration changes with a defined rollback;
- sandbox/test-mode provider mutations;
- reversible application/data migrations that do not delete protected production data, weaken access controls or alter live money/entitlements;
- deployment preparation and deployment operations only through the repository’s currently authorized production promotion path.

Every mutation still requires target verification, minimal sufficient scope, audit evidence where available and a rollback or compensating action appropriate to its risk.

## 5. Protected actions that remain individually gated

The following are **not** blanket-preauthorized by this session and still require a separate explicit Human Owner decision for the concrete target/action immediately before execution:

1. Human/CODEOWNER merge of a Pull Request;
2. creation of a PR/Draft PR where `CTRL-SDLC-PR-CREATE-001` requires exact Base/Head approval;
3. Owner/Admin IAM elevation, recovery or break-glass;
4. reusable secret disclosure, credential export or equivalent sensitive material exposure;
5. destructive or irreversible production-data mutation;
6. live billing, money movement, price/entitlement mutation or other financially binding provider action;
7. production resource deletion;
8. DNS/TLS/domain-ownership mutation;
9. security-control weakening, disabling enforcement or equivalent trust-boundary reduction;
10. activation of M10 `AUTHORIZE_PR_CI` or creation of a second production deployment authority.

A high-impact action may be executed in the same chat after its concrete target, effect and rollback are shown and the Human Owner explicitly approves that action.

## 6. PR and branch behavior during the session

This ADR removes **handoff-only PRs** between projects. It does not turn the repository into direct-to-main mode.

Unless a higher effective Owner decision explicitly changes the rule for a concrete work item:

- direct edits to `main` remain prohibited;
- work is performed on fresh current-main-derived branches;
- final main/open-PR correlation remains required before PR creation;
- exact-snapshot PR creation approval remains required;
- Human/CODEOWNER merge remains separate and mandatory;
- hosted checks remain technical evidence and never merge authority.

Multiple project folders may be touched by one session when the work is one coherent Human-directed work item. Unrelated work items remain independently scoped to prevent accidental writer collisions.

## 7. Security model

This decision follows a Just-enough/Just-in-time privileged-access model:

- time-bounded authority (`PT8H`);
- explicit Human principal remains in control;
- no transfer of Human identity to the model;
- least-privilege mutation scope per concrete task;
- high-impact protected actions retain step-up authorization;
- default rollback and evidence expectations remain active;
- expiration is automatic and fail-closed.

The session does not authorize self-elevation, silent privilege expansion or circumvention of provider-side authentication controls.

## 8. Semantic diff / impact package

| Area | Before | During active ADR-0104 session | After expiry |
|---|---|---|---|
| Foreign project execution | stop + handoff prompt/contract | same chat may execute across project folders | original rule restored |
| Handoff-only PRs | potentially required by routing workflow | not required | original rule restored |
| Human identity | Human Owner only | Human Owner remains Human; model is delegated executor | unchanged |
| Direct `main` writes | prohibited | prohibited | prohibited |
| PR creation | exact Base/Head Human approval | unchanged | unchanged |
| Merge | Human/CODEOWNER only | unchanged | unchanged |
| Ordinary reversible mutations | per-project routing + applicable authorization | standing session authorization across projects | original routing restored |
| High-impact protected mutations | concrete Human approval | concrete Human approval still required | unchanged |
| CI / validation | scope-based | unchanged | unchanged |

## 9. Operational impact

Positive:

- eliminates owner-routing-only PR churn for a bounded Human-supervised work session;
- permits a single chat to complete coherent cross-project roadmaps end-to-end;
- reduces repeated context reconstruction and duplicated handoff documents;
- retains Git history, exact-head PR gates, Human merge and protected-action boundaries.

Trade-offs:

- larger execution scope increases the chance of concurrent-writer overlap;
- the executor must therefore re-read current `main` and open PRs before each new work item or protected mutation;
- project-specific independent verification roles must not be self-certified merely because the same chat performed implementation.

## 10. Regulatory and compliance impact

This ADR changes internal execution routing only. It does not alter legal obligations, regulated-status claims, data-protection duties, financial-service suitability requirements or independent assurance requirements.

`N/A` for any claim that Human Owner delegation itself satisfies external regulatory approval.

## 11. Evidence and audit

For each work item executed under the session, evidence should record where applicable:

- `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`;
- session start and computed expiry;
- current-main SHA and candidate branch/head;
- affected project folders/PVC stages;
- open-writer correlation result;
- mutation target and mutation class;
- validation actually executed;
- rollback or compensating action;
- separate Human approval evidence for any protected action.

No reusable credential or secret is stored in session evidence.

## 12. Rollback

Before activation: close or do not merge the introducing PR.

During activation: the Human Owner may revoke the session at any time in chat. Revocation is effective immediately for future delegated actions; any in-flight protected mutation stops before commit where technically possible.

Repository rollback of changes made during the session uses normal fresh-branch/Human-merge governance. External provider rollback follows the provider/domain runbook and any applicable protected-action gate.

## 13. Supersedes / preserves

Temporarily supersedes during the active window only:

- `AUTH-GOV-AGENT-TRUST-ROOT` only for the `CTRL-SDLC-CHAT-HANDOFF-001 / FOREIGN_PROJECT_HANDOFF` execution-stop requirement;
- `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` only for foreign-project routing/handoff requirements;
- lower-tier project-local non-foreign-execution statements only for execution routing.

Explicitly preserves:

- `CTRL-SDLC-PR-CREATE-001`;
- `CTRL-MERGE-HUMAN-001`;
- `CTRL-CI-HOSTED-001` and applicable scope-based CI;
- `CTRL-SEC-SECRET-001`;
- `CTRL-SEC-LEASTPRIV-001`;
- single verified production deployment authority;
- all higher legal/regulatory/contractual obligations;
- independent Security/Compliance/QM acceptance boundaries where defined by their own authorities.

## 14. Definition of Done

This supersession candidate is merge-ready only when:

1. `ADR-0104` is uniquely reserved and registered;
2. its stable `AUTH-*` identity is registered;
3. the temporary supersession scope is represented in the Governance Control Catalog without weakening preserved controls;
4. current `main` and open PRs are re-correlated immediately before PR approval;
5. governance/JSON structure checks applicable to this documentation/control-plane scope pass;
6. the Human Owner gives exact-snapshot PR-creation approval;
7. activation occurs only through separate Human Merge.
