# CAPITAL-AI-CLIENT — Re-Correlation & Strangler Evidence 2026-09-01

**Project:** `CAPITAL-AI-CLIENT`  
**Project stage:** `PVC-01`  
**Source main:** `891f3933ac0476b1e7d4fa5cd6f397257ac52e68`  
**Branch:** `agent/agent-client-contract-baseline-r2-20260901`  
**Trust root:** `/AGENTS.md@891f3933ac0476b1e7d4fa5cd6f397257ac52e68`  
**Evidence class:** observational / non-authorizing

## 1. Re-correlation

Canonical routing resolves:

- Project: `CAPITAL-AI-CLIENT`;
- Folder: `docs/projects/agent-client/`;
- Stage: `PVC-01`;
- Primary Owner: `CAPITAL-AI-CLIENT`.

The existing project baseline still referenced `main@0f5d4f23841ef3824dec8447f700de0cd9614f16` in inventory/runtime/traceability files. Historical PR #668 attempted a similar re-correlation and contract baseline but was closed without merge; none of its candidate content is authorizing current state.

At the current pre-write correlation, PR #691 is open for `CAPITAL-AI-OPS` M10 retirement. It does not own or change `docs/projects/agent-client/**` and is treated as a foreign parallel writer.

## 2. Reuse / best-practice precheck

Repository-native semantics are reused rather than duplicated:

- `AgentPrincipalContext` for attributable principal semantics;
- `AGENT_CAPABILITIES` and `isKnownAgentCapability` for capability vocabulary;
- `evaluateAgentAuthorization` remains downstream/non-client;
- `providerProfile.ts` retains provider/model non-authority semantics;
- existing AI Agent target architecture retains the Human -> AI Client -> Control Plane boundary.

External advisory checks are consistent with this posture: NIST SSDF/SP 800-218A supports secure development controls; OWASP agent guidance recommends least-privilege, explicitly scoped tool permissions and explicit authorization for sensitive operations; W3C Trace Context defines correlation metadata, not authorization.

No new dependency or open-source runtime package is justified for a contract-only slice. Existing repository types/contracts are lower-risk than a new framework or parallel agent-client stack.

## 3. Current-main strangler scan

| Scan | Current-main result |
|---|---|
| dedicated productive `AgentClient` runtime module | not found |
| productive `requestedCapability` implementation | not found |
| canonical `AgentPrincipalContext` | found in Security/IAM authority and downstream consumers |
| `evaluateAgentAuthorization` | found in Security/Compliance/provider/control surfaces, not client-owned request construction |
| duplicate productive client request builders | not evidenced |
| divergent productive client response/status adapters | not evidenced |

Systemadmin/Operations principal construction remains foreign execution-host work and is not a PVC-01 refactor target under this session.

## 4. Strangler decision

| Trigger | Result |
|---|---|
| duplicate productive client request construction in 2+ paths | `NOT TRIGGERED` |
| inconsistent productive identity/capability handoff | `NOT TRIGGERED` |
| duplicated divergent response/status mapping | `NOT TRIGGERED` |
| shared client module demonstrably reduces productive duplication | `NOT TRIGGERED` |

**Decision:** `NO PHYSICAL PVC-01 RUNTIME MODULE`.

Creating a new TypeScript Agent Client layer now would be an unconsumed parallel implementation. The smallest conforming continuation is the provider-neutral `CLIENT_CONTRACTS.md` baseline.

## 5. Work-package disposition

| Package | Result |
|---|---|
| CLIENT-01 | re-correlated against current main |
| CLIENT-02 | request contract baseline defined |
| CLIENT-03 | identity handoff baseline defined; IAM remains downstream |
| CLIENT-04 | requested-capability baseline defined; no grant semantics |
| CLIENT-05 | response/status/error baseline defined |
| CLIENT-06 | client security boundary defined |
| CLIENT-07 | current evidence recorded; runtime tests deferred until a physical slice exists |

No runtime/test/build `PASS` is claimed by this evidence.

## 6. Scope and authority guard

Not executed locally:

- IAM/authorization changes;
- Operations/Systemadmin refactors;
- PolicyGate or downstream execution changes;
- protected provider/production mutations;
- EventMesh/trace authority;
- foreign-project implementation;
- Pull Request merge.

ADR-0104-S1 is active for this exact chat and project, so repeated PR-create approval may be replaced within its scope. Human Owner-only merge, current-main/open-writer correlation, hosted validation and foreign-project routing remain mandatory.

## 7. Next physical trigger

The next CLIENT runtime slice must identify a concrete productive consumer or duplicated client behavior, then introduce the smallest stable interface behind compatibility boundaries and add exact-head negative/contract tests. Until such evidence exists, `RUNTIME_MAPPING.md` remains `NO_PHYSICAL_RUNTIME_TRIGGER`.
