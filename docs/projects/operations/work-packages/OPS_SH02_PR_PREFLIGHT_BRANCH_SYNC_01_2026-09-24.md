# OPS-SH02-PR-PREFLIGHT-BRANCH-SYNC-01

**Project:** CAPITAL-AI-OPS  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-08, PVC-18  
**Parent:** OPS-08-B-SH-02  
**Baseline:** main@6bfc2af36b9fc6804709582dd9d9f60eee5ae136  
**State:** IMPLEMENTED_ON_BRANCH

## Observed failure

After PR #1386 fixed the provider auto-merge permission boundary, the mandatory
post-merge reconciliation exposed the next deterministic cascade failure on PR
#1381.

The main-push reconciler run `35959396070`, job `107504542284`, correctly
targeted PR #1381. Its head `5188995dd66c07e241634fa6fc4bab47ab811323`
was behind the new `CURRENT_MAIN` `0f0d819a31463716b4a3246ecd318a5221577a43`. The workflow imported current
main, but then invoked `productionPreflight.mjs` before its existing
post-reconcile branch-sync delegation was reachable. The preflight correctly
failed closed:

`PR head ... does not contain current main ... Rebase/recreate the branch from current main before creating or refreshing the PR baseline.`

Therefore the architecture had the correct branch-sync capability but the
generation ordering made it unreachable for this failure class.

## Fix

The existing leading PR Decision Evidence Reconciler now evaluates
`git merge-base --is-ancestor CURRENT_MAIN HEAD` immediately after importing
trusted current main.

If the head is stale:

1. the existing `sync-agent-pr-branches.yml` workflow is dispatched for the
   exact PR number;
2. scope classification, production preflight, body rendering and Decision
   reconciliation are skipped for that stale generation;
3. branch sync creates the next head generation, whose normal checks feed back
   into the same leading reconciliation chain.

If the head already contains current main, the existing path remains unchanged.

## Safety invariants

- `productionPreflight.mjs` remains fail-closed and is not weakened;
- no stale generation may write PR Decision/Evidence;
- no second branch-sync or PR-body writer is introduced;
- the existing dynamic post-reconcile branch-sync remains for drift discovered
  after the bootstrap lineage snapshot;
- Human/CODEOWNER merge authority remains unchanged.

## Exit evidence

- regression test proves lineage gate ordering before production preflight;
- exact stale generation delegates only to the canonical branch-sync;
- fresh generations retain ordinary Governance/CI/Security evaluation;
- PR #1381 converges after this fix is merged and its fresh branch generation
  completes.
