# CAPITAL-AI-CLIENT — Roadmap 2026-09-13

**Project:** `CAPITAL-AI-CLIENT`  
**Folder:** `docs/projects/agent-client/`  
**Owner/PVC:** `CAPITAL-AI-CLIENT / PVC-01`  
**Status:** `ACTIVE — CANONICAL DATED ROADMAP`  
**Baseline:** `main@9634053b222725db69d557f61d44d77b9eb8cb04` (PR #900 merged)  
**Superseded baseline:** `archive/CAPITAL_AI_CLIENT_ROADMAP_SUPERSEDED_2026-09-13.md`

## Consolidation rule

All non-terminal work packages from the superseded baseline remain carried forward with their existing IDs, constraints, dependencies and exit gates unless this file explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history stays archival and is not reopened. PR #900 is a derived documentary source only; this roadmap is the execution projection.

## Active work packages

### CLIENT-CARRY-01 — Existing non-terminal CLIENT backlog
Carry forward every non-terminal CLIENT item from the archived baseline, including trigger-gated physical runtime work. No physical client runtime is implied merely by this consolidation.

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

## Dependencies
OPS runtime/provider evidence; GOV authority; SEC independent verification; FINTECH prompt/history consumer evidence.

## Project exit gate
Exactly one active CLIENT roadmap; all carried-forward and PR-900 CLIENT work is traceable; no foreign PVC is self-closed; physical runtime remains trigger-gated.