# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-12
Baseline branch: `main`
Baseline commit: `ee65ba19f64e7e8ee2d618e16364a658dfe60e4c` (PR #211 merge)
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
| Supabase Auth | M5A MFA/TOTP Hardening | native TOTP enrollment/challenge/verify, AAL2 enforcement for privileged flows, recovery/backup-factor handling; no unrelated auth mutation | **baseline complete** → architecture approval → code + CI → pre-mutation check → explicit Owner mutation approval → native Owner enrollment → AAL2 positive/negative tests → recovery → advisor → evidence |
| Stripe | M7 only when explicitly named by dedicated ADR/runbook | specific billing/webhook/credential mutation only; no generic authorization | test-mode/non-destructive checks where possible → mutation → webhook/idempotency/mapping verification → rollback/revocation evidence |
| Render | M7 Deployment Identity | protected deployment identity, environment-scoped credentials/hooks, rotation/revocation | preflight → mutation → controlled deploy → health/readiness → rollback evidence |

### Supabase Auth plan constraint
- Supabase Native TOTP MFA is the preferred M5A authority and does not require a new application-owned MFA table.
- Organization-level Supabase Dashboard MFA enforcement is plan-dependent and separate from CAPITAL-AI app-user MFA.
- Leaked Password Protection remains **DEFERRED / PLAN-DEPENDENT (PRO+)** and is not an active M5A blocker on the current Free plan.
- M5A must not claim Leaked Password Protection as remediated until the plan supports it and a separate Owner-approved mutation is performed.

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
- PR #208 merged the M5A roadmap gate and the single robust PR-body CI trigger.
- PR #210 merged M5 application audit integration at `e39d5370d8b1498e84952535a38a339cc200082f`; final CI #892 passed.
- PR #211 merged the M5 post-merge synchronization at `ee65ba19f64e7e8ee2d618e16364a658dfe60e4c`; M5 is canonically **COMPLETE / VERIFIED PASS**.
- M5A read-only production/repository baseline is now complete on `agent/m5a-totp-aal2-baseline`.
- Production Supabase Auth contains **0 native MFA factors** and current session evidence contains **2 × aal1 / 0 × aal2**.
- Both Owner profiles currently carry the legacy CAPITAL-AI flag `totp_enabled=true`, proving the legacy TOTP path is separate from Supabase AAL2.
- Security Advisor reports `auth_insufficient_mfa_options`.
- `checkAdminAccess()` verifies Supabase identity + IAM role but does not yet enforce AAL2.
- `loginStepUpRequirement()` has a fail-open status/network error path unsuitable for privileged identities.
- ADR-0003.5 has therefore been reactivated from `resolved/` and is `IN PROGRESS` for the M5A assurance scope.
- ESS-0020 and ADR-0064 define Supabase Auth as Native MFA authority and preserve purpose-bound `x-step-up-token` only as defense-in-depth over AAL2.
- No Supabase Auth factor/config mutation has been performed by the baseline.
- M6 remains blocked until M5A reaches `VERIFIED PASS`.
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
| M5 Observability/Telemetry/Audit | **COMPLETE — VERIFIED PASS** | ADR-0056/0059 + PR #206/#207/#210/#211 + M5 evidence | persistence/app integration `VERIFIED PASS`; app mutation `NOT REQUIRED` | preserve |
| M5A Supabase MFA/TOTP Hardening | **IN PROGRESS — READ-ONLY BASELINE COMPLETE / REMEDIATION PLAN IN REVIEW** | ESS-0020 + ADR-0064 + reactivated ADR-0003.5 + `docs/evidence/m5a/*` | repository code `REQUIRED`; Owner native factor enrollment `REQUIRED BUT NOT YET AUTHORIZED`; project config mutation `CONDITIONAL`; Postgres DDL `NOT REQUIRED` | Human-review/merge baseline package → implement code on fresh branch → CI → explicit production mutation approval |
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

Final merge evidence:
- PR #210 head: `ffeab08c218314edd5292fbaf5ccb77413cee80e`;
- merge SHA: `e39d5370d8b1498e84952535a38a339cc200082f`;
- CI run: `31559124198` / #892 — **VERIFIED PASS**;
- PR #211 post-merge documentation sync: `ee65ba19f64e7e8ee2d618e16364a658dfe60e4c`.

## M5A verified read-only baseline
Authority: `docs/evidence/m5a/M5A_SUPABASE_TOTP_AAL2_BASELINE.md`.

### Production evidence
- project `AIFINANCIAL` is ACTIVE_HEALTHY;
- organization plan = Free;
- native Auth MFA storage already exists;
- native MFA factors = 0;
- current session assurance = 2 × `aal1`, 0 × `aal2`;
- legacy Owner TOTP flags = 2 × enabled;
- legacy break-glass codes = 20 unused;
- active legacy step-up tokens = 0;
- Advisor warning `auth_insufficient_mfa_options` remains present.

### Code evidence
- custom RFC-6238 TOTP is implemented outside Supabase Auth;
- native `mfa.enroll/challenge/verify` is absent from the current TOTP flow;
- runtime `aal2` enforcement is absent;
- privileged login status lookup can fail-open;
- purpose-bound Step-Up exists and is retained only as an additional action gate over AAL2.

### Mutation classification
- repository/application code: **REQUIRED**;
- Owner Native TOTP factor enrollment: **REQUIRED / NOT YET AUTHORIZED**;
- Supabase project Auth configuration: **CONDITIONAL / exact setting not observable through current connector**;
- Postgres DDL for Native MFA: **NOT REQUIRED**;
- legacy TOTP cleanup: **DEFERRED / SEPARATE APPROVAL**;
- Render/Stripe: **NOT REQUIRED for baseline**.

## M5A acceptance criteria
1. Human/Owner accepts ESS-0020 + ADR-0064.
2. TOTP enrollment uses supported Native `enroll → challenge → verify`.
3. Privileged Owner/admin operations reject `aal1` and require trusted `aal2`.
4. Enrollment alone never counts as successful MFA verification.
5. `aal2/aal1` stale/downgraded state fails closed.
6. Auth/AAL lookup errors fail closed for privileged identities.
7. `x-step-up-token` cannot replace AAL2 and remains identity/purpose/expiry/single-use bound.
8. Wrong/expired TOTP, missing factor, invalid challenge and replay-like attempts fail closed.
9. Recovery/backup-factor handling is Owner-controlled, tested and audited.
10. Native Owner factor enrollment is performed only after explicit production mutation approval.
11. Positive and negative tests are recorded without storing TOTP secrets/codes/factor IDs/recovery material.
12. Supabase Security Advisor is rerun after Auth mutation/configuration.
13. Mutation/test state must be `VERIFIED PASS` before M6.
14. Leaked Password Protection remains `DEFERRED — REQUIRES PRO+` until the plan changes.

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
10. M10 implementation requires Deep Research + repository read + dedicated ESS + ADR + threat model + negative tests + rollback/runbook.

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
Human-review and merge the M5A baseline/architecture package. This merge authorizes the **repository implementation phase only**. Then create a fresh implementation branch for Native TOTP enrollment/challenge/verify, centralized server AAL2 enforcement, fail-closed privileged login/session handling, recovery integration and tests. Production Owner-factor enrollment or Auth configuration mutation remains blocked until implementation CI is `VERIFIED PASS` and a separate explicit Human/Owner production-mutation approval is recorded. M6 remains blocked until M5A is complete.
