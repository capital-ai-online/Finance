# SA4B Autonomous Roadmap Block Traceability

Status: PLANNED / NOT YET ENABLED  
Date: 2026-08-12  
Canonical stage status: `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md`  
Authority: ADR-0070, ESS-0021 v1.1, ADR-0065

## Purpose

Diese Matrix bildet die SA4B-Anforderungen von Authority über geplante Implementierung und Tests bis zur später erforderlichen Runtime Evidence ab. Sie ist **kein eigener Stage-Statusspeicher**. Der kanonische SA4B-Status bleibt ausschließlich in der Systemadmin Roadmap.

## Requirement matrix

| ID | Requirement | Authority | Planned implementation boundary | Required verification | Required runtime evidence |
|---|---|---|---|---|---|
| SA4B-R01 | Roadmap Block Contract is non-authorizing | ADR-0070 | `.ai/contracts/development-chain-roadmap-block.schema.json` + contract validator | unknown fields/status fields rejected; valid contract accepted | contract digest/ref in execution correlation |
| SA4B-R02 | per-EU path scope | ADR-0070 / ESS-0021 | REM↔block↔unit policy evaluator | cross-unit/wrong-path/self-authority DENY | denied audit event before side effect |
| SA4B-R03 | per-EU capability/risk/mutation class | ESS-0021 | Agent IAM + Roadmap Unit evaluator | capability missing/risk exceeded/wrong class DENY | authorization decision correlation |
| SA4B-R04 | current-main/fresh-branch per EU | DevelopmentChain lifecycle | trusted execution host | stale base DENY; fresh branch PASS | BRANCH auth/outcome + exact base/head |
| SA4B-R05 | no arbitrary untrusted command execution | ADR-0070 | bounded patch/write and test plan runner | Issue/Chat payload cannot inject command/path/tool | negative host test + no side effect |
| SA4B-R06 | permit before every side effect | ADR-0059 / SA3A/SA3B | audited execution wrapper | audit persistence failure DENY before mutation | separate BRANCH/COMMIT/PR/CI_REQUEST authorization/outcome pairs |
| SA4B-R07 | PR is hard autonomous STOP | ADR-0070 | host state machine | attempt next unit before merge STOP | `STOP_PR_CHECKPOINT_REACHED` + PR id/head |
| SA4B-R08 | Human merge only | ADR-0065 / Owner policy | no MERGE capability | agent merge request DENY | Human merge actor + merge SHA |
| SA4B-R09 | branch delete before resume | Branch Lifecycle Policy | post-merge resume preflight | branch still present → STOP | branchDeleted=true / ref absence |
| SA4B-R10 | resume from new current main | ADR-0070 | resume gate | prior merge not ancestor/stale main → STOP | new unit base = then-current main |
| SA4B-R11 | open PR overlap control | DevelopmentChain policy | changed-file inventory preflight | path overlap → STOP | overlap decision evidence |
| SA4B-R12 | kill switch / expiry | ESS-0021 | REM validator | revoked/expired/kill-switch → DENY | deny correlation, no side effect |
| SA4B-R13 | CI budget / one-shot discipline | CI budget policy | CI_REQUEST policy | unchanged valid head no duplicate full run | exact head CI evidence |
| SA4B-R14 | external production mutation remains separate | ADR-0070 / DevelopmentChain policy | repository executor has no implicit production capability | production target request → STOP | `STOP_EXTERNAL_MUTATION_APPROVAL_REQUIRED` |
| SA4B-R15 | two-unit live pilot | Systemadmin Roadmap SA4B-EU3 | trusted host | EU-A and EU-B both pass with Human merge between | two branches, two PRs, two merges, two deletions, correlated audit |

## Planned SA4B PR checkpoints

### SA4B-PR1 — Contract / per-unit policy

Must close R01–R03 and extend self-authority protection to the new trust-root implementation.

### SA4B-PR2 — Bounded code/test execution host

Must close R04–R06, R11–R14 and provide the real repository code/test/config mutation mechanism.

### SA4B-PR3 — Two-unit live pilot closure

Must close R07–R10 and R15 with real Human-Merge boundaries and branch deletion.

## Required negative test suite

At minimum:

1. wrong contract digest → DENY;
2. unknown/extra contract field → DENY;
3. wrong blockId/unitId → DENY;
4. path allowed by REM but not by current EU → DENY;
5. self-authority/trust-root path → DENY;
6. missing capability → DENY;
7. risk above EU/REM ceiling → DENY;
8. stale base → DENY;
9. open PR overlap → STOP;
10. audit persistence failure → DENY before side effect;
11. arbitrary command payload → DENY/no execution;
12. next EU before previous PR merge → STOP;
13. next EU while previous branch exists → STOP;
14. revoked/expired REM → DENY;
15. attempted MERGE → DENY;
16. attempted external Production Mutation → STOP / separate approval required.

## Required positive live pilot evidence

For each of two real units:

- Owner-approved REM containing both unit IDs;
- block contract + digest binding;
- current-main preflight;
- separate branch;
- BRANCH authorization/outcome;
- scoped code/test mutation;
- COMMIT authorization/outcome;
- targeted tests PASS;
- PR authorization/outcome;
- CI_REQUEST authorization/outcome if used;
- review-ready PR;
- autonomous STOP;
- Human review + required CI;
- Human merge SHA;
- branch deletion;
- next-unit resume decision from new main.

## SA4B exit evidence rule

SA4B may be synchronized to `COMPLETE / VERIFIED PASS` in the canonical Systemadmin Roadmap only after all SA4B-R01..R15 requirements have test/evidence references and the two-unit live pilot has completed without external production mutation.
