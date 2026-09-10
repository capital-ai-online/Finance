# CAPITAL-AI Operations Roadmap

**Project ID:** `CAPITAL-AI-OPS`  
**Document role:** canonical project execution roadmap / non-authorizing  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Version:** `2.7.1`  
**Status:** ACTIVE — CANONICAL OPS EXECUTION PROJECTION  
**Date:** `2026-09-10`  
**Correlation baseline:** `main@e9839f5e3eccc0ae01d6a10e53d3787435e1379d`  
**Open PR baseline:** none at integrity-sync intake  
**Primary project stages:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`

## 1. Objective

CAPITAL-AI-OPS owns the bounded execution and operational lifecycle for Controlled Implementation, Supervisor, Version, Release, Production Operations and EventMesh/Traceability. The project consumes Governance and Security controls without duplicating their authority.

Current execution flow:

```text
PVC-02 Controlled Implementation
→ PVC-03 Documentary Engine / CAPITAL-AI-DOC
→ PVC-04 Supervisor
→ PVC-05 Platform Director / CAPITAL-AI-GOV
→ PVC-06 Version Management
→ PVC-07 Release Management
→ PVC-08 Production Operations
→ PVC-18 EventMesh / Traceability
```

## 2. Current-main authority invariants

1. `/AGENTS.md` is the sole repository trust root.
2. Project/PVC ownership comes from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`.
3. OPS owns `PVC-02/04/06/07/08/18`; execution delegation does not transfer long-term PVC or Domain ownership.
4. Current Governance permits bounded Security-primary repository remediation under its accepted Security-remediation authority without transferring the affected project's PVC ownership; Security verification remains independently Security-owned.
5. Production/provider mutation requires separate current authorization; repository implementation does not imply deployment.
6. `ESS-0019` remains the accepted provider-neutral AI control-plane contract; this roadmap does not create another identity, authorization, tool or MCP control plane.
7. `ADR-0059` remains the accepted audit/trace-correlation contract. Inbound W3C trace context is untrusted and must be validated before use.
8. `ADR-0056` is Proposed and may guide implementation reuse but does not override accepted authority.
9. `ADR-0070` remains Accepted for GitGuardian. Snyk-specific operational decisions are retired; GitGuardian remains the external Secret-Scanning/Honeytoken path.
10. GitGuardian credential, provider, permission or token-scope changes remain separate explicit Owner/provider mutations.
11. `DR-03` remains a separate provider-adapter/execution package. Edge trust, operational telemetry, Product Intelligence and Self-Healing readiness do not activate provider adapters.
12. Remote MCP/server/tool activation is not implied by repository metadata, telemetry, Product Intelligence or readiness contracts.
13. Productive M10 runtime remains `RETIRED / OFF`; historical M10 material is not reconstructed as a current gap.

## 3. Current-main correlation — 2026-09-10

The earlier OPS roadmap baseline was stale. Current main has advanced through the Human-merged Post-#851 runtime slice, GitGuardian least-privilege workflow work, dependency/security-floor work, edge-secret deployment coverage and later Governance/Security updates.

| Item | Current-main result | OPS disposition |
|---|---|---|
| PR #851 repository identity | Human-merged | canonical repository is `capital-ai-online/Finance` |
| PR #852 Dependabot/Security Policy | Human-merged/terminal | consume current Security policy |
| PR #855 GitGuardian API health | Human-merged/terminal | historical precursor to current health contract |
| PR #859 Edge Trust / Telemetry / Product Intelligence | Human-merged/terminal | `IMPLEMENTED_ON_MAIN / EVIDENCE_READY`; provider activation remains separate |
| PR #860 Snyk retirement | Human-merged/terminal Security work | Snyk current use retired; no OPS ownership transfer |
| PR #861 CLIENT-08 | Human-merged/terminal foreign project work | no OPS ownership transfer |
| PR #862 GitGuardian Health-Contract | Human-merged/terminal OPS workflow work | bounded PASS/FAIL/NOT-RUN health semantics established |
| PR #863 GitGuardian sources:read audit | Human-merged/terminal OPS workflow work | direct `/v1/health` authentication + `/v1/sources` audit; no permanent ggshield/scan dependency |
| GitGuardian Health run #34468840264 | `workflow_dispatch` on exact `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46`, terminal `success` | API authentication PASS; `monitoring_status=active/PASS`; no explicit FAILs; provider health-check gaps remain truthful NOT-RUN |
| PR #864 bounded Security-remediation authority | Human-merged Governance work | consume updated execution-delegation boundary; no OPS PVC transfer |
| PR #865 Multer/Nodemailer dependency floors | Human-merged OPS work | dependency minimums hardened on main |
| PR #867 Edge-Trust secret deployment coverage | Human-merged OPS work | server-only secret manifest/deployment coverage is on main; provider provisioning remains separate |
| PR #868 Governance chat/approval rollout | Human-merged Governance work | consume current lifecycle/approval state |
| PR #870/#871 Vite security floor + SEC-SOTA-03 sync | Human-merged Security work | consume independent Security state; no OPS ownership transfer |
| Open PRs | none at integrity-sync intake | no current PR writer |
| Active OPS branch | `agent/operations-self-healing-readiness-20260910` | separate Self-Healing readiness slice; 1 ahead / 15 behind current main at intake; no top-level ROADMAP/WORK_PACKAGES file overlap |
| Current main | `e9839f5e3eccc0ae01d6a10e53d3787435e1379d` | this integrity-sync branch started exactly here |

## 4. Workstreams

| Workstream | PVC | Current state |
|---|---|---|
| `OPS-02` Controlled Implementation | `PVC-02` | ACTIVE — current-main correlation, bounded implementation, dependency/security floors and pre-PR evidence |
| `OPS-04` Supervisor | `PVC-04` | PARTIAL — fatal-process repository contract implemented; post-deploy evidence remains open; Self-Healing readiness branch is separate |
| `OPS-06` Version Management | `PVC-06` | BLOCKED_BY_AUTHORITY_CONFLICT — Node target remains governed by current Accepted ADR resolution |
| `OPS-07` Release Management | `PVC-07` | PARTIAL |
| `OPS-08` Production Operations | `PVC-08` | PARTIAL — recovery harness on main; measured operational evidence remains open; Self-Healing readiness not yet merged |
| `OPS-18` EventMesh / Traceability | `PVC-18` | PARTIAL — trace/evidence architecture and Post-#851 correlation slice implemented; broader freshness/coverage remains open |

## 5. Post-#851 bounded repository slice — terminal on main

### `OPS-POST851-EDGE-01` — Cloudflare → Render Edge Trust

**State:** `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` via Human-merged PR #859; deployment-secret coverage additionally implemented via PR #867  
**Primary execution PVC:** `PVC-02`  
**Supporting runtime PVC:** `PVC-08`  
**Independent verification:** `CAPITAL-AI-SEC`

Current main contains the bounded origin-provenance verifier and its rate-limit integration. Caller-supplied Cloudflare-looking headers are not sufficient origin authentication. The repository contract requires separately provisioned edge proof before Cloudflare visitor identity is trusted.

PR #867 added `CAPITAL_AI_EDGE_TRUST_SECRET` to the server-only deployment/secret manifest coverage and focused tests. This closes the repository deployment-coverage defect; it does not provision the provider secret, modify Cloudflare, change Render environment values or deploy Production.

### `OPS-POST851-OBS-01` — existing Telemetry extension

**State:** `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` via Human-merged PR #859  
**Primary execution PVC:** `PVC-02`  
**Supporting traceability PVC:** `PVC-18`

Current main reuses `server/logger.ts` and `src/platform/Telemetry`; no second logger, collector, EventMesh or audit store was created. The bounded implementation validates W3C `traceparent` v00, rejects malformed/all-zero/unsupported versions, preserves parent-span semantics and treats edge/trace data as correlation metadata rather than authority.

### `OPS-POST851-PI-01` — vendor-neutral Product Intelligence contract

**State:** `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` via Human-merged PR #859  
**Primary execution PVC:** `PVC-02`  
**Supporting operational evidence PVC:** `PVC-18`

Current main contains the aggregate-safe `product.*` event contract without user/session/IP identity, credential payloads, request bodies, arbitrary nested content, vendor SDK/export, consent override or Product decision authority.

### `OPS-POST851-ID-02` — Render OIDC / OAuth 2.1 / MCP follow-up

**State:** `BLOCKED / SEPARATE FOLLOW-UP`

Before any implementation or provider mutation this package must re-correlate current `/AGENTS.md`, `ESS-0019`, accepted IAM/OIDC/OAuth authority, relevant Security assurance, current Render/GitHub execution-host identity and protected external-mutation boundaries. No MCP server, OAuth client, OIDC trust, permission, credential or connector is inferred or created by this roadmap sync.

## 6. GitGuardian least-privilege audit boundary

The permanent manual GitGuardian health/audit path is OPS/PVC-02 repository tooling, not a second Secret-Scanning engine. The external GitGuardian App continues to provide the canonical `GitGuardian Security Checks` scanner result.

Current repository contract after PR #863:

- authentication is checked directly through GitGuardian `GET /v1/health`;
- repository monitoring is read through `GET /v1/sources`;
- the workflow does not install or invoke ggshield;
- the workflow does not require `scan`, `sources:write` or `secrets:read` by design;
- `monitoring_status` is the required PASS evidence;
- unsupported or permission-denied provider health details remain `NOT-RUN`, never synthetic PASS;
- no API-key value, Secret value or provider response body is emitted as evidence.

GitGuardian's current API documentation defines `sources:read` as view-only access to code-repository sources, `sources:write` as view/edit access, and `scan` as a separate capability required for ggshield. Therefore the repository target contract for this management credential is `sources:read-only` for the permanent health/audit use case.

Run #34468840264 on exact `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46` proved API authentication and Finance-source read capability: `monitoring_status=active/PASS`, no explicit failures. `github_installation`, `api_network` and `api_access_rights` remained `NOT-RUN` on HTTP 403; `check_run_configuration` remained `NOT-RUN` because the current workflow has no documented public endpoint for that evidence.

The current-main workflow blob remains the same GitGuardian health implementation introduced by PR #863. However, successful read operations prove required capability, not the absence of additional scopes on the configured provider credential. The complete current token scope set is therefore **`NOT-PROVEN`** by repository evidence. Provider-side scope readback or a separately authorized least-privilege credential replacement/rotation is required to close that external gate. This branch performs no credential/provider mutation.

## 7. Security/Data-Integrity backlog and owner returns

| Package | Current state |
|---|---|
| `OPS-08-SEC-07` Recovery / RPO / RTO | recovery harness `IMPLEMENTED_ON_MAIN`; measured operational RPO/RTO evidence and Security verification remain open |
| `OPS-06-SEC-03` Node convergence | `BLOCKED_BY_AUTHORITY_CONFLICT` |
| `OPS-02-SEC-06` Entitlement capability inventory | parent inventory complete; current FINTECH/DATA child returns re-correlated; independent Security verification remains open |
| `OPS-04-SEC-04` Fatal process handling | `IMPLEMENTED_ON_MAIN / VERIFIED_REPOSITORY_CONTRACT`; exact post-deploy supervisor evidence remains open |
| `OPS-02-SEC-05` Stripe redirect boundary | `IMPLEMENTED_ON_MAIN / EVIDENCE_READY`; independent Security verification remains open |
| `OPS-08-SEC-09` Strict CSP promotion | `WAITING_FOR_EVIDENCE` |
| `OPS-08-SEC-10` Billing isolation | `WAITING_FOR_EVIDENCE` |

Current child-return projection for `OPS-02-SEC-06`:

- FINTECH `verified_screening`: `IMPLEMENTED / EVIDENCE_READY`; Security verification requested and not self-closed;
- DATA `realtime_ai_newsfeed`: productive route-access bypass is closed/evidence-ready, while the narrower authority-unavailable distinction and Security verification remain open;
- FINTECH `FIN-SEC-03`: Backtest, Monte Carlo, `full_ai_analysis` and remaining Buffett consumer-integration work remain FINTECH-owned and open/referred-not-executed.

OPS records these returns but does not absorb foreign productive implementation or independent Security closure.

## 8. Self-Healing readiness — active separate branch

`agent/operations-self-healing-readiness-20260910` contains `OPS-08-B-SH-01 — Self-Healing Readiness Foundation` and is the only active OPS branch detected at this integrity-sync intake.

Its bounded intent is to extend existing Supervisor/Telemetry surfaces with Observe→Detect→Diagnose readiness and a fail-closed remediation contract. It explicitly does not authorize productive autonomous recovery or SH-R2 protected mutations.

At this correlation point the branch is **1 commit ahead / 15 commits behind** `main@e9839f5e3eccc0ae01d6a10e53d3787435e1379d`, with merge-base `6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`. Its changed files do not include this top-level `ROADMAP.md`, top-level `WORK_PACKAGES.md`, the entitlement inventory or this integrity evidence. It must be resynchronized and revalidated against then-current main before any renewed PR-creation approval.

## 9. DR-03 and Security boundaries

`DR-03` remains `BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE` and separate from Post-#851, GitGuardian, dependency-hardening and Self-Healing readiness work. Provider profiles, IAM/policy/audit/trace boundaries are reused; no direct provider SDK bypass, remote-skill activation, deployment coupling or second Agent Control Plane is authorized.

Security remains owner for threat analysis, findings and independent verification. Current bounded Security-remediation delegation affects execution authority only; it does not transfer OPS PVC ownership to Security or Security verification authority to OPS.

## 10. Current execution queue

1. `OPS-08-B-SH-01` — resynchronize the existing Self-Healing readiness branch to then-current main and revalidate its exact head before any PR approval; preserve fail-closed SH-R2 Human/Owner gating.
2. `OPS-08-SEC-07` — obtain measured Recovery/RPO/RTO operational evidence without treating repository harness existence as recovery-performance proof.
3. `OPS-02-SEC-06` — maintain the parent entitlement inventory against current owner-return reality; do not reimplement FINTECH/DATA children or self-close Security verification.
4. `OPS-06-SEC-03` remains blocked until current Governance/ADR authority resolves the Node target.
5. `DR-03` and `OPS-POST851-ID-02` remain queued behind higher-priority OPS/security/authority gates.

The external GitGuardian `sources:read-only` proof is an Owner/provider least-privilege evidence gate, not a repository implementation package. It remains open because the complete current token scope set is not established by repository evidence.

## 11. Terminal/current evidence retained

| Work | Current disposition |
|---|---|
| PR #720 fatal process handling | implemented on main; repository contract verified; post-deploy evidence open |
| PR #729 User Lifecycle OPS closeout | terminal bounded OPS closeout; residual provider/Security gates remain |
| PR #776 Recovery/RPO/RTO harness | implemented on main; measured operational evidence open |
| PR #794 GOV-07 OPS evidence return | Human-merged/evidence-ready |
| PR #802 RPO evaluator | closed/unmerged; historical input only |
| PR #828 qs 6.16.0 | implemented/deployed/terminal |
| PR #851 repository identity | Human-merged; canonical repo `capital-ai-online/Finance` |
| PR #852 Security policy/dependabot | Human-merged |
| PR #854/#855 GitGuardian health/API health | Human-merged historical/current contract inputs |
| PR #857 BB-2E Source-Patch rebind | Human-merged/terminal |
| PR #859 Edge Trust / Telemetry / Product Intelligence | `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` |
| PR #860 Snyk retirement | Human-merged Security dependency; Snyk current use retired |
| PR #861 CLIENT-08 | Human-merged foreign dependency |
| PR #862 GitGuardian Health-Contract | Human-merged/terminal |
| PR #863 GitGuardian sources:read audit | Human-merged/terminal; manual health path no longer requires ggshield/scan |
| PR #864 bounded Security-remediation authority | Human-merged Governance dependency |
| PR #865 Multer/Nodemailer floors | Human-merged OPS dependency hardening |
| PR #867 Edge-Trust secret deployment coverage | Human-merged OPS deployment-readiness correction |
| PR #868 Governance chat/approval rollout | Human-merged Governance dependency |
| PR #870/#871 Vite floor / SEC-SOTA-03 sync | Human-merged Security work; no OPS ownership transfer |
| GitGuardian Health #34468840264 | exact post-#863 main run; auth + monitoring PASS, denied/unsupported provider evidence NOT-RUN |

## 12. Integrity-sync validation / Definition of Done

For this documentation/evidence synchronization:

- [x] fresh current main determined before branch creation: `e9839f5e3eccc0ae01d6a10e53d3787435e1379d`;
- [x] `/AGENTS.md` fully re-read from current main; Trust Root remains Control Plane `2.9.0`;
- [x] project/PVC mapping, OPS README/Roadmap, ADR-0070, ESS-0019 and current GitGuardian runbook re-read;
- [x] no open Pull Requests existed at branch creation/intake;
- [x] current active OPS branch set checked; Self-Healing branch is path-disjoint from this four-artifact sync;
- [x] current-main delta since PR #863 reviewed; none of the four integrity-sync target artifacts were changed by those 43 commits;
- [x] FINTECH/DATA entitlement child returns re-read from current main;
- [x] current GitGuardian health workflow re-read and found unchanged in content from the post-#863 implementation;
- [x] current GitGuardian documentation re-correlated for `sources:read`, `sources:write` and `scan` semantics;
- [x] no provider write, credential mutation, connector mutation or Production mutation performed;
- [ ] four-artifact branch readback and diff validation completed;
- [ ] final current-main/branch-head/open-PR correlation completed immediately before any PR-creation approval.

Independent/open gates remain:

- exact GitGuardian current credential scope proof is `NOT-PROVEN` provider-side;
- Self-Healing readiness branch requires fresh main resync/revalidation;
- measured Recovery/RPO/RTO operational evidence remains open;
- applicable independent Security verification remains open;
- Node convergence remains authority-blocked;
- hosted checks are not run before a future PR unless current repository rules require otherwise;
- Human/CODEOWNER merge remains separate.

## 13. PR / Production boundary

This roadmap does not authorize PR creation, merge, release, provider configuration, credential rotation or Production deployment. GitGuardian token/scope mutation, Render/Cloudflare configuration, Production rollout and other protected external mutations remain separate actions requiring their own then-current authorization.
