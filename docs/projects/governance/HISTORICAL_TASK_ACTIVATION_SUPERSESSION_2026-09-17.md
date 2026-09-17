# CAPITAL-AI-GOV — Historical Task Activation Supersession

**Supersession ID:** `CAPITAL-AI-GOV-HISTORICAL-TASK-ACTIVATION-SUPERSESSION-2026-09-17`  
**Date:** `2026-09-17`  
**Project:** `CAPITAL-AI-GOV`  
**Role:** non-authorizing Owner-decision projection; execution semantics resolve only through `/AGENTS.md@CURRENT_MAIN`.

## Decision

`historical/non-terminal != active`

Historical state, an old non-terminal marker, an old branch, an old Pull Request, an old chat, an old generated chat, an old report, an old task register, an old roadmap entry or an old evidence artifact MUST NOT create, preserve, restore, reopen, reactivate, continue or make executable a work item.

A work item is executable only when either:

1. `CURRENT_MAIN` contains a currently active canonical repository/project/Roadmap identity for that exact work item; or
2. the Human/Owner gives fresh direction in the current interaction that explicitly defines or re-authorizes it.

All normal Project/PVC/Owner, dependency, Security/Compliance, validation, branch and Human/CODEOWNER merge gates remain required.

## Superseded task-activation patterns

The following historical aggregate identities and equivalent aliases are retired as activation mechanisms and MUST NOT be used to infer active work:

- `CLIENT-CARRY-01`
- `DATA-CARRY-01`
- `DOC-CARRY-01`
- `FE-CARRY-01`
- `FIN-CARRY-01`
- `GOV-CARRY-01`
- `OPS-CARRY-01`
- `SEC-CARRY-01`
- `COMP-CARRY-01`
- `SEO-CARRY-01`
- `SOCIAL-CARRY-01`

Any historical text that groups old non-terminal work under one of these identifiers is ledger/evidence only. It is not an active backlog, queue, trigger or continuation source.

## Superseded chat continuation mechanisms

`GOV-CHAT-078` is retired and MUST NOT be used as a task, trigger, continuation source or execution rule.

The repository-specific continuation labels `CHAT_RUN_HANDOFF` and `POST_PR_HANDOFF` are retired. A Pull Request reaching a terminal state does not reactivate its originating chat or any predecessor task. A later interaction starts from then-current repository truth and requires a currently active canonical work-item identity or fresh Human/Owner direction.

`GOV_CHAT_HANDOFF_PROJECT_FOLDER_SPLIT.prompt.yaml` and the former `GOV-CHAT-078` continuation evidence are removed.

## Roadmap transition boundary

Canonical project Roadmap files remain temporarily present until the separately requested Roadmap-removal Pull Request. That deletion is intentionally sequenced after completion of the Social Roadmap. During this transition, historical/non-terminal markers and the retired aggregate identities above are non-active ledger text only and cannot authorize or select work.

## Exit condition

This supersession is converged when repository execution no longer depends on retired aggregate activation or origin-chat continuation semantics, and the later dedicated Roadmap-removal Pull Request removes the Roadmap surfaces after the Social Roadmap completion gate.
