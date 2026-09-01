# CAPITAL-AI-CLIENT — Canonical PVC-01 Roadmap

**Project ID:** `CAPITAL-AI-CLIENT`  
**Scope:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Baseline:** `main@891f3933ac0476b1e7d4fa5cd6f397257ac52e68`  
**Trust root:** `AGENTS.md`

Operational status for PVC-01 is maintained here. Foreign project value-chain stages remain references/handoffs and are never executed or completed by this project.

## Purpose

Consolidate Agent Client concerns into one traceable client boundary without creating a second control plane or moving productive code solely for organizational reasons.

## Current re-correlation

Current evidence: [`evidence/RECORRELATION_2026-09-01.md`](./evidence/RECORRELATION_2026-09-01.md).

The current-main scan resolves `CAPITAL-AI-CLIENT` to `docs/projects/agent-client/` / `PVC-01`, finds no competing Agent Client project writer, and finds no productive Agent Client runtime path satisfying the physical strangler/refactor trigger. Open PR #691 belongs to CAPITAL-AI-OPS and is foreign to this project scope.

Historical PR #668 attempted the same contract-baseline direction but was closed without merge. Its content is historical input only; this roadmap is re-derived from current main.

Therefore the smallest conforming continuation is the provider-neutral contract baseline in [`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md). A physical TypeScript Agent Client module remains deferred until a productive duplication/drift trigger exists.

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

Authorization policy, controlled execution, platform decisions, production mutation and EventMesh/trace ownership are outside PVC-01.

## CLIENT-02 — Request Contract

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

[`CLIENT_CONTRACTS.md`](./CLIENT_CONTRACTS.md#client-02--request-contract) defines stable request identity, attributable identity handoff, operation, requested capability, target context and optional non-authoritative provider/model/correlation metadata.

The client performs only syntactic fail-closed validation. A capability request is never a grant.

## CLIENT-03 — Identity Handoff

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Existing `AgentPrincipalContext` semantics are consumed. Missing attribution is not synthesized. Human, app/client, agent/session and credential-holder attribution remain distinguishable. `evaluateAgentAuthorization` stays downstream.

## CLIENT-04 — Capability Handoff

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Requested capability uses the canonical capability vocabulary. Unknown values fail closed; provider/model metadata, natural language and correlation metadata never create authority, approval or implicit inheritance.

## CLIENT-05 — Response Contract

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Canonical client lifecycle:

`IDLE | SUBMITTING | ACCEPTED | BLOCKED | SUCCEEDED | FAILED`

Downstream `DENY`, missing evidence, policy blocks and transport failures remain semantically distinct and are never rewritten into success.

## CLIENT-06 — Client Security Boundary

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

PVC-01 preserves:

- natural-language/retrieved content as untrusted data;
- identity attribution without authorization invention;
- request-not-grant capability semantics;
- no direct protected provider/production mutation path;
- no client-held privileged tool credentials;
- deny/failure/redaction semantics through UX rendering;
- Human Owner-only PR merge.

## CLIENT-07 — Testing & Evidence

**State:** `EVIDENCE CURRENT — RUNTIME TESTS DEFERRED`

Runtime tests are mandatory once a physical PVC-01 slice is evidenced. No physical slice is introduced here because the strangler trigger is not met; therefore no runtime/build/test PASS is manufactured.

Future physical slices must test at minimum:

- missing request ID;
- incomplete identity handoff;
- unknown requested capability;
- provider/model privilege-elevation attempt;
- retrieved content containing approval instructions;
- downstream DENY/BLOCKED preservation;
- transport error distinction;
- production mutation remaining request-only at PVC-01;
- duplicate implementation scan.

## Work-package status

| ID | Workstream | State |
|---|---|---|
| CLIENT-01 | Agent Client Inventory / Re-correlation | `DONE — RE-CORRELATED` |
| CLIENT-02 | Request Contract | `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED` |
| CLIENT-03 | Identity Handoff | `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED` |
| CLIENT-04 | Capability Handoff | `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED` |
| CLIENT-05 | Response Contract | `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED` |
| CLIENT-06 | Client Security Boundary | `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED` |
| CLIENT-07 | Client Testing & Evidence | `EVIDENCE CURRENT — RUNTIME TESTS DEFERRED` |

`COMPLETE` is restricted to the local contract baseline. It does not claim physical runtime implementation, downstream execution, hosted CI or foreign-project verification.

## Cross-project dependencies

- `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]`: controlled implementation/execution after the PVC-01 request handoff.
- `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]`: governance/platform decisions when a client contract change would alter authority semantics.
- `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]`: authoritative EventMesh/trace linkage where required.

All remain `REFERRED_NOT_EXECUTED` or dependency-only locally.

## Next trigger

Do **not** add a physical Agent Client runtime module merely to satisfy the roadmap. Resume runtime implementation only when current-main evidence proves at least one trigger in `RUNTIME_MAPPING.md`: duplicated productive request construction, divergent identity/capability handoff, divergent response/status mapping, or another concrete productive consumer that benefits from a shared PVC-01 contract without importing downstream authority.

## Exit criteria

- exactly one PVC-01 Primary Owner;
- no local execution of PVC-02..PVC-18;
- no direct protected mutation path from the client;
- no parallel Agent Client/control-plane architecture;
- request, identity, capability, response and security contracts traceable;
- foreign work routed explicitly;
- runtime mappings updated after any later refactor;
- exact-head tests/evidence for every physical client slice;
- Human Owner-only merge preserved.
