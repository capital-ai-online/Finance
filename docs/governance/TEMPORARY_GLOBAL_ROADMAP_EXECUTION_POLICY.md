# Temporary Global Roadmap Execution Policy

**Authority ID:** `AUTH-GOV-JIT-GLOBAL-ROADMAP-EXECUTION`  
**Status:** ACTIVE after Human Merge of ADR-0104 governance package  
**Version:** `1.0.0`  
**Date:** 2026-09-01  
**Parent:** `/AGENTS.md`  
**Decision:** `ADR-0104` / `AUTH-ADR-GOV-JIT-GLOBAL-ROADMAP-2026-09-01`

## Purpose

This policy defines a temporary, Human-Owner-activated cross-project repository execution mode for a single Governance-governed chat.

It allows one chat to execute a previously defined roadmap across multiple explicitly authorized canonical project folders while preserving each project's Primary Owner, technical/domain authority, branch identity, work-claim scope, review boundary and return evidence.

The user-facing phrase **global administrator** is a repository-execution metaphor only. This policy does not create or assign a real Global Administrator, cloud IAM, provider-admin or production-admin role.

## Operative control

`CTRL-GOV-JIT-GLOBAL-ROADMAP-001`

Session mode:

`GOV_GLOBAL_ROADMAP_SESSION`

Maximum activation duration:

`8 hours`

Longer programs are executed through renewed sessions, each requiring fresh correlation and explicit Human Owner activation.

## Mandatory activation manifest

Before requesting activation, the executor must create and display one complete manifest conforming to:

`docs/governance/control-plane/global-roadmap-execution-session.schema.json`

The manifest must contain at least:

- `sessionId`;
- `mode: GOV_GLOBAL_ROADMAP_SESSION`;
- `status: proposed`;
- `authorizedBy: Human/Owner`;
- reason/purpose;
- current-main activation baseline;
- one canonical roadmap path plus its current-main binding;
- exact associated document paths/path prefixes;
- explicit target projects;
- canonical target project folders;
- PVC stages/relationships;
- bounded work items;
- allowed path prefixes per target project;
- `activatedAt` and `expiresAt`;
- `maxDurationHours: 8`;
- `chatBound: true`;
- `repositoryMutationOnly: true`;
- retained protected gates.

The manifest must be specific enough that a later target project, work item or path can be deterministically classified as IN_SCOPE or OUT_OF_SCOPE.

## Activation gate

The session is `active` only after the Human Owner explicitly approves the exact displayed manifest in the same chat.

The approval must cover the concrete:

- roadmap;
- document set;
- target projects;
- work items/path bounds;
- activation time window.

General statements such as “continue”, a previous project approval, task creation permission or a historical administrator role do not activate the session unless they unambiguously approve the displayed activation manifest.

If the roadmap, target-project set, allowed paths or expiry changes materially, the session must be re-presented and re-approved.

## Context-switch protocol

For every authorized project transition, emit:

`[GLOBAL_ROADMAP_CONTEXT_SWITCH -> <TARGET_PROJECT> | PVC-<NN>]`

Before productive work in the target context:

1. resolve current `main` again;
2. read `/AGENTS.md` from that exact current main;
3. resolve target project, folder, PVC and Primary Owner from current canonical repository sources;
4. read the target project's current project surface and relevant roadmap/documents;
5. correlate open PRs;
6. correlate active/exclusive work claims;
7. correlate changed-file and semantic overlap;
8. correlate applicable AUTH/CTRL/ADR/ESS/document identities;
9. verify session is still active and the target work item/path scope is IN_SCOPE.

Any unresolved identity, scope, writer, authority or security conflict is fail-closed.

## Branch and PR isolation

The session is global at the **chat orchestration layer**, not at the branch layer.

Every productive work item must still use:

- a fresh branch from then-current main;
- the canonical target-project folder slug in the branch name;
- one bounded work item;
- one target-owner-aligned work claim where a claim is used;
- target-project-scoped changed files;
- target-project validation/evidence;
- a separate PR for that target-owner work package.

A single branch or PR must not combine productive changes owned by multiple Primary Owners merely because they are part of the same global roadmap session.

The work claim should record the `sessionId` for traceability but session identity does not enlarge its path scope.

## Preserved Human gates

The session does not pre-authorize future repository snapshots.

Before every PR or Draft PR, `CTRL-SDLC-PR-CREATE-001` remains mandatory:

- refresh current main;
- synchronize/correlate candidate;
- report exact Base and Head SHA;
- obtain explicit Human Owner approval for those exact SHAs;
- re-read Base/Head immediately before PR creation.

Human/CODEOWNER merge remains separately required for each concrete PR.

## Preserved protected-action gates

A session does not authorize protected external mutations. Separate current authorization remains required where applicable for:

- production deployment/promotion;
- Render/Supabase/Stripe or other provider production mutation;
- real Owner/Admin IAM elevation;
- secret disclosure/rotation;
- destructive production-data mutation;
- live billing/payment/money/entitlement changes;
- production resource deletion;
- DNS/TLS/domain ownership;
- security-control weakening;
- comparable high-impact operations.

A roadmap may describe these steps, but the session can only advance to the applicable protected gate and must stop until the separate required authorization exists.

## Assurance and decision separation

Global roadmap execution does not collapse independent roles.

In particular:

- CAPITAL-AI-SEC retains independent Security verification and Accepted-Risk boundaries;
- CAPITAL-AI-COMP / competent Legal authority retains legal applicability/classification decisions;
- Quality/assurance projects retain their own verification boundaries;
- Product/domain Primary Owners retain semantic/domain authority even when implementation is executed from the same chat session.

An implementing context may report `IMPLEMENTED` or `EVIDENCE_READY` where applicable but may not self-award independent `VERIFIED/CLOSED` states that belong to another authority.

## Expiry, revocation and invalidation

The session terminates at the earliest of:

1. its `expiresAt` timestamp;
2. explicit Human Owner revocation;
3. completion of all authorized work items;
4. a material Trust Root/authority change that invalidates the activation assumptions;
5. unresolved critical writer/security/scope ambiguity;
6. loss of a required target-project identity or canonical roadmap/document binding.

After termination the session cannot authorize another context switch.

Continuation requires fresh current-main correlation, a new proposed manifest and a new explicit Human Owner activation.

## Scope expansion

Scope expansion is never implicit.

If work reveals a needed project, work item or path not present in the active manifest:

- do not edit it under the current session;
- either request a revised activation manifest from the Human Owner, or
- fall back to `FOREIGN_PROJECT_HANDOFF`.

## Relationship to foreign-project handoff

`FOREIGN_PROJECT_HANDOFF` remains the repository default.

The only exception is a currently active, exact-scope `GOV_GLOBAL_ROADMAP_SESSION` covering the target project, work item and path bounds.

When that exception applies, use the global-roadmap context-switch marker instead of marking the work `REFERRED_NOT_EXECUTED`.

Outside the exact active session scope, the existing handoff contract applies unchanged.

## Audit evidence

For every session retain, without secrets:

- session ID;
- activation manifest;
- Human activation evidence/reference;
- activation current-main SHA;
- roadmap/document bindings;
- activation and expiry timestamps;
- each context switch target and observed current-main SHA;
- per-work-item branch/work-claim/PR references;
- validation status;
- protected gates encountered;
- terminal state: completed / revoked / expired / invalidated.

Evidence is non-authorizing and may not be used to reactivate an expired session.

## Security rationale

The model deliberately mirrors JIT/PAM principles: eligibility is not activation; activation is explicit; privilege is bounded by purpose, resources and time; activity is auditable; elevated scope automatically ends.

These external patterns are design input only. CAPITAL-AI authority remains defined by `/AGENTS.md`, its registries and accepted repository decisions.

## Failure modes / DENY cases

Fail closed when:

- no exact activation manifest was approved;
- session expired or was revoked;
- target project/folder/PVC cannot be resolved from current main;
- work item or path is outside manifest scope;
- target branch mixes Primary Owners;
- exact PR snapshot approval is absent;
- a protected external mutation is reached without separate approval;
- requested action would allow Security/Compliance/Legal self-approval;
- current authority conflicts with the session baseline;
- scope expansion is only inferred from conversational context.
