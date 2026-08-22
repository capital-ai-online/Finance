# Work Package — Documentary Maintenance Control Loop

**Status:** IMPLEMENTED / REVALIDATED  
**Original date:** 2026-08-20  
**Revalidated:** 2026-08-22  
**Merged baseline:** PR #460  
**Authorities:** ESS-0002, ESS-0003, ESS-0010, ESS-0019, ADR-0096, ADR-0097, SC-MD-SPT-0001

## Goal

Maintain a governed loop from Documentary observation to branch/Draft-PR maintenance while preserving repository authority hierarchy:

`Supervisor -> Platform Director -> authorized Documentary Agent -> isolated patch branch -> existing Draft PR`.

Documentary remains documentation/evidence sidecar and never becomes a financial runtime stage or decision authority.

## Implemented scope

### Maintenance Agent

- deterministic candidate list from Document Registry;
- semantic freshness through existing provider routing;
- semantic patch proposals only for non-protected documents;
- SHA-bound TOCTOU protection;
- deterministic patch SemVer increment;
- lifecycle reset to `generated` after automatic modification;
- actual checked-out branch must equal authorized maintenance branch.

### Supervisor / Governance / Platform Director wiring

- deterministic Supervisor recommendation evidence;
- fail-closed on hygiene findings;
- exact correlation/source-commit binding;
- exact Supervisor evidence binding in `PlatformDecisionRecord`;
- existing Protected Decision Boundary and Agent IAM reused;
- request `killSwitchActive` propagated;
- no Merge/Deploy/Production capability.

### SC-MD-SPT-0001 boundary

- Documentary is `read-only-documentation-evidence-sidecar` around `VC-17-EVENT-TRACEABILITY-SUPERVISOR`;
- current `fintech-value-chain-quality/1.0.0` projection contains **18 stages**;
- Documentary is not an additional financial runtime stage;
- no direct Documentary dependency from MarketData, Scoring, Ranking, Eligibility, Orchestrator or application hotpaths;
- no Documentary mutation effect on financial/runtime decisions;
- Supervisor Documentary evidence keeps `decisionAuthority=false` and `mutationAuthority=false`.

### Archive Retention extension

- `ArchiveRetentionAgent` is part of the existing Documentary Agent surface;
- it classifies `retain`, `owner-review` and `delete-eligible` only;
- only reproducible/unregistered/unreferenced canonical duplicates under `docs/archive/generated/**` or `docs/archive/transient/**` may become eligible after the retention period;
- registered/referenced/authority/evidence/security/compliance history is retained;
- deletion planning requires Owner approval, inactive kill switch and maintenance branch;
- agent returns `mutationPerformed=false`; physical deletion stays a normal governed patch + PR + Human merge.

### Automatic branch and Draft-PR handoff

- clean exact-main precondition;
- request `sourceCommit` equals current `main` SHA;
- `agent/documentary-maintenance-*` namespace;
- remote branch identity is never silently reused/force-updated;
- one bounded Work Claim;
- explicit-path staging only;
- final `main` re-fetch before handoff;
- existing `open-agent-draft-pr.yml` reused.

### Repository-wide semantic freshness

- targeted source-change correlation;
- periodic full-registry mode;
- existing RAG evidence;
- protected documents surface as review-only candidates;
- no rewrite of historical evidence/archive/ADR/governance/compliance/security/release material.

### Maintenance observability

- correlation/source-commit-bound health snapshot;
- aggregate coverage/freshness/orphan/candidate/patch counts only;
- no document bodies, prompts, diffs, user identifiers, credentials or secrets;
- no second central Observability authority.

### Validation closure

- ADR-0097 stable authority identity;
- ADR/Authority/Document registries synchronized;
- Documentary manifest/README synchronized;
- Work Claim must match actual branch diff for Documentary-generated maintenance branches;
- closure validator checks `git diff --check`, current-main synchronization, Registry/Authority/Manifest consistency, VC-17/18-stage sidecar/hot-path boundaries, Agent-IAM kill switch, actual branch verification, protected paths and narrow staging.

## ChatGPT/local sandbox integration

The repository now exposes an offline-first, non-authorizing pre-PR execution profile:

- `npm run sandbox:policy:test`
- `npm run sandbox:prepr`
- `npm run sandbox:prepr:full` (explicit higher-cost local test/build mode)

The runner requires a real checkout with current `origin/main` and pre-provisioned `node_modules`. It never performs dependency installation, push, PR creation, merge, deployment or external platform mutation. Hosted CI remains the independent exact-remote-head gate.

## Reuse decisions

- reuse `DocumentationHygieneValidator`;
- reuse `PlatformDecisionRecord` / `ProtectedDecisionBoundary`;
- reuse `evaluateAgentPolicy` / Agent IAM;
- reuse Anthropic/OpenAI routing and repository RAG;
- reuse `open-agent-draft-pr.yml`;
- reuse Repository Quality / Quality Center projection;
- reuse `FintechValueChainQualityProjection`;
- do not introduce another agent framework, EventMesh, version authority, PR workflow, Observability authority or CI authority.

## Security / integrity gates

- no direct `main` mutation;
- source evidence current-main-bound;
- actual branch identity verified;
- kill switch propagated;
- no model-selected capabilities;
- untrusted document/diff/RAG content treated as data;
- protected document classes review-only;
- no stale-plan apply;
- no autonomous archive deletion;
- branch collisions fail closed;
- final main movement invalidates candidate;
- no direct financial-hotpath dependency;
- no hosted full CI before PR unless required by normal post-PR governance.

## Local validation before PR readiness

Primary Documentary command:

`npm run documentary:maintenance:prepr`

ChatGPT/local preflight projection:

`npm run sandbox:prepr`

The Documentary closure validator validates current code/manifest against the current **18-stage** Quality projection and VC-17 sidecar binding. Historical PR #460 Evidence remains historical and is not rewritten to fabricate current stage numbering.

## Out of scope

- autonomous merge;
- platform release/version bump;
- Render/Supabase/Stripe mutation;
- rewriting historical evidence;
- changing financial domain business logic;
- adding Documentary as a financial runtime stage;
- replacing the existing PR/CI architecture;
- complete enterprise Observability outside the maintenance slice.
