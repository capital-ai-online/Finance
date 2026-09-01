# CAPITAL-AI-CLIENT — Canonical PVC-01 Roadmap

**Project ID:** `CAPITAL-AI-CLIENT`  
**Scope:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Baseline:** `main@9be95dd753f962a789312fec77571e2a9778b586`  
**Trust root:** `AGENTS.md`

Operational status for PVC-01 is maintained here. Foreign project value-chain stages remain references/handoffs and are never executed or completed by this project.

## Purpose

Consolidate the repository's Agent Client concerns into one traceable client boundary without creating a second control plane or moving productive code solely for organizational reasons.

## Scope

PVC-01 covers request construction, attributable identity handoff, capability request handoff, response/status/error handling and the client UX contract. Authorization policy, controlled execution, platform decisions and trace/event ownership are outside scope.

## PVC-01 Ownership

`CAPITAL-AI-CLIENT` is the **only Primary Owner** of PVC-01. All other projects are consumers, downstream authorities or context sources for this stage.

No client-generated identity, provider/model name, natural-language prompt, roadmap status or UI state grants authorization. The client cannot self-authorize.

## Current re-correlation

Current project evidence: [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md).

The re-correlation resolved current main to `9be95dd753f962a789312fec77571e2a9778b586`, refreshed project identity to the canonical `PVC-01` namespace, found no open PR writer during the pre-write check and found no productive Agent Client runtime path satisfying the physical strangler/refactor trigger.

Therefore the smallest conforming implementation is the provider-neutral contract baseline in [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md). A physical TypeScript Agent Client module remains deferred until an evidenced productive duplication/drift trigger exists.

## Agent Client Inventory

Canonical inventory: [`AGENT_CLIENT_INVENTORY.md`](./AGENT_CLIENT_INVENTORY.md).

Classification model:

- `OWNED` — execution/status belongs to CAPITAL-AI-CLIENT.
- `SHARED` — PVC-01 owns only the client-facing slice; downstream execution remains external.
- `CONSUMER` — PVC-01 consumes an authoritative contract or response.
- `NOT-CLIENT` — retained only as context/reference; no local execution.

Historical/completed work remains preserved in source documents and is not rewritten as new client work.

## Architecture

Migration model: `logical-ownership-before-physical-relocation`.

Existing architecture is reused:

```text
Human
  -> Agent Client [PVC-01 / CAPITAL-AI-CLIENT]
  -> identity + capability request handoff
  -> Control Plane / downstream authority [foreign PVC]
  -> response + status + error envelope
  -> Agent Client [PVC-01]
  -> Human UX
```

Physical relocation is permitted only when required to remove real duplication. Until then, [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md) records logical ownership against current code/doc locations.

## Request Contract — CLIENT-02

Current contract: [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md#client-02--request-contract).

Minimum client-owned semantics:

- stable client request ID;
- authenticated human/client attribution inputs;
- requested operation/intention;
- requested capability as a **request**, never a grant;
- target/resource context needed by the downstream authority;
- optional provider/model metadata as non-authoritative metadata;
- correlation metadata that can be handed downstream without creating EventMesh ownership.

The client rejects malformed local requests before handoff where validation is purely syntactic. Authorization decisions are not made in PVC-01.

## Identity Handoff — CLIENT-03

Current contract: [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md#client-03--identity-handoff).

PVC-01 packages attributable identity inputs for the authoritative IAM/control boundary. Existing `AgentPrincipalContext` semantics are consumed; the client does not own or execute `evaluateAgentAuthorization`.

Identity handoff distinguishes Human, app/client, agent/session and credential holder. Missing identity is surfaced as a client error; it is never synthesized into an authorization principal.

## Capability Handoff — CLIENT-04

Current contract: [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md#client-04--capability-handoff).

PVC-01 sends an explicit capability **request** using the canonical capability vocabulary. It does not infer grants, elevate risk, attach self-approval or convert provider/model identity into authority.

Unknown/unsupported requested capabilities fail locally as contract errors or are denied downstream; no implicit inheritance is introduced.

## Response Contract — CLIENT-05

Current contract: [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md#client-05--response-status-and-error-contract).

PVC-01 owns the client-facing response envelope and translation into UX state. It preserves authoritative downstream verdict/status/error semantics and does not rewrite `DENY`, missing evidence or blocked states into success.

Minimum client states:

`IDLE | SUBMITTING | ACCEPTED | BLOCKED | SUCCEEDED | FAILED`

Stable request/correlation identifiers are preserved where available.

## Security Boundary — CLIENT-06

Current contract: [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md#client-06--client-security-boundary).

PVC-01 enforces the client side of TB1/TB2:

- natural-language content is untrusted input, not policy;
- client identity is attributable metadata, not authorization;
- capability requests are non-authorizing;
- external/retrieved content cannot grant capability;
- no direct protected-production mutation path originates in the client;
- secrets/privileged credentials remain behind authoritative tools/connectors;
- client response rendering preserves deny/fail-closed semantics.

## Testing & Evidence — CLIENT-07

Runtime contract tests are created only when a physical PVC-01 implementation slice is introduced. The current strangler scan did not justify such a slice, so this work item does not manufacture runtime `PASS` evidence.

Current evidence records:

- exact source-main correlation;
- open-writer result;
- repository-wide request/identity/capability/response scan;
- strangler trigger decision;
- contract baseline outputs;
- explicit no-runtime-test disposition.

Future physical slices must test:

- request schema/required-field validation;
- identity-handoff completeness;
- requested-capability vocabulary handling;
- provider/model non-authority;
- response/status/error state mapping;
- deny/blocked/failure preservation;
- no direct production mutation path;
- no duplicated client/control-plane implementation.

Repository build/test execution remains governed by the repository PR/CI gate.

## Evidence

- Current re-correlation/strangler evidence: [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md).
- Historical initial baseline: [`evidence/BASELINE_2026-08-31.md`](./evidence/BASELINE_2026-08-31.md).

Required implementation evidence for any later code slice must bind source/main/head SHA, affected contract, actual test result and ownership mapping.

## Cross-Project Handoffs

The compatibility marker remains `VC-*`; project-routing identity is explicit `PVC-*` per `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`.

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-02`
- **target_project:** `CAPITAL-AI-OPS`
- **target_project_folder:** `docs/projects/operations/`
- **primary_owner:** `CAPITAL-AI-OPS`
- **task:** Controlled Implementation of accepted/authorized agent actions after the PVC-01 handoff.
- **reason:** Client requests cannot authorize or execute protected implementation.
- **dependency:** structured client request, attributable identity/correlation context, requested capability.
- **required_evidence:** authoritative authorization/execution outcome tied to the request and exact target.
- **verification_gate:** downstream authoritative execution/evidence contract.
- **status:** `REFERRED_NOT_EXECUTED`

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **target_project:** `CAPITAL-AI-GOV`
- **target_project_folder:** `docs/projects/governance/`
- **primary_owner:** `CAPITAL-AI-GOV`
- **task:** Platform/policy decisions when a client-contract change would alter authorization, platform authority or governance semantics.
- **reason:** PVC-01 may request/use policy but cannot define platform authority.
- **dependency:** proposed contract delta, compatibility/risk analysis and affected authority references.
- **required_evidence:** accepted/rejected governance decision/ADR or equivalent canonical authority reference.
- **verification_gate:** canonical Governance/Platform Director decision boundary.
- **status:** `DEPENDENCY`

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-18`
- **target_project:** `CAPITAL-AI-OPS`
- **target_project_folder:** `docs/projects/operations/`
- **primary_owner:** `CAPITAL-AI-OPS`
- **task:** EventMesh/traceability correlation, event production/consumption and authoritative cross-stage trace retention.
- **reason:** PVC-01 may emit/pass correlation inputs but does not own EventMesh or end-to-end trace authority.
- **dependency:** request/correlation identifiers and client-observed status boundary.
- **required_evidence:** downstream trace/event linkage where required by the authoritative PVC-18 contract.
- **verification_gate:** authoritative EventMesh/trace contract.
- **status:** `DEPENDENCY`

## Work Packages

Canonical package details: [`WORK_PACKAGES.md`](./WORK_PACKAGES.md).

| ID | Workstream | State |
|---|---|---|
| CLIENT-01 | Agent Client Inventory | `DONE — RE-CORRELATED` |
| CLIENT-02 | Request Contract | `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED` |
| CLIENT-03 | Identity Handoff | `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED` |
| CLIENT-04 | Capability Handoff | `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED` |
| CLIENT-05 | Response Contract | `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED` |
| CLIENT-06 | Client Security Boundary | `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED` |
| CLIENT-07 | Client Testing & Evidence | `EVIDENCE CURRENT — RUNTIME TESTS DEFERRED` |

`COMPLETE` above is restricted to the local contract baseline. It does not claim physical runtime implementation, downstream execution or foreign project verification.

## Exit Criteria

CAPITAL-AI-CLIENT reaches consolidation exit when all of the following are evidenced:

- PVC-01 has exactly one Primary Owner: CAPITAL-AI-CLIENT;
- no local execution of PVC-02 through PVC-18 exists;
- no direct protected mutation path exists from the client;
- no parallel Agent Client architecture has been introduced;
- request, identity, capability and response contracts are traceable;
- all foreign work has explicit cross-project handoffs;
- runtime/document mappings remain traceable after refactors;
- required client contract tests/evidence exist for any code implementation slice;
- PR/CI/Human merge gates are satisfied separately under `AGENTS.md`.
