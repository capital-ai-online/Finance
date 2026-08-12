# DevelopmentChain Documentation Freeze Policy

Effective: 2026-08-11
Updated: 2026-08-12

1. The AI-Agent transformation is documentation-first.
2. M3–M9 code/config/infrastructure changes were prohibited until M2G Documentation Freeze became COMPLETE on `main`; M2G is now complete.
3. After M2G, DevelopmentChain implementation proceeds **sequentially by phase**. Documentation for later phases may be prepared in advance, but documentation readiness never unblocks a phase whose predecessor gate is incomplete.
4. Every DevelopmentChain step must update `docs/architecture/ROADMAP.md`, the detailed implementation roadmap, traceability matrix and affected ADR/ESS status.
5. The canonical operational index is `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`; the legacy `AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` remains a stable-reference detail document.
6. Every phase with implementation or mutation must have the required execution/runbook, test, rollback, evidence and traceability contract before execution.
7. A PR that mixes unresolved architecture documentation with production mutation must be split.
8. Documentation-only PRs may contain documentation, `.ai` governance/contract metadata and agent directives, but no runtime/workflow/infrastructure side effect. They use Check Class D unless a stricter class is introduced by their actual changed files.
9. External production mutation requires the DevelopmentChain mutation sequence: Roadmap/ADR/ESS → Human/Owner approval → pre-mutation verification → authorized execution → post-verification → evidence → roadmap sync.
10. A mutation handoff is non-authorizing. `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md` cannot replace Human approval, REM/IAM, execution-host policy or durable audit evidence.
11. Every repository work item uses a fresh branch from current `main`. After successful Human merge into Finance, the work branch is deleted and never reused. Cloned repositories/worktrees follow the same rule and temporary copies are cleaned up after required Evidence is secured.
12. Parallel agent work is allowed only with explicit changed-file overlap inspection; conflicting writers must be sequenced or rescaled/rescoped.
13. M6–M10 implementation remains blocked by the sequential gates recorded in the DevelopmentChain Roadmap, even when their planning documents already exist.
14. `MERGE` remains Human/Owner-only; green CI, an execution permit or a mutation Handoff is never merge authorization.

Normative execution references:

- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`
- `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`
- `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md`
- `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md`
- `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`
