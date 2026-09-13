# CAPITAL-AI — Source Chat 003 Closure Evidence

**Source:** `CHAT-003 — Sicherheitsarchitektur: PostHog, CodeQL, PR-Klassen`  
**Date:** `2026-09-13`  
**Repository:** `capital-ai-online/Finance`  
**Current-main baseline:** `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`  
**Branch:** `agent/documentary-chat-workpackage-consolidation-20260913`  
**Existing PR:** `#900`  
**Preservation owner:** `CAPITAL-AI-DOC / PVC-03`  
**Target WPs:** `WP-04`, `WP-05`, `WP-06`, `WP-12`  
**Role:** documentary preservation evidence only; non-authorizing

## 1. Material source payload

CHAT-003 preserves five still-valid architecture constraints:

1. CI must use risk-proportionate capability/check capsules rather than an undifferentiated full pipeline for every change.
2. The `main` force-full production-validation path remains a distinct invariant and must not be bypassed by optimized PR-class capsules.
3. GitHub Enterprise Custom Properties may assist routing/policy metadata, but canonical Project/PVC/Owner truth remains in the repository mapping and property drift must be detectable.
4. CodeQL enablement/default-setup decisions require current-state correlation against the effective Security/CI stack and must avoid duplicate equivalent scanning.
5. PostHog, if later adopted, remains behind the existing vendor-neutral Telemetry/Product-Intelligence boundary and applicable privacy/consent/retention/access/audit constraints.

These concerns stay owner-routed; this evidence creates no new CI, Security, Enterprise or Telemetry authority.

## 2. Capability/check-capsule correlation

Current main already contains the canonical PR-scope classifier in `scripts/pr/classifyPrScope.mjs`. It distinguishes documentation, application/tooling and runtime/deploy classes and exposes bounded validation flags. Unknown non-documentation changes fail closed toward production impact.

CHAT-003 therefore requires capsule orchestration to consume the existing classifier rather than creating a second classifier. Same-snapshot evidence remains required for completion claims.

Owner routing: `CAPITAL-AI-QM` for quality/check orchestration, `CAPITAL-AI-OPS` for workflow/runtime mechanics and `CAPITAL-AI-SEC` for Security assurance inputs.

## 3. `main` force-full invariant

Current main explicitly implements `forceFull`. Its documented intent is that the Human-merged push to `main` performs the complete production build/attestation validation before the separately gated deployment path.

The residual CHAT-003 gap is therefore not missing `forceFull`; it is proving that optimized PR-class/capsule routing converges safely into that force-full main path and cannot bypass mandatory production validation.

No workflow or deployment mutation is authorized by this file.

## 4. GitHub Enterprise Custom Properties boundary

The source proposes Custom Properties for deterministic routing metadata such as Project/PVC/Owner/check category. Safe use is bounded as follows:

- metadata/routing aid only;
- values derive from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`;
- drift between properties and canonical repository mapping is detectable and fails closed for protected routing;
- property state cannot grant ownership, merge, deployment or Security authority;
- branch/main/PR-head correlation remains repository evidence and cannot be replaced by a property value.

This pass did not prove a canonical current-main implementation contract for this proposed Custom-Properties routing use, so it remains an owner-routed Enterprise capability gap rather than PASS.

## 5. CodeQL correlation rule

CHAT-003 requests CodeQL analysis tied to PR classes/check capsules, path/branch rules, required checks and merge gates.

Current main contains historical CodeQL evaluation material, but historical provider choices are non-authorizing. The preserved rule is to determine the current CodeQL/GitHub Security capability and configuration state, correlate it against current required checks and existing scanners, avoid equivalent duplicate scanning, and map distinct coverage to the smallest justified capsule. Provider-side enablement/default-setup remains a separately authorized platform mutation.

`NOT_RUN`, unavailable provider reads and historical evidence are not promoted to PASS.

## 6. PostHog / Telemetry boundary

Current main defines `src/platform/Telemetry/README.md` as a vendor-neutral Operational-Telemetry and Product-Intelligence boundary. It explicitly avoids direct GA4/PostHog/Amplitude binding or external transfer in the present contract and requires later vendor export to re-correlate the applicable privacy/consent/product boundaries.

Therefore PostHog must not become a second telemetry control plane or application truth source. If later adopted, it is an export/analysis consumer behind the canonical vendor-neutral contract. A repository mirror/self-hosted supply-chain path is not inferred as required merely from the source request; it requires a separate owner/security/reuse decision proving necessity.

No PostHog connection, installation, export route or production telemetry mutation is performed or authorized here.

## 7. Closure correlation

Current-main baseline: `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`.

Repository readback established:

- Documentary preservation mapping: `CAPITAL-AI-DOC / docs/projects/documentary/ / PVC-03`;
- current classifier includes D/C/R-style scope classification and `forceFull`;
- current Telemetry remains vendor-neutral;
- historical CodeQL material exists but does not prove current provider enablement;
- proposed Custom-Properties routing remains unproven as a current canonical implementation.

No unit, integration, TypeScript, build, hosted-CI, provider or production validation was executed by this documentation-only closure run. Those states remain `NOT_RUN` / `NOT_PROVEN` where applicable.

## 8. Closure result

- capability/check-capsule model — `FULLY_CONTAINED`;
- `main` force-full invariant and residual convergence gap — `FULLY_CONTAINED`;
- Custom-Properties metadata-only/drift boundary — `FULLY_CONTAINED`;
- CodeQL current-state/default-setup correlation rule — `FULLY_CONTAINED`;
- PostHog vendor-neutral Telemetry boundary — `FULLY_CONTAINED`;
- owner/PVC boundaries and no foreign-owner implementation — `FULLY_CONTAINED`.

`unique_content_not_yet_preserved = NONE` only after this exact file is successfully read back from the branch.

**Closure decision after successful readback:** `SAFE_TO_DELETE` for CHAT-003 only. This does not close the underlying QM/SEC/OPS work, does not prove provider state, does not merge PR #900 and does not authorize production or external-platform mutation.
