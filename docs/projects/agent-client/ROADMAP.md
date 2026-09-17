# CAPITAL-AI-CLIENT — Canonical Roadmap

**Project:** `CAPITAL-AI-CLIENT`  
**Folder:** `docs/projects/agent-client/`  
**Owner/PVC:** `CAPITAL-AI-CLIENT / PVC-01`  
**Status:** `ACTIVE — TEMPORARY CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-17 — historical task activation removed; physical runtime trigger remains absent  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Reconciliation rule

`historical/non-terminal != active`

This Roadmap remains temporarily present until the separately requested Roadmap-removal Pull Request after completion of the Social Roadmap. Historical task states, chat context, old branches and prior planning containers are evidence only and cannot preserve, restore, reopen or activate work.

Execution requires a currently active canonical identity from `CURRENT_MAIN` or fresh Human/Owner direction in the current interaction.

## Vision

A provider-neutral Agent Client that converts attributable Human intent into deterministic, auditable request/response interactions without becoming an authorization, protected-execution or provider-control authority.

## Mission

Own the complete `PVC-01` client boundary from request construction through identity/capability/provenance handoff to response/status/error handling. Preserve exact downstream semantics, keep retrieved/provider content non-authorizing, and materialize physical runtime only when a current-main-evidenced CLIENT trigger proves that a concrete implementation is required.

## Scope and invariants

- `CAPITAL-AI-CLIENT` is the sole Primary Owner of `PVC-01`.
- Authorization, capability grants, protected execution, provider activation, production mutation and EventMesh/trace authority remain downstream.
- Natural-language content, provider/model metadata, history content and tool annotations never become authority.
- Logical ownership precedes physical relocation; no second Agent Client runtime is introduced for symmetry.
- `RUNTIME_MAPPING.md` is the trigger surface for any physical CLIENT implementation.
- Foreign-owner work remains dependency-only and is never marked complete by CLIENT.

## Current state

Current main contains the complete provider-neutral CLIENT-02 through CLIENT-06 contract baseline, CLIENT-07 contract evidence and the Human-merged CLIENT-08 project-skill/plugin invocation contract. There is still no current-main-evidenced physical PVC-01 runtime trigger. `NO_PHYSICAL_RUNTIME_TRIGGER` therefore remains the operative state.

No generic historical planning container is an active task source. Terminal baseline work is retained in the ledger below; future work is represented only by concrete packages that meet the current activation rule.

## Work packages

| ID | Priority | State | Purpose | Exit gate |
|---|---:|---|---|---|
| `CLIENT-PR900-01` | 3/5 | `CONDITIONAL / NO_PHYSICAL_RUNTIME_TRIGGER` | Staged client request/response boundary | attributable intent plus deterministic request/identity/capability/response semantics are preserved without creating authority or protected execution |
| `CLIENT-PR900-02` | 3/5 | `CONDITIONAL / NO_PHYSICAL_RUNTIME_TRIGGER` | Provider-neutral discovery / invocation-request boundary | exact identity/version/provenance/integrity/freshness are preserved and the request cannot self-grant capability, approval, provider activation or execution |
| `CLIENT-PR900-03` | 4/5 | `CONDITIONAL / NO_PHYSICAL_RUNTIME_TRIGGER` | Client session/history/request-provenance boundary | deterministic session/history/request provenance reaches the downstream consumer without retrieved/history content being reinterpreted as authority |
| `CLIENT-RUNTIME-01` | 3/5 | `DEPENDENCY_HELD` | Physical runtime trigger assessment | `RUNTIME_MAPPING.md` records a concrete current-main-evidenced PVC-01 strangler/refactor trigger before implementation begins |

The status values above do not activate a package by themselves. A package is executable only after the current activation rule is satisfied.

### CLIENT-PR900-01 — Staged client request/response boundary

**Goal:** materialize the client-side path from attributable Human intent to a structured request only when a physical runtime trigger exists.  
**Scope:** request construction, identity handoff, requested-capability handoff and preservation/rendering of returned response/status/error semantics.  
**Dependencies:** authoritative downstream authorization/execution boundary.  
**Gate:** `CLIENT-RUNTIME-01` is satisfied on then-current main.  
**Exit:** the client boundary preserves attributable intent and deterministic request/identity/capability/response semantics without creating authority or a protected execution path.

### CLIENT-PR900-02 — Provider-neutral discovery / invocation-request boundary

**Goal:** preserve exact discovery and invocation-request semantics without activating a provider or remote execution plane.  
**Scope:** selected identity/version or revision, provenance, integrity/freshness where required, requested capability and structured downstream invocation request.  
**Dependencies:** OPS-owned provider/OAuth/MCP activation where applicable.  
**Gate:** `CLIENT-RUNTIME-01` is satisfied for a concrete invocation consumer.  
**Exit:** invocation requests cannot self-grant capability, approval, provider activation or execution authority.

### CLIENT-PR900-03 — Client session/history/request-provenance boundary

**Goal:** preserve attributable session/request identity and history-role/source metadata as data.  
**Scope:** client-side provenance and fail-closed downstream handoff only.  
**Dependencies:** FINTECH consumer trust processing and independent Security verification where applicable.  
**Gate:** a physical CLIENT consumer path exists.  
**Exit:** deterministic provenance is preserved; downstream prompt/history processing and Security negative verification remain owner-correct dependencies.

### CLIENT-RUNTIME-01 — Physical runtime trigger assessment

**Goal:** prevent speculative physical Client architecture.  
**Scope:** current-main inventory and `RUNTIME_MAPPING.md`.  
**Exit:** either a concrete duplication/drift/refactor trigger is evidenced and freshly activated into the exact affected CLIENT package, or `NO_PHYSICAL_RUNTIME_TRIGGER` remains explicitly current.

## Dependency-held work

| Concern | Owner projection | CLIENT disposition |
|---|---|---|
| OAuth/MCP/provider activation, permission mutation, protected or persistent provider execution | `CAPITAL-AI-OPS` | `DEPENDENCY_ONLY` |
| Consumer prompt/history processing and negative trust tests | `CAPITAL-AI-FINTECH` | `DEPENDENCY_ONLY` |
| Prompt/history and external MCP independent verification | `CAPITAL-AI-SEC` | `DEPENDENCY_ONLY` |
| Application MFA/AAL lifecycle and independent verification | GOV/Human + OPS evidence + SEC verification | `DEPENDENCY_ONLY` |

## Terminal ledger

| ID | State | Disposition |
|---|---|---|
| `CLIENT-01` | `DONE — PR #858 HUMAN-MERGED` | terminal inventory/re-correlation |
| `CLIENT-02` | `CONTRACT BASELINE COMPLETE` | request contract |
| `CLIENT-03` | `CONTRACT BASELINE COMPLETE` | identity handoff |
| `CLIENT-04` | `CONTRACT BASELINE COMPLETE` | capability handoff |
| `CLIENT-05` | `CONTRACT BASELINE COMPLETE` | response contract |
| `CLIENT-06` | `CONTRACT BASELINE COMPLETE` | client security boundary |
| `CLIENT-07` | `CONTRACT EVIDENCE COMPLETE` | runtime tests require a new physical implementation trigger |
| `CLIENT-08` | `CONTRACT IMPLEMENTED — PR #861 HUMAN-MERGED` | provider-neutral project-skill/plugin invocation contract |

Terminal ledger entries are evidence only and never reopen themselves.

## Dependencies

OPS runtime/provider evidence and execution; FINTECH consumer prompt/history trust; SEC independent verification and auth-lifecycle assurance; GOV/Human normative authority.

## Project exit gate

Exactly one temporary CLIENT roadmap exists; all PVC-01 work is represented by concrete packages; historical/non-terminal state never self-activates; terminal contract/evidence work is not reopened; foreign-owner work remains dependency-only; physical CLIENT runtime stays inactive until `RUNTIME_MAPPING.md` records a reproducible current-main trigger and the task is freshly active.
