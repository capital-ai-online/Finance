# CAPITAL-AI — Agent Client

**Project ID:** `CAPITAL-AI-CLIENT`  
**Display name:** CAPITAL-AI Client  
**Project value-chain stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Lifecycle:** `ACTIVE — CONTRACT BASELINE / LOGICAL OWNERSHIP`  
**Current correlation baseline:** `main@c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0`  
**Canonical execution roadmap:** [`ROADMAP.md`](./ROADMAP.md)

## Purpose

CAPITAL-AI-CLIENT is the single Primary Owner for PVC-01. It owns the client-side contract from attributable Human intent to a structured request handed to the authoritative downstream boundary, and the client-side handling of response, status and error semantics returned from that boundary.

The project does **not** authorize itself, execute protected mutations, own the Agent Control Plane, or absorb work from PVC-02 through PVC-18.

## Authority chain

```text
Human / Owner
  -> AGENTS.md
  -> PVC / project Roadmap
  -> applicable ADR / ESS / contracts
  -> CAPITAL-AI-CLIENT PVC-01 request/response contract
  -> authoritative downstream control/execution boundary
  -> response / status / error envelope
  -> CAPITAL-AI-CLIENT UX handling
```

Natural-language content, provider/model metadata, correlation IDs, plugin/skill metadata and client status never become authorization policy.

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

Current re-correlation on `main@c4d888d8e8491ca447ca0675fd47f9bcfc4e0fb0` finds no productive PVC-01 runtime path that justifies a physical Agent Client module. Repository search finds `requestedCapability` and the named logical Agent Client components only in documentation/contract material, while `src/platform/Security/agentIam.ts` remains the productive downstream IAM/capability authority surface. `NO_PHYSICAL_RUNTIME_TRIGGER` therefore remains in force.

CLIENT-02 through CLIENT-06 remain the provider-neutral contract baseline in [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md). A physical module remains gated by [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md). CLIENT-08 is open design work but is intentionally excluded from the current correlation-hygiene slice and must use a separate fresh branch/PR slice.

## Active project documents

The seven active CLIENT project documents are:

- [`README.md`](./README.md) — project identity and ownership boundary;
- [`ROADMAP.md`](./ROADMAP.md) — canonical PVC-01 status and priorities;
- [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md) — CLIENT-02 through CLIENT-06 contract baseline;
- [`AGENT_CLIENT_INVENTORY.md`](./AGENT_CLIENT_INVENTORY.md) — repository relationship inventory;
- [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md) — runtime/document mapping and physical-runtime trigger;
- [`TRACEABILITY.md`](./TRACEABILITY.md) — authority/source/runtime/dependency traceability;
- [`WORK_PACKAGES.md`](./WORK_PACKAGES.md) — CLIENT work-package projection.

Files under `evidence/` are historical evidence records for their recorded baselines. They are not rewritten merely to appear current.

## Cross-project rule

Foreign productive work is not executed or marked `DONE`/`VERIFIED` locally. Routing resolves from the current canonical project/PVC mapping in `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`, then the target project's Roadmap and applicable ADR/ESS. Withdrawn post-PVC handoff overlays and legacy `VC-*` project-routing markers are not current authority.
