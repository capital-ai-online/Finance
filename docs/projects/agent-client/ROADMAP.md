# CAPITAL-AI-CLIENT — Canonical Roadmap

**Project:** `CAPITAL-AI-CLIENT`  
**Folder:** `docs/projects/agent-client/`  
**Owner/PVC:** `CAPITAL-AI-CLIENT / PVC-01`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 projection owner-corrected against current main  
**Baseline:** `main@a0134ccf5d212e8badc2e6d2c216c311d8a43d88`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active CLIENT execution projection. Dated, archived and superseded roadmap copies are historical ledger only and are not execution sources. Terminal work is not reopened by consolidation. Foreign-owned work may appear only as an explicit dependency or handoff and cannot be implemented, verified or closed by PVC-01.

Physical CLIENT runtime work is activated only after `RUNTIME_MAPPING.md` records a concrete, current-main-evidenced PVC-01 strangler/refactor trigger. A generic carry-forward statement, documentary consolidation or foreign dependency is not such a trigger. PR #900 remains a derived documentary source only.

## PR #900 / #901 owner-corrected projection

### CLIENT-CARRY-01 — Baseline disposition, not generic active carry

**State:** `GENERIC CARRY CLOSED / NO IMPLICIT ACTIVE BACKLOG`

There is no blanket carry-forward of every historically non-terminal CLIENT item. The current disposition is explicit:

- `CLIENT-01` is terminal via Human-merged PR #858 and has no open work;
- `CLIENT-02` through `CLIENT-06` are completed provider-neutral contract baselines;
- `CLIENT-07` is a completed contract/evidence baseline; runtime tests remain deferred while no physical runtime exists;
- `CLIENT-08` contract delivery is Human-merged via PR #861 and has no open PR/branch work to continue;
- none of these states activates physical CLIENT runtime by itself.

A future runtime slice may reopen only the exact affected PVC-01 concern after a then-current `RUNTIME_MAPPING.md` trigger is evidenced. Foreign-owner work is never reactivated through `CLIENT-CARRY-01`.

### CLIENT-PR900-01 — Staged client request/response boundary

PVC-01 owns only the client-side path from attributable Human intent to a structured request handed to the authoritative downstream boundary: request construction, identity handoff, requested-capability handoff, and preservation/rendering of returned response, status and error semantics. Provider/model metadata and natural-language content remain non-authorizing.

Physical materialization is permitted only when an evidenced PVC-01 runtime trigger requires it. Authorization, capability grants, approval decisions and protected execution remain downstream.

**Exit:** the client boundary preserves attributable intent and deterministic request/identity/capability/response semantics without creating authority or a protected execution path.

### CLIENT-PR900-02 — Provider-neutral discovery / invocation-request boundary

PVC-01 owns provider-neutral discovery and invocation-request semantics only: exact selected identity/version or revision, provenance, integrity/freshness evidence where required, requested capability and the structured downstream invocation request. External skill/tool/MCP metadata and returned content remain untrusted input.

Not CLIENT-owned: OAuth activation, MCP/provider activation, connector permission mutation, protected provider execution, persistent execution, provider credentials and productive provider/Operations configuration. Those concerns remain dependency-only and are already represented by `CAPITAL-AI-OPS`, including `OPS-PR900-04 — Multi-LLM gateway / OAuth2 / MCP convergence`; Security verification remains independently owned where applicable.

**Exit:** the invocation request preserves identity/provenance/integrity/freshness and cannot self-grant capability, approval, provider activation or execution authority. Foreign Operations work is not closed locally.

### CLIENT-PR900-03 — Client session/history/request-provenance boundary

PVC-01 owns only the client-side provenance boundary: attributable session/request identity, preservation of history-role/source metadata as data, and a fail-closed handoff that does not reinterpret retrieved or historical content as authority.

Processing prompt/history content inside the financial/domain consumer, F01/F06 AI-chat trust, and negative tests for indirect prompt injection or history-role spoofing are FINTECH-owned and are already represented by `FIN-PR900-02 — F01/F06 AI-chat trust`. Independent Security verification remains represented by `SEC-PR900-06` and the routed F01/F06 findings.

**Exit:** CLIENT preserves deterministic session/history/request provenance through its handoff boundary; FINTECH consumer processing and negative trust tests remain foreign dependencies and are not closed by CLIENT.

## Owner-routed dependencies — non-executable in CLIENT

| Former / related concern | Current owner projection | CLIENT disposition |
|---|---|---|
| OAuth/MCP/provider activation, permission mutation, protected or persistent provider execution | `CAPITAL-AI-OPS` — `OPS-PR900-04` and applicable OPS stages | `DEPENDENCY_ONLY` |
| F01/F06 consumer prompt/history processing and indirect-injection / history-role-spoof negative tests | `CAPITAL-AI-FINTECH` — `FIN-PR900-02` | `DEPENDENCY_ONLY` |
| F01/F06 and external MCP independent verification | `CAPITAL-AI-SEC` — `SEC-PR900-06` and routed findings | `DEPENDENCY_ONLY` |
| `CLIENT-PR900-04` application MFA/AAL path disposition | `CAPITAL-AI-SEC` — `SEC-PR900-03` auth lifecycle + `SEC-PR900-04` independent application-MFA verification; `CAPITAL-AI-OPS / PVC-08` provides provider/auth-state Operations evidence; `CAPITAL-AI-GOV / Human` retains normative lifecycle decisions | `REMOVED_FROM_CLIENT_EXECUTION / DEPENDENCY_ONLY` |

`CLIENT-PR900-04` is therefore not an executable CLIENT work package. No duplicate OPS, FINTECH, SEC or GOV package is created by this roadmap.

## Carried-forward CLIENT baseline ledger

PVC-01 owns the client-side path from attributable Human intent to a structured request handed to the authoritative downstream boundary, plus preservation/rendering of returned response, status and error semantics. Authorization, capability grants, protected execution, production mutation and EventMesh/trace authority remain outside PVC-01. Current runtime decision remains `NO_PHYSICAL_RUNTIME_TRIGGER`.

| ID | Workstream | State | Current disposition |
|---|---|---|---|
| CLIENT-01 | Inventory / re-correlation | `DONE — PR #858 HUMAN-MERGED` | terminal ledger; no open work |
| CLIENT-02 | Request Contract | `CONTRACT BASELINE COMPLETE` | no runtime work unless exact PVC-01 trigger is evidenced |
| CLIENT-03 | Identity Handoff | `CONTRACT BASELINE COMPLETE` | no runtime work unless exact PVC-01 trigger is evidenced |
| CLIENT-04 | Capability Handoff | `CONTRACT BASELINE COMPLETE` | no runtime work unless exact PVC-01 trigger is evidenced |
| CLIENT-05 | Response Contract | `CONTRACT BASELINE COMPLETE` | no runtime work unless exact PVC-01 trigger is evidenced |
| CLIENT-06 | Client Security Boundary | `CONTRACT BASELINE COMPLETE` | no runtime work unless exact PVC-01 trigger is evidenced |
| CLIENT-07 | Testing & Evidence | `CONTRACT EVIDENCE COMPLETE` | runtime tests exist only with a physical CLIENT implementation |
| CLIENT-08 | Project Skill / Plugin Invocation Contract | `CONTRACT IMPLEMENTED — PR #861 HUMAN-MERGED` | terminal contract delivery; maintenance only, no remote activation or implicit runtime |

Active project documents remain `README.md`, `ROADMAP.md`, `CLIENT_CONTRACTS.md`, `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md`, `TRACEABILITY.md`, `WORK_PACKAGES.md`. Only this `ROADMAP.md` is the canonical CLIENT execution projection.

## Dependencies

OPS runtime/provider evidence and execution; FINTECH consumer prompt/history trust; SEC independent verification and auth-lifecycle assurance; GOV/Human normative authority. All are dependency/handoff relationships and do not transfer foreign execution into PVC-01.

## Project exit gate

Exactly one canonical CLIENT roadmap; only PVC-01-owned request/identity/capability/provenance/response boundaries are locally executable; terminal contract/evidence baselines are not generically reopened; foreign-owner work is dependency-only; and physical CLIENT runtime remains inactive until a current-main-evidenced trigger is recorded in `RUNTIME_MAPPING.md`.
