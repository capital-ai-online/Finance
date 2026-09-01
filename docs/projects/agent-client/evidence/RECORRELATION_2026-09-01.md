# CAPITAL-AI-CLIENT — Re-Correlation & Strangler Evidence 2026-09-01

**Project:** `CAPITAL-AI-CLIENT`  
**Project stage:** `PVC-01`  
**Source main:** `9be95dd753f962a789312fec77571e2a9778b586`  
**Branch:** `agent/agent-client-contract-baseline-20260901`  
**Trust root:** `/AGENTS.md@9be95dd753f962a789312fec77571e2a9778b586`  
**Evidence class:** observational / non-authorizing

## 1. Re-correlation result

The project files previously carried `main@0f5d4f23841ef3824dec8447f700de0cd9614f16` as their baseline. The user-requested intermediate reference `37bf7d954363d99d67083edbf520bd77892888dd` had already become historical before protected work started. Per `/AGENTS.md`, current main was resolved again and is `9be95dd753f962a789312fec77571e2a9778b586`.

Repository/project routing on that source main resolves:

- Project: `CAPITAL-AI-CLIENT`;
- Canonical project folder: `docs/projects/agent-client/`;
- Branch slug: `agent-client`;
- Project namespace/stage: `PVC-01`;
- Primary Owner: `CAPITAL-AI-CLIENT`.

No open Pull Request was found during the pre-write correlation.

The central cross-project contract retains the marker form `| VC-<NN>` for compatibility, while new project-routing identity is explicitly `project_stage: PVC-<NN>`. Therefore current project documents use `PVC-01` for ownership and retain `VC-*` only where a legacy handoff marker is intentionally required.

## 2. Reuse / best-practice precheck

### Repository-native reuse

The implementation reuses and references existing canonical semantics instead of duplicating them:

- `src/platform/Security/agentIam.ts::AgentPrincipalContext`;
- `src/platform/Security/agentIam.ts::AGENT_CAPABILITIES`;
- `src/platform/Security/agentIam.ts::isKnownAgentCapability`;
- `src/platform/Security/agentIam.ts::evaluateAgentAuthorization` as a downstream non-client boundary;
- `src/platform/Security/providerProfile.ts` for provider/model non-authority semantics;
- `docs/architecture/ai-agent/AI_AGENT_TARGET_ARCHITECTURE.md` for the Human -> AI Client -> Control Plane architecture.

No new IAM, policy gate, approval system, capability registry, tool adapter or execution stack is introduced.

### Advisory external references

- NIST SP 800-218 SSDF v1.1: secure-development practices integrated into the SDLC;
- W3C Trace Context Recommendation: portable request/trace context propagation without turning trace metadata into authority;
- RFC 9457 Problem Details: machine-readable HTTP error representation if a later HTTP adapter requires one.

These references are advisory and do not create a second CAPITAL-AI policy hierarchy.

## 3. Repository-wide strangler scan

### Scan: requested capability contract

Repository code search for `requestedCapability` returned no productive runtime implementation. The CLIENT-04 requested-capability concept existed only as project roadmap/contract intent before this branch.

### Scan: canonical lifecycle states

Search for the complete client state vocabulary `SUBMITTING | ACCEPTED | BLOCKED | SUCCEEDED | FAILED` returned the Agent Client project roadmap only. No productive status adapter implementing this PVC-01 lifecycle was found.

### Scan: authorization request construction

`AgentAuthorizationRequest` is present in the canonical Security/IAM implementation and consumers such as Compliance, authorized execution, Documentary orchestration and tests. These are downstream/control/foreign-owner surfaces, not a productive PVC-01 client implementation.

### Scan: attributable principal construction

Search for `appId`, `sessionId`, `credentialHolderId` and `requestId` found:

- canonical IAM types;
- Operations/Systemadmin scripts that construct principals for controlled execution;
- tests/fixtures for IAM, provider, audit and Systemadmin behavior.

Two similar Systemadmin `principal(...)` builders exist in Operations scripts, but they are foreign execution-host code. They do not establish a PVC-01 productive client path and are not modified by this project.

### Scan: provider/model semantics

`src/platform/Security/providerProfile.ts` already enforces that provider/profile context participates in control-plane scoping and does not replace explicit IAM authorization. The Agent Client contract references that non-authority rule and does not duplicate the provider registry.

## 4. Strangler trigger decision

| Trigger from `RUNTIME_MAPPING.md` | Evidence on source main | Decision |
|---|---|---|
| duplicate productive client request construction in two or more paths | not found | `NOT TRIGGERED` |
| inconsistent productive identity/capability handoff causing client drift | not found | `NOT TRIGGERED` |
| duplicated productive response/status mapping with divergent behavior | not found | `NOT TRIGGERED` |
| shared physical client module would reduce evidenced productive duplication without importing authority | not evidenced | `NOT TRIGGERED` |

**Decision:** `NO PHYSICAL PVC-01 RUNTIME MODULE`.

Creating a new TypeScript Agent Client module now would be an unconsumed parallel implementation rather than an evidenced strangler/refactor. The smallest conforming implementation is therefore the project-local, provider-neutral `CLIENT_CONTRACTS.md` contract baseline.

## 5. CLIENT-02 through CLIENT-06 disposition

| Work package | Result |
|---|---|
| CLIENT-02 Request Contract | contract baseline defined in `CLIENT_CONTRACTS.md`; no grant/credential semantics |
| CLIENT-03 Identity Handoff | attributable `AgentPrincipalContext` semantics referenced; IAM evaluation remains downstream |
| CLIENT-04 Capability Handoff | requested capability contract references canonical `AGENT_CAPABILITIES`; no client-owned grants |
| CLIENT-05 Response Contract | lifecycle/error/deny-preservation semantics defined; transport remains neutral |
| CLIENT-06 Security Boundary | fail-closed, no direct protected mutation path, no provider/model authority |

## 6. CLIENT-07 tests/evidence disposition

`WORK_PACKAGES.md` requires runtime contract tests only when a physical PVC-01 implementation slice is introduced. Because the strangler trigger is not met and no runtime code is introduced by this work item:

- no runtime test file is created;
- no build/test `PASS` is claimed;
- the negative-test matrix remains the mandatory future acceptance set;
- this re-correlation/scan record is the current CLIENT-07 evidence for the no-runtime decision.

This is intentionally fail-closed evidence: absence of a physical implementation is not represented as successful runtime validation.

## 7. Scope guard

Not executed locally:

- IAM/authorization changes;
- Operations/Systemadmin principal-builder refactor;
- PolicyGate changes;
- protected GitHub/Supabase/Render/Stripe mutations;
- EventMesh/trace authority;
- PR creation;
- merge.

## 8. Next gate

Before PR-creation approval may be requested, current `main` and the candidate head must be re-read, open PRs and semantic/changed-file overlap re-correlated, and available cheap validation repeated against the exact candidate snapshot. PR creation remains a separate explicit Human/Owner gate.
