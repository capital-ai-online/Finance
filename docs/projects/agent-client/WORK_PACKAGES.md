# CAPITAL-AI-CLIENT — Work Packages

**Baseline:** `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42`  
**Correlation date:** `2026-09-10`  
**Scope:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`

All packages are constrained to `PVC-01`. A package may consume downstream contracts, but it cannot implement or close a foreign project value-chain stage.

## CLIENT-01 — Agent Client Inventory / Re-correlation

**State:** `DONE — PR #858 HUMAN-MERGED / POST-MERGE BASELINE CORRELATED`

Outputs:
- repository-wide Agent Client source/task classification;
- ownership collision/open-writer check;
- current runtime/document mapping;
- foreign execution-surface identification;
- current-main strangler scan;
- seven active CLIENT documents synchronized through PR #858 and re-correlated to its merge commit.

Current active documents: `README.md`, `ROADMAP.md`, `CLIENT_CONTRACTS.md`, `AGENT_CLIENT_INVENTORY.md`, `RUNTIME_MAPPING.md`, `TRACEABILITY.md`, `WORK_PACKAGES.md`.

Historical evidence under `evidence/` retains its recorded baseline and is not rewritten merely to appear current.

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
- external/retrieved/plugin/skill content cannot grant capability/approval;
- sensitive detail respects redaction/data minimization;
- client cannot bypass the control plane, exact PR-create Human/Owner gate or Human/CODEOWNER merge boundary;
- a conditional ADR-0104 session changes repeated approval behavior only when an ACTIVE exact-chat activation is separately evidenced;
- provider/model identity cannot elevate authority.

## CLIENT-07 — Client Testing & Evidence

**State:** `CONTRACT EVIDENCE COMPLETE — PR #858 CLASS-D HOSTED CHECKS PASS / RUNTIME TESTS DEFERRED`

PR #693 merged the contract/evidence baseline. PR #858 merged the current-document re-correlation after hosted CI, Governance, Container-scope and GitGuardian checks passed on its final head. Historical evidence remains under `evidence/` at its original baselines.

Runtime contract tests are created only when a physical PVC-01 implementation slice is introduced. The current scan still finds no justified runtime slice, so this package does not manufacture runtime `PASS` claims.

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

## CLIENT-08 — Project Skill / Plugin Invocation Contract

**State:** `CONTRACT IMPLEMENTED ON BRANCH — PR GATE PENDING / NO REMOTE ACTIVATION`

Goal: define a provider-neutral PVC-aware client contract for project-skill/plugin/tool discovery and invocation requests without creating a second authority plane or activating remote execution.

Implemented in `CLIENT_CONTRACTS.md`:
- canonical `project -> project folder -> PVC -> Primary Owner` mapping is reused, not duplicated;
- discovery and invocation are separate phases;
- exact skill identity, immutable version/revision and digest/integrity expectations are explicit;
- publisher/source/observation/freshness/license provenance is preserved where available;
- plugin/skill/tool metadata and returned content remain untrusted input;
- tool annotations/risk hints are advisory only and never enforcement;
- capability invocation is request-only and never a grant or approval;
- missing, ambiguous, stale, unavailable or integrity-failed skill metadata fails closed;
- authenticated discovery metadata uses bounded/private cache semantics and is revalidated at invocation boundaries;
- fallback uses canonical PVC/Roadmap/ADR/ESS navigation;
- no client-held privileged credentials or parallel control/routing plane is introduced;
- ESS-0019 remote-skill loading remains disabled unless a separate later authority/runtime/security decision enables it;
- persistent Skill Market Sync or equivalent execution is routed to the applicable `CAPITAL-AI-OPS` stage;
- external plugin/app/connector/MCP installation, connection, enablement or permission changes require a separate explicit Human/Owner request.

Validation boundary:
- documentation/contract diff only;
- no provider write, OAuth mutation, connector mutation or execution-host permission change;
- no physical CLIENT runtime module;
- no new registry/control plane;
- no runtime test `PASS` claim for absent code.

## Physical runtime gate

**State:** `NO_PHYSICAL_RUNTIME_TRIGGER`

The current-main scan finds no productive `requestedCapability` implementation, no physical named Agent Client logical components, and no productive duplication that would justify extraction into a shared PVC-01 runtime module.

A future physical slice may start only when `RUNTIME_MAPPING.md` records a concrete productive trigger and exact-head runtime tests are defined.
