# CAPITAL-AI-CLIENT — Canonical PVC-01 Roadmap

**Project ID:** `CAPITAL-AI-CLIENT`  
**Scope:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Status:** `ACTIVE — CONTRACT BASELINE COMPLETE / PHYSICAL RUNTIME GATED / PROJECT-SKILL CONTRACT OPEN`  
**Correlation date:** `2026-09-06`  
**Correlation baseline:** `main@dbdb1d5ed2c93c857ab9de1329b9d4dcbba2fd67`  
**Trust root:** `/AGENTS.md@current main`

Operational status for PVC-01 is maintained here. Foreign PVC stages remain dependencies/routing targets and are never executed or completed by this project.

## Purpose

Consolidate Agent Client concerns into one traceable client boundary without creating a second control plane, duplicating downstream authority, or moving productive code solely for organizational reasons.

The project owns the client-side path from attributable Human intent to a structured request handed to the authoritative downstream boundary, plus preservation/rendering of returned response, status and error semantics.

## Current-main correlation — 2026-09-06

The previous Roadmap baseline `main@891f3933ac0476b1e7d4fa5cd6f397257ac52e68` is historical. Current `main` is `dbdb1d5ed2c93c857ab9de1329b9d4dcbba2fd67`, which is `587` commits ahead of that baseline.

Current correlation resolves:

- `CAPITAL-AI-CLIENT` -> `docs/projects/agent-client/` -> `PVC-01` -> Primary Owner `CAPITAL-AI-CLIENT`;
- `0` open Pull Requests at correlation time and therefore no current parallel PR writer;
- PR `#693` is Human-merged and established the CLIENT-02 through CLIENT-06 provider-neutral contract baseline plus CLIENT-07 evidence;
- PR `#691` is Human-merged, belongs to `CAPITAL-AI-OPS`, and retired the former M10 productive runtime; M10 is historical and is not a CLIENT implementation gap;
- historical PR `#668` remains closed/unmerged and non-authorizing;
- current repository search still finds no productive `requestedCapability` implementation and no physical `AgentClientRequestBuilder`, `AgentClientResponseAdapter` or `AgentClientStatusModel` runtime component;
- `src/platform/Security/agentIam.ts` remains the canonical downstream IAM/capability authority surface consumed by PVC-01; `evaluateAgentAuthorization` remains outside the client boundary;
- ESS-0019 v1.2.0 remains the provider-neutral Agent Control Plane contract and explicitly does not enable productive remote skill loading;
- current `/AGENTS.md` Control Plane 2.8.0 requires exact Human/Owner PR-creation approval for the final correlated main/branch-head state; historical standing-session wording does not override that current lifecycle;
- withdrawn post-PVC routing overlays are not current policy; project routing resolves through `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md`, the project Roadmap, applicable ADR/ESS, then code/tests/evidence.

### Correlation decision

`NO_PHYSICAL_RUNTIME_TRIGGER` remains the correct PVC-01 runtime decision. The next locally actionable feature work is therefore contract/design work for a reusable project-skill/plugin invocation boundary, not creation of an unconsumed Agent Client runtime stack.

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

**State:** `DONE — CONTRACT BASELINE MERGED / CURRENT-MAIN RE-CORRELATED`

Completed implementation/evidence:

- repository-wide Agent Client inventory and strangler scan;
- ownership and writer-collision check;
- current runtime/document mapping;
- foreign execution-surface classification;
- PR #693 Human-merged contract-baseline implementation;
- 2026-09-06 current-main refresh against `dbdb1d5ed2c93c857ab9de1329b9d4dcbba2fd67`;
- no current open PR writer and no evidenced physical runtime trigger.

### Remaining consistency debt

The supporting files `README.md`, `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md`, `TRACEABILITY.md` and `WORK_PACKAGES.md` still contain historical `main@891f...` correlation metadata and/or superseded writer/session wording. Their semantic contract remains usable, but their correlation metadata must be refreshed in a bounded documentation-consistency slice before they are treated as current-main evidence.

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

- natural-language/retrieved content as untrusted data;
- identity attribution without authorization invention;
- request-not-grant capability semantics;
- no direct protected provider/production mutation path;
- no client-held privileged tool credentials;
- deny/failure/redaction semantics through UX rendering;
- current Human/Owner PR-creation and Human/CODEOWNER merge boundaries;
- no implicit authority from provider/model identity, plugins, skills or retrieved tool metadata.

**Implemented on main:** contract baseline via PR #693.  
**Open runtime work:** none until a productive client slice exists.

---

## CLIENT-07 — Testing & Evidence

**State:** `CONTRACT EVIDENCE COMPLETE — RUNTIME TESTS DEFERRED`

The contract/evidence baseline was merged by PR #693. No physical PVC-01 runtime slice exists, so runtime/build/test PASS is not claimed.

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

**Open evidence work:** refresh supporting project-document correlation metadata identified under CLIENT-01. Runtime tests remain condition-gated, not currently actionable.

---

## CLIENT-08 — Project Skill / Plugin Invocation Contract

**State:** `OPEN — CONTRACT DESIGN / OWNERSHIP-BOUNDED`

### Goal

Define the PVC-01 client-side contract that allows a chat/execution client to discover and invoke the project-appropriate reusable skill context derived from the canonical project/PVC mapping, without requiring the Human to reload the same project execution context manually in every chat and without creating a second authority plane.

This work package incorporates the open project requirement for PVC-aware project skills and plugin-assisted chat execution while respecting current ESS-0019 and `/AGENTS.md` boundaries.

### PVC-01-owned scope

- define provider-neutral project-skill discovery/invocation semantics;
- bind skill selection to canonical `project -> project folder -> PVC -> Primary Owner` resolution;
- define immutable/stable skill identity, version and provenance fields where a skill artifact is consumed;
- treat skill/plugin/tool metadata and returned content as untrusted input;
- ensure skill invocation requests capability but never grants capability or approval;
- preserve request/correlation identity through skill invocation;
- define fail-closed behavior for missing, ambiguous, stale, untrusted or unauthorized skill metadata;
- ensure the client falls back to canonical PVC/Roadmap/ADR/ESS navigation rather than inventing project authority;
- prohibit a parallel Agent Control Plane, parallel project-routing registry or client-held privileged credentials.

### Explicitly outside PVC-01

- installing, connecting, enabling, disabling or changing permissions of ChatGPT plugins/apps/connectors/MCP hosts;
- persistent server-side workflow/job execution;
- authorization/policy evaluation;
- security approval or supply-chain attestation authority;
- protected deployment/production mutation;
- autonomous weekly remote-skill activation.

### Dependency / handoff gates

- **External plugin/app mutation:** separate explicit Human/Owner request is required by `/AGENTS.md`; repository documentation cannot authorize it.
- **Persistent Skill Market Sync job/workflow:** route to the Primary Owner resolved for controlled implementation/operations (`CAPITAL-AI-OPS`, relevant PVC stage) after the client contract is defined; PVC-01 does not host the job.
- **Authority/governance semantics:** any material change to repository authority or project-routing policy routes to `CAPITAL-AI-GOV / PVC-05`.
- **Remote skill activation:** ESS-0019 currently does not enable it. A future productive remote-skill mechanism requires separately scoped architecture/runtime/security evaluation before activation.

### Exit criteria

- one provider-neutral CLIENT skill-invocation contract exists;
- canonical PVC/project mapping is reused rather than duplicated;
- no remote skill is activated merely because it was discovered;
- provenance/version/integrity expectations are explicit;
- fail-closed behavior is defined for ambiguous or untrusted skill input;
- capability/approval/merge/deploy authority remains downstream;
- OPS/GOV dependencies are explicit and not locally marked complete;
- no physical Agent Client module is introduced unless the runtime trigger is independently met.

---

## Physical runtime gate

**State:** `DEFERRED — CONDITION NOT MET`

A physical Agent Client module is permitted only when current-main evidence proves at least one of:

- duplicate productive client request construction in two or more paths;
- inconsistent productive identity/capability handoff causing drift;
- duplicated productive response/status mapping with divergent behavior;
- a concrete productive consumer would reduce duplication through a shared client module without importing downstream authority.

### 2026-09-06 trigger check

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
| CLIENT-01 | Inventory / re-correlation | `DONE — PR #693 MERGED` | supporting document correlation metadata refresh |
| CLIENT-02 | Request Contract | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-03 | Identity Handoff | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-04 | Capability Handoff | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-05 | Response Contract | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-06 | Client Security Boundary | `CONTRACT BASELINE COMPLETE` | runtime deferred until trigger |
| CLIENT-07 | Testing & Evidence | `CONTRACT EVIDENCE COMPLETE` | project-doc correlation refresh; runtime tests trigger-gated |
| CLIENT-08 | Project Skill / Plugin Invocation Contract | `NOT IMPLEMENTED` | `OPEN — next feature-contract work` |

`COMPLETE` is restricted to the local contract/evidence baseline. It does not claim physical runtime implementation, downstream execution, hosted CI, plugin activation, persistent workflow execution or foreign-project verification.

---

## Completed implementations consolidated against main

| Item | Current-main result |
|---|---|
| Initial CLIENT inventory / PVC-01 ownership mapping | implemented and retained |
| CLIENT-02..CLIENT-06 provider-neutral contract baseline | `MERGED — PR #693` |
| CLIENT-07 contract/evidence baseline | `MERGED — PR #693` |
| Physical PVC-01 runtime module | intentionally `NOT IMPLEMENTED`; trigger not met |
| Historical M10 productive runtime | `RETIRED / OFF` by foreign OPS PR #691; not a CLIENT gap |
| Historical PR #668 candidate | closed/unmerged; non-authorizing |
| Old post-PVC routing overlays | withdrawn by current governance; not a CLIENT dependency |
| Exact PR-create Human approval lifecycle | current `/AGENTS.md` 2.8.0 controls |

---

## Open tasks consolidated against main

### Priority 1 — CLIENT documentation correlation hygiene

Refresh `README.md`, `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md`, `TRACEABILITY.md` and `WORK_PACKAGES.md` from historical `main@891f...` assumptions to the current-main authority/project state. Remove stale statements such as PR #691 being open and historical standing-session PR-create authority. Do not rewrite immutable historical evidence files merely to look current.

**Exit gate:** all active CLIENT project documents agree on current project/PVC ownership, current lifecycle authority, merged PR #693, merged foreign PR #691 and `NO_PHYSICAL_RUNTIME_TRIGGER`, with historical evidence clearly labeled historical.

### Priority 2 — CLIENT-08 Project Skill / Plugin Invocation Contract

Create the provider-neutral PVC-aware client contract described above before any custom runtime, plugin mutation or persistent Skill Market Sync implementation is attempted.

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
