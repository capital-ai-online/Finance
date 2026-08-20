# Work Package — Documentary Maintenance Control Loop

**Status:** VALIDATION CANDIDATE  
**Date:** 2026-08-20  
**Owner Priority:** Chat instruction 2026-08-20 — complete the missing Documentary Maintenance Agent, Supervisor/Governance wiring, automatic branch/Draft-PR path, repository-wide semantic freshness and Governance/Registry/Validation closure.  
**Roadmap Traceability:** `DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` D7, D9, E1, E6, H1, H5  
**Authorities:** ESS-0002, ESS-0003, ESS-0010, ESS-0019, ADR-0096, ADR-0097

## Goal

Close the gap between Documentary observation and governed document maintenance while preserving the repository authority hierarchy:

`Supervisor -> Platform Director -> authorized Documentary Agent -> isolated patch branch -> Draft PR`.

## Scope

### P0 — Dedicated Documentary Maintenance Agent

- deterministic candidate list from Document Registry;
- semantic freshness assessment through existing provider routing;
- semantic patch proposals only for non-protected documents;
- SHA-bound TOCTOU protection;
- deterministic patch SemVer increment;
- lifecycle reset to `generated` after automatic modification.

### P0 — Supervisor / Governance / Platform Director wiring

- Supervisor recommendation evidence from freshness + hygiene;
- fail-closed on hygiene findings;
- exact correlation/source-commit binding;
- exact Supervisor evidence binding in `PlatformDecisionRecord`;
- existing Protected Decision Boundary reused;
- existing Agent IAM `ANALYZE`/`PLAN`/`BRANCH`/`COMMIT`/`PR` reused;
- no Merge/Deploy/Production capability.

### P0 — Automatic branch and Draft-PR handoff

- clean exact-main precondition;
- request `sourceCommit` must equal current `main` SHA;
- `agent/documentary-maintenance-*` branch namespace;
- existing remote branch identity is rejected, never reused/force-updated;
- empty/no-change local branches are removed;
- post-push pre-handoff failures attempt remote cleanup;
- one bounded work claim;
- explicit-path staging only;
- local Documentation Hygiene and Governance checks;
- mandatory final `main` re-fetch before PR handoff;
- existing `open-agent-draft-pr.yml` reused instead of a second PR implementation.

### P1 — Repository-wide semantic freshness

- targeted source-change correlation;
- periodic full-registry scan mode;
- existing RAG evidence used by semantic assessment;
- protected documents surfaced as review-only candidates;
- no rewrite of evidence/archive/ADR/governance/compliance/security/release material.

### P2 — Documentary Maintenance observability slice

- correlation/source-commit-bound Health Snapshot;
- metrics for registry coverage, freshness ratio, orphan rate, candidate count, planned/skipped patches and applied documents;
- aggregate values only: no document body, prompts, diffs, user identifiers, credentials or secrets;
- no second central Observability authority.

### P0 — Governance / Registry / Validation closure

- ADR-0097 in ADR Registry with stable `AUTH-*` identity;
- ADR-0097 in repository Authority Registry;
- ADR, architecture contract and this Work Package in Document Registry;
- Documentary/Supervisor component manifests synchronized;
- Documentary component version synchronized with README;
- package scripts for controlled host, targeted tests, closure validator and pre-PR aggregate;
- Work Claim must equal the actual branch diff exactly;
- closure validator checks `git diff --check`, current-main synchronization, Registry/Authority/Manifest consistency, protected paths and narrow Git staging;
- final Main-correlation evidence records the intervening Repository Quality P0-P2 merge and its architectural impact.

## Reuse decisions

- Reuse `DocumentationHygieneValidator`.
- Reuse `PlatformDecisionRecord` and `ProtectedDecisionBoundary`.
- Reuse `evaluateAgentPolicy` / `agentIam`.
- Reuse Anthropic/OpenAI clients and `agentModelRouting`.
- Reuse repository RAG retrieval and AI evaluation tracking.
- Reuse `open-agent-draft-pr.yml`.
- Reuse the current-main read-only Repository Quality evidence/coordinator as an additional validation gate.
- Do not introduce `@openai/agents`, OPA, a second EventMesh, a second version authority, another PR workflow or another Observability authority in this work package.

## Security / Integrity gates

- no direct `main` mutation;
- source evidence must be current-main-bound;
- no model-selected capabilities;
- untrusted document/diff/RAG content is data, not instructions;
- protected document classes are review-only;
- no symlink/path traversal;
- no stale-plan application;
- automatic content never remains `approved`;
- branch collisions are fail-closed;
- main movement invalidates the candidate before remote PR handoff;
- post-push handoff errors do not intentionally leave branch debris;
- observability excludes sensitive content;
- no hosted full CI before PR.

## Local validation before PR readiness

Primary command:

`npm run documentary:maintenance:prepr`

It combines, in order:

- targeted unit tests for freshness, agent, orchestrator, Git-host helpers and maintenance observability;
- `npm run lint` for repository-wide TypeScript static validation;
- `npm run docs:hygiene:check`;
- `npm run governance:control-plane`;
- `npm run repository:quality:check` inherited from current `main` as read-only aggregated quality evidence;
- `npm run documentary:maintenance:validate`.

The closure validator additionally checks:

- exact changed-file / Work Claim equality;
- branch merge-base equals current `origin/main`;
- `git diff --check`;
- ADR-0097 Registry + Authority Registry consistency;
- Document Registry entries for ADR/architecture/work-package artifacts;
- Documentary manifest version/contracts/tests/implemented areas;
- current-main Repository Quality baseline and final Main-sync evidence;
- protected review-only prefixes;
- explicit-path staging and reuse of `open-agent-draft-pr.yml`.

## Out of scope

- autonomous merge;
- release/version bump of the platform;
- Render deployment;
- Supabase/Stripe mutation;
- rewriting historical evidence;
- changing existing domain business logic;
- replacing the legacy interactive Document Hygiene UI/runtime in this work package;
- Documentary Mermaid/Migration/Plugin implementation outside the ADR-0097 maintenance scope;
- complete enterprise Observability implementation outside the maintenance health slice.
