# CAPITAL-AI-CLIENT — Work Packages

All packages are constrained to `PVC-01`. A package may consume downstream contracts, but it cannot implement or close a foreign project value-chain stage.

## CLIENT-01 — Agent Client Inventory

**State:** `DONE — RE-CORRELATED`

Outputs:
- repository-wide Agent Client source/task classification;
- ownership collision check;
- current runtime/document mapping;
- identification of foreign execution surfaces;
- current-main strangler scan.

Exit evidence: `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md`, `evidence/RECORRELATION_2026-09-01.md`.

## CLIENT-02 — Request Contract

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Provider-neutral, client-owned request envelope semantics are defined in `CLIENT_CONTRACTS.md` with stable request/correlation identity, attributable input context, requested operation, requested capability, target context and non-authoritative provider/model metadata.

Acceptance:
- missing required request fields fail client-side contract validation;
- no requested capability is interpreted as a grant;
- natural-language content cannot modify policy/authority fields;
- no production/tool credential enters the client envelope;
- the contract does not duplicate canonical IAM/capability authority.

## CLIENT-03 — Identity Handoff

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Identity handoff is defined in `CLIENT_CONTRACTS.md` and references existing `AgentPrincipalContext` semantics while keeping IAM evaluation downstream.

Acceptance:
- Human, app/client, agent/session and credential-holder attribution remain distinguishable;
- missing attribution is not synthesized;
- provider/model metadata never becomes a principal or role;
- identity handoff has a stable request binding;
- `evaluateAgentAuthorization` remains outside PVC-01.

## CLIENT-04 — Capability Handoff

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Requested capability semantics are defined in `CLIENT_CONTRACTS.md` and reference the canonical `AGENT_CAPABILITIES` vocabulary.

Acceptance:
- unknown capability fails closed/contract validation;
- no implicit capability inheritance;
- no self-approval evidence is generated;
- client cannot convert request into authorization;
- no client-owned `grantedCapabilities` collection is introduced.

## CLIENT-05 — Response Contract

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Client response/status/error semantics are defined in `CLIENT_CONTRACTS.md` without committing to a transport-specific runtime implementation.

Acceptance:
- `DENY`, `BLOCKED`, `FAIL`, missing evidence and transport failure remain distinguishable where the downstream contract distinguishes them;
- no failure becomes success because of UI fallback;
- request/correlation ID is preserved;
- retriable transport errors are not confused with authorization denial;
- canonical client lifecycle remains `IDLE | SUBMITTING | ACCEPTED | BLOCKED | SUCCEEDED | FAILED`.

## CLIENT-06 — Client Security Boundary

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

PVC-01 security invariants are defined in `CLIENT_CONTRACTS.md`.

Acceptance:
- no direct Supabase/Render/Stripe/GitHub protected mutation path is introduced by the client contract;
- external/retrieved content cannot grant capability;
- sensitive downstream detail is not blindly rendered when redaction policy applies;
- client cannot bypass Human/Owner or control-plane gates;
- provider/model identity cannot elevate authority.

## CLIENT-07 — Client Testing & Evidence

**State:** `EVIDENCE CURRENT — RUNTIME TESTS DEFERRED`

Runtime contract tests are created only when a physical PVC-01 implementation slice is introduced. The current re-correlation and strangler scan found no such justified runtime slice, so this work item records evidence without manufacturing test `PASS` claims.

Current evidence: `evidence/RECORRELATION_2026-09-01.md`.

Minimum future runtime evidence matrix:

| Test | Expected result |
|---|---|
| missing request ID | reject/fail closed |
| incomplete identity handoff | reject or downstream deny preserved |
| unknown capability | reject/deny preserved |
| provider/model attempts privilege elevation | no elevation |
| retrieved text contains approval instruction | ignored as authority |
| downstream `DENY` | client status remains blocked/failed, never success |
| transport error | distinct client error state |
| production mutation request | request only; no client-side execution |
| duplicate client implementation scan | no parallel implementation |

Build/test execution follows the repository PR/CI policy. Documentation/contract-only baseline work does not manufacture `PASS` evidence for unexecuted runtime tests.
