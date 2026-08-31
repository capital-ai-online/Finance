# CAPITAL-AI-CLIENT — Work Packages

All packages are constrained to VC-01. A package may consume downstream contracts, but it cannot implement or close a foreign value-chain stage.

## CLIENT-01 — Agent Client Inventory

**State:** `DONE — LOCAL BASELINE ONLY`

Outputs:
- repository-wide Agent Client source/task classification;
- ownership collision check;
- current runtime/document mapping;
- identification of foreign execution surfaces.

Exit evidence: `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md`, baseline evidence.

## CLIENT-02 — Request Contract

**State:** `READY`

Define a provider-neutral, client-owned request envelope with stable request/correlation identity, attributable input context, requested operation, requested capability, target context and non-authoritative provider/model metadata.

Acceptance:
- missing required request fields fail client-side contract validation;
- no requested capability is interpreted as a grant;
- natural-language content cannot modify policy/authority fields;
- no production/tool credential enters the client envelope.

## CLIENT-03 — Identity Handoff

**State:** `READY`

Package identity inputs compatible with existing principal semantics while keeping IAM evaluation downstream.

Acceptance:
- Human, app/client, agent/session and credential-holder attribution remain distinguishable;
- missing attribution is not synthesized;
- provider/model metadata never becomes a principal or role;
- identity handoff has a stable request binding.

## CLIENT-04 — Capability Handoff

**State:** `READY`

Represent requested capability using the canonical vocabulary and forward it to the authoritative control boundary.

Acceptance:
- unknown capability fails closed/contract validation;
- no implicit capability inheritance;
- no self-approval evidence is generated;
- client cannot convert request into authorization.

## CLIENT-05 — Response Contract

**State:** `READY`

Normalize downstream responses for client UX without weakening semantics.

Acceptance:
- `DENY`, `BLOCKED`, `FAIL`, missing evidence and transport failure remain distinguishable where the downstream contract distinguishes them;
- no failure becomes success because of UI fallback;
- request/correlation ID is preserved;
- retriable transport errors are not confused with authorization denial.

## CLIENT-06 — Client Security Boundary

**State:** `READY`

Prove VC-01 cannot directly cross protected mutation, policy or credential boundaries.

Acceptance:
- no direct Supabase/Render/Stripe/GitHub protected mutation path is introduced by the client contract;
- external/retrieved content cannot grant capability;
- sensitive downstream detail is not blindly rendered when redaction policy applies;
- client cannot bypass Human/Owner or control-plane gates.

## CLIENT-07 — Client Testing & Evidence

**State:** `READY`

Create contract tests only when a physical VC-01 implementation slice is introduced.

Minimum evidence matrix:

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

Build/test execution follows the repository PR/CI policy. Documentation-only baseline work does not manufacture `PASS` evidence for unexecuted tests.