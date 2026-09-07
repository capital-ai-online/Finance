# CAPITAL-AI-SEC — SEC-SOTA-02 AI / Agent / MCP Control Inventory

**Work item:** `SEC-SOTA-02`  
**Project:** `CAPITAL-AI-SEC`  
**Owner:** `CAPITAL-AI-SEC` for Security requirements, threat analysis, findings and independent verification  
**Primary Productive PVC ownership:** `[]`  
**Inspection baseline:** `main@96119f958cacbf35614747380a066b87fdb1ee40`  
**Trust root:** `/AGENTS.md` v2.8.1  
**Applicable control-plane contract:** `ESS-0019` v1.2.0 / `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE`  
**Applicable component contract:** `ESS-0006` v1.1.0  
**Status:** `SECURITY_INVENTORY_IMPLEMENTED_BRANCH / FINDINGS_ROUTED / NOT_VERIFIED_CLOSED`  
**Date:** `2026-09-07`

## 1. Scope and authority boundary

This evidence inventories the current AI/model/agent/tool/retrieval/inter-agent/MCP surfaces against the existing CAPITAL-AI authority and control plane. It does not create a second Agent Control Plane, MCP architecture, IAM plane, execution host, finding authority or productive PVC owner.

The required projection is:

`surface -> trust boundary -> current authority path -> untrusted input/tool risk -> current control -> evidence -> gap -> productive owner/PVC -> verification gate`.

External OWASP GenAI/Agentic/Agent Control Standard/Secure MCP material remains `ADVISORY_NON_AUTHORIZING` through `docs/evidence/security/CAPITAL_AI_SEC_SOTA_BASELINE_2026-09-07.md`. Repository requirements in this inventory come from current `/AGENTS.md`, accepted ADR/ESS contracts and current code/evidence.

Current open-PR correlation at branch creation:

- open PR #839: `CAPITAL-AI-OPS` zizmor/workflow-hardening; changed files are GitHub workflows, OPS evidence and a PR-baseline regression test;
- no changed-file overlap with this Security evidence/roadmap slice;
- PR #839 remains an independent OPS/Supply-Chain writer and is not absorbed by `SEC-SOTA-02`.

## 2. Current control inventory

| Surface | Trust boundary / risk | Current authority path | Current control / evidence | Security result | Productive owner / PVC | Verification gate |
|---|---|---|---|---|---|---|
| Repository / agent instruction inputs | Prompt, retrieved, tool and inter-agent content can attempt authority expansion | `/AGENTS.md` -> ESS-0019 | Trust Root makes retrieved/tool/inter-agent content untrusted; ESS-0019 states source/tool content cannot redefine authority | `CONTROL_PRESENT` | Governance authority remains `CAPITAL-AI-GOV / PVC-05`; execution remains target-owned | negative authority-expansion tests remain applicable per consuming surface |
| Provider-neutral Agent IAM | Provider/model spoofing, capability inheritance, self-approval, excessive mutation | ESS-0019 -> ADR-0058 -> `src/platform/Security/agentIam.ts` | deny-by-default; complete principal; exact non-inheriting grants; risk floor; kill switch; HIGH/CRITICAL approval; CRITICAL step-up; no `MERGE` capability | `CONTROL_PRESENT` | reusable Security control: `CAPITAL-AI-SEC`; consuming productive owner unchanged | exact negative tests for incomplete principal, unknown/missing grants, self-approval, risk downgrade and `MERGE` denial |
| Provider profile / execution-client scope | Provider identity used as authority; profile overreach; mutation replay | ESS-0019 -> provider profile -> Agent IAM / real caller | `providerProfile.ts`: active ChatGPT/Claude/Grok profiles, retired aliases denied, research ceiling, appId/profile match, audit correlation for mutation, envelope replay gate | `CONTROL_PRESENT / HOST_EVIDENCE_BOUNDARY` | repository control `CAPITAL-AI-SEC`; external execution-host evidence `CAPITAL-AI-OPS / PVC-02` | real caller + canonical path + bypass denial + audit + rollback-to-read-only + external host configuration evidence |
| Systemadmin controlled execution | Scope creep, self-authority, replay, unaudited repository mutation | ADR-0065 / provider profile / Agent IAM / ADR-0059 | `authorizeSystemadminAuditedExecution()` applies provider scope, self-authority deny list, envelope replay input, durable authorization audit and bound execution permit; M9 replay drill records real-caller closure | `CONTROL_PRESENT` | `CAPITAL-AI-OPS / PVC-02` plus applicable execution PVC | preserve exact-head/permit/audit negative tests; no new finding from this inventory |
| Generic audited agent adapter | Authorization/outcome inspectability and durable audit | ADR-0059 -> `authorizedAgentExecution.ts` | durable authorization audit + append-only terminal outcome; persistence failure is fail-closed | `CONTROL_PRESENT / GENERIC_ADAPTER_NOT_A_GLOBAL_CHOKEPOINT` | actual consuming owner | use audited adapter or equally strong specialized audited path whenever ADR-0059 evidence is required |
| Documentary maintenance execution host | AI-assisted BRANCH/COMMIT/PR operations can bypass current Human gate or durable audit | `/AGENTS.md` -> ADR-0058/0059 -> target Documentary contract | current control loop evaluates `BRANCH`/`COMMIT`/`PR` through synchronous `evaluateAgentPolicy()` and then executes git branch/commit/push; it can dispatch `open-agent-draft-pr.yml` automatically | `CONFIRMED_GAP: F02 + F03` | `CAPITAL-AI-DOC / PVC-03`; shared execution workflow remains separate OPS/GOV dependency where applicable | caller must stop before PR creation for exact Human approval; repository mutations must have attributable durable audit/equivalent evidence before Security closure |
| `open-agent-draft-pr.yml` | PR creation is protected Human/Owner transition | `/AGENTS.md` `CTRL-SDLC-PR-CREATE-001` -> trusted-main PR template | workflow validates branch, baseline, work claim and template, then executes `gh pr create`; workflow contains no Human approval check itself | `SAFE_ONLY_WHEN_CALLER_HAS_CURRENT_EXACT_HUMAN_APPROVAL`; Documentary automatic dispatch violates that precondition | calling project owns invocation; workflow mechanism is controlled-implementation dependency | exact Human approval bound to current main/head/scope/title before workflow dispatch |
| AI Chat RAG prompt assembly (`POST /api/ai/chat`) | indirect prompt injection from repository chunks; untrusted history role spoofing; financial-analysis output integrity | ESS-0019 Research Evidence Contract + server AI contract | endpoint authenticates user, records retrieval evidence/transparency and declares grounding/citation completeness not verified; however retrieved chunk text is appended directly into the **system instruction**, and caller-supplied history is converted into `user` or `assistant` turns | `CONFIRMED_GAP: F01`; session provenance also `EVIDENCE_GAP: F06` | primary analysis owner `CAPITAL-AI-FINTECH / PVC-15`; request/session contract dependency `CAPITAL-AI-CLIENT / PVC-01` | untrusted retrieval must be data-delimited below trusted instructions; assistant-role history must be server-attested or normalized; negative indirect-injection/role-spoof tests required |
| Shared business LLM routing | user/domain strings attempt semantic prompt injection or malformed output | target project -> `agentModelRouting.ts` | Anthropic forced tool-schema / OpenAI JSON-schema for structured calls; text calls preserve system/user role separation; no generic tool execution is exposed by model router | `PARTIAL_CONTROL`; semantic injection can influence research output but cannot grant tool/repository authority through this router | primarily `CAPITAL-AI-FINTECH / PVC-15` for domain-analysis agents; other callers remain target-owned | consuming surfaces must keep model outputs non-authoritative and add injection tests where outputs affect consequential analysis |
| Raw-material / crypto multi-agent orchestration | inter-agent poisoning, privilege propagation, autonomous consensus | target FinTech roadmap/contracts | orchestrators fan out independent agents with `Promise.all` and aggregate typed results; raw-material authority explicitly remains `RESEARCH_CONTEXT_ONLY`, non-canonical, non-score-eligible and non-execution-eligible | `NO_DIRECT_AGENT_TO_AGENT_AUTHORITY_PATH_FOUND` | `CAPITAL-AI-FINTECH / PVC-15` | preserve research-only/non-canonical boundary and test that agent output cannot become canonical score/execution authority |
| Score Explainability Agent + Supabase score evidence tool | retrieved DB data attempts prompt injection; read capability escalates to write | ESS-0018 / ADR-0050 | tool validates symbol/date, bounded query, no raw SQL/write; NO_EVIDENCE fails closed; agent cannot mutate canonical score | `READ_CONTROL_PRESENT`; retrieved text remains part of F01-style semantic injection family | `CAPITAL-AI-FINTECH / PVC-17` for explainability consumer; evidence semantics dependency `CAPITAL-AI-DATA / PVC-10` | indirect-injection test using instruction-like `score_basis`; prove canonical score/ranking unchanged |
| Admin diagnostics Agent + Supabase write tools | model tool abuse, write bypass, TOCTOU, external mail side effect | ESS-0018 / ADR-0051 -> capability -> policy -> single-use approval -> fingerprint -> Supervisor apply | current productive caller is deterministic (no LLM); capability check precedes tools; writes are invoked by `AdminDiagnosticsAgent` through `executeApprovedSupervisedAction`; direct production callers outside this path were not found; fingerprint recheck protects current DB state | `CONTROL_PRESENT / NO PRODUCTIVE WRITE-BYPASS FOUND` | productive Admin/Ops implementation `CAPITAL-AI-OPS / PVC-02`; Security verifies | retain caller-only path, single-use approval, fingerprint and negative bypass tests |
| In-app MCP protocol server | missing MCP server inferred as an implementation gap | ESS-0018 / ADR-0041 status | current ESS-0018 explicitly records no MCP server in `src/`/`server/` and treats in-app MCP as not implemented by design | `NOT_APPLICABLE / NOT_A_GAP` | N/A | future in-app MCP requires separate owner-scoped architecture/security review before activation |
| Repository `.mcp.json` GA4 developer tooling | external MCP code identity, host credentials, permission/session isolation, tool-chain drift | `/AGENTS.md` external-tool boundary + ESS-0019 untrusted tool contract | config invokes `uvx analytics-mcp` and references host-side credential/project environment; repository cannot prove external host session/permission state from this file | `CONFIRMED_EVIDENCE_GAP: F04`; unpinned executable identity additionally overlaps `SEC-SOTA-03` supply-chain inventory | `CAPITAL-AI-OPS / PVC-02` for execution-host/tooling assurance; any marketing capability owner remains unchanged | immutable/version-bounded executable identity where supported; read-only capability/readback; host AuthN/AuthZ/session-isolation evidence; no connector mutation without separate Human request |
| ESS-0018 / ADR-0051 authority wording | provider-specific instruction mirror could be mistaken for binding authority | `/AGENTS.md` precedence -> Governance ESS/ADR lifecycle | current files still cite `CLAUDE.md` as binding/source of the Policy->IAM->Approval chain, while current Trust Root explicitly prohibits provider instruction mirrors as repository authority | `CONFIRMED_GOVERNANCE_HYGIENE_GAP: F05`; no effective authority expansion because `/AGENTS.md` wins | `CAPITAL-AI-GOV / PVC-05` | replace stale provider-specific authority references with current Trust Root / accepted stable authority without changing technical semantics |
| Retired M10 / `AUTHORIZE_PR_CI` | historical surface falsely reopened as current gap | `/AGENTS.md` | current Trust Root explicitly marks former M10 runtime retired/off and prohibits treating absence as a current gap | `NOT_A_GAP / HISTORICAL_ONLY` | N/A | do not restore absent retired runtime without new Human/Owner authority |

## 3. Confirmed findings and routed ownership

### `SEC-SOTA02-F01` — AI Chat indirect prompt-injection trust-boundary violation

**Severity:** `HIGH` for financial-analysis/output integrity; **execution-authority impact:** bounded by current no-tool/no-approval design of this endpoint.  
**State:** `CONFIRMED / OWNER_ROUTED`  
**Primary productive owner:** `CAPITAL-AI-FINTECH / PVC-15 — Domain Analysis / Executor`  
**Dependency:** `CAPITAL-AI-CLIENT / PVC-01` for caller/history contract where session provenance changes are required.

Evidence:

- `src/services/rag/retrieval.ts::formatChunksForPrompt()` emits retrieved repository chunk text as a plain prompt block;
- `server/ai.ts` appends that block directly to the trusted `systemInstruction`;
- the same endpoint accepts client-supplied history and maps any non-`user` role to an `assistant` message;
- ESS-0019 requires retrieved/source/tool content to remain untrusted data and not be followed as instruction merely because it was retrieved.

Required remediation outcome: trusted system rules and untrusted retrieved/history content remain structurally distinct; arbitrary retrieved text cannot occupy the trusted instruction channel; caller-controlled history cannot manufacture trusted assistant provenance. Required Security return evidence includes negative tests with malicious retrieved instructions and role-spoofed history plus proof that no tool/approval/execution authority can be obtained from the model output.

### `SEC-SOTA02-F02` — Documentary automated Draft-PR dispatch lacks the current exact Human PR-creation gate

**Severity:** `HIGH` Governance/Security boundary  
**State:** `CONFIRMED / OWNER_ROUTED`  
**Primary productive owner:** `CAPITAL-AI-DOC / PVC-03 — Documentary Engine`

Evidence:

- current Trust Root requires exact Human/Owner approval for the current main SHA, branch-head SHA, scope/correlation and intended title before **every** PR/Draft-PR creation surface;
- `runDocumentaryMaintenanceControlLoop.ts` can check `PR`, push the branch and immediately dispatch `open-agent-draft-pr.yml`;
- `open-agent-draft-pr.yml` performs trusted baseline/claim/template checks and then runs `gh pr create`, but it does not itself establish the required Human approval.

Required remediation outcome: the Documentary automated control loop must terminate at an approval-ready handoff before dispatching the PR-creation workflow; only a separately approved exact snapshot may trigger PR creation. No Security branch implementation is authorized here.

### `SEC-SOTA02-F03` — Documentary mutation path lacks durable ADR-0059-grade execution audit at the real Git host

**Severity:** `MEDIUM` inspectability/evidence integrity  
**State:** `CONFIRMED / OWNER_ROUTED`  
**Primary productive owner:** `CAPITAL-AI-DOC / PVC-03 — Documentary Engine`

Evidence:

- Documentary mutation authorization uses synchronous `evaluateAgentPolicy()` for `BRANCH`, `COMMIT` and `PR`;
- the same control loop then performs real `git switch`, file writes, `git commit`, `git push` and workflow dispatch;
- ADR-0059 retains `evaluateAgentPolicy()` for compatibility but requires agent execution needing ADR-0059 evidence to use an audited adapter/equivalent durable path;
- the repository already contains durable audited patterns in `authorizedAgentExecution.ts` and specialized `systemadminAuditedExecution.ts`.

Required remediation outcome: authorization and terminal mutation outcome are attributable to actor/app/agent/session/request/capability/policy/tool/repository/branch/commit/PR evidence, with audit failure handled fail-closed where required. Reuse an existing audited pattern; do not create a second audit plane.

### `SEC-SOTA02-F04` — External MCP/connector host assurance is not independently proven from repository state

**Severity:** `MEDIUM` assurance gap  
**State:** `EVIDENCE_GAP / OWNER_ROUTED`  
**Primary productive owner:** `CAPITAL-AI-OPS / PVC-02 — Controlled Implementation`

Evidence:

- provider profiles explicitly describe ChatGPT/Claude/Grok tool/MCP grants as host/session-side and require external-host configuration evidence for cutover readiness;
- `.mcp.json` invokes `uvx analytics-mcp` and references external host credentials/project identity, but does not prove the live host's AuthN/AuthZ, granted tool set, session isolation or effective read/write ceiling;
- there is no in-app MCP server whose internal code could substitute for this external-host evidence.

Required remediation outcome: evidence/readback of the effective external host/tool grant and session boundary; prove least privilege and that tool content cannot expand repository authority. The executable/version identity portion is handed to `SEC-SOTA-03` because it is supply-chain assurance. Any installation, connection, permission or credential mutation remains a separately authorized Human action.

### `SEC-SOTA02-F05` — stale `CLAUDE.md` authority references in current ESS/ADR text

**Severity:** `LOW` effective-risk / `MEDIUM` governance-hygiene significance  
**State:** `CONFIRMED / OWNER_ROUTED`  
**Primary productive owner:** `CAPITAL-AI-GOV / PVC-05 — Platform Director`

Evidence: current ESS-0018 and ADR-0051 still describe `CLAUDE.md` as a binding/source authority for the agent write chain. Current `/AGENTS.md` is the sole repository trust root and explicitly prohibits provider instruction mirrors from defining repository authority.

Required remediation outcome: replace provider-specific authority wording with the current stable Trust Root/accepted authority chain while preserving the existing technical control semantics. Security does not modify the foreign Governance/ESS lifecycle in this branch.

### `SEC-SOTA02-F06` — AI Chat session/history provenance is not independently attestable

**Severity:** `MEDIUM` context-integrity evidence gap  
**State:** `EVIDENCE_GAP / OWNER_ROUTED`  
**Primary productive owner:** `CAPITAL-AI-CLIENT / PVC-01 — Agent Client`  
**Server consumer dependency:** `CAPITAL-AI-FINTECH / PVC-15`

Evidence: `POST /api/ai/chat` verifies the current caller identity, but the complete prior `history` is supplied by the client and is not bound to a server-issued session identity in the inspected request/evaluation projection. No shared server-side conversational memory leak was found; the gap is provenance/continuity, not a claim that cross-user data leakage currently occurs.

Required remediation outcome: explicitly define stateless-history semantics or bind conversational history to a server-attested session/request chain; reject/normalize unsupported role values and provide negative tests demonstrating cross-session/context substitution cannot become trusted provenance.

## 4. Explicit non-findings / bounded conclusions

1. **No missing in-app MCP server is reported as a gap.** Current ESS-0018 intentionally uses internal TypeScript tools and says MCP is not implemented for in-app agents.
2. **No direct productive Supabase write-tool bypass was found.** Current non-test callers route the two write functions through `AdminDiagnosticsAgent` and `executeApprovedSupervisedAction`; tool tests can call functions directly by design.
3. **No direct agent-to-agent authority channel was found in the inspected FinTech orchestrators.** Parallel agents receive the same bounded domain input and return research annotations to a deterministic orchestrator; they do not grant each other capabilities.
4. **Raw-material agent output is explicitly non-canonical and non-execution-authoritative.** Prompt manipulation can corrupt research annotations but cannot, through this surface alone, grant scoring/execution authority.
5. **Systemadmin replay protection is not reopened as a gap.** Current code passes envelope replay fields into the real audited caller, and existing M9 evidence records closure of the prior dead-code integration defect.
6. **The theoretical generic approval-reuse residual recorded in historical M9 evidence is not promoted to a new current P0 finding here.** No current active provider profile grants the HIGH/CRITICAL production capabilities that would make that generic path a demonstrated productive exposure; future capability expansion must re-evaluate it.
7. **Retired M10 / `AUTHORIZE_PR_CI` is historical only and is not a missing implementation.**
8. **PR #839 is not a conflicting writer for this inventory.** Its workflow-security hardening belongs to OPS and supply-chain assurance; relevant results may later inform `SEC-SOTA-03`.

## 5. Verification state

This pass is a repository/static contract inspection on exact `main@96119f958cacbf35614747380a066b87fdb1ee40` plus current GitHub PR/workflow evidence. It did **not** execute production mutations, external MCP host configuration changes, provider permission changes, destructive fault injection or new local/hosted application tests.

- current Trust Root / project / PVC / Security roadmap / ESS-0019 / ADR-0058 / ADR-0059: `INSPECTED`;
- current code paths listed above: `INSPECTED`;
- PR #837 final Hosted Class-D checks: `PASS` on final PR head `d5e77d5fded414931896f4e6781e3dcfffcaed19` before Human merge;
- `SEC-SOTA02-F01..F05`: evidence-grounded findings as scoped above;
- `SEC-SOTA02-F06`: evidence/provenance gap, not a proven cross-user leak;
- new local/unit/build execution for this docs/evidence slice: `NOT RUN`;
- external MCP/connector live readback: `NOT RUN / EXTERNAL HOST EVIDENCE REQUIRED`;
- finding closure: `NOT VERIFIED`; productive owners must remediate and return evidence before independent Security closure.

## 6. Exit-gate result

`SEC-SOTA-02` inventory output is materialized when this evidence and the active Security roadmap/work-package projections agree on:

- actual current surfaces and control boundaries;
- no parallel Control Plane/MCP architecture;
- explicit `NOT_APPLICABLE` treatment of absent in-app MCP runtime;
- confirmed/evidence gaps with one Primary Owner/PVC each;
- no foreign productive remediation inside the Security branch;
- independent Security verification gates for every routed gap.
