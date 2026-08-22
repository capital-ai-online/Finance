# Documentary Maintenance Control Loop

**Status:** ACTIVE / IMPLEMENTED — merged through PR #460, revalidated 2026-08-22  
**Authority:** ESS-0010 + ESS-0002 + ESS-0003 + ESS-0019 + ADR-0096 + ADR-0097  
**Roadmap:** Documentary D7/D9, E1/E6, H1/H5  
**FinTech value-chain authority:** `SC-MD-SPT-0001`  
**Quality projection:** `fintech-value-chain-quality/1.0.0` — 18 stages

## Purpose

This component closes the Documentary maintenance loop without creating a second Governance, Versioning, EventMesh, Observability, AI-provider or PR authority.

```text
Document Registry + source-change evidence
                 ↓
      SemanticFreshnessAnalyzer
                 ↓
        Supervisor observation
        finding / recommendation
                 ↓
       Platform Director decision
          exact evidence bind
                 ↓
 DocumentaryMaintenanceOrchestrator
       Agent IAM + Governance
                 ↓
    DocumentaryMaintenanceAgent
       semantic patch plan only
                 ↓
 optional ArchiveRetentionAgent
       retention/deletion plan only
                 ↓
        isolated branch only
                 ↓
  deterministic apply/versioning
                 ↓
      local governance checks
                 ↓
      final current-main gate
                 ↓
 existing open-agent-draft-pr workflow
                 ↓
              Draft PR
                 ↓
       Human review / hosted CI
                 ↓
        Human/Owner merge only
```

## Components

### SemanticFreshnessAnalyzer

Reads the canonical Document Registry and produces deterministic freshness candidates. Targeted scans correlate changed repository paths with document references, declared dependencies and component semantic scope. A periodic scan with no source-path filter includes every active registered document as an AI-assessment candidate. The analyzer never writes files.

### Supervisor Documentary observation

`documentaryMaintenanceObservation.ts` transforms freshness and Documentation Hygiene findings into immutable recommendation evidence. Hygiene violations block automation. Protected documents are surfaced as review-required rather than patchable. The Supervisor still never approves the task.

### DocumentaryMaintenanceOrchestrator

The orchestrator validates the existing Platform Director protected-decision boundary and requires an exact Supervisor evidence binding. It composes with existing provider-neutral Agent IAM for `ANALYZE` and `PLAN`. Repository mutation capabilities are checked separately for `BRANCH`, `COMMIT` and `PR`.

The host propagates `killSwitchActive` from the execution request into the Agent-IAM context. An active kill switch remains effective for mutating capabilities and cannot be silently overridden by the Documentary host.

### DocumentaryMaintenanceAgent

The agent uses an injected semantic provider. It assesses whether a deterministic candidate is stale and may propose complete updated content only for non-protected paths. It never selects a target outside the deterministic candidate list and cannot patch review-only paths.

Before apply, the current document SHA must match the observed SHA. Apply is branch-only, transactional for document files plus registry, and re-runs Documentation Hygiene after mutation. The exported Apply contract resolves the actual checked-out Git branch and requires it to equal the authorized `agent/documentary-maintenance-*` branch.

### ArchiveRetentionAgent

`src/platform/Documentary/Agents/ArchiveRetentionAgent.ts` is a bounded retention/deletion **planner**, not a destructive execution service.

Only reproducible, unregistered, unreferenced canonical duplicates under `docs/archive/generated/**` or `docs/archive/transient/**` may become `delete-eligible`, after the configured retention window. Registered documents, authorities, Evidence, Compliance/Security material and referenced history are retained. Even `delete-eligible` items require explicit Owner approval, an inactive kill switch and an existing maintenance branch. The agent returns `mutationPerformed=false`; physical deletion remains a normal governed repository patch.

### AI adapter

`server/documentaryMaintenanceAiAdapter.ts` reuses existing Anthropic/OpenAI routing and repository RAG evidence. Document bodies, source diffs and retrieval chunks are untrusted data. The model cannot influence capabilities, branch selection, lifecycle transitions or version numbers.

### D9 Maintenance observability

`src/platform/Documentary/Observability/DocumentaryMaintenanceObservability.ts` derives an immutable health snapshot from freshness, Supervisor recommendation, plan and apply evidence. The snapshot exposes aggregate counts and ratios only; it contains no document body, prompt, diff, user identifier, credential or secret. This is a Documentary maintenance slice and does not replace the central Observability architecture.

## SC-MD-SPT-0001 value-chain integration

Documentary Maintenance is a **read-only Documentation/Evidence sidecar** around the current `VC-17-EVENT-TRACEABILITY-SUPERVISOR` stage. It is **not a nineteenth financial runtime stage**.

The existing Quality projection `fintech-value-chain-quality/1.0.0` is the repository-native structural/evidence check for the current **18-stage** value chain. Documentary does not become a Quality authority and Quality does not authorize Documentary mutation.

The integration contract is one-way with respect to financial runtime semantics:

- Documentary may consume governed repository/change/evidence context and Supervisor/Platform Director evidence;
- Documentary may emit documentation, maintenance-health and PR-review evidence;
- Documentary must not import or call MarketData, Scoring, Ranking, Eligibility or delivery hotpaths;
- Documentary must not change market data, classification, score, confidence, ranking, eligibility, provider routing, OrderIntent, release or deployment decisions;
- Financial/runtime components must not gain a direct Documentary or Quality mutation dependency.

The Supervisor Documentary surface remains observation/evidence-only with `decisionAuthority=false` and `mutationAuthority=false`.

## Git host / Draft-PR handoff

`scripts/automation/runDocumentaryMaintenanceControlLoop.ts`:

1. requires a clean checkout at exact current `main`;
2. requires request `sourceCommit` to equal current `main` SHA;
3. propagates `killSwitchActive` into Agent IAM;
4. validates freshness, Supervisor evidence and Platform Director decision before branch creation;
5. requires explicit Agent IAM grants and requires `PR` only when Draft-PR dispatch is enabled;
6. derives a unique `agent/documentary-maintenance-*` branch and refuses existing remote-branch reuse;
7. creates the branch from exact `origin/main`;
8. applies only the approved patch plan after actual branch verification;
9. increments document patch versions and downgrades changed documents to `generated`;
10. creates one bounded work claim;
11. stages only explicit changed paths;
12. runs Documentation Hygiene and Governance checks;
13. fetches `main` again immediately before remote handoff and aborts if it moved;
14. pushes the candidate branch;
15. dispatches existing `open-agent-draft-pr.yml`;
16. best-effort removes an orphan remote candidate if handoff fails after push.

No merge, deployment or production mutation is implemented.

## Validation closure

Existing package scripts remain authoritative:

- `documentary:maintenance` — controlled host entry point;
- `documentary:maintenance:test` — targeted unit suite;
- `documentary:maintenance:validate` — deterministic closure validator;
- `documentary:maintenance:prepr` — targeted tests + TypeScript + Documentation Hygiene + Governance Control Plane + Repository Quality + closure validator.

The separate `sandbox:prepr` command is only a ChatGPT/local execution projection over existing checks and cannot authorize PR, merge or deployment.

The closure validator verifies current-main synchronization, ADR/Authority/Document Registry identity, manifest contracts/tests/version, the VC-17/18-stage SC-MD-SPT sidecar boundary, hot-path isolation, kill-switch propagation, actual branch verification, protected document prefixes, narrow staging and reuse of the existing Draft-PR workflow. Historical Evidence retains the stage identifiers that were true when it was recorded; current-stage assertions come from the current Quality projection and manifest.

## Protected classes

Semantic full-content auto-patching is prohibited for `docs/adr/**`, `docs/archive/**`, `docs/compliance/**`, `docs/evidence/**`, `docs/governance/**`, `docs/legal/**`, `docs/security/**`, `docs/release/**` and root authorities/projections such as `AGENTS.md` and `README.md`. These artifacts remain review-required candidates where relevant.

## Versioning contract

The platform version remains `package.json#version`. Documentary component version remains `src/platform/Documentary/manifest.json#version`. For a semantically patched registered document only its Document Registry patch version is incremented and lifecycle is set to `generated`; review/approval remains separate.

## Failure model

The loop fails closed on dirty/stale host baseline, sourceCommit/main mismatch, active Agent-IAM kill switch for mutation, Documentation Hygiene findings, missing/mismatched Supervisor evidence, invalid Platform Director decision, missing Agent IAM capability, branch collision, actual branch mismatch, protected path, symlink/path traversal, oversized document, content-hash drift, invalid document SemVer, post-apply hygiene failure, staged-scope mismatch, `main` movement before PR handoff, SC-MD-SPT sidecar/hot-path drift or unavailable AI provider.

No failure path falls back to direct `main` mutation.
