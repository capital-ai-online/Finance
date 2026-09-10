# CAPITAL-AI Operations Roadmap

**Project ID:** `CAPITAL-AI-OPS`  
**Document role:** canonical project execution roadmap / non-authorizing  
**Role:** `PRIMARY_VALUE_CHAIN_OWNER`  
**Version:** `2.7.0`  
**Status:** ACTIVE — CANONICAL OPS EXECUTION PROJECTION  
**Date:** `2026-09-10`  
**Correlation baseline:** `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42`  
**Open PR baseline:** no open pull requests at branch creation; PR #851, #852 and #855 are Human-merged/terminal  
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
3. OPS may implement bounded runtime/controlled-delivery work but does not acquire Governance or independent Security-verification authority.
4. Production/provider mutation requires a separate current authorization; repository implementation does not imply deployment.
5. Security findings remain independently verified by `CAPITAL-AI-SEC`.
6. `ESS-0019` remains the accepted provider-neutral AI control-plane contract; this roadmap does not create another identity, authorization, tool or MCP control plane.
7. `ADR-0059` remains the accepted audit/trace-correlation contract. Inbound W3C trace context is untrusted and must be validated before use.
8. `ADR-0056` is Proposed and may guide implementation reuse but does not override accepted authority.
9. `DR-03` remains a separate provider-adapter/execution package. Edge trust, operational telemetry and Product Intelligence do not activate provider adapters.
10. Remote MCP/server/tool activation is not implied by repository metadata, telemetry or Product Intelligence.

## 3. Post-#851 current-main correlation

PR #851 migrated the active canonical repository identity to `capital-ai-online/Finance` and explicitly left OPS/OIDC/workflow/deployment identity as a later OPS correlation surface.

Current correlation result for this roadmap update:

| Item | Current-main result | OPS disposition |
|---|---|---|
| PR #851 repository identity | Human-merged at `8226d522d99623b7a0f4ac2fc4938dabe9bf1d29` | CONSUME; no Governance rewrite |
| PR #852 Dependabot/Security Policy | Human-merged/terminal | no changed-file or active-writer conflict |
| PR #855 GitGuardian API health | Human-merged/terminal | no changed-file or active-writer conflict |
| Open PRs | none at branch creation | no active parallel writer |
| Current main | `e9b2551a4e2e24c5fed3dac72362b8bf1727bf42` | branch must start exactly here |
| Canonical repo | `capital-ai-online/Finance` | use current identity only |

## 4. Workstreams

| Workstream | PVC | Current state |
|---|---|---|
| `OPS-02` Controlled Implementation | `PVC-02` | ACTIVE — current-main correlation, bounded implementation and pre-PR evidence |
| `OPS-04` Supervisor | `PVC-04` | PARTIAL — repository fatal-process contract implemented; post-deploy evidence remains open |
| `OPS-06` Version Management | `PVC-06` | BLOCKED_BY_AUTHORITY_CONFLICT — Node target remains governed by current Accepted ADR resolution |
| `OPS-07` Release Management | `PVC-07` | PARTIAL |
| `OPS-08` Production Operations | `PVC-08` | PARTIAL — recovery harness on main; measured operational evidence remains open |
| `OPS-18` EventMesh / Traceability | `PVC-18` | PARTIAL — existing trace/evidence architecture reused; no parallel telemetry bus |

## 5. Post-#851 bounded slice

### `OPS-POST851-EDGE-01` — Cloudflare → Render Edge Trust

**Primary execution PVC:** `PVC-02`  
**Supporting runtime PVC:** `PVC-08`  
**Independent verification:** `CAPITAL-AI-SEC`

Repository implementation may introduce a bounded origin-provenance verifier and reuse it where OPS runtime code needs a trustworthy client-address decision.

Current provider readback on 2026-09-10 establishes:

- Render service `Finance` is a public web service;
- direct origin URL is `https://finance-7clq.onrender.com`;
- inbound IP allowlist is `0.0.0.0/0`;
- Auto Deploy is `off`;
- service branch is `main`.

Therefore `CF-Connecting-IP`, `CF-Ray`, `Host` and `X-Forwarded-Proto` are not sufficient by themselves to prove that a request traversed the intended Cloudflare edge. The repository contract requires an additional separately provisioned edge secret before Cloudflare visitor identity is trusted.

Implementation boundary:

```text
Cloudflare edge
  -> canonical public host + HTTPS
  -> secret edge proof
  -> syntactically valid CF-Connecting-IP + CF-Ray
  -> Render application
  -> trusted client identity for rate-limit/telemetry only
```

Fail-closed behavior:

- direct `onrender.com` access never qualifies as trusted Cloudflare provenance;
- missing/mismatched secret proof denies Cloudflare visitor-IP trust;
- malformed client IP or Ray ID denies trust;
- denied provenance falls back to the direct peer identity instead of caller-selected forwarding data;
- Ray ID and client-IP metadata never grant application authority.

Provider activation is **NOT INCLUDED**. Cloudflare rule/header configuration, Render secret provisioning, origin lockdown, secret rotation and Production deployment require separately authorized provider/Production work.

### `OPS-POST851-OBS-01` — existing Telemetry extension

**Primary execution PVC:** `PVC-02`  
**Supporting traceability PVC:** `PVC-18`

Reuse `server/logger.ts` and `src/platform/Telemetry`; do not create another logger, collector, EventMesh or audit store.

Bounded additions:

- strict W3C `traceparent` v00 validation;
- all-zero trace/span IDs rejected;
- future/unsupported traceparent versions ignored until explicitly supported;
- `traceId`, inbound `parentSpanId`, trace flags, Cloudflare Ray ID and Edge-Trust state become correlation metadata only;
- security-audit evidence remains a separate retention/authority class under ADR-0059;
- no external OpenTelemetry dependency or vendor collector is introduced in this slice.

### `OPS-POST851-PI-01` — vendor-neutral Product Intelligence contract

**Primary execution PVC:** `PVC-02`  
**Supporting operational evidence PVC:** `PVC-18`  
**Consumer ownership:** unchanged; Product/FINTECH/Marketing/Privacy owners retain their own semantics and protected actions.

The contract is intentionally export-neutral:

- event namespace `product.*`;
- aggregate purposes such as feature adoption, funnel, experiment, feedback and reliability;
- no user/session/IP identity;
- no e-mail, authorization, cookie, token, secret, prompt, request body or query payload;
- bounded scalar properties only;
- optional technical trace/deployment correlation;
- no GA4/PostHog/Amplitude/vendor SDK;
- no consent override;
- no Product decision authority.

A future vendor adapter must correlate Privacy/Consent/Product/Marketing ownership separately.

### `OPS-POST851-ID-02` — Render OIDC / OAuth 2.1 / MCP follow-up

**State:** `BLOCKED / SEPARATE FOLLOW-UP`

This work item remains outside the current implementation. Before code or provider changes it must re-correlate:

- `/AGENTS.md` and current main;
- `ESS-0019`;
- applicable accepted IAM/OIDC/OAuth authority;
- `SEC-SOTA-02`, especially external-host assurance finding `F04`;
- current Render/GitHub execution-host identity;
- exact provider mutation and credential boundaries.

No in-app MCP server is inferred as a gap. No MCP server, OAuth client, OIDC trust, permission, credential or connector is created by the current slice.

## 6. DR-03 boundary

`DR-03` remains `BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE` and separate from the Post-#851 slice.

Current rules remain:

- reuse provider profiles and provider-neutral IAM;
- reuse existing capability/policy/audit/trace boundaries;
- do not create a second Agent Control Plane;
- do not add direct SDK/provider execution bypass;
- do not enable remote skill loading;
- do not couple provider-adapter work to deployment or Production mutation.

The Product Intelligence contract records product/runtime evidence only. It cannot select a model/provider, grant a capability, approve a tool call or start DR-03.

## 7. SEC-SOTA-02 boundary

`SEC-SOTA-02` is Security-owned for threat analysis, findings and independent verification and has no productive PVC ownership.

For OPS:

- `F04` external MCP/connector host assurance is an OPS/PVC-02 evidence dependency for a later external-host/OIDC/OAuth/MCP slice;
- executable/version identity overlaps supply-chain assurance and remains separately correlated;
- installation, connection, permission, OAuth, credential or provider mutation requires a separate Human action;
- `F01`, `F02`, `F03`, `F05`, `F06` remain with their routed FINTECH/DOC/GOV/CLIENT owners;
- this branch does not claim any SEC-SOTA finding `VERIFIED/CLOSED`.

## 8. Existing Security/Data-Integrity backlog retained

The owner-directed Post-#851 slice does not erase the existing OPS Security/Data-Integrity queue.

| Package | State |
|---|---|
| `OPS-08-SEC-07` Recovery / RPO / RTO | recovery harness on main; deterministic evaluator requires fresh re-intake; operational evidence and Security verification open |
| `OPS-06-SEC-03` Node convergence | BLOCKED_BY_AUTHORITY_CONFLICT |
| `OPS-02-SEC-06` Entitlement capability inventory | parent evidence ready; foreign child work and Security verification remain |
| `OPS-04-SEC-04` Fatal process handling | implementation/repository verification present; post-deploy evidence open |
| `OPS-02-SEC-05` Stripe redirect boundary | implementation/evidence ready; Security verification open |
| `OPS-08-SEC-09` Strict CSP promotion | WAITING_FOR_EVIDENCE |
| `OPS-08-SEC-10` Billing isolation | WAITING_FOR_EVIDENCE |

## 9. Current execution queue

1. `OPS-POST851-EDGE-01` + `OPS-POST851-OBS-01` + `OPS-POST851-PI-01` — owner-directed coherent repository slice; no provider/Production mutation.
2. Existing executable Security/Data-Integrity work remains next according to current Owner/trust-root priority once this bounded slice is terminal.
3. `OPS-06-SEC-03` remains blocked until Governance/ADR authority resolves the Node target.
4. `DR-03` remains queued behind higher-priority OPS gates.
5. `OPS-POST851-ID-02` remains separate and blocked pending current Security/Authority correlation.

## 10. Terminal/current evidence retained

| Work | Current disposition |
|---|---|
| PR #720 fatal process handling | IMPLEMENTED_ON_MAIN; post-deploy evidence open |
| PR #729 User Lifecycle OPS closeout | terminal for bounded OPS closeout; provider/Security residuals remain |
| PR #743 GOV-03/DR-02B | terminal foreign dependency; no Governance ownership transfer |
| PR #776 Recovery/RPO/RTO harness | IMPLEMENTED_ON_MAIN; measured operational evidence open |
| PR #794 GOV-07 OPS evidence return | EVIDENCE_READY / Human-merged; broader returns remain |
| PR #802 RPO evaluator | closed/unmerged; historical input only |
| PR #828 qs 6.16.0 | IMPLEMENTED_ON_MAIN / DEPLOYED / TERMINAL |
| PR #833 retired authorization cleanup | closed/unmerged; historical only |
| PR #836/#839 zizmor lineage | terminal historical/current-main input; no active PR writer |
| PR #851 repository identity | Human-merged; canonical repo is `capital-ai-online/Finance` |
| PR #852 Security policy/dependabot | Human-merged |
| PR #855 GitGuardian API health | Human-merged |

## 11. Validation / Definition of Done

For the Post-#851 slice:

- [x] current main determined before branch creation;
- [x] branch created exactly from `main@e9b2551a4e2e24c5fed3dac72362b8bf1727bf42`;
- [x] PR #851/#852/#855 correlated as terminal merged work;
- [x] no open PR writer existed at branch creation;
- [x] OPS/PVC, DR-03 and SEC-SOTA-02 boundaries recorded;
- [x] no parallel Agent/MCP/Telemetry/EventMesh control plane designed;
- [x] Render state inspected read-only; no provider mutation performed;
- [x] Edge-Trust implementation and focused negative tests materialized on branch;
- [x] W3C trace-context validation and existing logger integration materialized;
- [x] vendor-neutral Product Intelligence contract and privacy-negative tests materialized;
- [x] local executable validation recorded PASS/FAIL/NOT-RUN;
- [ ] final current-main/branch-head correlation completed;
- [ ] PR creation gate prepared from an exact immutable snapshot.

Existing independent gates remain:

- [ ] CAPITAL-AI-GOV resolves Node authority before Node mutation;
- [ ] measured recovery/RPO/RTO operational evidence completed;
- [ ] applicable Security verification completed;
- [ ] hosted checks run only after PR creation when applicable;
- [ ] Human/CODEOWNER merge completed separately.

## 12. PR / Production boundary

This roadmap does not authorize PR creation, merge, release, provider configuration or Production deployment. Auto Deploy is currently off on the Render service. Edge secret provisioning, Cloudflare configuration, Render environment mutation and Production rollout are explicitly outside this branch and require a separate current authorization.
