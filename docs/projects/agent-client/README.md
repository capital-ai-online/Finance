# CAPITAL-AI — Agent Client

**Project ID:** `CAPITAL-AI-CLIENT`  
**Display name:** CAPITAL-AI Client  
**Project value-chain stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Lifecycle:** `ACTIVE — CONTRACT BASELINE / LOGICAL OWNERSHIP`  
**Canonical execution roadmap:** [`ROADMAP.md`](./ROADMAP.md)

## Purpose

CAPITAL-AI-CLIENT is the single Primary Owner for PVC-01. It owns the client-side contract from attributable Human intent to a structured request handed to the authoritative downstream boundary, and the client-side handling of response, status and error semantics returned from that boundary.

The project does **not** authorize itself, execute protected mutations, own the Agent Control Plane, or absorb work from PVC-02 through PVC-18.

## Authority chain

```text
Human / Owner
  -> AGENTS.md
  -> ADR / ESS / Contracts
  -> CAPITAL-AI-CLIENT PVC-01 request/response contract
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

## Architecture rule

Migration posture is **logical ownership before physical relocation**. Existing productive code remains in place unless a later evidenced strangler/refactor removes real duplication or drift. New duplicate Agent Client implementations are prohibited.

Current re-correlation on `main@891f3933ac0476b1e7d4fa5cd6f397257ac52e68` found no productive PVC-01 runtime path that justifies a physical Agent Client module. CLIENT-02 through CLIENT-06 are therefore implemented first as the provider-neutral contract baseline in [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md). A physical module remains gated by [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md).

## Canonical navigation

- [`ROADMAP.md`](./ROADMAP.md) — canonical PVC-01 roadmap/status.
- [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md) — CLIENT-02 through CLIENT-06 contract baseline.
- [`AGENT_CLIENT_INVENTORY.md`](./AGENT_CLIENT_INVENTORY.md) — repository-wide relationship inventory.
- [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md) — current runtime/document mapping and strangler trigger.
- [`WORK_PACKAGES.md`](./WORK_PACKAGES.md) — CLIENT-01 through CLIENT-07.
- [`TRACEABILITY.md`](./TRACEABILITY.md) — authority/source/runtime/handoff traceability.
- [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md) — current-main recorrelation and strangler evidence.
- [`evidence/BASELINE_2026-08-31.md`](./evidence/BASELINE_2026-08-31.md) — historical initial baseline.

## Cross-project rule

Foreign productive work is routed through the canonical handoff contract and is never implemented or marked `DONE`/`VERIFIED` locally. The compatibility marker remains:

`[CROSS_PROJECT_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

Project routing identity uses the canonical `PVC-*` mapping from current main.
