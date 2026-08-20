# Documentary Maintenance — Main Sync Evidence

**Evidence status:** CLOSED FOR CURRENT BRANCH STATE  
**Checked:** 2026-08-20  
**Feature branch:** `agent/documentary-maintenance-control-loop-main-sync`  
**Current main / claim base:** `a8d384154ff2eb1bfe74108eb4a4119cbab2a040`  
**Previous maintenance merge-base:** `73d27b7a586722d968a972b07a8e73a10f777782`  
**Authority:** ADR-0097, ADR-0096, ESS-0002, ESS-0003, ESS-0010, ESS-0019

## Synchronization result

The stale maintenance branch had diverged substantially from `main`. Instead of force-rewriting it, a replacement branch was created directly from the exact current `main` commit `a8d384154ff2eb1bfe74108eb4a4119cbab2a040` and the bounded Documentary scope was transplanted onto that base.

The synchronized branch therefore has current `main` as its ancestry/merge-base. `main` itself was not mutated.

## Correlation of changes merged to main

The main-side changes between the previous Documentary merge-base and the synchronized base were reviewed for file, contract, architecture, dependency, API, security, authorization, compliance, governance and documentation impact.

Material correlations:

- Quality Center evolved from the earlier repository-quality baseline into the current read-only Chapter-12 execution/orchestration model.
- Documentary continues to own Documentation Hygiene and maintenance semantics; Quality consumes that evidence without becoming a second Documentary or Governance authority.
- `repository:quality:check` remains the repository-native read-only quality gate and is reused by `documentary:maintenance:prepr`.
- Current Agent IAM remains deny-by-default and retains the provider-neutral `AGENT_CAPABILITIES`, `AgentAuthorizationRequest` and `evaluateAgentPolicy` interfaces consumed by the Documentary orchestrator.
- The direct scope overlap requiring semantic resolution was `package.json`; the synchronized branch preserves the complete current-main build/test/quality script model and adds only the four Documentary maintenance commands.
- No new dependency, provider SDK, secondary EventMesh, secondary version authority or secondary Quality/Governance policy engine was introduced.

## Integrity closure

- Work Claim `DOCUMENTARY-MAINTENANCE-CONTROL-LOOP-2026-08-20` is bound to `a8d384154ff2eb1bfe74108eb4a4119cbab2a040`.
- The Claim is required to match `git diff --name-only origin/main...HEAD` exactly.
- Closure validation requires the merge-base to equal the current `origin/main` SHA.
- Closure validation requires this Evidence document to contain the same current-main SHA and synchronized branch identity.
- Documentation Hygiene, Governance Control Plane and `repository:quality:check` remain explicit pre-PR gates.
- No hosted GitHub CI was started for this synchronization.
- Merge remains Human/Owner-only.

If `main` advances after this evidence is generated, this evidence becomes stale by definition and the closure validator must fail until synchronization, Claim and Evidence are regenerated against the new `main`.
