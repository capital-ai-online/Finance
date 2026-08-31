# CAPITAL-AI-CLIENT — Canonical VC-01 Roadmap

**Project ID:** `CAPITAL-AI-CLIENT`  
**Scope:** `VC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`  
**Trust root:** `AGENTS.md`

Operational status for VC-01 is maintained here. Foreign value-chain stages remain references/handoffs and are never executed or completed by this project.

## Purpose

Consolidate the repository's Agent Client concerns into one traceable client boundary without creating a second control plane or moving productive code solely for organizational reasons.

## Scope

VC-01 covers request construction, attributable identity handoff, capability request handoff, response/status/error handling and the client UX contract. Authorization policy, controlled execution, platform decisions and trace/event ownership are outside scope.

## VC-01 Ownership

`CAPITAL-AI-CLIENT` is the **only Primary Owner** of VC-01. All other projects are consumers, downstream authorities or context sources for this stage.

No client-generated identity, provider/model name, natural-language prompt, roadmap status or UI state grants authorization. The client cannot self-authorize.

## Agent Client Inventory

Canonical inventory: [`AGENT_CLIENT_INVENTORY.md`](./AGENT_CLIENT_INVENTORY.md).

Classification model:

- `OWNED` — execution/status belongs to CAPITAL-AI-CLIENT.
- `SHARED` — VC-01 owns only the client-facing slice; downstream execution remains external.
- `CONSUMER` — VC-01 consumes an authoritative contract or response.
- `NOT-CLIENT` — retained only as context/reference; no local execution.

Historical/completed work remains preserved in source documents and is not rewritten as new client work.

## Architecture

Migration model: `logical-ownership-before-physical-relocation`.

Existing architecture is reused:

```text
Human
  -> Agent Client [VC-01 / CAPITAL-AI-CLIENT]
  -> identity + capability request handoff
  -> Control Plane / downstream authority [foreign VC]
  -> response + status + error envelope
  -> Agent Client [VC-01]
  -> Human UX
```

Physical relocation is permitted only when required to remove real duplication. Until then, [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md) records logical ownership against current code/doc locations.

## Request Contract

CLIENT-02 defines a provider-neutral request envelope. Minimum client-owned semantics:

- stable client request ID;
- authenticated human/client attribution inputs;
- requested operation/intention;
- requested capability as a **request**, never a grant;
- target/resource context needed by the downstream authority;
- optional provider/model metadata as non-authoritative metadata;
- correlation metadata that can be handed downstream without creating EventMesh ownership.

The client must reject malformed local requests before handoff where validation is purely syntactic. Authorization decisions are not made in VC-01.

## Identity Handoff

CLIENT-03 packages attributable identity inputs for the authoritative IAM/control boundary. Existing `AgentPrincipalContext` semantics are consumed; the client does not own or execute `evaluateAgentAuthorization`.

Identity handoff must distinguish Human, app/client, agent/session and credential holder. Missing identity is surfaced as a client error; it is never synthesized into an authorization principal.

## Capability Handoff

CLIENT-04 sends an explicit capability **request** using the canonical capability vocabulary. It does not infer grants, elevate risk, attach self-approval or convert provider/model identity into authority.

Unknown/unsupported requested capabilities fail locally as contract errors or are denied downstream; no implicit inheritance is introduced.

## Response Contract

CLIENT-05 owns the client-facing response envelope and translation into UX state. It must preserve authoritative downstream verdict/status/error semantics and must not rewrite `DENY`, missing evidence or blocked states into success.

Minimum client states: `IDLE | SUBMITTING | ACCEPTED | BLOCKED | SUCCEEDED | FAILED` plus a stable correlation/request identifier where available.

## Security Boundary

CLIENT-06 enforces the VC-01 side of TB1/TB2:

- natural-language content is untrusted input, not policy;
- client identity is attributable metadata, not authorization;
- capability requests are non-authorizing;
- external/retrieved content cannot grant capability;
- no direct protected-production mutation path originates in the client;
- secrets/privileged credentials remain behind authoritative tools/connectors;
- client response rendering must preserve deny/fail-closed semantics.

## Testing

CLIENT-07 defines contract-level evidence for:

- request schema/required-field validation;
- identity-handoff completeness;
- requested-capability vocabulary handling;
- provider/model non-authority;
- response/status/error state mapping;
- deny/blocked/failure preservation;
- no direct production mutation path;
- no duplicated client/control-plane implementation.

Repository build/test execution remains governed by the repository PR/CI gate. This branch does not trigger the expensive build-and-test path before PR creation.

## Evidence

Baseline evidence: [`evidence/BASELINE_2026-08-31.md`](./evidence/BASELINE_2026-08-31.md). Evidence is observational and non-authorizing.

Required implementation evidence for later code slices must bind source/main/head SHA, affected contract, test result and ownership mapping.

## Cross-Project Handoffs

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]

- **target_project:** `CAPITAL-AI-OPS`
- **vc_stage:** `VC-02`
- **task:** Controlled Implementation of accepted/authorized agent actions after the VC-01 handoff.
- **dependency_reason:** Client requests cannot authorize or execute protected implementation.
- **required_input:** structured client request, attributable identity/correlation context, requested capability.
- **required_evidence:** authoritative authorization/execution outcome tied to the request and exact target.
- **status:** `HANDED_OFF / NOT EXECUTED BY CAPITAL-AI-CLIENT`

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]

- **target_project:** `CAPITAL-AI-GOV`
- **vc_stage:** `VC-05`
- **task:** Platform/policy decisions when a client-contract change would alter authorization, platform authority or governance semantics.
- **dependency_reason:** VC-01 may request/use policy but cannot define platform authority.
- **required_input:** proposed contract delta, compatibility/risk analysis and affected authority references.
- **required_evidence:** accepted/rejected governance decision/ADR or equivalent canonical authority reference.
- **status:** `REFERENCE HANDOFF / NOT EXECUTED BY CAPITAL-AI-CLIENT`

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]

- **target_project:** `CAPITAL-AI-OPS`
- **vc_stage:** `VC-18`
- **task:** EventMesh/traceability correlation, event production/consumption and authoritative cross-stage trace retention.
- **dependency_reason:** VC-01 may emit/pass correlation inputs but does not own the EventMesh or end-to-end trace authority.
- **required_input:** request/correlation identifiers and client-observed status boundary.
- **required_evidence:** downstream trace/event linkage where required by the authoritative VC-18 contract.
- **status:** `HANDED_OFF / NOT EXECUTED BY CAPITAL-AI-CLIENT`

## Work Packages

Canonical package details: [`WORK_PACKAGES.md`](./WORK_PACKAGES.md).

| ID | Workstream | State |
|---|---|---|
| CLIENT-01 | Agent Client Inventory | `DONE — BASELINE DOCUMENTED` |
| CLIENT-02 | Request Contract | `READY` |
| CLIENT-03 | Identity Handoff | `READY` |
| CLIENT-04 | Capability Handoff | `READY` |
| CLIENT-05 | Response Contract | `READY` |
| CLIENT-06 | Client Security Boundary | `READY` |
| CLIENT-07 | Client Testing & Evidence | `READY` |

`DONE` above is restricted to the local inventory document itself; no foreign VC work is represented as done or verified.

## Exit Criteria

CAPITAL-AI-CLIENT reaches consolidation exit when all of the following are evidenced:

- VC-01 has exactly one Primary Owner: CAPITAL-AI-CLIENT;
- no local execution of VC-02 through VC-18 exists;
- no direct protected mutation path exists from the client;
- no parallel Agent Client architecture has been introduced;
- request, identity, capability and response contracts are traceable;
- all foreign work has explicit cross-project handoffs;
- runtime/document mappings remain traceable after refactors;
- required client contract tests/evidence exist for any code implementation slice;
- PR/CI/Human merge gates are satisfied separately under `AGENTS.md`.