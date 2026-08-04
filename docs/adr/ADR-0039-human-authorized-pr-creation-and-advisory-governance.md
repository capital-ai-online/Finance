# ADR-0039 — Human-Authorized Pull Request Creation and Advisory Process Governance

**Status:** Proposed  
**Date:** 2026-08-03  
**Decision owners:** CAPITAL-AI Owner / Platform Director / Security & Compliance  
**Supersedes:** ADR-0036 process-control rules only where explicitly stated below  

## Context

The PR-first multi-agent governance introduced hard CI gates for three process concerns: a 15-minute claim-to-PR deadline, production-baseline consistency, and exclusive work-claim/overlap enforcement. These controls were executed in the same GitHub Actions path as sandbox candidate validation.

This conflated two different questions:

1. **Can the candidate build and pass technical quality checks?**
2. **Should a Pull Request be created, sequenced, merged or released?**

A successful sandbox build proves technical feasibility only. It must not create authority to open or merge a Pull Request. Conversely, process drift or concurrent-work warnings must not make an otherwise valid technical build appear broken.

## Decision

### 1. Explicit human authorization before every PR

ChatGPT and other interactive agents MUST request explicit user authorization before creating every new Pull Request.

The authorization is:

- single-use;
- specific to the described PR scope;
- not inherited from a previous PR, branch, build, test, merge or general instruction;
- invalidated by a material scope expansion.

Before requesting authorization, the agent SHOULD summarize the intended scope, known risks, available technical validation, production drift and concurrent PR overlap.

### 2. Remove the 15-minute PR SLA

The claim-to-PR 15-minute deadline is deleted. No elapsed-time rule forces PR creation, invalidates a branch, or fails CI.

### 3. Production baseline becomes advisory process evidence

Production-state inspection remains a useful diagnostic and release-safety input, but it is removed from mandatory sandbox/build authorization.

Production drift MUST be surfaced to the human operator. The human decides whether to rebase, rescope, sequence, defer or proceed.

### 4. Work-claim / single-writer overlap becomes advisory process evidence

Changed-file and optional work-claim overlap checks remain useful for multi-agent coordination, but they no longer fail technical CI merely because another PR lacks a claim or has overlapping scope.

Detected conflict MUST be disclosed before PR creation or merge. Resolution choices include rescoping, sequencing, waiting, superseding duplicates or explicitly accepting the coordination risk.

### 5. Technical CI is restricted to candidate integrity

The PR technical-validation pipeline may gate on:

- dependency installation;
- production dependency vulnerability audit;
- TypeScript/type checking;
- automated tests;
- production build;
- deployment-readiness verification;
- workflow-security verification;
- other directly technical security/compliance checks.

A green technical pipeline is necessary evidence but never constitutes PR-creation or merge approval.

### 6. Merge/release authority remains human where required

This ADR does not weaken human/CODEOWNER approval for architecture, security, billing, IAM or other protected/high-impact changes. It separates that decision from sandbox build mechanics.

## Consequences

### Positive

- Build failures represent actual technical failures instead of workflow/process disagreements.
- ChatGPT cannot silently turn a successful test into a new PR.
- Parallel-agent conflicts remain visible without blocking independent technical validation.
- Production drift remains available for release decisions without contaminating build status.
- The workflow is easier to reason about and less prone to deadlock when multiple agents operate concurrently.

### Trade-offs

- Work claims become advisory rather than hard exclusive locks.
- Human operators must actively evaluate disclosed overlap and drift.
- Repository rulesets/CODEOWNERS remain important for final protected merges.

## Implementation

- `.github/workflows/pr-governance.yml` becomes a technical-validation workflow only.
- `AGENTS.md` defines explicit user authorization before every PR.
- `scripts/pr/createWorkClaim.mjs` removes PR-deadline language.
- `scripts/pr/validateWorkClaim.mjs` becomes an advisory coordination report rather than a failing CI gate.
- `.github/pull_request_template.md` records explicit PR-creation authorization and states that build evidence is non-authorizing.
- `scripts/pr/productionPreflight.mjs` remains available as an on-demand diagnostic/release evidence tool.

## Non-goals

This ADR does not authorize direct writes to protected production configuration, remove least-privilege workflow controls, remove CODEOWNER review, weaken secret handling, or allow models to self-approve protected changes.

## Rollback

If this governance model is reverted, the replacement must preserve the distinction between technical validation and human authorization. Reintroducing a time-based automatic PR creation requirement is explicitly rejected unless a future ADR documents a new human-approved rationale.
