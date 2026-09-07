# CAPITAL-AI — Agent Client

**Project ID:** `CAPITAL-AI-CLIENT`  
**Display name:** CAPITAL-AI Client  
**Project value-chain stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Lifecycle:** `ACTIVE — CONTRACT BASELINE / LOGICAL OWNERSHIP`  
**Current correlation baseline:** `main@eee9a8af3f3d2532a213154dd61f678454a2200b`  
**Canonical execution roadmap:** [`ROADMAP.md`](./ROADMAP.md)

## Purpose

CAPITAL-AI-CLIENT is the single Primary Owner for PVC-01. It owns the client-side contract from attributable Human intent to a structured request handed to the authoritative downstream boundary, and the client-side handling of response, status and error semantics returned from that boundary.

The project does **not** authorize itself, execute protected mutations, own the Agent Control Plane, or absorb work from PVC-02 through PVC-18.

## Authority chain

```text
Human / Owner
  -> AGENTS.md
  -> Project Value Chain / PVC-01 ownership
  -> project ROADMAP
  -> applicable ADR / ESS / contracts
  -> CAPITAL-AI-CLIENT request/response contract
  -> authoritative downstream control/execution boundary
  -> response / status / error envelope
  -> CAPITAL-AI-CLIENT UX handling
```

Natural-language content, provider/model metadata, correlation IDs and client status never become authorization policy.

## PVC-01 ownership boundary

Owned here:

- Agent Client architecture;
- request construction;
- identity handoff;
- capability request handoff;
- response/status/error handling;
- Agent Client UX contracts.

Explicitly not owned here:

- authorization/policy evaluation;
- protected execution/mutation;
- Platform Director/Governance decisions;
- Version/Release/Production Operations;
- Data, Evidence, Data Quality, Scoring, Ranking;
- EventMesh/Trace authority.

## Current correlation

The active CLIENT project surface is correlated to `main@eee9a8af3f3d2532a213154dd61f678454a2200b` on 2026-09-07.

- canonical routing is `CAPITAL-AI-CLIENT -> docs/projects/agent-client/ -> PVC-01 -> CAPITAL-AI-CLIENT`;
- there were `0` open Pull Requests at correlation time;
- the released historical CLIENT work claim does not represent an active writer;
- current repository search still finds no productive `requestedCapability` client implementation and no physical `AgentClientRequestBuilder` or `AgentClientStatusModel` runtime component;
- historical PR #668 remains closed/unmerged and non-authorizing;
- PR #693 is merged and supplies the CLIENT-02 through CLIENT-07 contract/evidence baseline;
- foreign OPS PR #691 is merged and its M10 runtime retirement remains historical/current-state context, not a CLIENT implementation gap;
- no standing chat/session authority is assumed by this project documentation; current protected lifecycle semantics are resolved from `/AGENTS.md` and any separately proven applicable higher authority.

## Architecture rule

Migration posture is **logical ownership before physical relocation**. Existing productive code remains in place unless a later evidenced strangler/refactor removes real duplication or drift. New duplicate Agent Client implementations are prohibited.

Current-main correlation found no productive PVC-01 runtime path that justifies a physical Agent Client module. CLIENT-02 through CLIENT-06 therefore remain the provider-neutral contract baseline in [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md). A physical module remains gated by [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md) and the current decision is `NO_PHYSICAL_RUNTIME_TRIGGER`.

## Canonical navigation

- [`ROADMAP.md`](./ROADMAP.md) — canonical PVC-01 roadmap/status.
- [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md) — CLIENT-02 through CLIENT-06 contract baseline.
- [`AGENT_CLIENT_INVENTORY.md`](./AGENT_CLIENT_INVENTORY.md) — repository-wide relationship inventory.
- [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md) — current runtime/document mapping and strangler trigger.
- [`WORK_PACKAGES.md`](./WORK_PACKAGES.md) — CLIENT-01 through CLIENT-07 package detail.
- [`TRACEABILITY.md`](./TRACEABILITY.md) — authority/source/runtime/dependency traceability.
- [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md) — historical 2026-09-01 re-correlation/strangler evidence; retained as evidence, not current policy.
- [`evidence/BASELINE_2026-08-31.md`](./evidence/BASELINE_2026-08-31.md) — historical initial baseline.

## Cross-project rule

Foreign productive work is routed by the canonical organizational mapping in [`../README.md`](../README.md) and [`../PROJECT_VALUE_CHAIN.md`](../PROJECT_VALUE_CHAIN.md), then by the target project's Roadmap and applicable ADR/ESS. Foreign work is never implemented or marked `DONE`/`VERIFIED` locally solely because PVC-01 depends on it.

No Cross-Project-Handoff policy overlay or unqualified `VC-*` project-routing marker is current CLIENT policy.
