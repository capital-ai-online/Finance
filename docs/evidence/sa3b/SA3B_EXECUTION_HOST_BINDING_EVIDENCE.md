# SA3B Execution Host Binding Evidence

Status: POST-MERGE HOST ACTIVE / FAIL-CLOSED PROBE PASS / POSITIVE PROBE BLOCKED
Date: 2026-08-12
Baseline: `main@156142102e7d2a97ad466aee0340f758fa4365e5` (PR #220 merge)
Authority: ADR-0059, ADR-0065, ADR-0067, ESS-0021

## Verified implementation prerequisite

SA3A is complete through PR #218:

- final head `4178f76c1c33b50b957cd073d83ed9eeb0493642`;
- merge `8de5a538ae9d2f0afc7b2e505ddda427ceb77780`;
- CI #926 PASS;
- Governance #647 PASS;
- branch deleted.

SA3B implementation is merged through PR #220:

- final reviewed head `c4c7d00b33e521dfd12b14ddfdc097288a80f385`;
- merge `156142102e7d2a97ad466aee0340f758fa4365e5`;
- CI #936 PASS;
- Governance #653 PASS;
- implementation branch deleted.

## Selected enforcement architecture

`Owner issue → GitHub Actions → GitHub OIDC → CAPITAL-AI audit broker → SA3A permit → exact GitHub action → SA3A outcome`

The initial real action remains deliberately limited to `BRANCH`.

Repository TypeScript cannot intercept ordinary direct ChatGPT GitHub connector writes. Direct connector writes therefore remain outside the autonomous Systemadmin mutation path.

## Production deployment evidence

Render service `Finance` (`srv-d91o1o9o3t8c73edi55g`) has `autoDeploy=no`.

After PR #220 merge, exactly one manual deployment was started without cache clear:

- deploy `dep-d9u19jjm8hqs73e95la0`;
- commit `156142102e7d2a97ad466aee0340f758fa4365e5`;
- finished `2026-08-12T06:39:05.889475Z`;
- status `live`;
- production telemetry reports the same commit SHA.

No Render environment/configuration value was changed by this deployment.

## Real post-merge probe #1

Owner Issue **#221**:

`[SA3B-PROBE] Permit-before-side-effect Verifikation`

Request bound to:

- mode `BRANCH_PROBE`;
- mandate `REM-SA3B-PROBE-001`;
- roadmap item `SA3B-HOST-PROBE`;
- base SHA `156142102e7d2a97ad466aee0340f758fa4365e5`;
- requested branch `agent/sa3b-host-probe-20260812a`.

GitHub Actions:

- workflow run `31570833507`;
- trusted `main` checkout: PASS;
- Node 24.18.0 setup: PASS;
- strict Issue request validation: PASS;
- current-main + trusted REM binding: PASS;
- GitHub OIDC acquisition: PASS;
- broker authorization: **HTTP 503 / FAIL-CLOSED**;
- branch creation: **SKIPPED**;
- terminal outcome: skipped because no authorization permit existed.

A repository branch lookup after the run confirms that `agent/sa3b-host-probe-20260812a` does not exist.

Therefore the real negative invariant is proven:

`NO DURABLE AUDIT PERMIT → NO GITHUB BRANCH SIDE EFFECT`

This is a **fail-closed security PASS**, not a positive SA3B completion PASS.

## Root cause 1 — production privileged Supabase credential

Render broker telemetry for workflow run `31570833507` records:

`[AgentAudit][SECURITY] durable audit persistence failed: Unregistered API key`

The same production service currently emits `Unregistered API key` for other privileged Supabase operations including Outbox, ScoreValidation and Alerts.

Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`) itself is `ACTIVE_HEALTHY` and its canonical project URL is `https://ryzywoktpmyhwzxmstyu.supabase.co`.

`server/db.ts` intentionally resolves privileged credentials as:

`SUPABASE_SECRET_KEY → SUPABASE_SERVICE_ROLE_KEY`

No secret value is stored in this evidence. Credential repair/rotation remains an Owner-controlled production-secret operation and is not performed by the repository remediation PR.

## Root cause 2 — M5 writer/schema contract drift

Read-only production schema verification exposed an independent application defect that had been hidden by mocked unit tests.

Canonical migration:

`supabase/migrations/20260811230540_m5_agent_audit_events.sql`

Canonical production columns include:

- `human_actor_id`;
- `intent`;
- `scope`;
- `authorization_decision`;
- `approval_reference`;
- `step_up_reference`;
- `tool_name`;
- `branch` / `commit_sha`;
- `pull_request_number`;
- `ci_run_id`;
- `attributes`.

The pre-remediation writer used application-only aliases including `actor_id`, `decision`, `approval_id`, `tool_id`, `pr_number`, `workflow_run_id` and `metadata` and omitted required `intent`/`scope`.

This means a valid privileged key alone would not be sufficient for a positive SA3B audit insert.

## Corrective repository remediation

Branch:

`fix/sa3b-m5-audit-schema-contract`

The remediation changes application code/tests only. **No Supabase schema mutation is required or authorized.**

Controls:

1. `agentAuditWriter.ts` maps exactly to the existing production migration vocabulary.
2. `intent` and `scope` become explicit application audit inputs.
3. generic and Systemadmin audited execution provide structured intent/scope.
4. external identities such as GitHub login `SvenKulessa` are never fabricated into UUID columns:
   - valid UUID → corresponding DB UUID field;
   - non-UUID → DB UUID field `NULL` + sanitized external identifier in `attributes`.
5. invalid/non-UUID approval/step-up references follow the same non-coercion rule.
6. `agentAudit.test.ts` asserts canonical runtime row keys and absence of legacy DB aliases.
7. `agentAuditSchemaContract.test.ts` ties the application row mapping directly to the canonical M5 migration so future drift fails CI.

The final review branch is squashed to one commit over the PR #220 merge baseline before the remediation PR is opened.

## Existing production audit authority

The production table is RLS-enabled, append-only and contains the original M5 verification row. The table itself is preserved; no destructive rollback or schema replacement is part of this remediation.

## Remaining SA3B exit gate

SA3B remains **IN PROGRESS** until all of the following are true:

1. writer/schema remediation PR passes final CI and Human merge;
2. remediation branch is deleted;
3. corrected `main` is deployed;
4. Owner restores a valid privileged Supabase server credential in Render without exposing it in repository/evidence;
5. privileged persistence health is verified;
6. a fresh Owner `BRANCH_PROBE` receives durable authorization evidence before branch creation;
7. exact branch is created from the current `main` SHA;
8. terminal `SUCCESS` outcome reference is durably recorded;
9. probe branch is deleted;
10. a deliberately invalid/stale/no-permit probe again proves zero side effect;
11. roadmap/traceability/evidence are synchronized.

## Current conclusion

**The real SA3B host exists and its fail-closed boundary has been proven in production. The positive permit-before-side-effect chain is blocked by a production privileged-key failure plus the discovered application writer/schema drift. SA4 remains blocked.**
