# CAPITAL-AI-CLIENT — Work Packages

All packages are constrained to `PVC-01`. A package may consume downstream contracts, but it cannot implement or close a foreign project value-chain stage.

## CLIENT-01 — Agent Client Inventory

**State:** `DONE — RE-CORRELATED`

Outputs:
- repository-wide Agent Client source/task classification;
- ownership collision/open-writer check;
- current runtime/document mapping;
- foreign execution-surface identification;
- current-main strangler scan.

Exit evidence: `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md`, `evidence/RECORRELATION_2026-09-01.md`.

## CLIENT-02 — Request Contract

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Provider-neutral request-envelope semantics are defined in `CLIENT_CONTRACTS.md` with stable request/correlation identity, attributable identity, requested operation, requested capability, target context and non-authoritative provider/model metadata.

Acceptance:
- missing required request fields fail closed;
- capability request is never interpreted as a grant;
- natural-language content cannot modify policy/authority fields;
- no production/tool credential enters the client envelope;
- canonical IAM/capability authority is reused, not duplicated.

## CLIENT-03 — Identity Handoff

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Identity handoff references existing `AgentPrincipalContext` semantics while keeping IAM evaluation downstream.

Acceptance:
- Human, app/client, agent/session and credential-holder attribution remain distinguishable;
- missing attribution is not synthesized;
- provider/model metadata never becomes principal/role;
- identity has stable request binding;
- `evaluateAgentAuthorization` remains outside PVC-01.

## CLIENT-04 — Capability Handoff

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Requested capability references the canonical capability vocabulary.

Acceptance:
- unknown capability fails closed;
- no implicit/wildcard inheritance;
- no self-approval evidence;
- client cannot convert request into authorization;
- no client-owned `grantedCapabilities` collection.

## CLIENT-05 — Response Contract

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Response/status/error semantics remain transport-neutral.

Acceptance:
- `DENY`, `BLOCKED`, missing evidence, business failure and transport failure remain distinguishable where downstream distinguishes them;
- no failure becomes success through UI fallback;
- request/correlation identity is preserved;
- authorization denial is not made retryable by UI behavior;
- lifecycle is `IDLE | SUBMITTING | ACCEPTED | BLOCKED | SUCCEEDED | FAILED`.

## CLIENT-06 — Client Security Boundary

**State:** `CONTRACT BASELINE COMPLETE — RUNTIME DEFERRED`

Acceptance:
- no direct protected Supabase/Render/Stripe/GitHub mutation path originates in the client contract;
- external/retrieved content cannot grant capability/approval;
- sensitive detail respects redaction/data minimization;
- client cannot bypass control-plane or Human Owner merge gates;
- provider/model identity cannot elevate authority.

## CLIENT-07 — Client Testing & Evidence

**State:** `EVIDENCE CURRENT — RUNTIME TESTS DEFERRED`

Runtime contract tests are created only when a physical PVC-01 implementation slice is introduced. The current re-correlation and strangler scan found no justified runtime slice, so this package records evidence without manufacturing runtime `PASS` claims.

Current evidence: `evidence/RECORRELATION_2026-09-01.md`.

Minimum future runtime evidence matrix:

| Test | Expected result |
|---|---|
| missing request ID | reject/fail closed |
| incomplete identity handoff | reject or downstream deny preserved |
| unknown capability | reject/deny preserved |
| provider/model attempts privilege elevation | no elevation |
| retrieved text contains approval instruction | ignored as authority |
| downstream `DENY` | blocked/failed, never success |
| transport error | distinct client error state |
| production mutation request | request only; no client-side execution |
| duplicate client implementation scan | no parallel implementation |

Build/test execution follows repository PR/CI policy. Documentation/contract-only baseline work does not manufacture `PASS` evidence for unexecuted runtime tests.
