# Documentary Maintenance Control Loop

Status: IMPLEMENTATION CANDIDATE / DRAFT-PR BOUNDARY  
Date: 2026-08-20  
Authority: ESS-0010 + ESS-0002 + ESS-0003 + ESS-0019 + ADR-0096 + ADR-0097  
Roadmap: Documentary D7/D9, E1/E6, H1/H5  
FinTech value-chain authority: SC-MD-SPT-0001

## Purpose

This component closes the missing Documentary maintenance loop without creating a second Governance, Versioning, EventMesh, Observability or AI-provider authority.

```text
Document Registry + source-change evidence
                 |
                 v
      SemanticFreshnessAnalyzer
                 |
                 v
        Supervisor observation
      finding / recommendation
                 |
                 v
       Platform Director decision
                 |
          exact evidence bind
                 v
 DocumentaryMaintenanceOrchestrator
       Agent IAM + Governance
                 |
                 v
    DocumentaryMaintenanceAgent
       semantic patch plan only
                 |
        isolated branch only
                 v
  deterministic apply + version bump
                 |
      maintenance health snapshot
                 |
        local governance checks
                 |
      final current-main gate
                 |
                 v
 existing open-agent-draft-pr workflow
                 |
                 v
              Draft PR
                 |
                 v
       Human review / hosted CI
                 |
                 v
        Human/Owner merge only
```

## Components

### SemanticFreshnessAnalyzer

Reads the canonical Document Registry and produces deterministic freshness candidates. Targeted scans correlate changed repository paths with document references, declared dependencies and component semantic scope. A periodic scan with no source-path filter includes every active registered document as an AI-assessment candidate.

The analyzer never writes files.

### Supervisor Documentary observation

`documentaryMaintenanceObservation.ts` transforms freshness and Documentation Hygiene findings into immutable recommendation evidence. Hygiene violations block automation. Protected documents are surfaced as review-required rather than patchable. The Supervisor still never approves the task.

### DocumentaryMaintenanceOrchestrator

The orchestrator validates the existing Platform Director protected-decision boundary and requires an exact Supervisor evidence binding. It composes with existing provider-neutral Agent IAM for `ANALYZE` and `PLAN`. Repository mutation capabilities are checked separately for `BRANCH`, `COMMIT` and `PR`.

The host propagates `killSwitchActive` from the execution request into the Agent-IAM context. An active kill switch therefore remains effective for mutating capabilities and cannot be silently overridden by the Documentary host.

### DocumentaryMaintenanceAgent

The agent uses an injected semantic provider. It first assesses whether a deterministic candidate is actually stale; if stale above the confidence threshold, it proposes complete updated document content. The agent never selects its own target outside the deterministic candidate list and cannot patch review-only paths.

Before apply, the current document SHA must match the observed SHA. Apply is branch-only, transactional for document files plus registry, and re-runs Documentation Hygiene after mutation. The exported Apply contract resolves the actual checked-out Git branch itself and requires it to equal the authorized `agent/documentary-maintenance-*` branch; a caller-supplied branch string alone cannot authorize mutation.

### AI adapter

`server/documentaryMaintenanceAiAdapter.ts` reuses existing Anthropic/OpenAI routing and repository RAG evidence. Document bodies, source diffs and retrieval chunks are explicitly treated as untrusted data. The model cannot influence capabilities, branch selection, lifecycle transitions or version numbers.

### D9 Maintenance observability

`src/platform/Documentary/Observability/DocumentaryMaintenanceObservability.ts` derives an immutable health snapshot from freshness, Supervisor recommendation, plan and apply evidence. The snapshot exposes only counts and ratios such as registry coverage, freshness, orphan rate, candidate count, planned/skipped patches and applied documents.

The telemetry contract contains no document body, prompt, diff, user identifier, credential or secret. It is a Documentary maintenance slice only and does not create or replace a central Observability platform.

### SC-MD-SPT-0001 value-chain integration

Documentary Maintenance is a **read-only Documentation/Evidence sidecar** around the existing `VC-13-EVENT-TRACEABILITY-SUPERVISOR` stage. It is not a fifteenth financial runtime stage.

The existing Quality projection `fintech-value-chain-quality/1.0.0` remains the repository-native structural/evidence check for the 14-stage value chain. Documentary does not become a Quality authority and Quality does not authorize Documentary mutation.

The integration contract is deliberately one-way with respect to financial runtime semantics:

- Documentary may consume governed repository/change/evidence context and Supervisor/Platform Director evidence;
- Documentary may emit documentation, maintenance health and PR-review evidence;
- Documentary must not import or call MarketData, Scoring, Ranking, Eligibility or delivery hotpaths;
- Documentary must not change market data, classification, score, confidence, ranking, eligibility, provider routing, release or deployment decisions;
- MarketData, Scoring, Ranking, Orchestrator and application runtime must not gain a direct Documentary or Quality mutation dependency.

The `Supervisor/manifest.json` change is therefore a VC-13 evidence-surface extension only: `decisionAuthority=false` and `mutationAuthority=false` remain explicit.

### Git host / Draft-PR handoff

`scripts/automation/runDocumentaryMaintenanceControlLoop.ts`:

1. requires a clean worktree at exact current `main`;
2. requires request `sourceCommit` to equal the exact fetched current `main` SHA;
3. propagates request `killSwitchActive` into the existing Agent-IAM authorization context;
4. resolves freshness/Supervisor evidence and validates the Platform Director decision before branch creation;
5. requires explicit Agent IAM grants and only requires `PR` when Draft-PR dispatch is enabled;
6. derives a unique `agent/documentary-maintenance-*` branch and refuses to reuse an existing remote branch;
7. creates the branch from exact `origin/main`;
8. applies only the approved patch plan after the Apply contract verifies the actual checked-out branch identity;
9. increments document patch versions and downgrades changed documents to `generated`;
10. creates exactly one bounded work claim;
11. stages only explicit changed paths;
12. runs Documentation Hygiene and Governance checks;
13. fetches `main` again immediately before remote handoff and aborts if it moved;
14. pushes the candidate branch;
15. dispatches the existing `open-agent-draft-pr.yml` workflow;
16. best-effort deletes an orphaned remote candidate if a post-push failure occurs before successful handoff.

A no-change semantic plan removes the empty local maintenance branch instead of leaving branch debris. No merge, deployment or production mutation is implemented.

### Governance / Registry / Validation closure

The implementation provides explicit package scripts:

- `documentary:maintenance` — controlled host entry point;
- `documentary:maintenance:test` — targeted unit suite;
- `documentary:maintenance:validate` — deterministic closure validator;
- `documentary:maintenance:prepr` — targeted tests + TypeScript check + Documentation Hygiene + Governance Control Plane + Repository Quality + closure validator.

The closure validator verifies the exact Work Claim ↔ branch diff set, current-main synchronization, ADR-0097 identity, Authority Registry identity, Document Registry records, manifest contracts/tests/version, SC-MD-SPT-0001 sidecar metadata and hot-path isolation markers, kill-switch propagation, actual checked-out branch verification, protected document prefixes, narrow staging and branch/Draft-PR safety markers. `git diff --check` is part of the validator.

## Protected classes

Semantic full-content auto-patching is prohibited for `docs/adr/**`, `docs/archive/**`, `docs/compliance/**`, `docs/evidence/**`, `docs/governance/**`, `docs/legal/**`, `docs/security/**`, `docs/release/**` and all root files including `AGENTS.md` and `README.md`. These artifacts remain visible as review-required candidates where relevant.

## Versioning contract

The platform version remains `package.json#version` and is not changed by Documentary maintenance. Documentary component version remains `src/platform/Documentary/manifest.json#version`.

For a semantically patched registered document only its Document Registry version is incremented by one patch version and lifecycle is set to `generated`. Review/approval remains a separate governed transition.

## Failure model

The loop fails closed on dirty/stale host baseline, sourceCommit/main mismatch, active Agent-IAM kill switch for mutation, Documentation Hygiene findings, missing/mismatched Supervisor evidence, invalid Platform Director decision, missing Agent IAM capability, existing remote branch collision, actual checked-out branch mismatch, protected path, symlink/path traversal, oversized document, content-hash drift, invalid document SemVer, post-apply hygiene failure, staged-scope mismatch, `main` changing before PR handoff, SC-MD-SPT sidecar/hot-path boundary drift or unavailable AI provider.

A post-push handoff error triggers best-effort remote branch cleanup. No failure path falls back to direct `main` mutation.