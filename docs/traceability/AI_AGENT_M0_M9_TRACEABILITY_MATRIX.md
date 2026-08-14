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
| M7 | **PHASE 0 COMPLETE / PROVENANCE-GATE MERGED, POST-DEPLOY VERIFICATION BUGFIX PENDING MERGE** | ADR-0061 | `AI_AGENT_DEPLOYMENT_IDENTITY.md`, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` | read-only Render preflight done; deploy-production gated on M6 attestation, confirmed on a real push; new post-deploy identity/health verification job merged but failed its first real run (read JSON body only, production identity is header-only) — root cause found and fixed, pending merge; zero external mutations performed; exact target + Owner mutation approval + Handoff + postverify/rollback still needed before any actual platform mutation | `docs/evidence/m7/M7_PHASE0_AND_REPOSITORY_CONTROLS_EVIDENCE.md`; all required mutations VERIFIED PASS |
| M8 | **BLOCKED BY M7** | ADR-0062 + ESS-0019 | Provider Profile Contract, `docs/runbooks/M8_AGENT_CUTOVER.md` | provider-neutral policy equivalence + bypass denial + rollback-to-read-only | `docs/evidence/m8/*` VERIFIED PASS |
| M9 | **BLOCKED BY M8** | ADR-0063 | Incident Response model, `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` | bypass/injection/replay/exfiltration/audit/kill-switch/break-glass/rollback drills | `docs/evidence/m9/*`; no unowned CRITICAL control |
| M10 | **BLOCKED BY M9** | ADR-0066 + ESS-0022 | M10 Threat Model + `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` | exact-state WebAuthn + shadow/replay/recovery/audit/single-CI/legacy-cleanup tests | `docs/evidence/m10/*`; passkey-only gate VERIFIED PASS |

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

M5A is `VERIFIED PASS` (2026-08-14): both Owner identities completed native TOTP enrollment interactively, confirmed via read-only production evidence (`docs/evidence/m5a/M5A_VERIFIED_PASS_CLOSURE_EVIDENCE.md`). M6 (Supply Chain Provenance) is `VERIFIED PASS` (2026-08-14): the full source→lockfile→SBOM→provenance/attestation chain was confirmed on the real hosted `push`-to-`main` build path, including a real cosign keyless signature verified in the same CI run (`docs/evidence/m6/M6_REPOSITORY_IMPLEMENTATION_EVIDENCE.md`). M7 (Deployment Identity) Phase 0 (read-only Render preflight) is complete and its first repository-implementation package (provenance-gated deploy + post-deploy identity/health verification) is code complete and locally tested, pending merge — see `docs/evidence/m7/M7_PHASE0_AND_REPOSITORY_CONTROLS_EVIDENCE.md`. No external mutation has been performed. M8–M10 remain blocked by their sequential predecessor gates.

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