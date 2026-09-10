# CAPITAL-AI-CLIENT — Canonical PVC-01 Roadmap

**Project ID:** `CAPITAL-AI-CLIENT`  
**Scope:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Status:** `ACTIVE — CONTRACT BASELINE COMPLETE / PHYSICAL RUNTIME GATED / CLIENT-08 SEPARATE`  
**Correlation date:** `2026-09-10`  
**Correlation baseline:** `main@c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0`  
**Trust root:** `/AGENTS.md@current main` (`Control Plane 2.9.0`)

Operational status for PVC-01 is maintained here. Foreign PVC stages remain dependencies/routing targets and are never executed or completed by this project.

## Purpose

Consolidate Agent Client concerns into one traceable client boundary without creating a second control plane, duplicating downstream authority, or moving productive code solely for organizational reasons.

The project owns the client-side path from attributable Human intent to a structured request handed to the authoritative downstream boundary, plus preservation/rendering of returned response, status and error semantics.

## Current-main correlation — 2026-09-10

Current correlation resolves:

- `CAPITAL-AI-CLIENT` -> `docs/projects/agent-client/` -> `PVC-01` -> Primary Owner `CAPITAL-AI-CLIENT`;
- current `main` is `c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0`;
- `0` open Pull Requests at correlation time;
- the retained work claim `CAPITAL-AI-CLIENT-CONTRACT-BASELINE-R2-2026-09-01` is `released`, so it is not an active writer claim;
- branch `agent/agent-client-snyk-ui-cleanup-20260910` is stale (`0` ahead / `17` behind current main) and therefore does not represent parallel unmerged CLIENT content;
- PR `#693` is Human-merged and established the CLIENT-02 through CLIENT-06 provider-neutral contract baseline plus CLIENT-07 evidence;
- PR `#691` is Human-merged, belongs to `CAPITAL-AI-OPS`, and retired the former M10 productive runtime; M10 is historical and is not a CLIENT implementation gap;
- historical PR `#668` remains closed/unmerged and non-authorizing;
- current repository search finds no productive `requestedCapability` implementation and no physical `AgentClientRequestBuilder`, `AgentClientResponseAdapter` or `AgentClientStatusModel` runtime component;
- `src/platform/Security/agentIam.ts` remains the canonical downstream IAM/capability authority surface consumed by PVC-01; `evaluateAgentAuthorization` remains outside the client boundary;
- ESS-0019 v1.2.0 remains ACCEPTED and provider-neutral; it explicitly does not enable productive remote skill loading;
- ADR-0104 v1.5.0 remains ACCEPTED, but no ACTIVE activation is evidenced for this chat; therefore the exact Human/Owner PR-creation approval gate in current `/AGENTS.md` applies;
- withdrawn post-PVC routing overlays are not current policy; project routing resolves through `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md`, this Roadmap, applicable ADR/ESS, then code/tests/evidence.

### Correlation decision

`NO_PHYSICAL_RUNTIME_TRIGGER` remains the correct PVC-01 runtime decision. The current bounded work is documentation/contract correlation hygiene only. CLIENT-08 remains the next feature-contract work item but must be executed later on a separate fresh branch/PR slice.

## Architecture

Migration model: `logical-ownership-before-physical-relocation`.

```text
Human
  -> Agent Client [PVC-01 / CAPITAL-AI-CLIENT]
  -> attributable identity + requested capability handoff
  -> authoritative control/execution boundary [foreign PVC]
  -> response + status + error envelope
  -> Agent Client [PVC-01]
  -> Human UX
```

Authorization policy, capability grants, protected execution, platform decisions, production mutation, release/deployment and EventMesh/trace authority remain outside PVC-01.

---

## CLIENT-01 — Agent Client Inventory / Re-correlation

**State:** `DONE — CONTRACT BASELINE MERGED / ACTIVE DOCS RE-CORRELATED`

Completed implementation/evidence:

- repository-wide Agent Client inventory and strangler scan;
- ownership and writer-collision check;
- current runtime/document mapping;
- foreign execution-surface classification;
- PR #693 Human-merged contract-baseline implementation;
- active CLIENT document refresh against `main@c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0`;
- no open PR writer, no active CLIENT work claim, and no evidenced physical runtime trigger.

The seven active project documents are `README.md`, `ROADMAP.md`, `CLIENT_CONTRACTS.md`, `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md`, `TRACEABILITY.md` and `WORK_PACKAGES.md`. Historical evidence files retain their recorded baselines and are not rewritten merely to look current.

---

## CLIENT-02 — Request Contract

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

[`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md#client-02--request-contract) defines stable request identity, attributable identity handoff, operation, requested capability, target context and optional non-authoritative provider/model/correlation metadata.

The client performs only syntactic fail-closed validation. A capability request is never a grant.

**Implemented on main:** contract baseline via PR #693.  
**Open runtime work:** none until the physical-runtime trigger is met.

---

## CLIENT-03 — Identity Handoff

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Existing `AgentPrincipalContext` semantics are consumed. Missing attribution is not synthesized. Human, app/client, agent/session and credential-holder attribution remain distinguishable. `evaluateAgentAuthorization` stays downstream.

**Implemented on main:** contract baseline via PR #693.  
**Open runtime work:** none until a productive PVC-01 consumer is evidenced.

---

## CLIENT-04 — Capability Handoff

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Requested capability uses the canonical capability vocabulary. Unknown values fail closed; provider/model metadata, natural language and correlation metadata never create authority, approval or implicit inheritance.

**Implemented on main:** contract baseline via PR #693.  
**Open runtime work:** none until a productive PVC-01 consumer is evidenced.

---

## CLIENT-05 — Response Contract

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Canonical client lifecycle:

`IDLE | SUBMITTING | ACCEPTED | BLOCKED | SUCCEEDED | FAILED`

Downstream `DENY`, missing evidence, policy blocks, business failures and transport failures remain semantically distinct and are never rewritten into success.

**Implemented on main:** contract baseline via PR #693.  
**Open runtime work:** none until a productive response/status consumer is evidenced.

---

## CLIENT-06 — Client Security Boundary

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

PVC-01 preserves:

- natural-language/retrieved/plugin/skill content as untrusted data;
- identity attribution without authorization invention;
- request-not-grant capability semantics;
- no direct protected provider/production mutation path;
- no client-held privileged tool credentials;
- deny/failure/redaction semantics through UX rendering;
- current exact Human/Owner PR-creation approval and Human/CODEOWNER merge boundaries unless a separately evidenced effective authority explicitly applies;
- no implicit authority from provider/model identity, plugins, skills or retrieved tool metadata.

**Implemented on main:** contract baseline via PR #693.  
**Open runtime work:** none until a productive client slice exists.

---

## CLIENT-07 — Testing & Evidence

**State:** `CONTRACT EVIDENCE COMPLETE — ACTIVE DOC CORRELATION REFRESHED / RUNTIME TESTS DEFERRED`

The contract/evidence baseline was merged by PR #693. Historical evidence files retain their original baselines. Current correlation metadata is maintained in the seven active project documents. No physical PVC-01 runtime slice exists, so runtime/build/test PASS is not claimed.

Future physical slices must test at minimum:

- missing request ID;
- incomplete identity handoff;
- unknown requested capability;
- provider/model privilege-elevation attempt;
- retrieved content containing approval instructions;
- downstream `DENY`/`BLOCKED` preservation;
- transport error distinction;
- production mutation remaining request-only at PVC-01;
- duplicate implementation scan.

---

## CLIENT-08 — Project Skill / Plugin Invocation Contract

**State:** `OPEN — SEPARATE FRESH BRANCH/PR SLICE REQUIRED`

### Goal

Define the PVC-01 client-side contract that allows a chat/execution client to discover and invoke project-appropriate reusable skill context derived from canonical project/PVC mapping without creating a second authority plane.

### PVC-01-owned scope

- provider-neutral project-skill discovery/invocation semantics;
- canonical `project -> project folder -> PVC -> Primary Owner` reuse;
- stable skill identity/version/provenance expectations;
- untrusted skill/plugin/tool metadata handling;
- request-not-grant capability semantics;
- request/correlation preservation;
- fail-closed behavior for missing, ambiguous, stale, untrusted or unauthorized skill metadata;
- fallback to canonical PVC/Roadmap/ADR/ESS navigation;
- prohibition of parallel control/routing planes and client-held privileged credentials.

### Explicitly outside PVC-01

- installing, connecting, enabling, disabling or changing permissions of plugins/apps/connectors/MCP hosts;
- persistent server-side workflow/job execution;
- authorization/policy evaluation;
- security approval or supply-chain attestation authority;
- protected deployment/production mutation;
- autonomous remote-skill activation.

### Dependency / handoff gates

- external plugin/app mutation requires a separate explicit Human/Owner request under `/AGENTS.md`;
- persistent Skill Market Sync implementation belongs to the applicable `CAPITAL-AI-OPS` stage after the CLIENT contract is defined;
- material repository-authority changes route to `CAPITAL-AI-GOV / PVC-05`;
- ESS-0019 does not enable productive remote skill loading.

### Exit criteria

- one provider-neutral CLIENT skill-invocation contract exists;
- canonical PVC/project mapping is reused rather than duplicated;
- no remote skill is activated merely because it was discovered;
- provenance/version/integrity expectations are explicit;
- fail-closed behavior is defined for ambiguous or untrusted skill input;
- capability/approval/merge/deploy authority remains downstream;
- OPS/GOV dependencies are explicit and not locally marked complete;
- no physical Agent Client module is introduced unless the runtime trigger is independently met.

**Execution rule:** CLIENT-08 is not part of the current correlation-hygiene slice. Start it only after this slice completes its PR lifecycle, using then-current main and a fresh conforming CLIENT branch.

---

## Physical runtime gate

**State:** `DEFERRED — CONDITION NOT MET`

A physical Agent Client module is permitted only when current-main evidence proves at least one of:

- duplicate productive client request construction in two or more paths;
- inconsistent productive identity/capability handoff causing drift;
- duplicated productive response/status mapping with divergent behavior;
- a concrete productive consumer would reduce duplication through a shared client module without importing downstream authority.

### 2026-09-10 trigger check

| Trigger | Result |
|---|---|
| duplicate productive client request construction | `NOT TRIGGERED` |
| inconsistent productive identity/capability handoff | `NOT TRIGGERED` |
| duplicated divergent response/status mapping | `NOT TRIGGERED` |
| evidenced productive duplication reduced by shared client module | `NOT TRIGGERED` |
| productive `requestedCapability` client implementation | `NOT FOUND` |
| physical Agent Client logical-component implementation | `NOT FOUND` |

Current relocation state: `NO_PHYSICAL_RUNTIME_TRIGGER`.

---

## Consolidated work-package status

| ID | Workstream | Main implementation status | Current open work |
|---|---|---|---|
| CLIENT-01 | Inventory / re-correlation | `DONE — PR #693 MERGED` | active-document correlation lifecycle for this slice |
| CLIENT-02 | Request Contract | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-03 | Identity Handoff | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-04 | Capability Handoff | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-05 | Response Contract | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-06 | Client Security Boundary | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-07 | Testing & Evidence | `CONTRACT EVIDENCE COMPLETE` | runtime tests trigger-gated |
| CLIENT-08 | Project Skill / Plugin Invocation Contract | `NOT IMPLEMENTED` | `OPEN — separate fresh branch/PR slice` |

`COMPLETE` is restricted to the local contract/evidence baseline. It does not claim physical runtime implementation, downstream execution, hosted CI, plugin activation, persistent workflow execution or foreign-project verification.

---

## Current priorities

### Priority 1 — CLIENT documentation correlation hygiene

Synchronize the seven active CLIENT documents to current project/PVC ownership, current lifecycle authority, merged PR #693, merged foreign PR #691 and `NO_PHYSICAL_RUNTIME_TRIGGER`. Historical evidence remains historical.

**Exit gate:** all seven active documents are mutually consistent; no stale standing-session or withdrawn post-PVC routing semantics remain; Slice 1 is PR-gate-ready.

### Priority 2 — CLIENT-08 Project Skill / Plugin Invocation Contract

Execute only after Priority 1 completes its PR lifecycle and after a fresh current-main/open-writer/ADR/ESS correlation.

**Exit gate:** contract accepted in the CLIENT project surface with explicit fail-closed/provenance/capability boundaries and explicit OPS/GOV dependency routing; no remote skill activation or external connector mutation is performed by this work package.

### Conditional future task — physical runtime slice

Not currently actionable. Re-open only after a documented trigger is found on then-current main.

---

## Cross-project dependencies

| Dependency | Owner / PVC | CLIENT input | Expected outcome | Local state |
|---|---|---|---|---|
| controlled implementation / persistent execution | `CAPITAL-AI-OPS / PVC-02` and applicable OPS stage | structured request/contract | authoritative implementation/execution outcome | `DEPENDENCY_ONLY` |
| platform/governance decision | `CAPITAL-AI-GOV / PVC-05` | architecture/authority decision request | canonical governance decision | `DEPENDENCY_ONLY` |
| production operations | `CAPITAL-AI-OPS / PVC-08` | approved deployment/operation request | authoritative production outcome | `DEPENDENCY_ONLY` |
| EventMesh / authoritative trace | `CAPITAL-AI-OPS / PVC-18` | request/correlation/status boundary | authoritative trace/event linkage | `DEPENDENCY_ONLY` |

Foreign productive work is never marked `DONE` or `VERIFIED` by CAPITAL-AI-CLIENT.

---

## Exit criteria for CAPITAL-AI-CLIENT

- exactly one PVC-01 Primary Owner;
- no local execution of PVC-02..PVC-18;
- no direct protected mutation path from the client;
- no parallel Agent Client/control-plane architecture;
- request, identity, capability, response and security contracts traceable;
- project-skill invocation remains provider-neutral, provenance-aware and non-authorizing;
- foreign work routed explicitly through canonical project/PVC ownership;
- runtime mappings updated after any later physical refactor;
- exact-head tests/evidence for every physical client slice;
- current Human/Owner PR-creation gate and Human/CODEOWNER-only merge preserved.
