# CAPITAL-AI — Source Chat 002 Closure Evidence

**Source:** `CHAT-002 — Finance Repo Speicher / erhöhte Action-Volumen`  
**Date:** 2026-09-13  
**Repository:** `capital-ai-online/Finance`  
**Current-main correlation baseline:** `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`  
**Consolidation branch:** `agent/documentary-chat-workpackage-consolidation-20260913`  
**Existing Pull Request:** `#900`  
**Preservation owner:** `CAPITAL-AI-DOC / PVC-03`  
**Subject owners:** `CAPITAL-AI-QM` cross-cutting; `CAPITAL-AI-OPS / PVC-02, PVC-07, PVC-18`; `CAPITAL-AI-GOV / PVC-05` for normative boundaries only  
**Target work packages:** `WP-04 — CI/CD, PR Classes & Quality Management`; `WP-06 — GitHub Enterprise & Developer Platform`  
**Role:** documentary preservation evidence only; non-authorizing

## 1. Material source delta

The source chat distinguishes three storage classes that must not be collapsed into one generic GitHub Actions storage bucket:

1. `CACHE` — acceleration material that may be evicted and recreated without becoming authoritative evidence.
2. `TRANSIENT_ARTIFACT` — bounded execution output used for debugging, handoff, inspection or short-lived downstream consumption.
3. `EVIDENCE_ARTIFACT` — retained verification material whose identity, provenance and retention are part of the assurance claim.

The governing semantic rule is: **cache is not evidence**. A cache hit, retained build directory, dependency cache or re-used execution artifact does not prove that a required check passed for the exact evaluated repository snapshot.

## 2. Evidence identity and freshness

Evidence reuse is valid only when the evidence is bound to the exact evaluated identity and its freshness remains acceptable for the applicable gate. Depending on the check, relevant identity includes the repository/commit or branch head, workflow/check identity, configuration or policy identity and deterministic input digest where applicable.

A provider-side artifact name, successful historical run, cache key or storage presence alone is insufficient evidence identity.

`NOT_RUN`, unavailable evidence, stale evidence and evidence for a different snapshot remain distinct from `PASS`.

## 3. Execution versus evaluation

The source chat separates **execution** from **evaluation**:

- execution produces a result or artifact;
- evaluation determines whether that result satisfies the applicable gate for the exact current snapshot and authority context.

Replaying or reusing a prior execution may be an OPS optimization opportunity, but it must not silently become a new evaluation or PASS. Any replay mechanism belongs to the canonical OPS execution chain and requires explicit identity, idempotency, freshness and evidence semantics rather than a parallel Documentary/QM runtime.

## 4. Parallel and sequential work

Independent technical checks may execute in parallel when they do not share mutable state or authority ordering constraints.

Authority-dependent, mutation-dependent or state-transition-dependent operations remain sequential. In particular, a later step must not execute merely because an independent check finished when the applicable governance, release, deployment, owner or protected-mutation gate has not been satisfied.

This distinction is intended to improve CI throughput without weakening repository lifecycle ordering.

## 5. Retention model

Retention should be purpose-bound rather than uniform:

- caches: shortest practical retention consistent with reproducible acceleration;
- transient artifacts: bounded to debugging/handoff/downstream-consumer need;
- evidence artifacts: retained according to the assurance, audit, rollback, release or regulatory purpose that requires them.

Storage quotas, GitHub plan limits, provider pricing and product-specific retention defaults are external/changeable facts and are not repository truth unless separately captured as dated evidence. Increased Action storage/volume should therefore be treated as capacity, not as permission to retain everything indefinitely.

## 6. Owner routing

| Concern | Canonical owner / boundary | Required continuation |
|---|---|---|
| CI evidence classification, exact-snapshot gate semantics | `CAPITAL-AI-QM` cross-cutting | Map required check classes to evidence identity/freshness and explicit PASS/FAIL/NOT_AVAILABLE states. |
| Execution, replay/idempotency, artifact production | `CAPITAL-AI-OPS / PVC-02, PVC-18` | Reuse existing event-driven execution mechanisms; no second scheduler/event bus. |
| Release-bound evidence and retention needed for promotion/rollback | `CAPITAL-AI-OPS / PVC-07` | Bind release evidence to the exact release/deployment identity. |
| Normative repository lifecycle or evidence authority changes | `CAPITAL-AI-GOV / PVC-05` | Only when a material policy/authority change is actually required; optimization alone creates no new Governance authority. |
| Documentary preservation | `CAPITAL-AI-DOC / PVC-03` | Preserve this source decision without implementing foreign-owner runtime work. |

## 7. Security and mutation boundary

This source preservation authorizes no GitHub Enterprise administration mutation, workflow permission broadening, provider-plan change, production deployment, application/runtime mutation, retention-policy enforcement mutation or connector/integration permission change.

External provider capabilities may be evaluated read-only where already available and relevant. Any protected mutation remains subject to current Owner/authority controls.

## 8. Validation and stale-state disposition

Current-main baseline for this preservation pass is `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`. PR #900 remains the only open Pull Request found in the current dedicated PR search at this point and remains unmerged.

The existing master consolidation already preserved the broad goal of GitHub Action storage/volume optimization in `DELTA-001`. The semantic distinctions above were the previously missing source payload and are preserved here.

No unit, integration, TypeScript, build, hosted-CI, provider-quota or runtime validation is newly executed by this documentation write. Those states are `NOT_RUN` or external-current-state dependent, never inferred as `PASS`.

## 9. Closure result

**Classification after materialization:**

- cache/transient/evidence three-class model — `FULLY_CONTAINED`;
- cache-is-not-evidence invariant — `FULLY_CONTAINED`;
- exact identity/freshness requirement — `FULLY_CONTAINED`;
- execution-versus-evaluation distinction — `FULLY_CONTAINED`;
- replay as OPS-owned follow-up — `FULLY_CONTAINED`;
- parallel independent checks versus sequential authority/mutation gates — `FULLY_CONTAINED`;
- purpose-bound differentiated retention — `FULLY_CONTAINED`;
- provider quotas/prices are not repository truth — `FULLY_CONTAINED`;
- owner/PVC handoffs — `FULLY_CONTAINED`.

`unique_content_not_yet_preserved = NONE` only after this exact file is successfully read back from the consolidation branch.

**Closure decision after successful readback:** `SAFE_TO_DELETE` for CHAT-002 only. This does not close any other source chat, project folder, runtime work package or PR #900.
