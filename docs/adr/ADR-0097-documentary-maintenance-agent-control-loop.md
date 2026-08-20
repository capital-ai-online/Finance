# ADR-0097 — Documentary Maintenance Agent Control Loop

**Authority ID:** `AUTH-ADR-DOCUMENTARY-MAINTENANCE-CONTROL-LOOP-2026-08-20`  
**Version:** `1.0.0`  
**Status:** `PROPOSED` — implementation candidate; effective only after Human Merge  
**Date:** `2026-08-20`  
**Decision Owner:** CAPITAL-AI Owner  
**Scope:** Documentary semantic freshness, Supervisor/Platform-Director authorization wiring, branch-only document mutation, deterministic document versioning, maintenance observability, SC-MD-SPT-0001 evidence-sidecar integration and Draft-PR handoff

## Context

The Documentary baseline already contains deterministic document models, provenance, code discovery, lifecycle governance, a read-only Documentation Hygiene validator, status-event drift detection and a narrowly bounded status-header updater. The repository also already contains the provider-neutral Agent IAM, Compliance policy gate, Platform Director protected-decision boundary, Supervisor observation model, Anthropic/OpenAI model routing, RAG evidence retrieval and a trusted `open-agent-draft-pr.yml` workflow.

The remaining gap is the closed maintenance loop requested by the Owner and described by `DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` D7/D9, E1/E6 and H1/H5:

```text
Supervisor finding / recommendation
        |
        v
Platform Director approved decision
        |
        v
Documentary Maintenance Agent
        |
        v
isolated branch -> bounded patch -> Draft PR
```

The loop must not turn the Supervisor, Documentary, Observability telemetry or an AI provider into a new repository authority.

The repository-wide FinTech value chain `SC-MD-SPT-0001` is separately projected by Quality as 14 read-only structural/evidence stages. Documentary maintenance must integrate with that chain as supporting documentation/evidence capability only; it must not become a fifteenth financial runtime stage or influence market data, classification, scoring, confidence, ranking, eligibility, provider routing, release or deployment decisions.

## Decision

### 1. Dedicated Maintenance Agent, no decision authority

`src/platform/Documentary/Agents/DocumentaryMaintenanceAgent.ts` is the Documentary semantic-maintenance agent contract. It may assess candidate documents and produce bounded patch proposals. It cannot approve architecture, compliance, governance, releases or merges.

Semantic model output is advisory data. Deterministic code owns path allowlists, lifecycle/version transitions, hashes and Git boundaries.

### 2. Deterministic freshness discovery before AI

`SemanticFreshnessAnalyzer` reads the canonical Document Registry and identifies candidate documents from explicit source-path references, declared `@depends on` relationships, component semantic scope, document-to-document references and periodic repository-wide full scans.

Archived, superseded and suspended documents are excluded from automatic freshness mutation.

### 3. Protected document classes are review-only

The Maintenance Agent never performs semantic full-content mutation on ADRs, archived material, compliance/legal/security documents, governance/control-plane documents, evidence artifacts, release evidence or root authorities/projections outside `docs/`.

Such documents may be reported as freshness candidates, but remain Human/Owner review-only. Existing specialized deterministic mechanisms retain their narrower contracts.

### 4. Supervisor -> Platform Director -> Agent binding

The Supervisor produces deterministic Documentary maintenance recommendation evidence from freshness and hygiene observations. The Supervisor still does not decide.

Before the semantic agent may plan a patch, the orchestrator requires a valid approved `PlatformDecisionRecord`, `Documentary` in affected components, a `PASS` Supervisor assessment whose `evidenceId` exactly matches the current recommendation, matching correlation/source evidence, and explicit Agent IAM `ANALYZE` and `PLAN` grants.

Repository mutations additionally require explicit `BRANCH`, `COMMIT` and, only when Draft-PR dispatch is enabled, `PR` grants. There remains no Agent IAM `MERGE` capability.

The host propagates the request's Agent IAM `killSwitchActive` state into every authorization decision. It must never hard-code an inactive kill switch. An active kill switch therefore prevents mutating capabilities at the existing deny-by-default Agent IAM boundary.

### 5. Branch-only patch application and deterministic document versioning

A semantic patch may be applied only on `agent/documentary-maintenance-*`. `main` is rejected unconditionally. The Apply contract verifies the **actual checked-out Git branch** and requires it to equal the authorized `branchName`; a caller-supplied maintenance-looking string alone is insufficient.

Every patch is protected by repository-relative path validation, non-symlink checks, file-size bounds and pre-/post-plan SHA-256 checks. A TOCTOU mismatch aborts the operation.

For each applied document patch, `docs/governance/document-registry.json` is updated deterministically: patch SemVer increments by exactly one and lifecycle becomes `generated`; authority/owner/type/language/path remain unchanged. The AI model never chooses the version or lifecycle state.

### 6. Current-main and branch-identity binding

The Git host requires a clean checkout of the exact fetched current `origin/main`. Request `sourceCommit` must equal that exact Main SHA; stale source evidence cannot start a maintenance branch.

Branch names are correlation-derived under `agent/documentary-maintenance-*`. An already-existing remote branch with the same derived identity is rejected instead of being reused or force-updated. An empty/no-change candidate removes its local branch. If a failure occurs after a remote push but before successful handoff, the host best-effort deletes the orphaned remote candidate.

### 7. Existing AI routing and RAG are reused

No `@openai/agents` or second model-orchestration framework is introduced in this scope. The server adapter reuses `generateStructuredWithFallback()`, `generateTextWithFallback()`, existing Anthropic/OpenAI clients, AI evaluation governance and repository RAG evidence retrieval.

Prompt inputs explicitly treat document text, diffs and retrieved chunks as untrusted data. Model output cannot grant capabilities or alter authorization state.

### 8. D9 maintenance observability is aggregation-only

`src/platform/Documentary/Observability/DocumentaryMaintenanceObservability.ts` derives a health snapshot from freshness, Supervisor recommendation, patch plan and apply result. It exposes only aggregate counts/ratios such as registry coverage, freshness ratio, orphan rate, candidate count, planned/skipped patches and applied documents.

No document body, prompt, diff, user identifier, secret or credential is included in the telemetry contract. This is a Documentary maintenance-specific D9 slice and does not replace a central observability platform.

### 9. SC-MD-SPT-0001 integration is sidecar-only and non-authorizing

Documentary maintenance is attached to the FinTech value chain as a read-only Documentation/Evidence sidecar around `VC-13-EVENT-TRACEABILITY-SUPERVISOR`. The existing Quality projection `fintech-value-chain-quality/1.0.0` remains the repository-native structural/evidence check for the 14-stage value chain.

This integration does **not** add Documentary as a runtime stage. Documentary does not import or call MarketData, Scoring, Ranking, Eligibility or delivery hotpaths and does not become a dependency of those hotpaths. It consumes governed repository/change/evidence context and emits documentation/maintenance evidence only.

Direct effects on market data, classification, scoring, confidence, ranking, eligibility, provider routing, release, deployment or production mutation are forbidden. Quality remains read-only and non-authorizing; Documentary does not depend on Quality for mutation authority.

### 10. Existing Draft-PR workflow is reused

The Git host creates a fresh branch from exact fetched `origin/main`, writes only the approved patch set plus one bounded work claim, runs local structural governance checks, stages only explicit paths, commits and pushes the branch. It then dispatches the existing `.github/workflows/open-agent-draft-pr.yml` instead of implementing a second PR path.

Immediately before remote handoff, `origin/main` is fetched again. If `main` changed during the run, the candidate is rejected and must be regenerated from the newer main. Evidence-bound semantic patches are not silently rebased.

### 11. Governance/Registry/Validation closure is deterministic

The branch provides `documentary:maintenance:test`, `documentary:maintenance:validate` and `documentary:maintenance:prepr` scripts. The closure validator checks exact Work Claim ↔ changed-file equality, branch synchronization with current `origin/main`, `git diff --check`, ADR/Authority/Document Registry identities, Documentary manifest version/contracts/tests, the SC-MD-SPT-0001 sidecar boundary, kill-switch propagation, actual checked-out branch verification, protected path classes, explicit staging and reuse of the existing Draft-PR workflow.

This validator complements — and does not replace — the canonical Documentation Hygiene, Governance Control Plane and Repository Quality gates.

### 12. No pre-PR expensive CI and no merge/deploy

The host may run targeted/local low-cost checks before PR creation. Full hosted CI remains a post-PR concern. The Maintenance Agent cannot merge, deploy or perform production mutation.

## Security and data-integrity impact

- deny-by-default Agent IAM is reused;
- Agent IAM kill-switch state is propagated rather than hard-coded inactive;
- Platform Director approval is bound to the Supervisor recommendation identity;
- current Main SHA is bound to the semantic source evidence;
- prompt-injection content is treated as data rather than instructions;
- protected documents are excluded from semantic auto-write;
- content hashes prevent stale-plan application;
- symlinks/path traversal are rejected;
- automatic content changes cannot remain `approved` in the registry;
- actual checked-out branch must equal the authorized maintenance branch before apply;
- remote agent-branch collisions are rejected;
- post-push handoff failures attempt remote cleanup;
- `main` is never an eligible mutation target;
- no Merge/Deploy/Production capability is granted;
- telemetry excludes document content, prompts, diffs, user identifiers and secrets;
- no MarketData/Scoring/Ranking/Eligibility hotpath obtains a Documentary or Quality mutation dependency.

No Supabase, Stripe, Render, production data, secrets or external infrastructure are mutated by this architecture.

## Validation / Definition of Done

1. Semantic freshness discovery is deterministic and registry-based.
2. Supervisor recommendation evidence is deterministic and fail-closed on hygiene findings.
3. Platform Director and Supervisor evidence must match before agent planning.
4. Current `sourceCommit` equals the exact current Main SHA before semantic analysis.
5. Agent IAM grants are required for analysis, planning and Git mutations; kill-switch state is propagated to the IAM decision.
6. Semantic full-content mutation is denied for protected document classes.
7. Patch apply is denied on `main`, outside `agent/documentary-maintenance-*`, and whenever the actual checked-out branch differs from the authorized branch identity.
8. Applied documents receive deterministic patch-version increments and `generated` lifecycle.
9. Existing remote branch identity cannot be silently reused.
10. Existing Draft-PR workflow is reused.
11. Final `main` drift aborts PR handoff.
12. D9 maintenance health telemetry is content-free and correlation-bound.
13. Documentary is declared and validated as a non-authorizing SC-MD-SPT-0001 sidecar around VC-13, not a financial runtime stage.
14. Work Claim, ADR Registry, Authority Registry, Document Registry and component manifest are mutually consistent.
15. Targeted unit/type/structural/repository-quality checks pass before PR readiness.
16. Merge remains a separate Human/Owner action.

## Rollback

Before merge, delete or close the feature branch/Draft PR. No production rollback is required because the agent has no production mutation path. After merge, revert ADR-0097 and the Documentary maintenance-control-loop implementation together on a new branch from then-current `main`; do not restore direct automatic writes to `main` as a shortcut.