# SA2 Chat Execution Profile Evidence

Status: PRE-PR / REPOSITORY CI PENDING
Date: 2026-08-12
Baseline: `main@d8ccc3c5e136d51ae36b57b103119b25f4a42b8b`
Authority: ESS-0021, ADR-0065, SA1 REM Validator, M4 Agent IAM

## 1. SA1 prerequisite verification

PR #215 is merged at `d8ccc3c5e136d51ae36b57b103119b25f4a42b8b`.

Authoritative SA1 checks on final PR head `b3aacd0c9ca6dfdfb981c4f563f0c840f93dad2e`:

- CI-Prüfung #909: PASS;
- Governance-Prüfung #634: PASS;
- SA1 repository/control-plane implementation: merged.

A separate Google Marketing protection run #155 failed in the static contract step. During SA2 the same failure reproduced as run #157. The diagnosis identified two concrete CI defects rather than an SA1/SA2 runtime-policy failure:

1. the protected-change workflow watched the over-broad path `src/platform/Security/**`, so unrelated Systemadmin security code triggered the Google Marketing guard;
2. the central CI consolidation had removed the dedicated post-build invocation of `tests/unit/securityResponse.production.test.ts`, even though that test intentionally skips before `dist/index.html` exists.

PR #216 therefore remediates this inherited CI regression instead of suppressing it:

- `ci.yml` restores a dedicated production-CSP delivery test **after** `npm run build`;
- the Owner gate evaluates the body snapshot of the exact `edited` event instead of re-reading a later live PR body, preventing checkbox race/double-build authorization;
- the Google Marketing guard watches exact security dependencies instead of all `src/platform/Security/**` files;
- the guard now also watches `ci.yml` and `package.json`, validates the invariant script wiring, verifies the production test file exists and statically proves `build → production CSP test → predeploy` order.

These changes are not treated as PASS until the final PR #216 head completes the corresponding GitHub checks.

## 2. SA2 objective

Create the ChatGPT execution profile for logical agent:

`capital-ai-systemadmin-roadmap-executor`

The profile must compose with SA1 rather than bypass it and must not create an unaudited live mutation gap before SA3.

## 3. Implemented artifacts

- `src/platform/Security/systemadminExecutionProfile.ts`
- `.ai/contracts/systemadmin-roadmap-execution-profile.json`
- `tests/unit/systemadminExecutionProfile.test.ts`
- `docs/runbooks/SYSTEMADMIN_CHAT_EXECUTION_PROFILE.md`
- this Evidence document
- Systemadmin Roadmap/Traceability synchronization
- CI/Owner-gate race remediation and restoration of protected post-build CSP evidence discovered during SA2 review

## 4. Canonical authorization chain

`OWNER_APPROVED REM → SA2 CHAT PROFILE → SA1 REM VALIDATOR → M4 AGENT IAM → ACTION ENVELOPE`

The profile uses the exact ChatGPT app/client id only as an execution-surface constraint. It is not an authority source.

## 5. Capability boundary

Allowed for SA2 policy evaluation:

- READ
- ANALYZE
- PLAN
- BRANCH
- COMMIT
- PR
- CI_REQUEST

Hard excluded:

- MERGE
- DEPLOY_REQUEST
- PRODUCTION_MUTATION

SA1 also continues to deny CRITICAL execution, reserved Human/Owner mutation classes, invalid targets/paths, invalid/expired REMs, out-of-scope actions, CI-budget violations and concurrent-writer conflicts.

## 6. Dry-run / live boundary

### DRY_RUN

The complete initial repository capability sequence may be policy-evaluated and represented as an immutable action envelope.

Mutating envelopes are explicitly marked:

`liveMutationPermitted = false`

### LIVE

Before SA3:

- non-mutating READ/ANALYZE may be allowed when the exact REM allows them;
- BRANCH/COMMIT/PR/CI_REQUEST are fail-closed denied.

This prevents unaudited standing mutation authority from existing between SA2 and SA3.

## 7. Sequence checks

The profile adds execution-order checks above SA1:

| Action | Required SA2 state |
|---|---|
| PLAN | current main + Roadmap resolved |
| BRANCH | full security/Roadmap/overlap/check-class/test/rollback preflight |
| COMMIT | fresh `agent/*` branch + targeted validation PASS |
| PR | branch + implementation complete + validation PASS + current head SHA + no existing work-package PR |
| CI_REQUEST | open PR + PR number + current head SHA + validation PASS |

Mutating actions are denied after final Human/Owner review has started.

## 8. Fail-closed stop conditions

Tests cover denial on:

- wrong agent;
- wrong ChatGPT app/client id;
- SA1 not VERIFIED PASS;
- incomplete preflight;
- missing/fake branch state;
- missing targeted validation;
- incomplete implementation before PR;
- missing current head;
- duplicate/open PR state mismatch;
- credential exposure signal;
- untrusted prompt/tool scope-elevation signal;
- unexpected production mutation requirement;
- final Owner review already started;
- MERGE, DEPLOY_REQUEST, PRODUCTION_MUTATION;
- SA1 target/path scope mismatch;
- SA1 CI budget denial.

## 9. Positive path evidence

A valid Owner-approved REM with exact:

- Owner;
- Systemadmin agent;
- Finance repository/main;
- Roadmap item;
- allowed capability;
- target;
- repository paths;
- HIGH-or-lower risk;
- repository mutation class;
- validity window;
- kill switch;
- approval evidence

can produce a DRY_RUN PR action envelope after all SA2 checkpoints pass.

The envelope is frozen, secret-free by contract and records `requiresHumanMerge = true`.

## 10. Credential and data handling

The model-facing action envelope contains no token/password/secret/reusable-credential field. Credentials remain with the connector/tool host.

If credential exposure is detected, the profile returns DENY before a mutating action may be prepared.

## 11. Tool-host enforcement boundary

This repository code is the canonical policy/profile contract, but it cannot by itself intercept arbitrary external ChatGPT connector calls. SA2 therefore does not claim end-to-end connector enforcement.

SA3 must connect the prepared action path to the existing M5 append-only audit mechanism and prove correlation before LIVE mutation can be enabled.

## 12. External mutations

| Domain | SA2 state |
|---|---|
| Repository code | IMPLEMENTED ON BRANCH |
| Chat execution profile | IMPLEMENTED / CI PENDING |
| GitHub workflow hardening | IMPLEMENTED / CURRENT-HEAD CI PENDING |
| Supabase | NOT REQUIRED |
| Stripe | NOT REQUIRED |
| Render | NOT REQUIRED |
| Deployment | NOT REQUIRED |
| Production mutation | PROHIBITED |
| Merge | HUMAN/OWNER ONLY |

## 13. Exit gate

SA2 becomes VERIFIED PASS only after:

1. current-head Human/Owner review;
2. required repository CI PASS for final reviewed head;
3. Google Marketing guard PASS when its protected paths are part of the final diff;
4. the dedicated post-build production CSP delivery test PASS;
5. Human merge to `main`;
6. SA2 branch deletion;
7. mutating LIVE mode remains disabled;
8. SA3 append-only audit correlation becomes the next active stage.
