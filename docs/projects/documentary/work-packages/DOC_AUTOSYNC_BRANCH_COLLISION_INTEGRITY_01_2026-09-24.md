# DOC-AUTOSYNC-BRANCH-COLLISION-INTEGRITY-01 — Verified AUTO_SYNC Branch Reuse

**Project:** `CAPITAL-AI-DOC`  
**Owner / PVC:** `CAPITAL-AI-DOC / PVC-03`  
**Baseline:** `main@881ac00bddc21d79c2a2356628971026d7f9b574`  
**Priority:** P1  
**Status:** IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED  
**Trigger:** Fresh Human/Owner request on 2026-09-24 to correlate CURRENT_MAIN, identify next work and verify current document-cleanup implementations for functionality.

## Three-PVC functional review

### PVC-03 — Documentary Engine

Observed current-state functionality:

- `.github/workflows/documentary-change-impact.yml` is event-driven from accepted `main` pushes.
- Version integrity, archive integrity, exact before..after impact planning, deterministic AUTO_SYNC planning, hygiene validation, handoff evidence and convergence evidence are wired into one workflow.
- AUTO_SYNC writes are bounded to three explicit current-document projection paths and an isolated work claim.
- Semantic maintenance remains behind Supervisor → Platform Director → Agent IAM and the branch-only Documentary Maintenance Agent.
- Archive Integrity is executable and fail-closed; Archive Retention remains intentionally planning-only and never deletes files.

Finding `DOC-AUTOSYNC-COLLISION-001`:

An already existing `agent/documentary-autosync-<sourceSha>` branch was previously accepted as idempotent solely because its ref existed. The fresh plan, changed-file set, patch bytes and work claim were not rebound to that existing branch before the trusted Draft-PR handoff.

Risk: stale or independently modified branch state could be reused under a fresh AUTO_SYNC run even though the current analysis produced different evidence.

### PVC-02 — Controlled Implementation handover

Current runtime still imports/mounts `server/documentHygiene.ts` through `server.application.ts`, `server/routes/registerApplicationRoutes.ts`, `server/systemEvents.ts` and `server/decisionEngine.ts`, while the Documentary Roadmap classifies `server/documentHygiene.ts` and `server/documentSanitizer.ts` as dependency-held legacy-runtime retirement.

Under `/AGENTS.md@CURRENT_MAIN` current runtime must not continue to depend on an implementation explicitly classified as legacy. This is an owner-correct `CAPITAL-AI-OPS / PVC-02` handover, not a DOC mutation in this work package.

**Handover ID:** `DOC-TO-OPS-LEGACY-HYGIENE-RUNTIME-RETIREMENT-20260924`

**OPS exit condition:** migrate or retire every productive server consumer through the current canonical architecture; only after consumer count reaches zero may DOC physically remove the legacy hygiene/sanitizer sources.

### PVC-05 — Platform Director / Governance boundary

The current trust root requires fail-closed current-state integrity and prohibits productive legacy runtime integration. This work package changes no Governance authority, no Self-Healing contract and no merge policy. It only strengthens Documentary evidence binding beneath the existing control plane.

## Implementation

Existing AUTO_SYNC branch reuse now requires:

1. one parent equal to the exact source/current-main SHA;
2. compare state exactly one commit ahead and zero behind;
3. changed-file set equal to fresh planned patch paths plus the expected work claim;
4. fresh source/proposed hash verification;
5. existing branch patch bodies equal to fresh proposed hashes;
6. work claim identity equal to the fresh project/base/branch/path/handoff evidence.

Any mismatch stops before Draft-PR handoff. Identical replay remains idempotent.

## Scope boundary

- No direct `main` mutation.
- No Production/Render/Supabase/Stripe/IAM/Secret mutation.
- No new workflow or second Documentary/Self-Healing authority.
- No OPS legacy-runtime mutation in this DOC branch.
- No physical archive deletion.
- Human/CODEOWNER merge remains the final gate.

## Exit evidence

- Workflow no longer trusts branch existence by itself.
- Existing branch reuse is bound to exact source SHA, one-commit ancestry, fresh changed-file set, patch hashes and claim/handoff identity.
- Any mismatch fails closed before the trusted Draft-PR handoff.
- Focused workflow regression preserves stale-main/concurrency boundaries.
- Exact-head repository and workflow-security checks pass.
