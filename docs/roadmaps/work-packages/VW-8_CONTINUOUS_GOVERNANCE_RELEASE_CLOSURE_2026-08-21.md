# VW-8 — Continuous Governance & Release Closure

**Status:** IMPLEMENTED ON BRANCH / PENDING HUMAN MERGE  
**Authority:** `ESS-0017` / `ESS-0017-CONTRACTS` / `ADR-0078`  
**Check class:** Application/Test/Configuration (C)

## Scope

- integrate Vocabulary governance into the existing test/quality value chain;
- add deterministic closure validation for VW-0 through VW-8;
- synchronize ESS Registry metadata without creating a second registry;
- preserve 18-stage FinTech projection and non-authorizing flags;
- keep Wiki publication external and explicitly gated;
- preserve Human-only merge and existing repository CI governance.

## Implementation

### Commands

- `npm run vocabulary:wording:test`
- `npm run vocabulary:wording:check`
- `npm run vocabulary:wiki:check`
- `npm run vocabulary:migration:check`
- `npm run vocabulary:governance:check`
- `npm run vocabulary:governance:prepr`

`test:raw` includes the read-only `vocabulary:governance:check`, so normal repository validation detects catalog, Wiki and migration drift.

### Closure validator

`scripts/automation/validateVocabularyGovernanceClosure.ts` verifies:

- Vocabulary manifest version and VW-0…VW-8 completion metadata;
- 18-stage FinTech coverage;
- `financialDecisionAuthority=false` and `mutationAuthority=false`;
- ESS-0017 / ESS-0017-CONTRACTS registry version and ADR-0078 reference;
- required architecture/work-package artifacts;
- zero `DRIFT` in the controlled wording migration plan;
- explicit Wiki `--apply` and separate `--push` gates.

## Cost governance

No GitHub-hosted build/test workflow is manually triggered before PR creation. Local/cheap checks are exposed as repository scripts; hosted CI is allowed only after the PR exists according to project governance.

## Rollback

Repository-only change set. Rollback is `git revert` of the PR merge. No Supabase, Render, Stripe, IAM, Wiki or production data mutation is performed by this branch.

## Acceptance

- [x] ESS Registry synchronized in-place
- [x] no new dependency introduced
- [x] no new CI workflow introduced
- [x] governance check attached to existing test chain
- [x] deterministic closure validator implemented
- [x] external Wiki mutation remains gated and unexecuted
- [x] Human merge boundary preserved
- [ ] final current-main synchronization immediately before PR
- [ ] PR created
- [ ] post-PR hosted checks evaluated
