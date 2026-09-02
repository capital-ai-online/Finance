# CAPITAL-AI-GOV — Historical Consolidation Validation Report

**Historical baseline:** `main@64a3415781a50177798cbe9404b1855735e5371a`  
**Historical branch:** `agent/governance-chat-consolidation-20260831`  
**Scope:** documentation / project architecture / work-claim lifecycle / branch governance  
**Lifecycle:** `HISTORICAL / NON-AUTHORIZING`

This report records the validation state of the 2026-08-31 Governance consolidation. It is retained for audit only. Current development instructions resolve through `/AGENTS.md`, `docs/projects/PROJECT_VALUE_CHAIN.md`, the affected project Roadmap and applicable ADR/ESS.

Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Older Candidate-Head wording from the original workflow is not current policy.

## Historical results

The original work established and checked, for its then-current branch state:

- `/AGENTS.md` and current-main correlation;
- no conflicting open PR writer at the recorded preflight;
- `PVC-*` as an organizational Project Value Chain namespace distinct from the technical financial `VC-*` namespace;
- no new runtime, scoring, data, EventMesh, release, deployment or production implementation by Governance;
- no new ADR/ESS/AUTH/CTRL identity for the project-folder consolidation itself;
- Human-only merge remained unchanged;
- the repository branch naming convention was introduced under the existing governance chain;
- historical work-claim lifecycle cleanup was performed for the correlated work.

## Historical validation limitation

The GitHub connector used for that work could not execute repository shell commands directly. The report therefore did **not** establish local PASS for:

- `npm run governance:control-plane`
- `npm run repository:validate`
- `npm run docs:hygiene:check`
- `npm run repository:quality:check`
- `scripts/pr/validateWorkClaim.mjs`

Hosted validation and later Human Merge supplied the terminal repository evidence for the old work item.

## Current-use rule

Do not use this report as a current pre-PR checklist or project plan. For new work:

1. read current `main` and open PRs;
2. resolve PVC / Primary Owner;
3. read the current project Roadmap and applicable ADR/ESS;
4. work on a fresh scoped branch;
5. before PR creation, report current `main SHA` and `branch head SHA` and obtain the required Human/Owner approval;
6. after PR creation, use the final `PR head SHA` for hosted validation; merge remains Human/CODEOWNER-only.
