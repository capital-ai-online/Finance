# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-12
Baseline branch: `main`
Baseline commit: `e39d5370d8b1498e84952535a38a339cc200082f` (PR #210 merge)
Platform version: `0.6.0`
Canonical role: current-state DevelopmentChain status index. Historical detail remains in ADR/evidence documents.

## Mandatory maintenance rule
Every merged DevelopmentChain step MUST update this file with the new `main` SHA, affected phase status, mutation/test state, next gate and evidence pointer. A roadmap-changing PR is incomplete without this synchronization.

## Human / Owner gate before expensive CI
Every PR targeting `main` MUST be human-visible and explicitly reviewed by repository Owner `SvenKulessa` before expensive build/test validation starts.

Binding sequence:

`PR OPEN/UPDATE → OWNER FILE REVIEW → ALL FILES VIEWED → CURRENT-HEAD REVIEW (💪/okay) → OWNER CHECKBOXES LAST → ONE build-and-test → MERGE ELIGIBLE`

Rules:
- every changed file must be reviewed under `Files changed` and marked `Viewed`;
- Owner review must target the exact current PR head and contain `💪` or `okay`;
- after that review, the PR body must attest both complete diff review and all files viewed by setting/saving the two Owner checkboxes as the final trigger;
- any new commit invalidates the previous current-head review;
- the review itself does not start expensive CI;
- the final PR-body edit after review is the single normal `pull_request: edited` trigger for `build-and-test`;
- normal operation is exactly one `build-and-test` run per PR head;
- documentation-only changes use the fast path inside the same `build-and-test` job;
- code changes run only the required npm/audit/TypeScript/unit/build checks;
- Docker/runtime checks run only for Docker/runtime/deployment-relevant scope;
- lightweight governance/security checks may run earlier;
- successful CI is not merge authorization;
- AI clients stop before merge unless a separate explicit human merge instruction exists.

Authority: `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`.

## Roadmap package before privileged autonomous agents
Privileged agent capability is allowed only after a Roadmap architecture package derived from:
1. Deep Research/current best-practice comparison where relevant;
2. read-only current-repository and production-evidence inspection;
3. gap analysis;
4. required ESS creation/update;
5. required ADR creation/update;
6. traceability, mutation/test gates, rollback and kill-switch definition;
7. Human/Owner approval.

Without that package, an agent receives no `BRANCH`, `COMMIT`, `PR`, `CI_REQUEST`, `DEPLOY_REQUEST` or `PRODUCTION_MUTATION` capability. `MERGE` remains outside the autonomous agent capability vocabulary.

Authority: `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md`.

## Daily-task read-only agent exception
Recurring/daily tasks may instantiate agents without prior Owner approval only when capabilities are limited to `READ` and `ANALYZE` and the agent has no repository/platform write credentials, no PR creation, no CI request, no deploy, no mutation and no merge capability. Any elevation exits this exception and requires the full Roadmap/ESS/ADR/Human-Approval sequence.

## Mandatory mutation and verification gate
Any state change in GitHub, Supabase, Stripe, Render or another production-connected platform follows:

`ROADMAP/ADR → HUMAN APPROVAL → PRE-MUTATION TEST → MUTATION → POST-MUTATION VERIFICATION → EVIDENCE → ROADMAP UPDATE → NEXT PHASE`

The next phase remains blocked until every required mutation/test is documented as `VERIFIED PASS`. Failed/inconclusive verification requires STOP/ROLLBACK or a newly approved remediation step.

## Platform mutation schedule
| Platform | Roadmap point | Allowed scope | Gate before next phase |
|---|---|---|---|
| Supabase | M5 Observability/Telemetry/Audit | approved audit/telemetry persistence and policy-bound evidence | **COMPLETE / VERIFIED PASS** |
| Supabase Auth | M5A MFA/TOTP Hardening | TOTP enrollment/challenge/verify, AAL2 enforcement for privileged flows, recovery/backup-factor handling; no unrelated auth mutation | repo/config baseline → Owner approval → TOTP/AAL2 mutation/configuration where required → positive/negative auth tests → evidence |
| Stripe | M7 only when explicitly named by dedicated ADR/runbook | specific billing/webhook/credential mutation only; no generic authorization | test-mode/non-destructive checks where possible → mutation → webhook/idempotency/mapping verification → rollback/revocation evidence |
| Render | M7 Deployment Identity | protected deployment identity, environment-scoped credentials/hooks, rotation/revocation | preflight → mutation → controlled deploy → health/readiness → rollback evidence |

### Supabase Auth plan constraint
- TOTP MFA is available on all Supabase projects and is the preferred M5A remediation path.
- Leaked Password Protection is available only on Supabase Pro and above and is therefore **DEFERRED / PLAN-DEPENDENT**, not an active blocker on the current plan.
- M5A must not claim Leaked Password Protection as remediated until the project plan supports it and a separate Owner-approved mutation is performed.

## Current status quo
- PR #192 established the provider-neutral AI-Agent architecture and Documentation Freeze basis.
- PR #194 closed M2G.
- PR #195/#196 completed M3 CI Hardening and docs-fast-path proof.
- PR #197 established the Human/Owner review gate.
- PR #198/#202 completed and consolidated M4 Agent IAM.
- PR #203 moved expensive CI behind the Owner gate and appended M10 WebAuthn/passkey assurance.
- PR #204 consolidated CI to one `build-and-test` job and established PR check classes.
- PR #206 approved the M5 persistence design and classified the Supabase mutation as REQUIRED.
- PR #207 merged the verified M5 Supabase mutation evidence and repository synchronization.
- PR #208 merged the M5A TOTP/AAL2 roadmap gate and the single robust PR-body CI trigger.
- PR #210 merged the M5 application audit integration at `e39d5370d8b1498e84952535a38a339cc200082f`.
- PR #210 final head `ffeab08c218314edd5292fbaf5ccb77413cee80e` passed required CI run #892 (`31559124198`).
- Final M5 checks PASS: Human-/Owner gate, repository integrity, dependency audit, TypeScript, unit tests, production build/predeploy, Docker hardening and production image verification.
- Production Supabase migrations `20260811230540_m5_agent_audit_events` and `20260811230743_m5_agent_audit_events_least_privilege` remain applied and verified.
- `public.agent_audit_events` is RLS-enabled, append-only and deny-by-default for `anon`/`authenticated`; `service_role` has only `SELECT` + `INSERT`.
- Synthetic redacted audit event write/read passed; UPDATE and DELETE negative tests fail closed.
- M5 application integration uses the server-side audited PolicyGate adapter, validated redaction/omission and append-only authorization/outcome correlation.
- M5 application substep required **NO NEW SUPABASE MUTATION**.
- M5 is **COMPLETE / VERIFIED PASS** subject only to merging this post-merge documentation synchronization.
- M5A Supabase Auth MFA/TOTP hardening is the next phase; its first step is read-only baseline only.
- Leaked Password Protection remains plan-dependent (Pro+) and is not a blocker for M5A TOTP completion.
- CoinMarketCap remains removed/deactivated.
- Kraken remains public REST evidence only.

## DevelopmentChain M0–M10
| Phase | Status | Authority | Mutation / test gate | Next gate |
|---|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | read-only baseline | preserve |
| M1 Git Guardrails | COMPLETE | GitHub protection + Owner policy | policy validation | preserve |
| M2 Architecture/Documentation | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | synchronized |
| M2G Documentation Freeze | COMPLETE | PR #192/#194 | freeze verification | sequential implementation |
| M3 CI Hardening | COMPLETE | ADR-0053/0060 + PR #195/#196/#204/#208 | one `build-and-test`, review → checkbox final trigger, risk-based fast/full path | preserve single-trigger behavior |
| M4 Agent IAM | COMPLETE | ADR-0050/0051/0058 + ESS-0018/0019 + PR #198/#202 | negative IAM tests + Owner gate; no live external mutation | preserve |
| M5 Observability/Telemetry/Audit | **COMPLETE — VERIFIED PASS** | ADR-0056/0059 + PR #206/#207/#210 + M5 evidence | persistence `VERIFIED PASS`; app integration `VERIFIED PASS`; app mutation `NOT REQUIRED` | merge post-merge sync, then start M5A read-only baseline |
| M5A Supabase MFA/TOTP Hardening | **PLANNED — UNBLOCKED AFTER M5 SYNC MERGE** | Supabase Auth guidance + existing IAM/Step-up ADRs; dedicated remediation evidence/ADR update if architecture changes | verify current TOTP flow/config read-only → Owner approve → enroll/challenge/verify + AAL2 enforcement mutation/config if required → positive/negative tests → recovery evidence | M6 blocked until M5A `VERIFIED PASS`; Leaked Password Protection remains Pro+ deferred |
| M6 Supply Chain | BLOCKED BY M5A | ADR-0060 | SBOM/provenance/attestation tests | authorize only after M5A COMPLETE |
| M7 Deployment Identity + Production Platform Mutation Gate | BLOCKED BY M6 | ADR-0061 + platform ADR/runbooks | Render required when design demands it; Stripe/Supabase only when explicitly named | M8 blocked until all M7 PASS |
| M8 Agent Cutover | BLOCKED BY M7 | ADR-0062 | approved privileged execution-client cutover; read-only daily agents remain exception | M9 after cutover PASS |
| M9 Assurance | BLOCKED BY M8 | ADR-0063 | injection/replay/exfiltration/kill-switch/break-glass/rollback drills | M10 after assurance PASS |
| M10 PR WebAuthn / Passkey Step-up | BLOCKED BY M9 | dedicated ESS/ADR/runbook after Deep Research | Owner assertion bound to repository + PR + current head SHA + privileged action; replay/origin/RP-ID/freshness tests | final DevelopmentChain assurance |

## M5 verified persistence evidence
Authority: `docs/evidence/m5/M5_SUPABASE_AGENT_AUDIT_MUTATION_EVIDENCE.md`.

Verified production facts:
- table absent before mutation;
- migrations applied through the approved Supabase mutation path;
- RLS = enabled;
- `anon`: no SELECT/INSERT;
- `authenticated`: no SELECT/INSERT;
- `service_role`: SELECT/INSERT only, no UPDATE/DELETE;
- unexpected default `TRUNCATE/TRIGGER/REFERENCES` privileges were detected and removed before acceptance;
- redacted synthetic event persisted and correlated successfully;
- UPDATE negative test = DENIED (`append-only`);
- DELETE negative test = DENIED (`append-only`);
- no rollback required.

## M5 application integration — final evidence
Authority: `docs/evidence/m5/M5_APP_AUDIT_INTEGRATION_EVIDENCE.md`.

Verified implementation:
1. server-side `agent_audit_events` writer using the existing privileged server Supabase client;
2. Telemetry secret/PII redaction before INSERT;
3. explicit omission of full prompts, full diffs and raw request/response bodies;
4. request/trace/actor/app/agent/capability/risk/policy/approval/tool/repository/PR/CI/artifact/deployment/runtime mapping;
5. `auditReference` returned from the durable writer;
6. provider-neutral PolicyGate composed with durable audit persistence in a server-only adapter;
7. terminal outcome persisted as a second append-only correlated event;
8. unit/negative tests for redaction, omission, correlation, denied-outcome prevention and persistence fail-closed behavior;
9. typed Supabase insert mock fixed the prior TS2493 compile failure;
10. final required CI run #892 passed all application and runtime checks.

Mutation state for this substep: **NOT REQUIRED** — the existing verified Supabase schema was sufficient.

Final merge evidence:
- PR #210 head: `ffeab08c218314edd5292fbaf5ccb77413cee80e`;
- merge SHA: `e39d5370d8b1498e84952535a38a339cc200082f`;
- CI run: `31559124198` / #892 — **VERIFIED PASS**.

## M5A Supabase MFA/TOTP acceptance criteria
1. Read-only assessment proves the current application TOTP enrollment/login/step-up path and current Supabase Auth configuration.
2. TOTP enrollment uses the supported enroll → challenge → verify flow.
3. Privileged operations that require MFA reject `aal1` and require `aal2`.
4. No privileged endpoint treats factor enrollment alone as successful MFA verification.
5. Wrong/expired TOTP, missing factor, stale session and replay-like attempts fail closed.
6. Recovery/backup-factor handling is documented; destructive factor reset requires Owner-controlled recovery.
7. Positive and negative tests are recorded without storing TOTP secrets or recovery material.
8. Supabase Security Advisor is rerun after any Auth/config mutation.
9. Mutation state must be `VERIFIED PASS` before M6.
10. Leaked Password Protection remains documented as `DEFERRED — REQUIRES PRO+` until the plan changes.

## M10 PR WebAuthn / Passkey Step-up acceptance criteria
1. WebAuthn/passkey is the cryptographic step-up; device ID alone is never sufficient authentication.
2. Assertion is bound to Owner `SvenKulessa`, Finance repository, PR number, exact current head SHA and privileged action.
3. Any new commit invalidates the prior assertion.
4. Challenges are single-use, short-lived and replay-protected.
5. RP ID/origin and credential ownership are verified server-side.
6. Verification emits immutable audit evidence without storing private-key material.
7. Failure, expiry, target/head mismatch or replay fails closed.
8. Existing Files-changed/Viewed attestation, current-head review and CI remain independent controls.
9. Recovery/break-glass requires separate documented flow and audit trail.
10. M10 implementation requires Deep Research + repo read + dedicated ESS + ADR + threat model + negative tests + rollback/runbook.

## Protected invariants
- no synthetic/demo financial scores in production;
- fail-closed IAM/auth/runtime-secret semantics;
- CoinMarketCap remains decommissioned;
- Kraken public REST only;
- protected `main` + single stable `build-and-test` required check;
- normal PR flow produces one expensive `build-and-test` run only after current-head Owner review and the final Owner-checkbox edit;
- AI agents cannot self-approve or autonomously merge;
- privileged autonomous agents require the approved Roadmap/ESS/ADR package;
- daily agents are read-only only;
- no next roadmap phase while a required mutation/test gate is incomplete, failed or undocumented;
- M10 supplements rather than replaces Human/Owner review and CI;
- every DevelopmentChain phase updates ROADMAP + traceability + affected ADR/ESS.

## Next action
Merge this documentation-only M5 post-merge synchronization after Human/Owner review. Then start **M5A Supabase MFA/TOTP/AAL2** with a read-only repository and Supabase Auth baseline. No Supabase Auth mutation is authorized until the baseline establishes the exact need and a separate Human/Owner approval is recorded. M6 remains blocked until M5A is `VERIFIED PASS`.
