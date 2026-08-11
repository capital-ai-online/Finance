# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-12
Baseline branch: `main`
Baseline commit: `9322a7e274bfb765a5bbec71a3ce3107bde1d46c` (PR #206 merge)
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
- the stable required software check is a single `build-and-test` job.

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
- Production Supabase migrations `20260811230540_m5_agent_audit_events` and `20260811230743_m5_agent_audit_events_least_privilege` have been applied and verified.
- `public.agent_audit_events` is RLS-enabled, append-only and deny-by-default for `anon`/`authenticated`; `service_role` has only `SELECT` + `INSERT`.
- Synthetic redacted audit event write/read passed; UPDATE and DELETE negative tests fail closed.
- Supabase Security Advisor shows no M5-created critical finding. The `RLS Enabled No Policy` INFO is intentional for the policyless deny-by-default audit table.
- CoinMarketCap remains removed/deactivated.
- Kraken remains public REST evidence only.

## DevelopmentChain M0–M10
| Phase | Status | Authority | Mutation / test gate | Next gate |
|---|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | read-only baseline | preserve |
| M1 Git Guardrails | COMPLETE | GitHub protection + Owner policy | policy validation | preserve |
| M2 Architecture/Documentation | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | synchronized |
| M2G Documentation Freeze | COMPLETE | PR #192/#194 | freeze verification | sequential implementation |
| M3 CI Hardening | COMPLETE | ADR-0053/0060 + PR #195/#196/#204 | one `build-and-test`, risk-based fast/full path | preserve |
| M4 Agent IAM | COMPLETE | ADR-0050/0051/0058 + ESS-0018/0019 + PR #198/#202 | negative IAM tests + Owner gate; no live external mutation | preserve |
| M5 Observability/Telemetry/Audit | IN PROGRESS — SUPABASE PERSISTENCE VERIFIED / APP INTEGRATION PENDING | ADR-0056/0059 + PR #206 + M5 mutation evidence | persistence `VERIFIED PASS`; application writer + redaction + E2E correlation still required | M6 blocked until application/E2E PASS |
| M6 Supply Chain | BLOCKED BY M5 | ADR-0060 | SBOM/provenance/attestation tests | authorize only after M5 COMPLETE |
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
Before M6 is authorized, a Human-reviewed application PR must:
1. add the server-side `agent_audit_events` writer using the existing service-side Supabase client;
2. apply redaction before INSERT and prohibit secrets/tokens/full prompts/full diffs/raw sensitive bodies;
3. bind real request/trace/actor/app/agent/capability/risk/policy/approval/tool/repository/PR/CI/runtime context;
4. return/use `auditReference` in operational telemetry where applicable;
5. add unit tests and negative redaction/fail-closed tests;
6. prove an end-to-end authorized AI-assisted command can be reconstructed without exposing secrets;
7. record PASS evidence and only then set M5 `COMPLETE` and M6 `AUTHORIZED`.

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
- expensive CI only after valid Owner current-head review;
- AI agents cannot self-approve or autonomously merge;
- privileged autonomous agents require the approved Roadmap/ESS/ADR package;
- daily agents are read-only only;
- no next roadmap phase while a required mutation/test gate is incomplete, failed or undocumented;
- M10 supplements rather than replaces Human/Owner review and CI;
- every DevelopmentChain phase updates ROADMAP + traceability + affected ADR/ESS.

## Next action
Merge the M5 mutation-evidence repository-sync PR after Human/Owner review. Then implement the M5 server-side audit writer and end-to-end correlation tests in a separate application PR. M6 remains blocked until that application integration is `VERIFIED PASS` and M5 is formally closed.
