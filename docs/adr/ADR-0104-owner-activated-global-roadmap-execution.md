# ADR-0104 — Owner-activated temporary global roadmap execution

**Authority ID:** `AUTH-ADR-GOV-JIT-GLOBAL-ROADMAP-2026-09-01`  
**Status:** ACCEPTED — effective only after Human Merge of this governance package  
**Version:** `1.0.0`  
**Date:** 2026-09-01  
**Owner:** Human Owner / CAPITAL-AI-GOV  
**Parent trust root:** `/AGENTS.md`

## Context

CAPITAL-AI normally enforces strict project ownership. A chat working in one canonical project must hand productive work belonging to another Primary Owner to that target project through `FOREIGN_PROJECT_HANDOFF`.

That default is appropriate for independent work, but it creates avoidable fragmentation when the Human Owner has already defined one cross-project roadmap and wants one Governance-governed chat to execute the roadmap sequentially across several canonical project folders.

The required capability resembles privileged-access-management Just-In-Time activation: elevated execution must be explicit, temporary, purpose-bound, least-privileged, auditable and automatically expire. External PAM guidance is advisory input only and does not create repository authority.

## Decision

Introduce a new Governance policy authority:

`AUTH-GOV-JIT-GLOBAL-ROADMAP-EXECUTION`

and operative control:

`CTRL-GOV-JIT-GLOBAL-ROADMAP-001`.

The control permits an Owner-activated `GOV_GLOBAL_ROADMAP_SESSION` in one chat. During an active session, that chat may execute repository work across the explicitly authorized canonical project folders and Primary Owners of a pre-defined roadmap without emitting a normal foreign-project handoff for each in-scope switch.

This is an **execution delegation, not an ownership transfer**.

## Activation contract

A session becomes active only when all of the following are true:

1. current `main` and `/AGENTS.md` are freshly resolved;
2. the roadmap and associated documents are canonical repository paths and bound to the observed current-main commit;
3. all target projects, project folders, PVC relationships, work items and allowed path prefixes are explicitly enumerated;
4. the session contains `activatedAt` and `expiresAt` with a duration of at most eight hours;
5. the session is bound to the current chat and may not be reused in another chat;
6. the assistant presents the complete activation manifest to the Human Owner;
7. the Human Owner explicitly approves that exact manifest in the chat.

A task request, general approval, previous approval, role label or historical authorization is not session activation.

## Execution model

While active, the same chat may change target project context using:

`[GLOBAL_ROADMAP_CONTEXT_SWITCH -> <TARGET_PROJECT> | PVC-<NN>]`

Before each context switch, the executor must re-read current `main`, `/AGENTS.md`, the target project's canonical project surface, open Pull Requests, active/exclusive work claims, changed-file overlap and semantic/authority overlap.

Each work item remains isolated:

- one bounded work item per branch;
- branch uses the target project's canonical folder slug;
- work claim identifies the target project and the global-roadmap session ID;
- changed files must stay within the work item's authorized target scope;
- one branch/PR may not combine productive work owned by different Primary Owners;
- target project authority and technical/domain contracts remain controlling.

## Rights that are not delegated

Session activation does not authorize:

- creation of a Pull Request or Draft Pull Request without the normal exact Base/Head Human approval;
- Human/CODEOWNER merge;
- deployment or production promotion;
- production/provider mutation;
- Owner/Admin IAM elevation or real provider Global Administrator assignment;
- secret disclosure or secret rotation outside separately authorized automation;
- live billing, payment, money or entitlement mutation;
- destructive production-data mutation;
- DNS/TLS/domain-ownership mutation;
- security-control weakening;
- independent Security `VERIFIED/CLOSED` decisions or Accepted Risk;
- legal/compliance applicability decisions reserved to the competent owner.

These gates remain separate and are evaluated when a concrete protected action is reached.

## Expiry and revocation

A session expires at the earliest of:

- `expiresAt`;
- explicit Human Owner revocation;
- completion of all authorized work items;
- a material Governance/authority change that invalidates the activation baseline;
- unresolved project identity, writer, security or scope ambiguity.

Expired or revoked sessions cannot be revived implicitly. Continuation requires a freshly correlated manifest and new explicit Human Owner activation.

## Foreign-project fallback

`FOREIGN_PROJECT_HANDOFF` remains the default rule.

If the target project, work item or path is not explicitly inside the active session manifest, or the session is expired/revoked/ambiguous, the executor must stop local foreign implementation and use the existing cross-project handoff contract.

## Consequences

### Positive

- One chat can execute a known cross-project roadmap without repeated context reconstruction.
- Primary ownership and per-project branch/claim boundaries remain observable.
- Privileged cross-project execution is temporary and auditable rather than permanent.
- Existing PR, merge, production and independent-assurance gates remain intact.

### Trade-offs

- More pre-switch correlation is required inside a long-running chat.
- Session manifests must be explicit enough to prevent scope creep.
- Long roadmaps exceeding eight hours require re-activation rather than indefinite privilege.

## Rejected alternatives

### Permanent Global Administrator role for the agent

Rejected. It violates least privilege, creates durable cross-project authority and conflates repository execution with provider IAM.

### One global branch/PR for the complete roadmap

Rejected. It destroys Primary Owner isolation, complicates review and creates broad rollback/merge blast radius.

### Reuse normal `FOREIGN_PROJECT_HANDOFF` for every step

Retained as the default fallback, but insufficient for explicitly Owner-directed one-chat roadmap execution.

## Security properties

The design follows least-privilege and JIT principles:

- explicit activation;
- purpose/scope binding;
- short duration;
- per-context revalidation;
- auditable session identity;
- automatic expiry;
- fail-closed ambiguity;
- no inherited production or merge authority.

## Verification

The governance consistency regression test must verify that:

- the new control has one stable identity;
- the Trust Root names the session mode and its maximum duration;
- project ownership remains unchanged;
- exact-snapshot PR approval and Human Merge remain mandatory;
- the handoff fallback remains mandatory outside an active in-scope session;
- the machine-readable activation schema is referenced by the policy/control.
