# AI Agent M0–M10 Traceability Matrix

> Legacy filename retained for stable references. Detailed document/handoff traceability: `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`.

Status date: 2026-08-12
Baseline: `main@3b6bba0ec5c156c7bc1c68115284555f7560c2bf` (PR #231 merge)
Production deploy: `dep-d9u3ifbm8hqs73eedgq0` — `live` — same commit

| Phase | Execution State | Authority | Primary implementation / execution documents | Mutation / Test Gate | Exit Evidence |
|---|---|---|---|---|---|
| M0 | **COMPLETE** | M0 Evidence Baseline | `docs/evidence/m0/*` | read-only | baseline PASS |
| M1 | **COMPLETE** | Git Guardrails / Human Owner Policy | protected main / PR governance | Owner-reviewed policy | stable protection + merge boundary |
| M2 / M2G | **COMPLETE** | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*`, Freeze Policy | no production mutation | Documentation Freeze COMPLETE |
| M3 | **COMPLETE** | ADR-0053 + ADR-0060 | `.github/workflows/ci.yml`, PR Check Classification | bounded scope-aware CI | one normal `build-and-test` path preserved |
| M4 | **COMPLETE** | ADR-0058 + ESS-0018/0019 | Agent IAM / PolicyGate / capability/risk models | negative IAM + Human gate | M4 VERIFIED |
| M5 | **COMPLETE / VERIFIED PASS** | ADR-0056 + ADR-0059 | `public.agent_audit_events`, `server/agentAudit/*`, SA3B host evidence | real privileged authorization/outcome persistence + audit-outage negative proof | Issues #221/#223/#224 + SA3B branch cleanup |
| M5A | **IN PROGRESS** | ESS-0020 + ADR-0064 + ADR-0003.5 | `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md` | repo code+CI → explicit Owner production approval → native factor/AAL2/recovery/advisor tests | `docs/evidence/m5a/*`; M6 remains blocked |
| M6 | **BLOCKED BY M5A** | ADR-0060 | `AI_AGENT_SUPPLY_CHAIN_MODEL.md`, `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md` | source/lock/SBOM/artifact/provenance/attestation positive + mismatch negative tests | `docs/evidence/m6/*` → VERIFIED PASS required |
| M7 | **BLOCKED BY M6** | ADR-0061 | `AI_AGENT_DEPLOYMENT_IDENTITY.md`, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` | exact target + Owner mutation approval + Handoff + postverify/rollback | `docs/evidence/m7/*`; all required mutations VERIFIED PASS |
| M8 | **BLOCKED BY M7** | ADR-0062 + ESS-0019 | Provider Profile Contract, `docs/runbooks/M8_AGENT_CUTOVER.md` | provider-neutral policy equivalence + bypass denial + rollback-to-read-only | `docs/evidence/m8/*` VERIFIED PASS |
| M9 | **BLOCKED BY M8** | ADR-0063 | Incident Response model, `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` | bypass/injection/replay/exfiltration/audit/kill-switch/break-glass/rollback drills | `docs/evidence/m9/*`; no unowned CRITICAL control |
| M10 | **BLOCKED BY M9** | ADR-0066 + ESS-0022 | M10 Threat Model + `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` | exact-state WebAuthn + shadow/replay/recovery/audit/single-CI/legacy-cleanup tests | `docs/evidence/m10/*`; passkey-only gate VERIFIED PASS |

## Cross-cutting DevelopmentChain Controls

| Requirement | Authority / Artifact | Expected behavior |
|---|---|---|
| Operational roadmap | `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | current phase + documentation readiness + next gate |
| Execution sequence | `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` | no mutation/phase skip |
| Branch lifecycle | `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md` | fresh branch from current main; delete after Human merge; never reuse |
| Responsibilities | `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md` | Owner/Dev/Prod/Executor/CI separation |
| Check class | `docs/governance/PR_CHECK_CLASSIFICATION.md` | strictest D/C/R/M applies |
| Generic phase execution | `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md` | reproducible preflight → implementation → merge → optional mutation → closure |
| Generic Evidence | `docs/evidence/templates/DEVELOPMENT_CHAIN_PHASE_EVIDENCE_TEMPLATE.md` | baseline, tests, mutation, audit, rollback, closure captured |
| Mutation Handoff | `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md` | exact non-authorizing work order |
| Machine validation | `.ai/contracts/development-chain-mutation-handoff.schema.json` | exact bounded Handoff schema |
| Autonomous repository mutation | Systemadmin REM/IAM/Execution Host | permit-before-side-effect; exact capability/path/head binding |
| Merge | Human/Owner only | never granted to agent |

## M5 / Systemadmin corrective closure

Historical chain:

```text
PR #220 Execution Host
→ first real probe
→ M5 persistence failure
→ no branch side effect
→ diagnosis: privileged credential failure + writer/schema drift
→ PR #222 writer/schema correction
→ real positive Issue #223
→ durable authorization
→ BRANCH side effect
→ durable SUCCESS outcome
→ stale-base negative Issue #224
→ branch cleanup
→ M5 + SA3B COMPLETE / VERIFIED PASS
```

The fail-closed invariant `NO DURABLE AUDIT PERMIT → NO GITHUB SIDE EFFECT` and the positive permit-before-side-effect invariant are both proven in real host execution.

## SA4 repository-autonomy trace

PR #226 bootstrapped the first bounded autonomous work-package host. Owner Issue #228 / Workflow `31579519025` produced branch `agent/sa4-pilot-proof-20260812b`, commit `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d`, exact path `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`, Draft PR #229 and separate authorization/outcome references for BRANCH, COMMIT and PR.

PR #229 was then Human-reviewed and Human-merged to `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`; main CI #966 passed; pilot branch is absent. PR #231 later synchronized Systemadmin roadmap/traceability. Current repository/production baseline is `main@3b6bba0ec5c156c7bc1c68115284555f7560c2bf` on Render deploy `dep-d9u3ifbm8hqs73eedgq0`.

Closure: `docs/evidence/sa4/SA4_VERIFIED_PASS_CLOSURE_2026-08-12.md`.

**SA4 result:** bounded deterministic `BRANCH → COMMIT → Draft PR` automation is VERIFIED PASS. Arbitrary application-code patching, general file mutation and autonomous CI requests are not proven by the SA4 pilot and require separate bounded implementation/authority.

## M5A Requirement Trace

| Requirement | Implementation / Verification | Expected result |
|---|---|---|
| Authority state | ESS-0020 + ADR-0064 + ADR-0003.5 Human/Owner consistency | accepted before implementation |
| Execution path | normal Human-authorized Development path or dedicated M5A REM + bounded code executor | exact scope only |
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