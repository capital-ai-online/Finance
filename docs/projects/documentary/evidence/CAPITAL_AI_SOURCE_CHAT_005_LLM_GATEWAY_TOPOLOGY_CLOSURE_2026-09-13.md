# CAPITAL-AI — Source Chat 005 Closure Evidence

**Source:** `CHAT-005 — LLM Gateways prüfen / migrieren`  
**Date:** 2026-09-13  
**Repository:** `capital-ai-online/Finance`  
**Current-main correlation baseline:** `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`  
**Consolidation branch:** `agent/documentary-chat-workpackage-consolidation-20260913`  
**Existing Pull Request:** `#900`  
**Preservation owner:** `CAPITAL-AI-DOC / PVC-03`  
**Target work package:** `WP-07 — Multi-LLM Gateway, OAuth2 & MCP`  
**Role:** documentary preservation evidence only; non-authorizing

## 1. Material source delta

The source chat preserves a concrete distributed LLM-provider topology rather than a generic instruction to consolidate providers.

The topology must keep three distinct planes separate:

1. **LLM Gateway** — provider-neutral model-routing and provider-adapter boundary for model inference.
2. **MCP / Tool Gateway** — tool and capability invocation boundary with its own trust, permission and connector semantics.
3. **ESS-0019 Control Plane** — repository capability/governance contract surface; it constrains allowed capability use but is neither the productive LLM router nor the MCP/tool transport.

Canonical invariant:

`LLM Gateway != MCP/Tool Gateway != ESS-0019 Control Plane`

Convergence work must therefore remove unnecessary duplicate gateways without collapsing these separate responsibilities into one privileged runtime.

## 2. Distributed provider topology

The source requires one provider-neutral logical model-access layer with bounded provider adapters, while allowing providers to remain operationally distributed where their APIs, hosting, authentication, latency, locality, cost or model-specific constraints differ.

Provider convergence is architectural simplification, not a mandate to force all models through one physical host or one credential domain.

Provider-specific functionality that is still required should be retained behind the canonical provider-neutral boundary rather than reimplemented as parallel application logic.

## 3. Migration boundary

Migration must be incremental and reversible:

- inventory current gateways, routers, adapters and direct-provider call sites;
- identify the canonical route for each existing capability;
- distinguish compatibility adapters from duplicate authority/runtime;
- migrate consumers in bounded slices;
- preserve rollback/compatibility evidence until old paths are demonstrably unused;
- retire a duplicate path only after its consumers, tests and operational evidence are correlated.

No bulk provider migration, provider account change, connector installation, credential change, production routing switch or runtime deployment is authorized by this Documentary evidence.

## 4. Ownership and dependencies

The productive LLM gateway/runtime remains owner-routed to `CAPITAL-AI-OPS` under the applicable controlled implementation/production boundaries. Productive client invocation belongs to `CAPITAL-AI-CLIENT / PVC-01` where client behavior is affected. Governance constraints remain `CAPITAL-AI-GOV / PVC-05`; Security remains cross-cutting assurance; Documentary only preserves this source decision.

The migration depends on current inventory/evidence, applicable ESS-0019 capability contracts, current Security/least-privilege boundaries and the canonical OPS/CLIENT Roadmaps. It must not create a second provider registry, policy plane, MCP host authority or agent framework.

## 5. Validation and stale-state disposition

Current-main baseline for this preservation pass is `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`. PR #900 remains open and unmerged.

The master consolidation already preserves the broad gateway-convergence goal in `WP-07`. The explicit three-plane topology and non-collapse invariant above were the missing semantic payload from CHAT-005.

No provider/runtime inventory is newly executed by this Documentary write. No provider endpoint, OAuth configuration, MCP host, credential, production route, unit/integration/build/hosted-CI state or deployment is changed or verified here. Those states remain separately owner-evidenced and `NOT_RUN` where not executed.

## 6. Closure result

- distributed provider topology — `FULLY_CONTAINED`;
- `LLM Gateway != MCP/Tool Gateway != ESS-0019 Control Plane` — `FULLY_CONTAINED`;
- incremental/reversible migration boundary — `FULLY_CONTAINED`;
- no forced single physical host/credential domain — `FULLY_CONTAINED`;
- owner/PVC and security/governance dependencies — `FULLY_CONTAINED`.

`unique_content_not_yet_preserved = NONE` only after this exact file is successfully read back from the consolidation branch.

**Closure decision after successful readback:** `SAFE_TO_DELETE` for CHAT-005 only. This does not close any other source chat, project folder, gateway migration task or PR #900.
