# AI Agent M0–M10 Traceability Matrix

> Legacy filename retained for stable references; scope now includes M10.

| Phase | Authority | Primary documents / implementation | Mutation/Test gate | Exit evidence |
|---|---|---|---|---|
| M0 | M0 Evidence Baseline | `docs/evidence/m0/*` | read-only | PASS baseline |
| M1 | Git Guardrails | main protection/CODEOWNERS + Human/Owner policy | Owner-reviewed GitHub policy changes | protected main + stable `build-and-test` + Owner review gate |
| M2 | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | no production mutation | PR #192 + M2G PR #194; Documentation Freeze COMPLETE |
| M3 | ADR-0060 + ADR-0053 | `.github/workflows/ci.yml`, `docs/evidence/m3/*` | one required `build-and-test`; current-head review then final Owner-checkbox edit triggers expensive CI | PR #195/#196/#204/#208 COMPLETE |
| M4 | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 | `src/platform/Security/agentIam.ts`, `src/platform/Compliance/PolicyGate.ts`, `tests/unit/agentIam.test.ts`, `docs/evidence/m4/M4_AGENT_IAM_EVIDENCE.md` | no Stripe/Supabase/Render production mutation; negative IAM tests + Human/Owner gate | PR #198/#202 COMPLETE |
| M5 | ADR-0059 + ADR-0056 | `public.agent_audit_events`, `server/agentAudit/*`, `tests/unit/agentAudit.test.ts`, `docs/evidence/m5/*` | persistence/app integration `VERIFIED PASS` | **COMPLETE / VERIFIED PASS** — PR #210 + #211 |
| M5A | ESS-0020 + ADR-0064 + reactivated ADR-0003.5 | Native Supabase TOTP, centralized server AAL2 enforcement, recovery, `docs/evidence/m5a/*`, M5A runbook | baseline read-only complete → architecture approval → code+CI → explicit Owner production mutation approval → Owner native factor enrollment → AAL2 negative/positive tests → recovery → advisor/evidence | **IN PROGRESS — BASELINE COMPLETE / MUTATION NOT AUTHORIZED** |
| M6 | ADR-0060 | supply-chain model | SBOM/provenance/attestation verification; no implicit external-platform mutation | BLOCKED BY M5A PASS |
| M7 | ADR-0061 + platform-specific ADR/runbooks | deployment identity + approved platform mutation plans | Render production identity mutation; Stripe/Supabase only when explicitly named and Owner-approved; every mutation requires verification PASS | BLOCKED BY M6 PASS |
| M8 | ADR-0062 + `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md` | provider profiles/cutover | privileged agents only after approved Roadmap/ESS/ADR package; read-only daily agents remain exception | BLOCKED BY M7 mutation/test PASS |
| M9 | ADR-0063 | incident/assurance docs | negative tests, injection/replay/exfiltration, kill-switch/break-glass/rollback drills | BLOCKED BY M8 PASS |
| M10 | dedicated future ESS/ADR/runbook | PR WebAuthn/passkey step-up | assertion bound to Owner + repo + PR + exact head + privileged action; replay/origin/RP-ID/freshness fail closed | BLOCKED BY M9 PASS |

## Current phase gate

M0–M5 are COMPLETE. PR #211 merged the final M5 documentation sync to `main@ee65ba19f64e7e8ee2d618e16364a658dfe60e4c`.

M5A has completed its **read-only baseline**. No production Auth mutation has been executed.

### M5A production evidence

Aggregate, non-secret read-only evidence:

- Supabase project `AIFINANCIAL` is healthy;
- organization plan = Free;
- native `auth.mfa_factors` count = **0**;
- current `auth.sessions` assurance = **2 × aal1 / 0 × aal2**;
- legacy application state = **2 Owner profiles with `totp_enabled=true`**;
- legacy recovery = **20 unused break-glass rows**;
- active legacy step-up tokens = **0**;
- Security Advisor warning `auth_insufficient_mfa_options` present.

This establishes that CAPITAL-AI's historical TOTP proof is separate from Supabase Native MFA/AAL2.

### M5A repository evidence

Current authoritative gaps:

- `src/platform/Security/totp.ts` implements local RFC-6238 instead of Native MFA;
- `server/stepUp.ts` stores/verifies application TOTP secrets and issues application step-up tokens;
- `TotpSettings.tsx` uses legacy profile flags/routes;
- `checkAdminAccess()` verifies identity/role but not `aal2`;
- `loginStepUpRequirement()` can fail-open when factor/status checks fail;
- `LoginStepUpGate.tsx` can accept passkey confirmation independently of the TOTP condition stated in ADR-0003.5;
- existing tests validate local TOTP math but not Native MFA enrollment/challenge/verify or AAL transitions.

ADR-0003.5 is therefore moved back from `resolved/` to active `docs/adr/` with `IN PROGRESS` status for M5A.

### M5A target chain

```text
Supabase primary session (aal1)
→ Native TOTP enroll/challenge/verify
→ trusted aal2
→ IAM role + central server AAL2 gate
→ purpose-bound one-time step-up where required
→ privileged action
→ audit evidence
```

The purpose-bound CAPITAL-AI token is additional defense-in-depth and cannot replace AAL2.

## M5A mutation state

| Mutation domain | State |
|---|---|
| Repository/application code | `REQUIRED` |
| Native TOTP enrollment for two Owner identities | `REQUIRED / NOT YET AUTHORIZED` |
| Supabase project Auth configuration | `CONDITIONAL / NOT YET VERIFIED` |
| Native MFA Postgres DDL | `NOT REQUIRED` |
| Legacy custom-TOTP cleanup | `DEFERRED / SEPARATE APPROVAL` |
| Render | `NOT REQUIRED` for baseline/design |
| Stripe | `NOT REQUIRED` |

The available Supabase connector proves factor/session/advisor state but does not expose the exact Dashboard Challenge/Verify configuration. Therefore a project-setting mutation cannot be justified unless a later pre-mutation check proves it necessary.

## M5A required test traceability

| Requirement | Required evidence |
|---|---|
| Owner/Admin AAL1 denied | negative unit/integration test |
| native enroll → challenge → verify | positive integration test |
| enrollment without verify denied | negative test |
| wrong TOTP / invalid challenge denied | negative test |
| stale `aal2/aal1` denied | negative test |
| Auth/AAL lookup failure denied | negative test |
| AAL1 + valid action-step-up denied | negative test |
| wrong user/purpose/replayed step-up denied | negative test |
| authorized AAL2 + required action-step-up allowed | positive test |
| recovery/factor reset Owner-controlled | negative + controlled recovery evidence |
| Advisor rerun | post-mutation Supabase evidence |
| no MFA secret/code in evidence | evidence review |

## Mandatory mutation state vocabulary
Every platform-affecting roadmap item must record one of:

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

A later phase may not start unless every mutation/test marked required by the preceding phase is `VERIFIED PASS`.

Current M5A: baseline = `VERIFIED READ-ONLY`; repository remediation = `PLANNED`; production Auth mutation = `NOT AUTHORIZED`.

## Autonomous agent traceability gate
Privileged autonomous/semi-autonomous agents require a Human/Owner-approved Roadmap package built from current best practices, read-only repository/production inspection, gap analysis, ESS/ADR, mutation/test gates, telemetry/audit, rollback and kill switch.

Daily/recurring agents are exempt from prior Owner approval only when strictly limited to `READ` and `ANALYZE`, with no branch/commit/PR/CI/deploy/mutation/merge capability or write credential.

No implementation phase may close without updating `docs/architecture/ROADMAP.md`, the detailed implementation roadmap and this matrix.

## Next gate

Human/Owner review and merge of the M5A baseline/architecture PR authorizes only the repository implementation phase. Production Owner-factor enrollment remains a separate later approval gate after code implementation and CI are `VERIFIED PASS`.

M6–M10 remain blocked by their sequential gates.
