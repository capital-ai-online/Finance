# CAPITAL-AI-OPS Work Packages

**Project:** `CAPITAL-AI-OPS`  
**Status:** ACTIVE BACKLOG / NON-AUTHORIZING  
**Correlation baseline:** `main@96e305aa076e5c8e2eb49ee4051770f756ef2fbc`  
**Correlation date:** `2026-09-16`  
**Open PR baseline:** none at post-PR #996 / post-PR #1001 current-main sync

## Current terminal repository packages

| Priority | Package | PVC | Scope | Exit evidence / current disposition |
|---:|---|---|---|---|
| Owner-directed | `OPS-POST851-EDGE-01` Cloudflare→Render Edge Trust | primary `PVC-02`; supporting `PVC-08` | fail-closed origin provenance before trusting Cloudflare visitor identity | `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` via PR #859; secret deployment coverage added via PR #867; provider provisioning separate |
| Owner-directed | `OPS-POST851-OBS-01` Telemetry correlation extension | primary `PVC-02`; supporting `PVC-18` | extend existing logger/Telemetry with validated W3C context and edge provenance | `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` via PR #859; no second logger/collector/audit plane |
| Owner-directed | `OPS-POST851-PI-01` Product Intelligence contract | primary `PVC-02`; supporting `PVC-18` | vendor-neutral aggregate-safe product event schema | `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` via PR #859; consumer ownership unchanged |
| Owner-directed | `OPS-DEP-FLOOR-01` Multer/Nodemailer dependency floors | `PVC-02` | harden direct manifest minimums without unrelated dependency churn | `IMPLEMENTED_ON_MAIN` via PR #865 |
| Owner-directed | `OPS-EDGE-SECRET-COVERAGE-01` Edge-Trust secret deployment coverage | primary `PVC-02`; supporting `PVC-08` | bind `CAPITAL_AI_EDGE_TRUST_SECRET` to server-only deployment/secret manifest coverage | `IMPLEMENTED_ON_MAIN` via PR #867; provider secret provisioning separate |
| Blocked follow-up | `OPS-POST851-ID-02` Render OIDC/OAuth2.1/MCP | `PVC-02` | external execution-host identity only after Security/Authority re-correlation | `BLOCKED / NOT_IN_CURRENT_SLICE` |

## Current foreign Security dependency — M6 / Supply-Chain continuation

| Package | Responsible project Roadmap state | Repository evidence | Long-term technical owner / PVC | OPS disposition |
|---|---|---|---|---|
| `SEC-SOTA03-ARTIFACT-DIGEST-BINDING` | Security Roadmap status is owned by CAPITAL-AI-SEC and must be read from its then-current Roadmap before any closure assertion | PR #872 Human-merged as `a05d75f27fdd0c3bea5321a23cbf2de24bdbc56c`; final head `e59308599dde3f7cf050601a2b6e64c5a73aaf59`; PR CI, Governance and Container Security were successful for that exact head | `CAPITAL-AI-OPS / PVC-02` + `PVC-07` | consume implementation on main; do not synthesize Security `VERIFIED/CLOSED` |

The package extends the existing ADR-0060/M6 provenance chain by binding deterministic SHA-256 identity for the actual built runtime output into the existing release-manifest/provenance verification path.

Responsible Security status remains Security-owned. OPS consumes merged implementation evidence without manufacturing an independent Security closure state.

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

This projection does not close, downgrade or absorb Security findings.

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
| P2 | `OPS-02-CI-01` Build/Test Cost & Scope Reduction | `PVC-02` | `IMPLEMENTED_ON_MAIN / COST_PROFILE_AND_STALE_EVENT_GUARD_MERGED` via PR #988 + PR #996; hosted cost/race evidence remains open and real-evidence-only |
| P2 | `OPS-08-B` Reliability & Capacity Baseline | `PVC-08` | ACTIVE / PARTIAL; any historical Self-Healing branch requires fresh current-main correlation before continuation |
| P2 | `OPS-18-B` Traceability Freshness | `PVC-18` | OPEN / PARTIAL |

## `OPS-08-B-SH-01` — Self-Healing Readiness Foundation — SUPERSEDED PROJECTION

**Historical branch reference:** `agent/operations-self-healing-readiness-20260910`  
**Disposition:** HISTORICAL / NON-ACTIVE / SUPERSEDED_BY_SH_02

The historical package remains evidence only. Its blanket projection that productive autonomous recovery or `SH-R2` actions require a separate per-run Human/Owner approval is superseded where it conflicts with `/AGENTS.md@CURRENT_MAIN`. The historical branch is not resumed and is not an integration base.

## `OPS-08-B-SH-02` — Autonomous Self-Healing Backend & Frontend

**Current branch:** `agent/operations-autonomous-self-healing-platform-20260920`  
**Primary PVC:** `PVC-08`; supporting `PVC-02`, `PVC-04`, `PVC-07`, `PVC-18`  
**Status:** OWNER-DIRECTED / ACTIVE / IMPLEMENTATION STARTED

Fresh Owner direction selects one bounded self-healing platform from current main. The package reuses Supervisor, process lifecycle/health, Telemetry/logger, EventMesh, Recovery Evidence Harness, Frontend architecture and the existing exact-SHA GitHub→Render promotion path.

Current implementation starts with:
- one canonical backend liveness/lifecycle authority;
- bounded one-shot Frontend stale-asset recovery;
- deterministic recovery tiers and verification semantics;
- no new provider credentials, merge authority or parallel control plane.

Detailed work graph: `work-packages/OPS_08_B_SH_02_AUTONOMOUS_SELF_HEALING_PLATFORM_2026-09-20.md`.

## DR-03 — Provider Adapter / Execution Integration

| Priority | Package | PVC | Scope | Current disposition |
|---:|---|---|---|---|
| queued | `DR-03` Provider Adapter / Execution Integration | primary `PVC-02`; supporting `PVC-04`, `PVC-18` | smallest productive provider-adapter boundary behind existing IAM/policy/audit/trace gates | `BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE` |

DR-03 remains separate. No current package activates a provider adapter, modifies provider grants, creates a second Agent Control Plane, enables remote skill loading, creates an MCP server or performs Release/Production mutation.

## OPS-PR900 GitHub / MCP / Readiness sequence

| Package | PVC | Current disposition | Bounded scope / gate |
|---|---|---|---|
| `OPS-PR900-03A` GitHub Work-Management Inventory & Package Materialization | `PVC-02` | `MERGED / CAPABILITY_GAP_VERIFIED` via PR #950 (`1ef0b91ca6b3f61f23f8f1e449ae0deadf6b1ff3`) | provider-versus-connector inventory complete; coordination-only repository contract materialized |
| `OPS-PR900-03B` GitHub Work-Management Pilot | `PVC-02` | `BLOCKED / NOT_STARTED — PROVIDER_HOST / EFFECTIVE-GRANT / READBACK GAP` | starts only when Organization Projects/Fields, Issue Types/Fields, Milestone object management and Wiki navigation are available through one separately authorized Finance-only path with real mutation + reproducible readback |
| `OPS-PR900-03C` GitHub Enterprise API Authority & Capability Matrix | `PVC-02` | `MERGED / REVALIDATED / PROVIDER_MUTATION_NOT_AUTHORIZED` via PR #962 (`770756209b6248395ce4eedce63981355728004f`) | provider API, connected execution surface and effective credential grants remain separate evidence classes |
| `OPS-PR900-04A` GitHub App / MCP Reader Setup | `PVC-02` | `MERGED / READER_CONTRACT_READY / PROVIDER_MUTATION_HELD` via PR #970 (`7f680c432dbf172a5b672ae0a3bd521b36b11dbe`) | least-privileged Reader contract only; GitHub App/OAuth/permission/Vault/PAT setup remains separately Human/Owner-authorized |
| `OPS-PR900-04B` GitHub Work-Management Gateway Adapter | `PVC-02` | `MERGED / REPOSITORY_ADAPTER_READY / PROVIDER_HOST_HELD` via PR #982 (`89d10a14830285ca8d7abd344f6f0da7b3b4c399`) | official GitHub MCP reused; bounded Finance-only Milestone + navigation-only Wiki complement on main; real gateway/Vault host and provider readback remain held |
| `OPS-PR900-05` Production Observability / Readiness | primary `PVC-08`; supporting `PVC-07`, `PVC-18` | `MERGED / EVIDENCE_CONTRACT_READY / LIVE_MEASUREMENT_OPEN` via PR #980 (`b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`) | deterministic readiness evidence contract on main; numerical SLO/incident/RPO/RTO/vendor measurements remain real-evidence-only |
| `OPS-PR900-06` Security Owner Returns | OPS-owned return surfaces | `NEXT_EXECUTABLE / PRIORITY_1` | exact-identity/time/snapshot evidence only; independent Security `VERIFIED/CLOSED` remains with CAPITAL-AI-SEC |

Provider/native feature availability, connected execution-surface capability and effective credential grants are distinct facts. Repository adapters or contracts never prove provider grants by themselves.

For 03B specifically, the merged 04A/04B repository prerequisites narrow the blocker but do not remove it. The remaining exit evidence is one separately authorized provider-host setup with metadata-only effective-grant readback, Finance-only scope and real `Read -> Write -> Readback` across the required GitHub work-management surfaces.

No partial pilot counts as successful completion, and this package does not authorize connector, OAuth, permission, GitHub App, Vault, PAT or provider integration mutation.

## Security / execution-delegation boundary

Current Governance permits a bounded Security-primary repository remediation under its accepted Security-remediation control without transferring file, Domain or PVC ownership. CAPITAL-AI-SEC remains independent assurance owner for Security findings. This changes execution eligibility only; it does not let OPS self-close Security findings or let Security absorb OPS long-term ownership.

PR #872 demonstrates that separation: Security executed the bounded implementation, while long-term Controlled-Implementation/Release ownership remains OPS/PVC-02/PVC-07. The merged technical result is consumed by OPS without manufacturing Security closure.

## Package rules

1. One bounded coherent work item/work package per fresh compliant branch; under current `/AGENTS.md`, immediately executable dependent substeps may remain on that branch while Project/folder/Primary Owner, objective, authority scope and reviewability stay coherent and no separate protected-mutation/assurance/integration boundary is crossed.
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
13. GitHub Work Management remains coordination/navigation only; Issue/Project/Milestone/Wiki metadata cannot become a parallel Roadmap, version, Governance, Security, Release, Deployment, PR or merge authority.

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
| PR #872 artifact-digest binding | merged as `a05d75f27fdd0c3bea5321a23cbf2de24bdbc56c`; Security status remains Security-owned |
| PR #873 PVC Vocabulary / Thesaurus | merged as `5e9be38b5af037f85fab67643043c5be30f87e16` |
| PR #950 GitHub Work-Management inventory/materialization | merged as `1ef0b91ca6b3f61f23f8f1e449ae0deadf6b1ff3`; 03A complete |
| PR #970 GitHub App / MCP Reader Setup | merged as `7f680c432dbf172a5b672ae0a3bd521b36b11dbe`; repository Reader contract ready, provider setup held |
| PR #980 Production Readiness Evidence | merged as `b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`; evidence contract ready, live measurement open |
| PR #982 GitHub Work-Management Gateway Adapter | merged as `89d10a14830285ca8d7abd344f6f0da7b3b4c399`; repository adapter ready, provider host held |
| PR #988 CI cost profiles | merged as `741cdaccb2b2236d626de13c9293d604f48c53e7`; cost-profile policy on main |
| PR #996 stale PR-event guard | merged as `60ae94a07ab19c497e841fce48e4e96c81cdfcf1`; snapshot-bound stale-event/concurrency hardening on main |
| PR #1001 branch work-package / post-merge continuation | merged as current-main Authority update; `/AGENTS.md` re-read before this sync |
| GitGuardian Health #34468840264 | terminal success on exact post-#863 main; required monitoring PASS; denied/unsupported categories remain NOT-RUN |

## Current writer correlation — 2026-09-16

- current main: `96e305aa076e5c8e2eb49ee4051770f756ef2fbc`;
- PR #996 is terminal/Human-merged and its OPS-02-CI-01 payload is consumed as main state;
- PR #1001 is terminal/Human-merged and its `/AGENTS.md` Authority update is consumed from current main; no current open Pull Request exists at this reconciliation point;
- the new work-package aggregation semantics do not aggregate the separately protected Provider-Host mutation into this repository-only documentation package;
- historical OPS status/integrity branches are search input only and are not used as successor bases;
- no provider write, credential mutation, connector mutation, OAuth/permission change, Vault/secret mutation or Production mutation occurs in this status sync.

## Exit gate for current post-PR #996 sync

- this projection is bound to current main `96e305aa076e5c8e2eb49ee4051770f756ef2fbc`;
- PR #996 is represented as merged/current-main work, not active-branch work;
- PR #1001 current Authority is consumed and does not weaken provider-mutation separation;
- PR #970/#980/#982/#988/#996 terminal states are consumed without reopening completed repository materialization;
- `OPS-PR900-03B` stays blocked until separately authorized provider-host/effective-grant/Finance-only `Read -> Write -> Readback` evidence exists;
- `OPS-PR900-06` is the next normal executable OPS Roadmap slice;
- Security closure remains with CAPITAL-AI-SEC and live readiness/provider evidence remains unsynthesized;
- final main/head/open-PR and Authority correlation is repeated before PR creation;
- Human/CODEOWNER merge remains separate and provider setup remains separately Human/Owner-authorized.