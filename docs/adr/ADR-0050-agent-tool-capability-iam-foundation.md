# ADR-0050 — Agent Tool & Capability IAM Foundation (Supabase, Phase 1)

- **Status:** Accepted / Phase 1 implemented, Phase 2 not started
- **Date:** 2026-08-09
- **Scope:** AI-agent read access to Supabase, new agent-tool layer, governance for a future
  capability/grant IAM extension
- **Related:** ADR-0043 (Supabase Privilege Separation & Render Production Hardening), ADR-0041
  (Enterprise Market Data Provider & MCP Architecture — status reference for "specified, not
  implemented"), ESS-0014, ESS-0016, ESS-0018

## Context

CAPITAL-AI's AI agents (`src/agents/*.ts`) previously had no way to read the application's own
Supabase data — they only ever produced structured JSON/text via
`src/services/agentModelRouting.ts`. A request emerged for two production capabilities: a
Screening/Scoring explainability agent (read-only) and an Admin/Support/Diagnostics agent (read +
controlled write) coupled to the existing `Compliance` and `Supervisor` components.

Investigation of the current codebase (documented in ESS-0018 §2) found that none of the
prerequisites for the write-capable admin agent exist yet: no tool-calling layer for agents, no
capability/grant IAM (only coarse role checks in
`src/platform/Security/authMiddleware.ts`), no approval-artifact implementation, and `Compliance`/
`Supervisor` explicitly do not gate live actions today. Building tool-calling, capability IAM, an
approval workflow, real Compliance/Supervisor gating, and a write-capable agent in a single change
would be an unreviewable diff for a FinTech application handling real financial data, and would
violate the fail-closed, approval-gated mutation model CLAUDE.md mandates for provider mutations.

## Decision

### 1. Phase 1 ships now: a read-only agent-tool foundation

- A new, additive `src/services/agentTools/` module hosts backend-only agent tools. The first tool,
  `getScoreSnapshotEvidence` (`supabaseScoreEvidenceTool.ts`), reads `score_snapshots` exclusively
  through `getPrivilegedServerSupabase()` (`server/db.ts`, unchanged, per ADR-0043) using the
  Supabase JS query builder with validated inputs — never raw SQL, never a write path.
- `src/services/rag/evidenceLayer.ts` gains an additive `buildRowEvidenceBundle` export that reuses
  the existing quality-verdict logic (previously inlined in `buildRagEvidenceBundle`, now extracted
  into a shared internal evaluator) so database-row evidence and vector-chunk evidence share one
  auditable, fail-closed quality model instead of two divergent ones. No existing exported function
  signature changes.
- A new `ScoreExplainabilityAgent` (`src/agents/scoreExplainabilityAgent.ts`) consumes the tool and
  the existing `generateTextWithFallback` router (`agentModelRouting.ts`, unchanged) to produce a
  cited explanation. It never fabricates an explanation when no evidence exists.
- A new admin-only endpoint (`server/scoreExplainability.ts`, `GET /api/scoring/explain/:symbol`)
  exposes this, gated by `checkAdminAccess(..., SUPERVISOR_ZONE_ROLES)` — the same pattern already
  used by `server/agentEvaluationRouter.ts`. No anonymous or browser-privileged-client access exists
  at any point.
- Every call is audited via the existing `logSystemEvent('ORCHESTRATOR', ...)` path
  (`server/systemEvents.ts`) with symbol/date-range/row-count/quality-verdict only — never row
  payloads.

This is purely additive. `authMiddleware.ts`, `Compliance/`, `Supervisor/`, `server/db.ts`, and all
existing agents/routers are unmodified except for the one new `app.use(...)` mount line in
`server.application.ts`.

### 2. Phase 2 (capability IAM, approval workflow, write-capable admin agent) is specified, not built

ESS-0018 §4.2 enumerates the target capability names and explicit non-goals (no raw-SQL tool ever,
no schema/project/migration mutation via an agent, no agent-granted IAM roles) for the
Admin/Support/Diagnostics agent. None of it ships in this ADR. Before any Phase 2 code:

- a capability/grant extension to `src/platform/Security/` must exist (new `Grant`/`Capability`
  types, storage, `checkCapability()`);
- an approval-artifact contract must be implemented (not just documented, as `AnalyticsApproval`
  currently is);
- `Compliance` must gain a real policy-verdict surface and `Supervisor.executeSupervised()` must
  enforce Approval + Dry-run + Fingerprint before Apply;
- each write capability must be individually enumerated — never a general SQL-execution tool.

This requires its own ADR amendment before implementation, per CLAUDE.md's requirement that
architecture-changing decisions get an ADR and that provider/database mutations follow the full
Policy→IAM/Grant→Approval→Dry-run→Fingerprint→Apply→Verify→Audit chain.

### 3. No MCP protocol server in Phase 1

The only real MCP server in this repository (`ga4-analytics`, `.mcp.json`) is Claude Code developer
tooling, not an in-app agent-capability pattern. With exactly one internal caller
(`ScoreExplainabilityAgent`), introducing MCP transport/schema machinery in-process adds complexity
without a consumer that needs it. ESS-0018 §5 records the trigger condition for revisiting this
(a second real, independent consumer — e.g. the Phase 2 write-capable admin agent, which may need
its own process/trust boundary).

## Consequences

### Positive

- A real, working, auditable read path exists for score explainability without touching any
  protected/security-critical file.
- The eventual write-capable admin agent is designed now (ESS-0018 §4.2), not improvised later, and
  its non-goals (no raw SQL, no schema/project mutation, no self-granted IAM) are on record before
  any code exists.
- `score_snapshots`' existing service-role-only RLS posture (ADR-0043) is reused unchanged, not
  weakened or bypassed.

### Trade-offs

- The Admin/Support/Diagnostics agent requested by the user is **not** delivered by this ADR. It
  requires the Phase 2 capability-IAM and approval-workflow foundation first.
- `evidenceLayer.ts`'s internal quality-evaluation logic is refactored (extracted, not duplicated),
  which touches a file used by the existing chat-assistant RAG path (`server/ai.ts`); the exported
  `buildRagEvidenceBundle` signature and behavior are unchanged, and the existing
  `tests/unit/ragEvidenceLayer.test.ts` suite is the regression guard.

## Validation & Evidence

1. Unit tests prove the row-evidence quality verdict is fail-closed (`NO_EVIDENCE` on empty rows)
   and shares thresholds with the existing RAG evidence path.
2. Unit tests prove `getScoreSnapshotEvidence` only ever calls the Supabase query builder with
   allowlisted filters (`.eq`/`.gte`/`.lte`/`.order`/`.limit`), never raw SQL, and only via
   `getPrivilegedServerSupabase()`.
3. `GET /api/scoring/explain/:symbol` returns 403 without a valid admin/supervisor bearer token.
4. `npm run lint`, `npm test`, `npm run build`, `npm run predeploy:check` pass.
5. `grep` confirms no write/upsert/delete export exists in `src/services/agentTools/`.

## Rollback

Reverting Phase 1 removes only the new files and the one router mount line; it restores no prior
behavior because none of this existed before. Rollback does not require IAM/security review since
no protected invariant (CLAUDE.md list, ADR-0043's privilege separation, RLS policies) is touched or
weakened.
