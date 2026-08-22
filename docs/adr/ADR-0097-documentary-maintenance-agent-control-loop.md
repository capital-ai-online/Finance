# ADR-0097 — Documentary Maintenance Agent Control Loop

**Authority ID:** `AUTH-ADR-DOCUMENTARY-MAINTENANCE-CONTROL-LOOP-2026-08-20`  
**Version:** `1.1.0`  
**Status:** `ACCEPTED / IMPLEMENTED` — implementation merged through PR #460; revalidated 2026-08-22  
**Date:** `2026-08-22`  
**Decision Owner:** CAPITAL-AI Owner  
**Scope:** Documentary semantic freshness, Supervisor/Platform-Director authorization wiring, branch-only document mutation, deterministic document versioning, archive-retention planning, maintenance observability, SC-MD-SPT-0001 evidence-sidecar integration and Draft-PR handoff

## Context

The repository already provides deterministic Documentary models/provenance, code discovery, lifecycle governance, Documentation Hygiene, status-event drift detection, provider-neutral Agent IAM, Compliance policy gates, Platform Director protected decisions, Supervisor observation, Anthropic/OpenAI routing, repository RAG and the trusted `open-agent-draft-pr.yml` workflow.

PR #460 landed the Documentary Maintenance Control Loop. Subsequent value-chain evolution expanded the canonical Quality projection to 18 stages. The previous VC-13/14-stage Documentary wording therefore became current-state drift even though the architectural boundary remained correct.

## Decision

### 1. Dedicated maintenance capability, no decision authority

`src/platform/Documentary/Agents/DocumentaryMaintenanceAgent.ts` remains the semantic-maintenance capability. AI/model output is advisory data only. Deterministic code owns path allowlists, lifecycle/version transitions, hashes, Git boundaries and capability checks.

The agent cannot approve architecture, governance, compliance, release, merge, deployment or production mutation.

### 2. Deterministic freshness discovery before AI

`SemanticFreshnessAnalyzer` reads the canonical Document Registry and identifies candidates from source-path references, dependencies, semantic scope, document references and periodic full scans. Archived, superseded and suspended artifacts are excluded from automatic semantic mutation.

### 3. Protected document classes are review-only

ADRs, archive history, Governance, Compliance, Legal, Security, Evidence, release evidence and root authorities/projections cannot receive autonomous semantic full-content writes. They may be surfaced for Owner review.

### 4. Supervisor → Platform Director → Agent binding

Supervisor emits deterministic recommendation evidence and never approves. Planning requires an exact approved Platform Director decision bound to current Supervisor/source evidence and explicit Agent IAM `ANALYZE`/`PLAN` grants. Repository writes additionally require `BRANCH`, `COMMIT` and, where Draft-PR dispatch is used, `PR` capability.

The request kill-switch state is propagated to Agent IAM and cannot be hard-coded inactive.

### 5. Branch-only apply and deterministic versioning

Semantic apply is allowed only on `agent/documentary-maintenance-*`; `main` is rejected. The actual checked-out branch must equal the authorized branch. Repository-relative path validation, symlink rejection, file-size limits and pre/post SHA-256 checks protect against traversal and TOCTOU drift.

Applied registered documents receive exactly one patch SemVer increment and lifecycle `generated`; AI never chooses version or approval state.

### 6. Current-main binding

The host requires a clean checkout of exact fetched `origin/main`. Request `sourceCommit` must equal that SHA. Existing remote branch identity is rejected rather than force-reused. Final `main` movement before PR handoff invalidates the candidate.

### 7. Existing provider routing and RAG are reused

No second agent/provider framework is introduced. The adapter reuses the existing Anthropic/OpenAI routing, AI evaluation governance and repository RAG. Retrieved/document content is treated as untrusted data and cannot alter capabilities or authorization.

### 8. D9 maintenance observability is aggregation-only

Maintenance telemetry contains only bounded counts/ratios and correlation/source metadata. It contains no document bodies, prompts, diffs, user identifiers, credentials or secrets and does not replace central Observability.

### 9. Archive retention is a bounded planner, not a deletion authority

`ArchiveRetentionAgent` extends the existing Documentary agent surface only for deterministic retention classification.

`archived` is not equivalent to `delete-authorized`. Only old, unregistered, unreferenced, reproducible canonical duplicates under `docs/archive/generated/**` or `docs/archive/transient/**` may become `delete-eligible`. Authorities, Evidence, Security/Compliance artifacts and referenced/registered history remain retained.

Even a `delete-eligible` result requires explicit Owner approval, inactive kill switch and an existing maintenance branch. The agent returns a deletion plan with `mutationPerformed=false`; physical deletion remains a normal governed repository patch and Human merge.

### 10. SC-MD-SPT-0001 integration is VC-17 sidecar-only

Documentary maintenance is attached as a read-only Documentation/Evidence sidecar around current `VC-17-EVENT-TRACEABILITY-SUPERVISOR` in the **18-stage** `fintech-value-chain-quality/1.0.0` projection.

This does **not** add Documentary as a financial runtime stage. Documentary cannot import or call MarketData, Scoring, Ranking, Eligibility, OrderIntent or delivery hotpaths and cannot become their mutation dependency. Direct effects on market data, classification, score, confidence, ranking, eligibility, provider routing, release, deployment or production mutation are forbidden.

Quality remains read-only/non-authorizing; Documentary does not depend on Quality for mutation authority.

### 11. Existing Draft-PR workflow is reused

The host creates a fresh maintenance branch from exact `origin/main`, writes only the approved bounded patch set and one Work Claim, runs local structural checks, stages explicit paths only, commits/pushes, and reuses `.github/workflows/open-agent-draft-pr.yml`.

No second PR workflow is introduced.

### 12. Local/ChatGPT sandbox validation is non-authorizing

`sandbox:prepr` may execute existing local checks in a real repository checkout before PR creation. It performs no automatic dependency install, network write, branch push, PR creation, merge, deploy or external platform mutation and cannot replace hosted CI.

### 13. Deterministic validation closure

The closure validator checks Work Claim/diff binding, current-main ancestry, `git diff --check`, ADR/Authority/Document Registry identity, Documentary manifest version/contracts/tests, current VC-17/18-stage sidecar metadata, hot-path isolation, kill-switch propagation, actual branch identity, protected paths, narrow staging and existing Draft-PR workflow reuse.

Historical evidence is not rewritten merely because stage numbering later evolved; current stage assertions are taken from current code/manifest/registry state.

## Security and data-integrity impact

- deny-by-default Agent IAM reused;
- kill switch propagated;
- Platform Director approval bound to Supervisor evidence;
- current Main SHA bound to source evidence;
- prompt/RAG content treated as untrusted data;
- protected documents excluded from semantic auto-write;
- content hashes and actual branch identity prevent stale/incorrect apply;
- no direct `main` mutation;
- no autonomous deletion, merge, deploy or production capability;
- no financial hotpath gains a Documentary/Quality mutation dependency.

No Supabase, Stripe, Render, secrets or production data are mutated by this ADR.

## Verification / Definition of Done

1. deterministic freshness discovery and registry binding;
2. exact Supervisor/Platform Director evidence binding;
3. current-main sourceCommit binding;
4. Agent IAM required for analysis/planning/Git capabilities;
5. semantic auto-write denied for protected classes;
6. actual branch must match authorized maintenance branch;
7. deterministic document patch version/lifecycle transition;
8. remote branch collision denied;
9. existing Draft-PR workflow reused;
10. final main drift aborts handoff;
11. D9 telemetry remains content-free;
12. Documentary manifest and validator bind to VC-17 and 18-stage Quality projection;
13. ArchiveRetentionAgent never performs physical deletion;
14. local sandbox remains non-authorizing and offline-first;
15. merge remains separate Human/Owner action.

## Rollback

Repository rollback is a Human-gated Git revert on a fresh branch from then-current `main`. No production rollback is implied because this architecture has no direct production mutation path.
