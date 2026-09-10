# SEC-SOTA02-F01 — AI Chat Trust-Boundary Remediation Evidence

**Date:** 2026-09-10  
**Project:** `CAPITAL-AI-FINTECH`  
**Project folder:** `docs/projects/fintech/`  
**Primary PVC:** `PVC-15 — Domain Analysis / Domain Executor`  
**Primary Owner:** `CAPITAL-AI-FINTECH`  
**Source finding:** `SEC-SOTA02-F01`  
**Security owner:** `CAPITAL-AI-SEC` — independent verification authority  
**CLIENT dependency:** `CAPITAL-AI-CLIENT / PVC-01` for durable session/history provenance (`SEC-SOTA02-F06`)  
**Branch origin baseline:** `main@181579df1b4d975379a2b7113ad946da341ed6e2`  
**Current synchronized main baseline:** `main@181579df1b4d975379a2b7113ad946da341ed6e2`  
**Branch:** `agent/fintech-sec-sota02-f01-recorrelation-20260910`  
**FINTECH state:** `IMPLEMENTED / EVIDENCE_READY`  
**Security state:** `VERIFICATION REQUESTED — NOT VERIFIED / NOT CLOSED`

## 1. Required remediation gate

The bounded remediation requires that:

1. retrieved repository text remains untrusted data and never occupies the trusted system-instruction channel;
2. caller-controlled history cannot manufacture trusted assistant/system/developer/tool provenance;
3. malicious retrieved instructions and history-role spoofing have deterministic negative evidence;
4. AI Chat output gains no tool, approval or execution authority through this remediation.

ESS-0019 v1.2.0 remains the binding AI-agent capability-plane contract. Retrieved/source/tool content is untrusted and cannot elevate capability or redefine authority.

## 2. Current-main / authority / parallel-work correlation

The predecessor branch `agent/fintech-sec-sota02-f01-ai-chat-trust-20260910` retained the bounded F01 implementation at head `6c801cf8eecc44f299dd7700e91ce2b163dad6ec`, but its merge base was `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`. Against current `main@181579df1b4d975379a2b7113ad946da341ed6e2`, GitHub reported `14 ahead / 73 behind`.

The 73 current-main commits changed 38 files, including Governance, Documentary, Operations, Security-roadmap and supply-chain surfaces, but none of the seven F01 runtime/test/evidence paths. Semantic review preserved the same controlling invariant from current `/AGENTS.md` v2.9.0 and accepted ESS-0019 v1.2.0: retrieved, source, tool and caller-provided content remains untrusted and cannot elevate capability or repository authority.

No Pull Request was open at the replacement-branch preflight. The fresh replacement branch `agent/fintech-sec-sota02-f01-recorrelation-20260910` was created directly from exact current `main@181579df1b4d975379a2b7113ad946da341ed6e2`. Only the effective seven-file F01 payload is rematerialized; the predecessor branch history and stale approval snapshots are not imported as authority.

Current project resolution remains:

- Current Project: `CAPITAL-AI-FINTECH`;
- Current Project Folder: `docs/projects/fintech/`;
- Primary PVC: `PVC-15 — Domain Analysis / Domain Executor`;
- Primary Owner: `CAPITAL-AI-FINTECH`;
- Security owner: `CAPITAL-AI-SEC` for independent verification and closure;
- CLIENT/PVC-01 session/history provenance remains separate under `SEC-SOTA02-F06`.

The current Approval Envelope semantics introduced on main by PR #874 are material lifecycle context. Earlier PR-create approvals do not transfer to this replacement branch; any PR creation requires a newly correlated exact current-main/head/scope/title envelope.

## 3. Reuse / architecture precheck

No new dependency, provider, plugin, MCP host, guardrail model or parallel Control Plane is introduced.

Existing repository assets are reused:

- `generateTextWithFallback()` remains the provider-neutral text-only model path;
- `retrieveRelevantChunksWithEvidence()` and `formatChunksForPrompt()` remain the RAG/evidence projection;
- existing AI governance, transparency and request correlation remain unchanged;
- the existing `PROMPT_REGISTRY` remains the prompt identity/version authority;
- the new helper only classifies and transports trust levels for the existing AI Chat path.

Current OWASP GenAI Prompt Injection / RAG guidance was used only as advisory state-of-the-art input. Repository authority remains current `/AGENTS.md`, applicable ADR/ESS and project contracts.

## 4. Implemented trust boundary

### `src/services/aiChatTrustBoundary.ts`

A provider-neutral model-input builder now owns the AI Chat trust separation:

- fixed repository-authored system instruction;
- retrieved context only inside the current user payload between explicit `UNTRUSTED RETRIEVED CONTENT (DATA ONLY)` markers;
- current user request follows the retrieved-data block;
- retrieved/source content and caller history are explicitly untrusted and cannot become system/developer/assistant/tool/approval/execution authority;
- caller history retains only entries whose claimed role is exactly `user`;
- caller-claimed `assistant`, `system`, `developer`, `tool` and unknown roles are dropped;
- empty user-history entries are dropped.

This is intentionally fail-closed for assistant-history provenance. Durable authoritative assistant/session history remains a separate `CAPITAL-AI-CLIENT / PVC-01` dependency under `SEC-SOTA02-F06`.

### `server/ai.ts`

`POST /api/ai/chat` now calls `buildAiChatModelInput()` and passes only its `contents`, `history` and `systemInstruction` outputs to `generateTextWithFallback()`.

The former RAG concatenation into `systemInstruction` and the former mapping of every non-`user` caller history role to provider `assistant` are removed. No tool binding, structured-generation path, approval path, OrderIntent path, mutation capability or production authority is added.

### `src/services/aiUsageTracker.ts`

The existing `chat-assistant` identity remains unchanged while its prompt version advances from `1.0.0` to `1.1.0`, so pre-remediation and hardened evaluations do not share an indistinguishable prompt version.

## 5. Tests and validation

Added:

- `tests/unit/aiChatTrustBoundary.test.ts`;
- `tests/unit/aiChatTrustBoundaryWiring.test.ts`;
- `tests/unit/aiChatPromptRegistryVersion.test.ts`.

The tests cover malicious retrieved instruction isolation, role-spoof dropping, no-execution-authority invariants, productive route wiring and prompt-version pinning.

Predecessor validation remains attributable to the exact unchanged trust-boundary helper/test blobs rematerialized on this replacement branch:

- strict TypeScript `5.8.3` check: **PASS**;
- malicious RAG instruction + spoofed-history behavior smoke: **PASS**;
- predecessor current-main drift overlap review: **PASS**;
- replacement-branch changed-file overlap review against `main@181579df1b4d975379a2b7113ad946da341ed6e2`: **PASS**;
- open-PR review at replacement-branch preflight: **PASS — no open PRs**.

The behavior smoke verified that only the legitimate caller `user` history turn survives, malicious retrieved text is absent from `systemInstruction`, the same text remains bounded inside untrusted user context before `CURRENT USER REQUEST`, and the no-execution-authority invariant remains present.

## 6. NOT RUN

The following remain **NOT RUN on the replacement branch** and are not represented as PASS:

- repository Vitest execution;
- full repository TypeScript check;
- lint / repository quality checks;
- production build / CSP / predeploy checks;
- hosted GitHub Actions checks;
- provider-live Anthropic/OpenAI adversarial execution.

Hosted checks remain post-PR evidence under current `/AGENTS.md`.

## 7. Residuals / ownership boundary

- `SEC-SOTA02-F06` remains separately open under `CAPITAL-AI-CLIENT / PVC-01` with FINTECH server dependency.
- `FIN-SEC-03` remains a separate P1/HIGH FINTECH work item and is not bundled into F01.
- Prompt injection is not claimed to be mathematically eliminated; this branch removes the identified authority-channel violation and bounds caller/retrieval influence under the existing no-tool/no-execution architecture.
- `CAPITAL-AI-SEC` retains independent verification/closure authority; FINTECH does not self-promote to `SECURITY VERIFIED` or `CLOSED`.

## 8. Requested independent Security verification

After Human merge, Security should rerun malicious retrieved-instruction and history-role-spoof cases against the exact merged/runtime identity and confirm:

1. retrieved instructions cannot occupy the trusted system channel;
2. caller-provided privileged/assistant roles cannot become provider assistant/system/tool provenance;
3. AI Chat output still has no tool/approval/execution authority;
4. the separate session-provenance residual remains tracked under `SEC-SOTA02-F06` until independently resolved.
