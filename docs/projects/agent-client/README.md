# CAPITAL-AI — Agent Client

**Project ID:** `CAPITAL-AI-CLIENT`  
**Display name:** CAPITAL-AI Client  
**Project value-chain stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Lifecycle:** `ACTIVE — CONTRACT BASELINE / LOGICAL OWNERSHIP`  
**Canonical execution roadmap:** [`ROADMAP.md`](./ROADMAP.md)

## Purpose

CAPITAL-AI-CLIENT is the single Primary Owner for PVC-01. It owns the client-side contract from authenticated human intent to a structured request handed to the authoritative control boundary, and the client-side handling of responses, status and errors returned from that boundary.

The project does **not** authorize itself, execute protected mutations, own the Agent Control Plane, or absorb work from PVC-02 through PVC-18.

## Authority chain

```text
Human / Owner
  -> AGENTS.md
  -> ADR / ESS / Contracts
  -> CAPITAL-AI-CLIENT PVC-01 contract
  -> Agent Control Plane / authoritative downstream project
  -> response / status / error envelope
  -> CAPITAL-AI-CLIENT UX handling
```

`AGENTS.md` remains the trust root. Roadmaps and client identity are projections/inputs, not authorization authority. Natural-language user intent is never treated as an authorization policy.

## PVC-01 ownership boundary

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

The current re-correlation found no productive PVC-01 runtime path that justifies a physical Agent Client module. CLIENT-02 through CLIENT-06 are therefore implemented first as the provider-neutral contract baseline in [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md). A physical module remains gated by the strangler trigger in [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md).

## Canonical navigation

- [`ROADMAP.md`](./ROADMAP.md) — canonical PVC-01 execution roadmap.
- [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md) — current CLIENT-02 through CLIENT-06 contract baseline.
- [`AGENT_CLIENT_INVENTORY.md`](./AGENT_CLIENT_INVENTORY.md) — repository-wide Agent Client task/source classification.
- [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md) — current runtime and document mapping to PVC-01 ownership.
- [`WORK_PACKAGES.md`](./WORK_PACKAGES.md) — CLIENT-01 through CLIENT-07 work packages.
- [`TRACEABILITY.md`](./TRACEABILITY.md) — authority, source, runtime and handoff traceability.
- [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md) — current-main re-correlation and strangler decision evidence.
- [`evidence/BASELINE_2026-08-31.md`](./evidence/BASELINE_2026-08-31.md) — historical initial consolidation baseline.

## Cross-project rule

The repository compatibility marker remains:

`[CROSS_PROJECT_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

Every new project-routing handoff also carries the explicit project identity `project_stage: PVC-<NN>` according to `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`.

A handoff is non-authorizing. CAPITAL-AI-CLIENT does not implement the foreign task and never marks it `DONE` or `VERIFIED` locally.
