# CAPITAL-AI-CLIENT — Canonical Roadmap

**Project:** `CAPITAL-AI-CLIENT`  
**Folder:** `docs/projects/agent-client/`  
**Owner/PVC:** `CAPITAL-AI-CLIENT / PVC-01`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 contents folded into this file  
**Baseline:** `main@7f06828841546aa07a9ddca63ec8a7eca77e92d6`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

### CLIENT-CARRY-01 — Existing non-terminal CLIENT backlog
Carry forward every non-terminal CLIENT item from the pre-2026-09-13 baseline, including trigger-gated physical runtime work. No physical client runtime is implied merely by this consolidation.

### CLIENT-PR900-01 — Staged chat-entry/client materialization
Materialize the compact staged chat-entry flow only where a productive client/runtime implementation is actually required. Reuse canonical Project/PVC/authority routing; do not create a parallel control plane.

**Exit:** productive need is evidenced; request/identity/capability semantics remain non-authorizing and downstream authority is preserved.

### CLIENT-PR900-02 — Gateway / skill / OAuth-MCP client boundary
Keep discovery and invocation provider-neutral; remote skills/tools remain untrusted until verified. OAuth/MCP/provider activation, connector permission changes and protected execution stay outside PVC-01.

**Exit:** invocation requests preserve provenance/version/integrity/freshness and cannot self-grant capability or approval.

### CLIENT-PR900-03 — F01/F06 prompt and provenance trust
With FINTECH/PVC-15, separate retrieved/history content from instructions, preserve role/session provenance and prove negative trust tests for history-role spoofing and indirect prompt injection.

**Exit:** malformed/untrusted history cannot elevate authority; ownership handoff to FINTECH is explicit.

### CLIENT-PR900-04 — Application MFA path disposition
Inventory productive authentication paths relevant to application MFA/AAL semantics. OPS/PVC-08 supplies provider-state evidence; GOV/Human retains normative lifecycle decisions.

**Exit:** every productive path has an evidence-backed disposition without inventing a global MFA requirement.

## Carried-forward baseline (pre-2026-09-13)

PVC-01 owns the client-side path from attributable Human intent to a structured request handed to the authoritative downstream boundary, plus preservation/rendering of returned response, status and error semantics. Authorization, capability grants, protected execution, production mutation and EventMesh/trace authority remain outside PVC-01. Current runtime decision remains `NO_PHYSICAL_RUNTIME_TRIGGER`.

| ID | Workstream | State | Open work |
|---|---|---|---|
| CLIENT-01 | Inventory / re-correlation | `DONE — PR #858 HUMAN-MERGED` | none |
| CLIENT-02 | Request Contract | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-03 | Identity Handoff | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-04 | Capability Handoff | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-05 | Response Contract | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-06 | Client Security Boundary | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-07 | Testing & Evidence | `CONTRACT EVIDENCE COMPLETE` | runtime tests trigger-gated |
| CLIENT-08 | Project Skill / Plugin Invocation Contract | `CONTRACT IMPLEMENTED` | no remote activation; physical runtime remains trigger-gated |

Active project documents: `README.md`, `ROADMAP.md`, `CLIENT_CONTRACTS.md`, `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md`, `TRACEABILITY.md`, `WORK_PACKAGES.md`.

## Dependencies
OPS runtime/provider evidence; GOV authority; SEC independent verification; FINTECH prompt/history consumer evidence.

## Project exit gate
Exactly one active CLIENT roadmap; all carried-forward and PR-900 CLIENT work is traceable; no foreign PVC is self-closed; physical runtime remains trigger-gated.
