# CAPITAL-AI-CLIENT — Canonical Roadmap

**Baseline:** `main@896722e55ab1304bd798da6fc8c6f2d9b178a12e`

**Project:** `CAPITAL-AI-CLIENT`  
**Folder:** `docs/projects/agent-client/`  
**Owner/PVC:** `CAPITAL-AI-CLIENT / PVC-01`  
**Status:** `ACTIVE — TEMPORARY CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-21 — Landing baseline exists on current main via merged #1195/#1206; physical runtime trigger remains absent  
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

Current main contains the complete provider-neutral CLIENT-02 through CLIENT-06 contract baseline, CLIENT-07 contract evidence and the Human-merged CLIENT-08 project-skill/plugin invocation contract. Fresh Landing-First correlation on `main@896722e55ab1304bd798da6fc8c6f2d9b178a12e` confirms that the root landing exists and the pinned presentation from merged #1195/#1206 is present. The former landing-creation blocker is superseded. There is still no current-main-evidenced physical PVC-01 runtime trigger. `NO_PHYSICAL_RUNTIME_TRIGGER` therefore remains the operative state.

Fresh Human/Owner direction defines the landing sequence as `LF-00 -> LF-01 -> LF-02+` and assigns CLIENT only the preservation of request/client boundaries when a later phase actually requires a canonical PVC-01 capability. That direction creates a dependency-held CLIENT work item, not permission to introduce client runtime during LF-01.

No generic historical planning container is an active task source. Terminal baseline work is retained in the ledger below; future work is represented only by concrete packages that meet the current activation rule.

## Work packages

| ID | Priority | State | Purpose | Exit gate |
|---|---:|---|---|---|
| `CLIENT-PR900-01` | 3/5 | `CONDITIONAL / NO_PHYSICAL_RUNTIME_TRIGGER` | Staged client request/response boundary | attributable intent plus deterministic request/identity/capability/response semantics are preserved without creating authority or protected execution |
| `CLIENT-PR900-02` | 3/5 | `CONDITIONAL / NO_PHYSICAL_RUNTIME_TRIGGER` | Provider-neutral discovery / invocation-request boundary | exact identity/version/provenance/integrity/freshness are preserved and the request cannot self-grant capability, approval, provider activation or execution |
| `CLIENT-PR900-03` | 4/5 | `CONDITIONAL / NO_PHYSICAL_RUNTIME_TRIGGER` | Client session/history/request-provenance boundary | deterministic session/history/request provenance reaches the downstream consumer without retrieved/history content being reinterpreted as authority |
| `CLIENT-RUNTIME-01` | 3/5 | `DEPENDENCY_HELD` | Physical runtime trigger assessment | `RUNTIME_MAPPING.md` records a concrete current-main-evidenced PVC-01 strangler/refactor trigger before implementation begins |
| `CLIENT-LF-01` | 4/5 | `DEPENDENCY_HELD / LANDING_BASELINE_PRESENT` | Landing-First client/request boundary readiness | LF-01 has independent PASS evidence and a later dependency-ready landing phase requires a canonical PVC-01 capability; no productive landing provider/runtime dependency is introduced by CLIENT beforehand |

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

### CLIENT-LF-01 — Landing-First client/request boundary readiness

**Goal:** preserve the canonical PVC-01 request/client boundary for later landing phases without creating a speculative runtime or importing FE/OPS/FINTECH authority.  
**Fresh Owner direction:** `CAPITAL-AI-LANDING-FIRST-INTEGRATION-01..03` supplied in the 2026-09-21 interaction; non-authorizing projection resolved through `/AGENTS.md@CURRENT_MAIN`.  
**Current gate:** Landing creation is satisfied on CURRENT_MAIN. Remaining gating is limited to later phase need, #1209 desktop stabilization where relevant, independent SEC/QM evidence, and the existing CLIENT physical-runtime trigger.  
**Observed dependency: merged #1195/#1206 establish landing existence/presentation; #1209 is the remaining FE desktop stabilization writer and does not itself create CLIENT ownership.
**Allowed now:** contract/evidence correlation continues; landing existence no longer blocks CLIENT.  
**Prohibited before LF-01 PASS:** new client runtime, provider initialization, entitlement authority, pricing calls, scoring authority, browser-local business authority, or any duplicate request/session implementation.  
**Continuation condition:** start CLIENT runtime work only when a later dependency-ready phase requires a canonical client/request capability and `CLIENT-RUNTIME-01` records a concrete current-main trigger; landing creation itself is no longer a blocker.  
**Evidence:** [`evidence/CLIENT_LANDING_FIRST_CORRELATION_2026-09-21.md`](./evidence/CLIENT_LANDING_FIRST_CORRELATION_2026-09-21.md).

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
