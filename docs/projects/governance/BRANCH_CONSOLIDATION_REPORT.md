# CAPITAL-AI-GOV — Branch Consolidation Report

**Correlation baseline:** `main@64a3415781a50177798cbe9404b1855735e5371a`  
**Open PRs at consolidation start:** 0  
**Current merge source:** `agent/governance-chat-consolidation-20260831` only

## Branch disposition

| Branch | Relative state observed vs baseline | Claim lifecycle | Disposition |
|---|---|---|---|
| `docs/capital-ai-gov-consolidation-20260831` | diverged; 7 ahead / 61 behind | `superseded` | historical reuse only |
| `gov/capital-ai-gov-v2-20260831` | diverged; 12 ahead / 61 behind | `superseded` | historical reuse only |
| `gov/capital-ai-gov-vc-integration-20260831` | diverged; 37 ahead / 50 behind | `superseded` | historical reuse only |
| `gov/project-architecture-pvc-20260831` | diverged; 25 ahead / 5 behind | `superseded` | historical reuse only |
| `agent/governance-pvc-architecture-20260831` | diverged before lifecycle close; reusable P1 documents | changed to `superseded` during this consolidation | P1 reuse source only |
| `agent/governance-chat-pr-20260831` | diverged; 5 ahead / 5 behind | `released` | historical PR-transport reuse only |
| `agent/governance-chat-pr-v2-20260831` | merged through PR #629 | merged claim was stale `active` on main | terminalized as `released/merged` in this candidate |

## Consolidation decisions

1. No historical GOV branch is merged/rebased wholesale.
2. Current non-authorizing project contracts are replayed onto fresh current main.
3. Stale snapshot-bound validation/PR-ready evidence is not copied.
4. Unique useful concepts from earlier branches are normalized into current canonical files (`TASK_REGISTER`, authority boundaries, component matrix and handoffs) instead of publishing multiple competing roadmap variants.
5. Foreign technical/runtime changes found in old branches are not replayed by GOV.
6. Shared Authority/ADR/ESS registries are not changed solely to preserve old branch content.

## Reuse trace

- PVC/project model: reused from `agent/governance-pvc-architecture-20260831`.
- Platform Director / authority boundary concepts: normalized from `gov/capital-ai-gov-v2-20260831` and `gov/capital-ai-gov-vc-integration-20260831`.
- roadmap/task extraction concepts: normalized from `docs/capital-ai-gov-consolidation-20260831`.
- compact PR body + direct Chat/API/MCP/Connector transport: already merged through PR #628 and PR #629; not duplicated here.

## Exit condition

This branch consolidation is complete when final current-main synchronization shows no new overlap, the current candidate has exactly one active GOV claim, documentation/governance validation is green or explicitly unavailable pre-PR, and Human/Owner approves PR creation for the exact final snapshot.
