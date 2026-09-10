# CAPITAL-AI — Agent Client

**Project ID:** `CAPITAL-AI-CLIENT`  
**Display name:** CAPITAL-AI Client  
**Project value-chain stage:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Lifecycle:** `ACTIVE — CONTRACT BASELINE / LOGICAL OWNERSHIP / CLIENT-08 CONTRACT`  
**Current correlation baseline:** `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42`  
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
  -> CAPITAL-AI-CLIENT PVC-01 request/response + project-skill invocation contract
  -> authoritative downstream control/execution boundary
  -> response / status / error envelope
  -> CAPITAL-AI-CLIENT UX handling
```

Natural-language content, provider/model metadata, correlation IDs, plugin/skill/tool metadata, tool annotations and client status never become authorization policy.

## PVC-01 ownership boundary

Owned here:

- Agent Client architecture;
- request construction;
- identity handoff;
- capability request handoff;
- response/status/error handling;
- Agent Client UX contracts;
- provider-neutral project-skill/plugin/tool discovery and invocation-request semantics that reuse canonical project/PVC ownership.

Explicitly not owned here:

- authorization/policy evaluation;
- protected execution/mutation;
- plugin/app/connector/MCP installation, connection, enablement or permission changes;
- persistent remote-skill execution or Skill Market Sync;
- Platform Director/Governance decisions;
- Version/Release/Production Operations;
- Data, Evidence, Data Quality, Scoring, Ranking;
- EventMesh/Trace authority.

## Architecture rule

Migration posture is **logical ownership before physical relocation**. Existing productive code remains in place unless a later evidenced strangler/refactor removes real duplication or drift. New duplicate Agent Client implementations are prohibited.

Post-merge correlation on `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42` finds no productive PVC-01 runtime path that justifies a physical Agent Client module. Repository search continues to find `requestedCapability` and the named logical Agent Client components only in documentation/contract material, while `src/platform/Security/agentIam.ts` remains the productive downstream IAM/capability authority surface. `NO_PHYSICAL_RUNTIME_TRIGGER` therefore remains in force.

CLIENT-02 through CLIENT-06 and CLIENT-08 are provider-neutral contracts in [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md). CLIENT-08 separates discovery, identity/integrity/freshness validation and invocation request; it does not activate remote skills or external integrations. A physical module remains gated by [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md).

## CLIENT-08 summary

CLIENT-08 reuses the canonical `project -> project folder -> PVC -> Primary Owner -> Roadmap -> ADR -> ESS` chain. External skill/plugin/MCP metadata can describe candidates but cannot override repository routing, grant capability, establish trust or authorize execution.

Invocation-sensitive candidates require exact identity and immutable version/revision plus integrity/provenance evidence where required. Stale, ambiguous, unavailable or integrity-failed candidates fail closed. Tool annotations and risk hints remain advisory/untrusted. Credentials and provider-specific authorization stay behind the already-authorized execution host/connector boundary.

## Active project documents

The seven active CLIENT project documents are:

- [`README.md`](./README.md) — project identity and ownership boundary;
- [`ROADMAP.md`](./ROADMAP.md) — canonical PVC-01 status and priorities;
- [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md) — CLIENT-02 through CLIENT-06 plus CLIENT-08 contract baseline;
- [`AGENT_CLIENT_INVENTORY.md`](./AGENT_CLIENT_INVENTORY.md) — repository relationship inventory;
- [`RUNTIME_MAPPING.md`](./RUNTIME_MAPPING.md) — runtime/document mapping and physical-runtime trigger;
- [`TRACEABILITY.md`](./TRACEABILITY.md) — authority/source/runtime/dependency traceability;
- [`WORK_PACKAGES.md`](./WORK_PACKAGES.md) — CLIENT work-package projection.

Files under `evidence/` are historical evidence records for their recorded baselines. They are not rewritten merely to appear current.

## Cross-project rule

Foreign productive work is not executed or marked `DONE`/`VERIFIED` locally. Routing resolves from the current canonical project/PVC mapping in `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`, then the target project's Roadmap and applicable ADR/ESS. Withdrawn post-PVC handoff overlays and legacy `VC-*` project-routing markers are not current authority.

Persistent Skill Market Sync or equivalent remote execution belongs to the applicable CAPITAL-AI-OPS stage. Material changes to repository authority belong to CAPITAL-AI-GOV / PVC-05. CLIENT records these only as dependencies.
