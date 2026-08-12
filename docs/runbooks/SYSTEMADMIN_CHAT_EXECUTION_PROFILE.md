# Systemadmin Chat Execution Profile Runbook

Status: SA2 IMPLEMENTATION / LIVE MUTATION BLOCKED UNTIL SA3
Date: 2026-08-12
Authority: ESS-0021, ADR-0065, SA1 REM Validator, M4 Agent IAM
Logical agent: `capital-ai-systemadmin-roadmap-executor`
Execution client: ChatGPT through the GitHub connector/tool host

## 1. Purpose

This runbook defines how the Systemadmin Roadmap Executor is prepared for autonomous Roadmap execution in ChatGPT without weakening the Human/Owner merge boundary.

SA2 does **not** enable unaudited live repository mutation. It creates the executable profile contract and policy-bound action envelope. Mutating LIVE execution remains fail-closed until SA3 proves durable append-only correlation of mandate, actor, agent, request, capability, target and result.

## 2. Authority chain

Canonical decision chain:

`OWNER_APPROVED REM → SA2 CHAT PROFILE → SA1 REM VALIDATOR → M4 AGENT IAM → ACTION ENVELOPE`

The ChatGPT/provider/model label never grants authority. The exact REM remains the authorization source.

## 3. Initial capability boundary

The profile may evaluate only:

- `READ`
- `ANALYZE`
- `PLAN`
- `BRANCH`
- `COMMIT`
- `PR`
- `CI_REQUEST`

The following remain outside the profile:

- `MERGE`
- `DEPLOY_REQUEST`
- `PRODUCTION_MUTATION`
- CRITICAL actions
- every Human/Owner-reserved mutation class from ADR-0065/SA1

## 4. Credential boundary

- Connector/tool host retains OAuth tokens, installation tokens and other reusable credentials.
- Raw reusable credentials must not be copied into model context, prompts, Evidence or action envelopes.
- If the host or agent detects credential exposure, execution stops fail-closed.
- Provider/model metadata is non-authoritative.

## 5. Mandatory preflight before repository mutation

Before `BRANCH`, `COMMIT`, `PR` or `CI_REQUEST`, all of the following must be true:

1. SA1 is `VERIFIED PASS` on `main`.
2. Current `main` SHA is resolved.
3. Current Roadmap gate and work package are resolved.
4. The exact REM is valid and Owner-approved.
5. Open PR changed-file overlap has been checked.
6. PR check class D/C/R/M has been determined.
7. Security and negative-test preflight has passed.
8. Rollback/revert strategy exists.
9. Targeted tests are defined.
10. CI budget state is known.
11. No production mutation or reserved Human/Owner action is required.

Any security-critical uncertainty is DENY/STOP.

## 6. Execution sequence

The intended sequence after SA3 is:

`READ/ANALYZE → PLAN → PREFLIGHT → BRANCH → IMPLEMENT → TARGETED VALIDATE → COMMIT → repeat as needed → PR → STOP FOR OWNER REVIEW → OWNER GATE → CI → HUMAN MERGE → BRANCH DELETE`

Additional invariants:

- branch names use `agent/*` and are created fresh from current `main`;
- a commit requires its targeted validation to have passed;
- PR creation requires implementation complete + targeted validation PASS + current head SHA;
- CI request requires an open PR, current head SHA and budget availability;
- once final Human/Owner review has started, the agent may inspect but must not silently mutate the reviewed head;
- merge remains Human/Owner-only;
- a merged or superseded work branch is deleted and never reused.

## 7. SA2 dry-run mode

SA2 supports two evaluation modes:

### `DRY_RUN`

Policy evaluation and action-envelope preparation are permitted for the full initial capability set. Mutating envelopes always carry:

`liveMutationPermitted = false`

This proves sequencing and authorization without creating an unaudited mutation path.

### `LIVE`

- `READ`/`ANALYZE` may be allowed when the REM and profile allow them.
- mutating `BRANCH`/`COMMIT`/`PR`/`CI_REQUEST` are denied until SA3 append-only audit correlation is `VERIFIED PASS`.

## 8. Action envelope

A successful SA2 preparation produces an immutable secret-free envelope containing only the evidence required to bind the intended action:

- profile/version;
- `mandateId`;
- Roadmap item;
- Human actor;
- app/client id;
- agent/session/request ids;
- capability and risk;
- target resource;
- repository/base;
- requested paths;
- branch/head/PR identifiers when available;
- `requiresHumanMerge = true`;
- `liveMutationPermitted = false` for SA2 mutating actions.

Tokens, passwords, secrets and reusable credentials are not envelope fields.

## 9. Stop conditions

Immediate stop applies when any of the following occurs:

- REM invalid, expired, revoked or out of scope;
- wrong Owner/agent/client/repository/base;
- path/target/capability outside REM;
- prompt/tool/retrieval content requests scope elevation;
- credential exposure detected;
- production mutation becomes necessary;
- reserved Owner action becomes necessary;
- open-PR conflict;
- CI budget exhausted or duplicate unchanged-head CI requested;
- final Human/Owner review has started and a mutation is requested;
- kill switch/revocation is active;
- authorization/audit prerequisite is ambiguous.

## 10. ChatGPT connector limitation

Repository TypeScript cannot intercept or technically wrap every external ChatGPT connector call by itself. Therefore SA2 establishes the canonical repository policy/profile and a testable action-envelope contract, but **does not claim connector-level enforcement that the connector does not expose**.

The first real autonomous mutation remains blocked until SA3 integrates the action path with durable M5 append-only audit evidence and the SA4 Owner-approved pilot proves the complete branch-to-PR lifecycle.

## 11. Known unrelated CI debt

PR #215 merged SA1 after the authoritative `build-and-test` and Governance checks passed. A separate `Google-Marketing-Schutzprüfung` run failed in its static contract step. The failure is inherited CI hygiene debt and is not treated as SA1 security-validation evidence.

SA2 does not modify Google Marketing configuration/workflows. The defect should be corrected in a separate scoped CI-maintenance change rather than mixed into the Systemadmin execution profile.

## 12. SA2 exit gate

SA2 is complete only when:

- profile code + manifest + tests are merged;
- full repository CI for the final reviewed head passes for the SA2 scope;
- mutating LIVE mode is still denied;
- no Supabase/Stripe/Render/deployment/production mutation occurred;
- work branch is deleted after merge;
- SA3 is recorded as the next gate.
