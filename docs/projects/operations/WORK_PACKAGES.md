# CAPITAL-AI-OPS Work Packages

**Project:** `CAPITAL-AI-OPS`  
**Status:** ACTIVE BACKLOG / NON-AUTHORIZING  
**Correlation baseline:** `main@5e9be38b5af037f85fab67643043c5be30f87e16`  
**Correlation date:** `2026-09-10`  
**Open PR baseline:** none at integrity-sync intake; current re-correlation: PR #874 open

## Current terminal repository packages

| Priority | Package | PVC | Scope | Exit evidence / current disposition |
|---:|---|---|---|---|
| Owner-directed | `OPS-POST851-EDGE-01` Cloudflare→Render Edge Trust | primary `PVC-02`; supporting `PVC-08` | fail-closed origin provenance before trusting Cloudflare visitor identity | `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` via PR #859; secret deployment coverage added via PR #867; provider provisioning separate |
| Owner-directed | `OPS-POST851-OBS-01` Telemetry correlation extension | primary `PVC-02`; supporting `PVC-18` | extend existing logger/Telemetry with validated W3C context and edge provenance | `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` via PR #859; no second logger/collector/audit plane |
| Owner-directed | `OPS-POST851-PI-01` Product Intelligence contract | primary `PVC-02`; supporting `PVC-18` | vendor-neutral aggregate-safe product event schema | `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` via PR #859; consumer ownership unchanged |
| Owner-directed | `OPS-DEP-FLOOR-01` Multer/Nodemailer dependency floors | `PVC-02` | harden direct manifest minimums without unrelated dependency churn | `IMPLEMENTED_ON_MAIN` via PR #865 |
| Owner-directed | `OPS-EDGE-SECRET-COVERAGE-01` Edge-Trust secret deployment coverage | primary `PVC-02`; supporting `PVC-08` | bind `CAPITAL_AI_EDGE_TRUST_SECRET` to server-only deployment/secret manifest coverage | `IMPLEMENTED_ON_MAIN` via PR #867; provider secret provisioning remains separate |
| Blocked follow-up | `OPS-POST851-ID-02` Render OIDC/OAuth2.1/MCP | `PVC-02` | external execution-host identity only after Security/Authority re-correlation | `BLOCKED / NOT_IN_CURRENT_SLICE` |

## Current foreign Security dependency — M6 / Supply-Chain continuation

| Package | Responsible project Roadmap state | Repository evidence | Long-term technical owner / PVC | OPS disposition |
|---|---|---|---|---|
| `SEC-SOTA03-ARTIFACT-DIGEST-BINDING` | Security Roadmap on current main: `IMPLEMENTED_BRANCH / CI_REMEDIATION_COMMITTED / HOSTED_REVALIDATION_OPEN`; aggregate `SEC-SOTA-03` remains `IN_PROGRESS / ... / INVENTORY_OPEN` | PR #872 Human-merged as `a05d75f27fdd0c3bea5321a23cbf2de24bdbc56c`; final head `e59308599dde3f7cf050601a2b6e64c5a73aaf59`; PR CI, Governance and Container Security `success` | `CAPITAL-AI-OPS / PVC-02` + `PVC-07` | consume implementation on main; do not synthesize Security `VERIFIED/CLOSED`; Security-owned Roadmap synchronization remains open |

The package extends the existing ADR-0060/M6 provenance chain by binding deterministic SHA-256 identity for the actual built runtime output into the existing release-manifest/provenance verification path.

The responsible Security Roadmap has not yet caught up with the Human merge and exact-head hosted results. That status drift is kept explicit. Under the current project-status model, the derived M6 continuation therefore remains **CURRENT OPEN** until `CAPITAL-AI-SEC` re-correlates its own Roadmap and records the current bounded-slice/aggregate state.

**Owner exit gate:** Security Roadmap is synchronized to then-current main and final exact-head evidence; the merged runtime-artifact digest path is classified without stale `IMPLEMENTED_BRANCH`/`HOSTED_REVALIDATION_OPEN` wording, while `SEC-SOTA-03` remains open or closes only according to Security-owned residual inventory and verification evidence.

## GitGuardian least-privilege audit boundary

The permanent manual GitGuardian health/audit path is repository tooling under OPS/PVC-02, not a second Secret-Scanning engine. The external GitGuardian App remains the canonical scanner path through `GitGuardian Security Checks`.

Current repository contract after Human-merged PR #863:

- API-key authentication is checked through `GET /v1/health`;
- Finance repository monitoring is read through `GET /v1/sources`;
- no ggshield installation or invocation occurs in the health workflow;
- `scan`, `sources:write` and `secrets:read` are not required by the permanent health/audit design;
- `monitoring_status` is the required PASS evidence;
- denied or unsupported provider-health evidence remains `NOT-RUN`;
- no API-key value, token payload, Secret value or provider response body is emitted.

Post-merge workflow run `#34468840264` executed on exact `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46` and completed successfully: API authentication PASS, `monitoring_status=active/PASS`, no explicit FAILs. `github_installation`, `api_network` and `api_access_rights` remained `NOT-RUN` due HTTP 403; `check_run_configuration` remained `NOT-RUN` because the current workflow has no documented public endpoint for that evidence.

GitGuardian's current API documentation defines `sources:read` as view-only source access, `sources:write` as view/edit source access and `scan` as the separate scanning capability required for ggshield. The target credential contract is therefore `sources:read-only` for this permanent health/audit use case.

The current repository evidence does **not** enumerate the complete scope set attached to the existing `GITGUARDIAN_API_KEY`. Successful authentication and source reads prove the required capability, not the absence of additional provider scopes. Exact configured credential scope is therefore `NOT-PROVEN`. Provider-side readback or a separately authorized replacement/rotation is required to close that external least-privilege evidence gate. This repository package performs no token, permission or provider mutation.

## Edge-Trust contract

Current main contains the fail-closed Edge-Trust implementation and the server-only secret deployment-coverage correction.

Repository contract:

- trusted public hosts are centralized and reused by CORS/edge validation;
- `x-forwarded-proto` must be `https`;
- `CAPITAL_AI_EDGE_TRUST_SECRET` is server-only and must be provisioned separately;
- `x-capital-ai-edge-token` must match the configured secret using constant-time comparison;
- `CF-Connecting-IP` and `CF-Ray` must be syntactically valid;
- forwarding headers do not establish provenance by themselves;
- denied provenance falls back to direct peer identity;
- secret/header values are never emitted to telemetry.

Provider configuration, secret creation/rotation, Cloudflare rules, Render environment mutation, origin allowlist changes and Production deployment remain separate protected actions.

## Telemetry contract

Current main reuses only the existing logger/Telemetry/traceability architecture. Implemented behavior includes strict W3C `traceparent` validation, parent-span preservation, edge correlation metadata and separation between operational telemetry and durable Security audit evidence. No second logger, EventMesh, metric store or vendor collector is introduced by these packages.

## Product Intelligence contract

Allowed: `product.*` aggregate event purposes, bounded scalar properties and technical service/version/commit/trace correlation.

Denied: user/session/IP identity, contact identifiers, credentials, prompts/request bodies/query content, arbitrary nested payloads, vendor SDK/export, implicit analytics consent and product/financial decision authority.

Vendor export remains a future owner-specific adapter and cannot be activated by this OPS roadmap package.

## Security-priority packages retained

| Priority | Package | PVC | Current disposition |
|---:|---|---|---|
| P1 | `OPS-08-SEC-07` Recovery / RPO / RTO | `PVC-08` | recovery harness `IMPLEMENTED_ON_MAIN`; measured operational RPO/RTO evidence + independent Security verification open |
| P1 | `OPS-06-SEC-03` Node Control-Plane Convergence | `PVC-06` | `BLOCKED_BY_AUTHORITY_CONFLICT` |
| P1 | `OPS-02-SEC-06` Entitlement Capability Inventory | `PVC-02` | parent inventory complete; owner-return state re-correlated; independent Security verification open |
| P1 | `OPS-04-SEC-04` Fatal Process Handling | `PVC-04` | `IMPLEMENTED_ON_MAIN / VERIFIED_REPOSITORY_CONTRACT`; post-deploy evidence open |
| P1 | `OPS-02-SEC-05` Stripe Redirect Boundary | `PVC-02` | `IMPLEMENTED_ON_MAIN / EVIDENCE_READY`; Security verification open |
| P2 | `OPS-08-SEC-09` Strict CSP Promotion | `PVC-08` | `WAITING_FOR_EVIDENCE` |
| P2 | `OPS-08-SEC-10` Billing Isolation | `PVC-08` | `WAITING_FOR_EVIDENCE` |

The current integrity sync does not close, downgrade or absorb Security findings.

### `OPS-02-SEC-06` current owner-return projection

- `verified_screening`: FINTECH records `IMPLEMENTED / EVIDENCE_READY`; independent Security verification requested;
- `realtime_ai_newsfeed`: DATA records the productive route-access bypass as implemented/evidence-ready; authority-unavailable distinction and Security verification remain open;
- `FIN-SEC-03`: Backtest, Monte Carlo, `full_ai_analysis` and remaining Buffett consumer integration remain FINTECH-owned and `OPEN / REFERRED_NOT_EXECUTED`.

OPS consumes these states as parent inventory evidence only and does not implement foreign FINTECH/DATA business semantics.

## Core OPS packages

| Priority | Package | PVC | Current disposition |
|---:|---|---|---|
| P1 | `OPS-02-A` Controlled Implementation Inventory | `PVC-02` | ACTIVE / recurring |
| P1 | `OPS-04-A` Supervisor Ownership & Gap Closure | `PVC-04` | PARTIAL |
| P1 | `OPS-06-A` Version Boundary & Drift | `PVC-06` | BLOCKED at current Node authority boundary |
| P1 | `OPS-07-A` Release Evidence Contract | `PVC-07` | OPEN |
| P1 | `OPS-08-A` Production Handoff & Recovery | `PVC-08` | OPEN / PARTIAL |
| P1 | `OPS-18-A` EventMesh/Traceability Coverage | `PVC-18` | OPEN / PARTIAL; Post-#851 trace-correlation slice implemented |
| P2 | `OPS-02-CI-01` Build/Test Cost & Scope Reduction | `PVC-02` | PLANNED |
| P2 | `OPS-08-B` Reliability & Capacity Baseline | `PVC-08` | ACTIVE / PARTIAL; `OPS-08-B-SH-01` exists on separate Self-Healing readiness branch and requires current-main resync |
| P2 | `OPS-18-B` Traceability Freshness | `PVC-18` | OPEN / PARTIAL |

## `OPS-08-B-SH-01` — Self-Healing Readiness Foundation

**Branch:** `agent/operations-self-healing-readiness-20260910`  
**Primary PVC:** `PVC-08`; supporting `PVC-04`, `PVC-18`, `PVC-02`

The package extends existing Supervisor/Telemetry surfaces with Observe→Detect→Diagnose readiness and a bounded remediation contract. It does not authorize productive autonomous recovery. SH-R2 actions remain Human/Owner-gated. The branch must be resynchronized and its exact head revalidated before any renewed PR-creation approval.

Its changed files do not include top-level `ROADMAP.md`, top-level `WORK_PACKAGES.md`, the entitlement inventory or the current integrity evidence file, so it is kept separate rather than combined with this documentation sync.

## DR-03 — Provider Adapter / Execution Integration

| Priority | Package | PVC | Scope | Current disposition |
|---:|---|---|---|---|
| queued | `DR-03` Provider Adapter / Execution Integration | primary `PVC-02`; supporting `PVC-04`, `PVC-18` | smallest productive provider-adapter boundary behind existing IAM/policy/audit/trace gates | `BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE` |

DR-03 remains separate. No current package activates a provider adapter, modifies provider grants, creates a second Agent Control Plane, enables remote skill loading, creates an MCP server or performs Release/Production mutation.

## Security / execution-delegation boundary

Current Governance permits a bounded Security-primary repository remediation under its accepted Security-remediation control without transferring file, Domain or PVC ownership. CAPITAL-AI-SEC remains independent assurance owner for Security findings. This changes execution eligibility only; it does not let OPS self-close Security findings or let Security absorb OPS long-term ownership.

PR #872 demonstrates that separation: Security executed the bounded implementation, while long-term Controlled-Implementation/Release ownership remains OPS/PVC-02/PVC-07. The merged technical result is consumed by OPS, but the stale Security Roadmap state is left to the responsible Security owner to reconcile.

## Package rules

1. One bounded coherent work item per fresh compliant branch.
2. Security-relevant implementation may become `IMPLEMENTED`/`EVIDENCE_READY`; `VERIFIED/CLOSED` remains with the current independent Security authority unless a higher effective authority states otherwise.
3. Foreign productive work is not absorbed by this OPS parent inventory.
4. Runtime/provider/credential mutation is never implied by repository code or documentation.
5. Lower-precedence roadmap text does not override Accepted ADR/ESS authority.
6. Closed/unmerged PRs and deleted branches are historical input only.
7. Product Intelligence cannot become IAM, entitlement, scoring, billing or consent authority.
8. Telemetry cannot replace EventMesh, Traceability or durable audit evidence.
9. External edge identity remains untrusted until the edge-proof contract succeeds.
10. External credential capability observed by successful reads does not prove absence of unobserved provider scopes.
11. Productive M10 remains retired/off and is not reconstructed as a current package.
12. Self-Healing readiness cannot convert SH-R2 protected actions into automatic remediation.

## Current terminal references

| Work | Current result |
|---|---|
| PR #720 fatal process handling | merged; repository contract present |
| PR #729 User Lifecycle OPS closeout | merged |
| PR #776 Recovery/RPO/RTO harness | merged; measured operational evidence open |
| PR #794 GOV-07 OPS evidence return | merged |
| PR #802 RPO evaluator | closed/unmerged |
| PR #828 qs 6.16.0 | merged/deployed/terminal |
| PR #851 repository identity | merged |
| PR #852 Security policy/dependabot | merged |
| PR #854/#855 GitGuardian health/API health | merged |
| PR #857 BB-2E Source-Patch rebind | merged/terminal |
| PR #859 Edge Trust / Telemetry / Product Intelligence | merged; `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` |
| PR #860 Snyk retirement | merged Security dependency; Snyk current use retired |
| PR #861 CLIENT-08 | merged foreign dependency |
| PR #862 GitGuardian Health-Contract | merged/terminal |
| PR #863 GitGuardian sources:read audit | merged/terminal; permanent health path no longer depends on ggshield/scan |
| PR #864 bounded Security-remediation authority | merged Governance dependency |
| PR #865 Multer/Nodemailer dependency floors | merged OPS hardening |
| PR #867 Edge-Trust secret deployment coverage | merged OPS correction |
| PR #868 Governance chat/approval rollout | merged Governance dependency |
| PR #870/#871 Vite security floor / SEC-SOTA-03 sync | merged Security work; no OPS ownership transfer |
| PR #872 artifact-digest binding | merged as `a05d75f27fdd0c3bea5321a23cbf2de24bdbc56c`; Security Roadmap synchronization remains open |
| PR #873 PVC Vocabulary / Thesaurus | merged as `5e9be38b5af037f85fab67643043c5be30f87e16` |
| GitGuardian Health #34468840264 | terminal success on exact post-#863 main; required monitoring PASS; denied/unsupported categories remain NOT-RUN |

## Active-writer correlation

At integrity-sync intake:

- no Pull Request was open;
- `agent/operations-roadmap-integrity-sync-20260910` owns this bounded four-artifact documentation/evidence sync;
- `agent/operations-self-healing-readiness-20260910` is the only other active OPS branch detected and is file-disjoint from the four integrity-sync target artifacts;
- deleted/unmerged earlier integrity branches and their commits are historical input only.

Current re-correlation after PR #872/#873 merges:

- PR #872 is terminal/Human-merged into main; its implementation is consumed without claiming Security closure;
- PR #873 is terminal/Human-merged into current main; its Vocabulary/PVC terminology changes create no OPS ownership or file conflict;
- PR #874 remains open under `CAPITAL-AI-GOV` for Approval Envelope v3.4 and changes Trust Root, Development-Chain approval/policy, Governance project, registry/evaluator/test surfaces; it has no changed-file overlap with this OPS integrity-sync scope, but it is a material semantic/authority writer that must reach a terminal state before a separate DevelopmentChain current-state/milestone matrix is materialized;
- no parallel OPS implementation or Security status overwrite is created.

## Exit gate for current integrity-sync package

- branch has been resynchronized to `main@5e9be38b5af037f85fab67643043c5be30f87e16` after PR #872 and #873 merges;
- current open-PR set is re-correlated: PR #874 is changed-file disjoint from this branch and its later DevelopmentChain authority dependency is explicitly sequenced;
- PR #859/#867 are represented as merged/current-main work, not `ACTIVE_BRANCH` work;
- PR #872 is represented as merged implementation with responsible Security Roadmap status drift still open rather than synthetic closure;
- GitGuardian Health run #34468840264 is represented with exact PASS/NOT-RUN semantics and is not promoted to a different SHA;
- current workflow design supports a `sources:read-only` target contract, while actual provider token scopes remain `NOT-PROVEN`;
- Self-Healing readiness remains separate and must resync before its own PR approval;
- later DevelopmentChain milestone/current-state work remains sequenced after the active Governance Approval-Envelope writer reaches terminal state and responsible project Roadmaps are re-read;
- no provider write, credential mutation, connector mutation or Production mutation occurs;
- branch readback/diff validation must PASS;
- final main/head/open-PR correlation is repeated before PR approval;
- PR creation remains separately Human/Owner-approved.
