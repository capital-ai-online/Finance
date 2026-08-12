# SA3B Execution Host Binding Evidence

Status: IMPLEMENTED / FINAL PR CI + POST-MERGE E2E PROBE PENDING
Date: 2026-08-12
Baseline: `main@8de5a538ae9d2f0afc7b2e505ddda427ceb77780`
Authority: ADR-0059, ADR-0065, ADR-0067, ESS-0021

## Prerequisite verification

SA3A is complete through PR #218:

- final head `4178f76c1c33b50b957cd073d83ed9eeb0493642`;
- merge commit `8de5a538ae9d2f0afc7b2e505ddda427ceb77780`;
- CI #926: PASS;
- Governance #647: PASS;
- former SA3A branch deleted.

Therefore SA3B is the active Systemadmin stage.

## Diagnosis

The repository-side SA3A adapter cannot intercept direct external ChatGPT GitHub connector mutations. Treating direct connector writes as audited solely because repository policy exists would be a false enforcement claim.

SA3B therefore introduces an actual side-effect host rather than relying on advisory client behavior.

## Selected enforcement architecture

`Owner issue → GitHub Actions → GitHub OIDC → CAPITAL-AI audit broker → SA3A permit → exact GitHub action → SA3A outcome`

The initial real action is deliberately limited to `BRANCH`.

## Implemented artifacts

- `docs/adr/ADR-0067-systemadmin-github-actions-execution-host.md`;
- `.github/workflows/systemadmin-roadmap-executor.yml`;
- `.ai/mandates/REM-SA3B-PROBE-001.json`;
- `server/systemadmin/githubActionsOidc.ts`;
- `server/systemadmin/systemadminExecutionBrokerRouter.ts`;
- `scripts/systemadmin/validateExecutionIssue.mjs`;
- `tests/unit/githubActionsOidc.test.ts`;
- `tests/unit/systemadminExecutionIssue.test.ts`;
- `tests/unit/systemadminExecutionHostWorkflow.test.ts`;
- route composition contract update;
- SA3 control-plane self-protection extension;
- machine-readable Systemadmin audit contract v1.1.0;
- Roadmap/traceability/runbook updates.

## No external configuration mutation in this PR

| Platform | Mutation |
|---|---|
| Supabase schema/config | NOT REQUIRED |
| Stripe | NOT REQUIRED |
| Render settings/env | NOT REQUIRED |
| DNS/IONOS | NOT REQUIRED |
| GitHub repository files | REQUIRED / PR only |
| Production data | NOT REQUIRED |

The broker reuses the already production-verified M5 audit writer. GitHub-to-CAPITAL-AI authentication uses GitHub Actions OIDC and introduces no reusable shared secret.

## OIDC security evidence

Implementation requires:

- GitHub OIDC issuer;
- exact audience `capital-ai-systemadmin-execution`;
- Finance repository name + immutable repository ID;
- Owner actor and IDs;
- `issues` event;
- `refs/heads/main`;
- exact SA3B workflow ref;
- RS256 JWT signature verified using GitHub JWKS;
- valid token time window.

Unit negative matrix includes wrong audience, actor, actor ID, repository ID, owner ID, event, ref, workflow, expiry, signature and subject.

## Ingress security evidence

Issue payload is untrusted.

Only six fields are accepted, and the mode is hard-limited to `BRANCH_PROBE`. Unknown fields and command-like branch names are denied. The workflow imports the real REM from trusted `main` rather than accepting it from the Issue.

## Permit-before-side-effect evidence

Static workflow contract proves ordering in trusted workflow source:

`broker /authorize → validate audit-bound BRANCH permit → gh api branch create → broker /outcome`

The workflow contains only one branch-create POST and no `git push` or `gh pr create`.

Runtime proof is still pending because the workflow and broker must first be Human-reviewed, merged and available on `main`.

## Rollback evidence

If branch creation fails, an `ERROR` outcome is persisted.

If branch creation succeeds but terminal audit persistence fails, the workflow deletes the probe branch immediately and then fails.

After a successful acceptance probe, the probe branch is deleted after evidence capture according to the Finance branch lifecycle.

## Test plan

Final repository CI must prove:

1. TypeScript build of OIDC verifier/broker and route composition;
2. valid signed GitHub OIDC token accepted;
3. invalid claims/signature denied;
4. exact probe Issue accepted;
5. expanded/malformed/shell-like Issue denied;
6. workflow actions are immutable-SHA pinned;
7. workflow explicit permissions pass repository security policy;
8. durable authorization appears before branch side-effect in workflow contract;
9. no PR/deploy/merge capability is exposed by the probe host;
10. existing SA3 tests remain PASS.

## Post-merge acceptance still required

This document must not be upgraded to `VERIFIED PASS` from CI alone.

Required live evidence after merge/deployment:

- execution broker responds only to exact GitHub Actions OIDC identity;
- one valid Owner probe receives authorization audit reference before branch creation;
- created branch equals requested current `main` SHA;
- terminal SUCCESS outcome reference exists;
- a deliberately invalid/stale request produces no branch;
- successful probe branch is deleted;
- probe issues/workflow run IDs/audit references are recorded here without secrets.

## Current conclusion

**SA3B implementation is ready for final repository validation, but execution-host binding is not yet VERIFIED PASS. SA4 remains blocked.**
