# CAPITAL-AI — Agent Client

**Project ID:** `CAPITAL-AI-CLIENT`  
**Display name:** CAPITAL-AI Client  
**Value-chain stage:** `VC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Lifecycle:** `ACTIVE — LOGICAL OWNERSHIP CONSOLIDATION`  
**Canonical execution roadmap:** [`ROADMAP.md`](./ROADMAP.md)

## Purpose

CAPITAL-AI-CLIENT is the single Primary Owner for VC-01. It owns the client-side contract from authenticated human intent to a structured request handed to the authoritative control boundary, and the client-side handling of responses, status and errors returned from that boundary.

The project does **not** authorize itself, execute protected mutations, own the Agent Control Plane, or absorb work from VC-02 through VC-18.

## Authority chain

```text
Human / Owner
  -> AGENTS.md
  -> ADR / ESS / Contracts
  -> CAPITAL-AI-CLIENT VC-01 contract
  -> Agent Control Plane / authoritative downstream project
  -> response / status / error envelope
  -> CAPITAL-AI-CLIENT UX handling
```

`AGENTS.md` remains the trust root. Roadmaps and client identity are projections/inputs, not authorization authority. Natural-language user intent is never treated as an authorization policy.

## VC-01 ownership boundary

### Owned here

- Agent Client architecture;
- request construction;
- identity handoff;
- capability request handoff;
- response handling;
- client-side status handling;
- client-side error handling;
- Agent Client UX contracts.

### Explicitly not owned here

Controlled Implementation, Supervisor, Platform Director, Version Management, Release Management, Production Operations, UAI/Data Ingestion, Evidence Management, Data Quality, Scoring, Ranking and EventMesh/Traceability remain with their canonical downstream owners.

## Architecture rule

The migration model is **logical ownership before physical relocation**. Existing productive code remains in place unless a later evidenced refactor is required to remove duplication. Imports, contracts, tests and runtime behavior must remain stable. New duplicate Agent Client implementations are prohibited; changes use reuse/strangler/refactor patterns.

Current architecture already defines:

```text
Human -> AI Client -> Agent Control Plane -> Capability/Policy -> Tool Adapter -> Platform -> Evidence
```

CAPITAL-AI-CLIENT owns only the `Human -> AI Client -> handoff` and downstream response/UX edge. Authorization and protected execution start after that handoff.

## Canonical navigation

- [`ROADMAP.md`](./ROADMAP.md) — canonical VC-01 execution roadmap.
- [`AGENT_CLIENT_INVENTORY.md`](./AGENT_CLIENT_INVENTORY.md) — repository-wide Agent Client task/source classification.
- [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md) — current runtime and document mapping to VC-01 ownership.
- [`WORK_PACKAGES.md`](./WORK_PACKAGES.md) — CLIENT-01 through CLIENT-07 work packages.
- [`TRACEABILITY.md`](./TRACEABILITY.md) — authority, source, runtime and handoff traceability.
- [`evidence/BASELINE_2026-08-31.md`](./evidence/BASELINE_2026-08-31.md) — exact-main baseline and validation evidence.

## Cross-project rule

Foreign work is represented only by:

`[CROSS_PROJECT_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

A handoff is non-authorizing. CAPITAL-AI-CLIENT does not implement the foreign task and never marks it `DONE` or `VERIFIED` locally.