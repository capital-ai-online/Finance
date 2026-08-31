# CAPITAL-AI-GOV — Consolidation Validation Report

**Baseline:** `main@64a3415781a50177798cbe9404b1855735e5371a`  
**Candidate:** `agent/governance-chat-consolidation-20260831`  
**Scope:** documentation / project architecture / work-claim lifecycle

## PASS — pre-implementation correlation

- `/AGENTS.md` read from current main.
- Current main SHA established.
- Open PRs against main: 0.
- Historical GOV branch changed-file and semantic overlap reviewed.
- All historical GOV branch claims are terminal after the PVC writer supersession.
- ADR registry reviewed: no active namespace reservation relevant to this work; ADR-0096 remains controlling Governance Control Plane authority.
- ESS registry reviewed: no `PVC-*` conflict identified; component specifications remain subordinate to current Governance authority.
- Current main search contained no existing `PVC-01` / Project Value Chain namespace competing with this candidate.
- No runtime, scoring, data, EventMesh, release, deployment or production implementation is executed by GOV.
- Foreign work is represented only as explicit handoff/dependency.

## PASS — consolidation design

- Fresh branch created directly from current main.
- One new exclusive consolidation work claim created.
- `docs/projects/` is explicitly non-authorizing.
- `PVC-*` is explicitly separated from current technical `SC-MD-SPT-0001` `VC-*` identifiers.
- P2 DevelopmentChain implementation remains OPS-owned.
- P3 FVC migration remains multi-owner and unexecuted.
- Admin Panel graph implementation remains CLIENT/OPS-owned.
- Old GOV branch content is reused selectively; stale branch snapshots are not merged wholesale.
- No new ADR/ESS/AUTH identity is created.
- M10 remains suspended/off.
- Human-only merge remains unchanged.
- Compact PR template/direct Chat PR transport already merged on main are referenced, not reimplemented.

## Lifecycle remediation

- `agent/governance-pvc-architecture-20260831` claim: changed from active/exclusive to `superseded`/non-exclusive.
- PR #629 merged claim on main: corrected in this candidate from stale `active` to `released`, `releaseReason: merged`, `pullRequest: 629`.

## Open governance follow-up deliberately not made enforceable here

The Owner-directed branch naming convention `agent/<project-folder>-<compact-task>-<YYYYMMDD>` is captured in `TASK_REGISTER.md`. Repository-wide enforcement requires a later versioned update of the existing Trust Root / `CTRL-SDLC-BRANCH-001`; this candidate does not create a competing project-level authority.

## Connector-unavailable local commands

The GitHub connector used for this work cannot execute repository shell commands directly. Therefore the following pre-PR commands remain `NOT_AVAILABLE` on this execution surface and must be supplied by trusted workflow/hosted validation where applicable:

- `npm run governance:control-plane`
- `npm run repository:validate`
- `npm run docs:hygiene:check`
- `npm run repository:quality:check`
- direct execution of `scripts/pr/validateWorkClaim.mjs`

Runtime build/unit tests are not required as pre-PR evidence for this documentation-only consolidation unless repository hosted CI classifies the changed scope more strictly.

## Remaining pre-PR gates

1. re-read current main/open PRs and exact candidate head;
2. compare branch against current main and ensure `behind_by = 0`;
3. recheck active writer/claim state;
4. inspect current main PR template and generate transport-equivalent baseline/body;
5. report exact final main/head to Human/Owner and obtain explicit PR-create approval;
6. create PR only if both SHAs remain unchanged.
