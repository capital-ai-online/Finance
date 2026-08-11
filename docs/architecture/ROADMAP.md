# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-12
Baseline branch: `main`
Baseline commit: `d51b8dd25daa9ad6b845b4958fdb20600f1fb3b4` (PR #207 merge)
Platform version: `0.6.0`
Canonical role: current-state DevelopmentChain status index. Historical detail remains in ADR/evidence documents.

## Mandatory maintenance rule
Every merged DevelopmentChain step MUST update this file with the new `main` SHA, affected phase status, mutation/test state, next gate and evidence pointer. A roadmap-changing PR is incomplete without this synchronization.

## Human / Owner gate before expensive CI
Every PR targeting `main` MUST be human-visible and explicitly reviewed by repository Owner `SvenKulessa` before expensive build/test validation starts.

Binding sequence:

`PR OPEN/UPDATE → OWNER FILE REVIEW → OWNER CHECKBOXES → CURRENT-HEAD REVIEW (💪/okay) → build-and-test → MERGE ELIGIBLE`

Rules:
- every changed file must be reviewed under `Files changed` and marked `Viewed`;
- the PR body must attest both the complete diff review and all files viewed;
- Owner review must target the exact current PR head and contain `💪` or `okay`;
- any new commit invalidates the previous current-head review;
- before those signals are valid, expensive npm/TypeScript/unit/build/Docker checks must not start;
- lightweight governance/security checks may run earlier;
- successful CI is not merge authorization;
- AI clients stop before merge unless a separate explicit human merge instruction exists;
- the stable required software check is exactly one `build-and-test` context from GitHub Actions.

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
| Supabase | M5 Observability/Telemetry/Audit | approved audit/telemetry persistence and policy-bound evidence | baseline → mutation → RLS/permission/append-only tests → redacted write/read → advisor → evidence |
| Supabase Auth | M5A TOTP MFA Remediation | TOTP enrollment/challenge/verify and AAL2 enforcement for privileged Owner/admin paths; no Leaked Password Protection requirement on current plan | repo/auth baseline → Human approval → auth/config/code mutation as required → TOTP/AAL2 positive + negative tests → evidence |
| Stripe | M7 only when explicitly named by dedicated ADR/runbook | specific billing/webhook/credential mutation only; no generic authorization | test-mode/non-destructive checks where possible → mutation → webhook/idempotency/mapping verification → rollback/revocation evidence |
| Render | M7 Deployment Identity | protected deployment identity, environment-scoped credentials/hooks, rotation/revocation | preflight → mutation → controlled deploy → health/readiness → rollback evidence |

## Current status quo
- PR #192 established the provider-neutral AI-Agent architecture and Documentation Freeze basis.
- PR #194 closed M2G.
- PR #195/#196 completed M3 CI Hardening and docs-fast-path proof.
- PR #197 established the Human/Owner review gate.
- PR #198/#202 completed and consolidated M4 Agent IAM.
- PR #203 moved expensive CI behind the Owner gate and appended M10 WebAuthn/passkey assurance.
- PR #204 consolidated CI to one `build-and-test` job and established PR check classes.
- PR #206 approved the M5 persistence design and classified the Supabase mutation as REQUIRED.
- PR #207 synchronized and verified the executed M5 Supabase audit mutation; merge commit `d51b8dd25daa9ad6b845b4958fdb20600f1fb3b4` is the current baseline for this roadmap update.
- Production Supabase migrations `20260811230540_m5_agent_audit_events` and `20260811230743_m5_agent_audit_events_least_privilege` have been applied and verified.
- `public.agent_audit_events` is RLS-enabled, append-only and deny-by-default for `anon`/`authenticated`; `service_role` has only `SELECT` + `INSERT`.
- Synthetic redacted audit event write/read passed; UPDATE and DELETE negative tests fail closed.
- Supabase Security Advisor shows no M5-created critical finding. The `RLS Enabled No Policy` INFO is intentional for the policyless deny-by-default audit table.
- Supabase TOTP MFA is available on all projects; M5A must verify/fix application enforcement so privileged Owner/admin paths require `aal2` after TOTP challenge/verify.
- Leaked Password Protection is plan-gated in the current project context and is recorded as `DEFERRED — PLAN DEPENDENCY`; it MUST NOT block M5/M5A completion while unavailable on the active Supabase plan.
- GitHub ruleset for `main` requires exactly one status context named `build-and-test` from GitHub Actions. Multiple visible historical/cancelled `build-and-test` check-runs for the same SHA are a workflow-trigger/concurrency presentation issue, not two configured required status contexts; remediation must minimize duplicate workflow attempts without weakening the required check.
- CoinMarketCap remains removed/deactivated.
- Kraken remains public REST evidence only.

## DevelopmentChain M0–M10
| Phase | Status | Authority | Mutation / test gate | Next gate |
|---|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | read-only baseline | preserve |
| M1 Git Guardrails | COMPLETE | GitHub protection + Owner policy | policy validation | preserve |
| M2 Architecture/Documentation | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | synchronized |
| M2G Documentation Freeze | COMPLETE | PR #192/#194 | freeze verification | sequential implementation |
| M3 CI Hardening | COMPLETE | ADR-0053/0060 + PR #195/#196/#204 | one required `build-and-test`, risk-based fast/full path | preserve |
| M4 Agent IAM | COMPLETE | ADR-0050/0051/0058 + ESS-0018/0019 + PR #198/#202 | negative IAM tests + Owner gate; no live external mutation | preserve |
| M5 Observability/Telemetry/Audit | IN PROGRESS — SUPABASE PERSISTENCE VERIFIED / APP INTEGRATION PENDING | ADR-0056/0059 + PR #206/#207 + M5 mutation evidence | persistence `VERIFIED PASS`; application writer + redaction + E2E correlation still required | M5A/M6 remain blocked as specified below |
| M5A Supabase TOTP MFA Remediation | PLANNED — AFTER M5 APP INTEGRATION, BEFORE M6 | existing IAM ADRs + dedicated remediation evidence/ADR update if architecture changes | privileged Owner/admin flow must prove TOTP challenge/verify → `aal2`; missing/stale/invalid TOTP and `aal1` must fail closed; Leaked Password Protection = DEFERRED plan dependency | M6 blocked until M5 + M5A VERIFIED PASS |
| M6 Supply Chain | BLOCKED BY M5/M5A | ADR-0060 | SBOM/provenance/attestation tests | authorize only after M5 + M5A COMPLETE |
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

## Remaining M5 implementation gate
Before M5A/M6 is authorized, a Human-reviewed application PR must:
1. add the server-side `agent_audit_events` writer using the existing service-side Supabase client;
2. apply redaction before INSERT and prohibit secrets/tokens/full prompts/full diffs/raw sensitive bodies;
3. bind real request/trace/actor/app/agent/capability/risk/policy/approval/tool/repository/PR/CI/runtime context;
4. return/use `auditReference` in operational telemetry where applicable;
5. add unit tests and negative redaction/fail-closed tests;
6. prove an end-to-end authorized AI-assisted command can be reconstructed without exposing secrets;
7. record PASS evidence and only then set M5 application integration `VERIFIED PASS`.

## M5A Supabase TOTP MFA acceptance criteria
1. Inventory existing TOTP enrollment/challenge/verify code and Supabase Auth settings read-only before mutation.
2. TOTP enrollment uses Supabase MFA APIs and verified factors only.
3. Privileged Owner/admin authorization requires a valid session with `aal2`; `aal1` is insufficient.
4. If `currentLevel=aal1` and `nextLevel=aal2`, the application requires challenge + verify before privileged access.
5. Invalid, expired/mismatched challenge, missing factor, stale session and absent `aal2` fail closed.
6. Server/API authorization validates the trusted JWT/AAL context; UI state alone is never authorization.
7. Positive and negative tests plus redacted audit evidence are required before M6.
8. Leaked Password Protection is not an acceptance criterion while unavailable on the active Supabase plan; record it as a plan-dependent future hardening item.

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
- protected `main` + exactly one required GitHub Actions context `build-and-test`;
- expensive CI only after valid Owner current-head review;
- AI agents cannot self-approve or autonomously merge;
- privileged autonomous agents require the approved Roadmap/ESS/ADR package;
- daily agents are read-only only;
- no next roadmap phase while a required mutation/test gate is incomplete, failed or undocumented;
- M10 supplements rather than replaces Human/Owner review and CI;
- every DevelopmentChain phase updates ROADMAP + traceability + affected ADR/ESS.

## Next action
Implement and verify the M5 server-side audit writer/E2E correlation in a Human-reviewed application PR. Then execute M5A TOTP MFA inventory/remediation and prove privileged Owner/admin `aal2` enforcement. M6 remains blocked until both M5 and M5A are `VERIFIED PASS`. In parallel, remediate duplicate visible CI attempts without creating a second required `build-and-test` context.