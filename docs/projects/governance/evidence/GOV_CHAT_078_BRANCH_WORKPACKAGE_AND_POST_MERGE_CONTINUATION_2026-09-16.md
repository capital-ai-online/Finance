# CAPITAL-AI-GOV — Branch Work-Package Aggregation and Post-Merge Chat Continuation

**Date:** `2026-09-16`  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary PVC / Owner:** `PVC-05 / CAPITAL-AI-GOV`  
**Work item:** `GOV-CHAT-078`  
**Role:** Owner-decision evidence and non-authorizing implementation trace  
**Baseline:** `main@cf1d8b84f2455c0859f61407773ad9022dff00fa`  
**Branch:** `agent/governance-workpackage-continuation-20260916`  
**Trust root:** `/AGENTS.md@current-main`

## Owner direction

The Human/Owner directed two execution-model improvements:

1. A scoped branch should be able to complete a larger coherent work package before creating a Pull Request, instead of creating a Pull Request after each small internal process.
2. A chat that created a Pull Request should retain a post-create continuation watch so that, after the Human/CODEOWNER merge, project-folder-specific follow-up work can resume automatically from then-current `main`.

This evidence does not create a second authority, Roadmap, queue, merge mechanism or provider control plane. The implementation reuses the existing stable Trust-Root semantics for scoped branches, ordered Roadmap PR execution, `POST_PR_HANDOFF` and `CHAT_RUN_HANDOFF`.

## Branch work-package aggregation

The intended branch unit is one coherent and reviewable **work package**. A work package may contain multiple dependent Roadmap substeps, implementation processes and commits before PR creation when all of the following remain true:

- one canonical Current Project / project folder and Primary Owner remain controlling;
- the substeps share one bounded objective and common package exit gate;
- applicable ADR/ESS/CTRL/AUTH scope remains compatible;
- no required ownership, authority, independent-assurance, protected-mutation or serial-integration boundary is crossed;
- current-main/open-writer correlation remains resolvable;
- the resulting diff remains reviewable as one coherent change.

There is no artificial numeric cap on internal branch processes or commits. The branch should continue through all immediately executable in-scope substeps until the work-package exit gate is reached or a real split boundary is encountered. Finishing one atomic substep alone is not a reason to create a PR.

A new branch / PR is required when the work would otherwise cross a canonical project/Primary-Owner boundary, require a separate authority or Human decision, depend on an unintegrated predecessor, require separate protected external mutation, introduce an independently reviewable risk boundary, encounter unresolved writer/correlation conflict, or become semantically unrelated to the original work-package objective.

## Ordered PR integration remains unchanged

This change does not permit stacked unmerged dependency branches or multiple successor PRs in the same ordered Roadmap lane. The optimization occurs **before** PR creation: more coherent work is completed on the scoped branch before the single bounded Draft PR is opened.

Human/CODEOWNER-only merge remains unchanged.

## Post-merge origin-chat continuation

`POST_PR_HANDOFF` should bind the created PR to an execution-host-local continuation watch whenever the current authorized chat/orchestration host exposes an already-available merge/terminal-outcome event capability.

Minimum binding facts are:

- repository identity;
- PR number;
- Current Project and canonical project folder;
- branch / PR-head identity at registration;
- the fact that the watch belongs to the chat that created the PR.

Opaque chat/session identifiers, provider credentials, webhook secrets or tokens must not be written into repository evidence or the PR body merely to implement continuation.

On `merged == true`, the originating chat resumes a new `CHAT_RUN_HANDOFF` execution pass. Before any new write it re-reads then-current `main`, open PRs/active writers, Project/PVC/Owner mapping, the affected project Roadmap and applicable ADR/ESS/controls. It then consumes required post-merge evidence and continues the highest-priority immediately executable work for that same canonical project folder. A successor branch is created only when the recomputed next work package actually warrants repository changes.

If the PR is closed without merge, the watch resumes only to recompute the queue from then-current `main`; predecessor payload is not assumed.

The continuation watch never grants merge, deployment, protected external mutation, foreign-project ownership or permission expansion.

## Execution-host boundary

The repository can define when and how continuation must occur, but it cannot manufacture an external ChatGPT/Claude/Grok session wake-up transport. Registration therefore uses an already connected/authorized execution-host event or automation capability when available. Repository governance must not install a connector, create provider credentials, add webhook secrets or change OAuth/permissions solely to make the continuation transport exist.

If the active execution host cannot register a terminal-PR event watch for the origin chat, the handoff must report `AUTOMATIC_CONTINUATION_UNAVAILABLE` rather than claim that a trigger exists. This is a capability boundary, not permission to poll, self-merge or create a parallel repository queue.

## Correlation

At branch creation the current main baseline was `cf1d8b84f2455c0859f61407773ad9022dff00fa`. Open PRs #996 (OPS CI stale-event hardening), #997 (SEC provider readback) and #998 (DATA Roadmap identity normalization) were inspected. Their changed-file/project scopes are disjoint from this GOV Trust-Root/evidence work package; no observed open writer owns this evidence path.

## Exit gate

`GOV-CHAT-078` is complete when the Trust Root explicitly permits coherent multi-process work-package aggregation on one scoped branch and requires `POST_PR_HANDOFF` to register origin-chat terminal-outcome continuation when an authorized event capability is actually available, with fail-closed reporting when it is not. Ordered PR integration, Human/CODEOWNER merge, ownership, authority and protected-mutation boundaries remain unchanged.
