# AI Agent M0–M10 Traceability Matrix

> Legacy filename retained for stable references. Detailed document/handoff traceability: `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`.

Status date: 2026-08-14
Baseline: `main@66da35b80ba23e4f216318a9cd9f9b4e7b787679` (PR #255 merge)

| Phase | Execution State | Authority | Primary implementation / execution documents | Mutation / Test Gate | Exit Evidence |
|---|---|---|---|---|---|
| M0 | COMPLETE | M0 Evidence Baseline | `docs/evidence/m0/*` | read-only | baseline PASS |
| M1 | COMPLETE | Git Guardrails / Human Owner Policy | protected main / PR governance | Owner-reviewed policy | stable protection + merge boundary |
| M2 / M2G | COMPLETE | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*`, Freeze Policy | no production mutation | Documentation Freeze COMPLETE |
| M3 | COMPLETE | ADR-0053 + ADR-0060 | `.github/workflows/ci.yml`, PR Check Classification | bounded scope-aware CI | one normal `build-and-test` path preserved |
| M4 | COMPLETE | ADR-0058 + ESS-0018/0019 | Agent IAM / PolicyGate / capability/risk models | negative IAM + Human gate | M4 VERIFIED |
| M5 | **VERIFIED PASS** | ADR-0056 + ADR-0059 | `public.agent_audit_events`, `server/agentAudit/*` | PR #222 corrected writer↔schema contract; real successful privileged audit insert confirmed (`docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md`) | persistence and application runtime both VERIFIED PASS |
| M5A | **VERIFIED PASS** | ESS-0020 + ADR-0064 + ADR-0003.5 | `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md` | repo code+CI merged; both Owner identities enrolled + verified native TOTP factor, confirmed `aal2` session, Advisor without unowned HIGH/CRITICAL | `docs/evidence/m5a/M5A_VERIFIED_PASS_CLOSURE_EVIDENCE.md`; M6 unblocked |
| M6 | **VERIFIED PASS** | ADR-0060 | `AI_AGENT_SUPPLY_CHAIN_MODEL.md`, `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md` | source/lock/SBOM/artifact/provenance chain implemented, merged, and confirmed on the real hosted `push`-to-`main` build path (run [`31834114193`](https://github.com/SvenKulessa/Finance/actions/runs/31834114193)): cosign keyless signing (Sigstore Fulcio/Rekor) signed and, in the same run, `cosign verify-blob` confirmed the signature against the exact expected certificate identity and OIDC issuer (`Verified OK`); positive/negative consistency tests PASS (`tests/unit/verifySupplyChainProvenance.test.ts`) | `docs/evidence/m6/M6_REPOSITORY_IMPLEMENTATION_EVIDENCE.md` |
| M7 | **COMPLETE / VERIFIED PASS** (2026-08-14, all 9 Exit Gate criteria met) | ADR-0061 | `AI_AGENT_DEPLOYMENT_IDENTITY.md`, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` | read-only Render preflight done; deploy-production gated on M6 attestation, confirmed on a real push; post-deploy identity/health verification confirmed end-to-end against the live Render deploy after a real bug fix; Owner performed a real deploy-hook rotation, independently confirmed via 3 sources; Owner performed a real Render Dashboard rollback plus roll-forward to current `main`, both independently confirmed via 3 sources each; all 10 Required Negative Tests now have a concrete, automated, passing test (`docs/evidence/m7/M7_REQUIRED_NEGATIVE_TESTS_EVIDENCE.md`, new `src/platform/Security/developmentChainMutationHandoff.ts` validator/gate) | `docs/evidence/m7/M7_PHASE0_AND_REPOSITORY_CONTROLS_EVIDENCE.md`, `docs/runbooks/M7_DEPLOY_HOOK_ROTATION_HANDOFF.md`, `docs/runbooks/M7_ROLLBACK_VERIFICATION_HANDOFF.md`, `docs/evidence/m7/M7_REQUIRED_NEGATIVE_TESTS_EVIDENCE.md`; all required mutations VERIFIED PASS |
| M8 | **COMPLETE / VERIFIED PASS** (2026-08-16, all 9 Exit Gate items PASS) | ADR-0062 + ESS-0019 | Provider Profile Contract, `docs/runbooks/M8_AGENT_CUTOVER.md` | Provider Profile Registry, Policy-Equivalence, no-regression SA3B/SA4 wiring, rollback-to-read-only, audit correlation and provider-specific-bypass-denial all verified; `externalHostConfigurationVerified` for `chatgpt-github-connector` verified read-only 2026-08-16 → READY on all 6 `ProviderCutoverEvidence` fields; Exit-Gate-Punkt 2 closed under Owner-accepted scope decision (2026-08-16, explicit "ACCEPT" via AskUserQuestion) — supported privileged providers = mutating providers with a production host, i.e. `chatgpt-github-connector` only; canonical provider set corrected 2026-08-16 (PR #365) to ChatGPT/Claude/Grok — `claude-code-cli` and `grok-xai-connector` both structurally BLOCKED and explicitly not supported privileged paths; `google-ai-studio`/`notebooklm`/`gemini` now RETIRED (DENY) | `docs/evidence/m8/M8_CLOSURE_EVIDENCE.md`; `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`; `docs/evidence/m8/M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md`; `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md`; `docs/evidence/m8/M8_PROVIDER_BYPASS_ROUTE_AUDIT_EXIT_GATE_4_EVIDENCE.md`; `docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md` | M9 unblocked (Integrated Roadmap Phase I2); each M9 drill separately Owner-authorized |
| M9 | **COMPLETE / VERIFIED PASS** (2026-08-17, all 10 Exit Gate items satisfied) | ADR-0063 | Incident Response model, `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` | bypass/injection/replay/exfiltration/audit/kill-switch/break-glass/rollback drills all have live-drill evidence (`docs/evidence/m9/*_LIVE_DRILL_2026-08-16.md`); Required Independent Review complete (`M9_INDEPENDENT_EVIDENCE_REVIEW_2026-08-16.md`); the one genuinely fixable finding (F2, `requireStepUp()` purpose filter) closed and tested (`M9_STEPUP_PURPOSE_FILTER_FIX_2026-08-17.md`); remaining structural residuals (SA3B-only-caller scope, mocked-Supabase test methodology) explicitly Owner-accepted; no unowned CRITICAL control found | `docs/evidence/m9/M9_CLOSURE_EVIDENCE.md` (authoritative closure record); `docs/evidence/m9/*` |
| M10 | **IN PROGRESS** (2026-08-17; Phases 1-3 of 6 implemented and tested, Phase 3 live-wired; three post-live-wiring production incidents found and fixed) | ADR-0066 + ESS-0022 | M10 Threat Model + `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` | Phase 1 (Trusted PR State Resolver) and Phase 2 (Challenge Issuance) implemented, not live-wired; Phase 3 (Owner Credential Enrollment, `@simplewebauthn/server`+`@simplewebauthn/browser`) implemented AND live-wired — real Owner+step-up-gated HTTP endpoint (`/api/m10/credential-enrollment`), Supabase persistence, minimal Owner UI in SupervisorDashboard; Owner-reported production bugs root-caused to (1) the Phase 3 migration having never been applied to production — Owner-authorized fix via `mcp__Supabase__apply_migration`; (2) unhandled store exceptions in `credentialEnrollment.ts` causing silent failure instead of a clean `DENY` — fixed with try/catch on every store call (PR #412); (3) the migration enabling RLS but granting no explicit `service_role` table privilege (this repo carries no Supabase default service_role grants, ADR-0043) — Owner-authorized follow-up migration `20260817030000_m10_passkey_service_role_grants.sql` grants exactly `SELECT`/`INSERT`/`UPDATE`, verified via `information_schema.role_table_grants`; no real Owner enrollment performed yet; 91 tests combined (85 + 6 new regression tests); Phases 4-6 + Controlled Cutover outstanding | `docs/evidence/m10/M10_PHASE3_LIVE_WIRING_2026-08-17.md`; `docs/evidence/m10/M10_PHASE3_PRODUCTION_INCIDENT_FIX_2026-08-17.md`; `docs/evidence/m10/*` |

## Cross-cutting DevelopmentChain Controls

| Requirement | Authority / Artifact | Expected behavior |
|---|---|---|
| Operational roadmap | `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | current phase + documentation readiness + next gate |
| Execution sequence | `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` | no mutation/phase skip |
| Branch lifecycle | `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md` | fresh branch from current main; delete after Human merge; never reuse |
| Clone/worktree lifecycle | same Branch Lifecycle Policy + `AGENTS.md` | never edit local main; clean ephemeral workspace after Evidence |
| Responsibilities | `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md` | Owner/Dev/Prod/Executor/CI separation |
| Check class | `docs/governance/PR_CHECK_CLASSIFICATION.md` | strictest D/C/R/M applies |
| Generic phase execution | `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md` | reproducible preflight → implementation → merge → optional mutation → closure |
| Generic Evidence | `docs/evidence/templates/DEVELOPMENT_CHAIN_PHASE_EVIDENCE_TEMPLATE.md` | baseline, tests, mutation, audit, rollback, closure captured |
| Mutation Handoff | `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md` | exact non-authorizing work order |
| Machine validation | `.ai/contracts/development-chain-mutation-handoff.schema.json` | exact bounded Handoff schema |
| Autonomous mutation | Systemadmin REM/IAM/Execution Host | permit-before-side-effect; independent VERIFIED PASS required |
| Merge | Human/Owner only | never granted to agent |

## Current Phase Gate

M5 is `VERIFIED PASS` (confirmed 2026-08-14): the application writer's corrective runtime verification (started after the first real SA3B probe, PR #222 corrected the repository-side M5 schema mapping and added migration↔writer regression coverage) is closed — a real successful privileged production audit insert was found already recorded on 2026-08-12 (SA4 pilot chain, `pull_request_number: 229`), cross-verified against the actual merged PR #229, on a base SHA confirmed to be a descendant of PR #222's merge commit. See `docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md`.

M5A is `VERIFIED PASS` (2026-08-14): both Owner identities completed native TOTP enrollment interactively, confirmed via read-only production evidence (`docs/evidence/m5a/M5A_VERIFIED_PASS_CLOSURE_EVIDENCE.md`). M6 (Supply Chain Provenance) is `VERIFIED PASS` (2026-08-14): the full source→lockfile→SBOM→provenance/attestation chain was confirmed on the real hosted `push`-to-`main` build path, including a real cosign keyless signature verified in the same CI run (`docs/evidence/m6/M6_REPOSITORY_IMPLEMENTATION_EVIDENCE.md`). M7 (Deployment Identity) is `COMPLETE / VERIFIED PASS` (2026-08-14): Phase 0 (read-only Render preflight) is complete; the provenance-gated deploy + post-deploy identity/health verification is `VERIFIED PASS` on the real hosted build/deploy path (`docs/evidence/m7/M7_PHASE0_AND_REPOSITORY_CONTROLS_EVIDENCE.md`); a real Owner-executed deploy-hook rotation/revocation is independently confirmed via GitHub Actions logs, Render's own deploy history, and a passing post-deploy verification (`docs/runbooks/M7_DEPLOY_HOOK_ROTATION_HANDOFF.md`); a real Owner-executed Render Dashboard rollback to a prior deploy plus its subsequent roll-forward to current `main` (via merge of PR #277) is likewise independently confirmed via GitHub Actions logs, Render's own deploy history (`trigger: rollback` then `trigger: deploy_hook`), and passing post-deploy verification (`docs/runbooks/M7_ROLLBACK_VERIFICATION_HANDOFF.md`); and all 10 Required Negative Tests from the runbook now have a concrete, automated, passing test against a new `src/platform/Security/developmentChainMutationHandoff.ts` validator/execution gate, static CI-config guards, and a real subprocess integration test proving the health/readiness fail-closed path (`docs/evidence/m7/M7_REQUIRED_NEGATIVE_TESTS_EVIDENCE.md`). All 9 M7 Exit Gate criteria are explicitly walked through and met in `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`'s "Exit Gate Closure" section, including confirming via `git ls-remote` that no M7 work branch persists after merge. M8 (Agent Cutover) Phase 0 (read-only provider inventory) is complete: all 6 Prerequisite Gate criteria are met, and the most significant finding is that this (and every) interactive Claude Code session's own MCP tool calls are not mediated by `agentIam.ts` at all — that tool grant comes from the outer CCR/session runtime, not from this repository, so it cannot be closed by a code change. The first Phase 1 repository package, the Provider Profile Contract + Registry (`src/platform/Security/providerProfile.ts`), is `VERIFIED PASS`: profiles for all 4 documented providers (ChatGPT, Claude Code, Google AI Studio, NotebookLM) compose with — never replace — the existing `agentIam.ts` kernel, and every Policy Equivalence Test and Negative Test required by the M8 runbook now has a passing test (`docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md`). The module was then additionally wired as an additive, narrowing-only check into the live SA3B/SA4 execution host (`server/agentAudit/systemadminAuditedExecution.ts`), with a Policy Equivalence drift-guard test proving the new generic registry stays in exact sync with the pre-existing SA2-specific capability list, and an end-to-end test proving the actually-live BRANCH capability path still resolves identically (`layer: 'REM_POLICY'`, unchanged) — the full suite (949 tests) stayed green throughout. M8's own exit gate is still not met — Claude Code, Google AI Studio and NotebookLM still have no real caller, no direct provider bypass is deactivated, and rollback-to-read-only is not yet proven — so M8 as a whole stays `PLANNED`. M9–M10 remain blocked by their sequential predecessor gates.

## M5 corrective trace — PR #222

```text
PR #220 Execution Host deployed
→ real SA3B probe
→ strict Issue/REM/OIDC checks PASS
→ durable M5 persistence FAIL: Unregistered API key
→ branch side effect SKIPPED
→ read-only diagnosis finds writer↔schema drift
→ PR #222 corrects application mapping and contract tests
→ merge 91963f59...
→ real SA3B probe (07:28 UTC) + SA4 pilot chain (08:42 UTC, PR #229) on post-fix main
→ real successful privileged audit inserts confirmed, cross-verified against PR #229
→ M5 VERIFIED PASS (2026-08-14, docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md)
```

The fail-closed invariant `NO DURABLE AUDIT PERMIT → NO GITHUB SIDE EFFECT` has already been observed in the real host probe.

## M5A Requirement Trace

| Requirement | Implementation / Verification | Expected result |
|---|---|---|
| Native factor flow | Supabase Native `enroll → challenge → verify` | positive PASS |
| Privileged AAL1 | centralized server AAL2 gate | DENY |
| Enrollment without verification | assurance gate | DENY |
| Wrong TOTP / invalid challenge | Native MFA verification | DENY |
| stale/downgraded assurance | AAL lookup | DENY |
| AAL lookup failure | fail-closed privileged path | DENY |
| application step-up without AAL2 | combined assurance gate | DENY |
| wrong user/purpose/replayed step-up | step-up validation | DENY |
| authorized AAL2 + required action step-up | combined gate | ALLOW |
| recovery/factor reset | Owner-controlled native recovery | audited PASS |
| advisor rerun | post-mutation production evidence | captured |
| secret safety | evidence review | no MFA secret/code/recovery material |

## M6 Requirement Trace

| Requirement | Artifact / Test | Expected result |
|---|---|---|
| exact source | source SHA in build/evidence | matches candidate head |
| exact dependencies | committed lockfile + digest | deterministic install |
| SBOM | SPDX/CycloneDX machine output | bound to source/lock |
| artifact identity | artifact/image digest | immutable subject |
| provenance | builder/source/input/subject statement | verifies exact artifact |
| attestation | verifiable signature/trust path where required | PASS |
| source/lock/artifact mismatch | negative tests | DENY |
| untrusted builder/provenance | negative test | DENY |
| rollback artifact | immutable last-known-good reference | retrievable/verifiable |

## M7 Mutation Trace

Every external state change must resolve:

```text
Roadmap Item
→ exact target
→ pre-mutation baseline
→ Human Mutation Approval Evidence
→ DevelopmentChain Handoff ID
→ REM / IAM / Execution Host decision
→ authorization audit reference
→ exact side effect
→ outcome audit reference
→ post-verification
→ rollback state
```

No Handoff alone authorizes execution.

## M8 Provider Equivalence Trace

Equivalent semantic capability requests must produce the same policy outcome across ChatGPT, Claude, Google AI Studio and future transports. All agent profiles deny `MERGE`; research profiles deny mutation; production mutation requires exact approved Handoff plus separately verified execution permission.

## M9 Assurance Trace

Required drill families: authorization bypass, prompt/tool injection, replay/idempotency, secret/data exfiltration, audit outage/completeness, kill switch, break-glass, rollback/recovery and independent Evidence review. Unexpected ALLOW/side effect blocks M10.

## M10 Passkey Authorization Trace

```text
Human File Review / Viewed
→ trusted PR-state resolver
→ server challenge
→ Owner WebAuthn assertion
→ RP/origin/credential/signature/UP/UV/freshness verification
→ exact PR-context match
→ immutable approval evidence
→ atomic one-CI consumption
→ build-and-test
→ Human merge
```

Exact binding covers Owner, repository, PR, base branch/SHA, exact head SHA, canonical changed-file-set hash, canonical diff/review digest, `AUTHORIZE_PR_CI`, challenge/approval freshness and replay state.

## Parallel Systemadmin Workstream

PR #220 implemented the SA3B GitHub-Actions/OIDC host. PR #222 corrected the M5 application schema contract discovered by the first real probe. SA3B is still **VERIFICATION PENDING** until the Owner-controlled production credential is valid, a positive probe persists authorization before the branch side effect, SUCCESS outcome evidence is correlated, a no-permit/stale negative probe creates no side effect, and the probe branch is deleted.

Until then, direct mutating ChatGPT/Claude/other connector calls bypassing the enforceable host cannot be labeled autonomous DevelopmentChain `VERIFIED PASS` execution.

## Mutation State Vocabulary

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

`Documentation Ready` is not a mutation state and never implies approval.

## Closure Rule

No DevelopmentChain phase closes without Authority consistency, required implementation/CI, required external mutation `VERIFIED PASS`, positive and negative verification, redacted audit/evidence, rollback state, Human merge where applicable, Finance work branch deletion, synchronized Roadmap/traceability and an explicit Next Gate.