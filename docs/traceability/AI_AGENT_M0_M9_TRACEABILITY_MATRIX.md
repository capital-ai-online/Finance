# AI Agent M0–M10 Traceability Matrix

> Legacy filename retained for stable references; scope now includes M10.

| Phase | Authority | Primary documents / implementation | Mutation/Test gate | Exit evidence |
|---|---|---|---|---|
| M0 | M0 Evidence Baseline | `docs/evidence/m0/*` | read-only | PASS baseline |
| M1 | Git Guardrails | main protection/CODEOWNERS + Human/Owner policy | Owner-reviewed GitHub policy changes | protected main + stable `build-and-test` + Owner review gate |
| M2 | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | no production mutation | PR #192 + M2G PR #194; Documentation Freeze COMPLETE |
| M3 | ADR-0060 + ADR-0053 | `.github/workflows/ci.yml`, `docs/evidence/m3/*` | one required `build-and-test`; current-head review then final Owner-checkbox edit triggers expensive CI | PR #195/#196/#204/#208 COMPLETE |
| M4 | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 | `src/platform/Security/agentIam.ts`, `src/platform/Compliance/PolicyGate.ts`, `tests/unit/agentIam.test.ts`, `docs/evidence/m4/M4_AGENT_IAM_EVIDENCE.md` | no Stripe/Supabase/Render production mutation; negative IAM tests + Human/Owner gate | PR #198/#202 COMPLETE |
| M5 | ADR-0059 + ADR-0056 | `public.agent_audit_events`, `server/agentAudit/*`, `tests/unit/agentAudit.test.ts`, `docs/evidence/m5/*` | persistence mutation `VERIFIED PASS`; application substep mutation `NOT REQUIRED`; Owner-reviewed runtime/application checks PASS | **COMPLETE / VERIFIED PASS** — PR #210, CI #892, merge `e39d5370d8b1498e84952535a38a339cc200082f` |
| M5A | existing IAM/Step-up ADRs + Supabase Auth guidance | TOTP enrollment/challenge/verify + privileged AAL2 enforcement | read-only auth baseline → Owner approval → mutation/config only if required → positive/negative AAL2 tests → advisor/evidence | UNBLOCKED AFTER M5 POST-MERGE SYNC; Leaked Password Protection DEFERRED plan dependency |
| M6 | ADR-0060 | supply-chain model | SBOM/provenance/attestation verification; no implicit external-platform mutation | BLOCKED BY M5A PASS |
| M7 | ADR-0061 + platform-specific ADR/runbooks | deployment identity + approved platform mutation plans | Render production identity mutation; Stripe/Supabase only when explicitly named and Owner-approved; every mutation requires verification PASS | BLOCKED BY M6 PASS |
| M8 | ADR-0062 + `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md` | provider profiles/cutover | privileged agents only after approved Roadmap/ESS/ADR package; read-only daily agents remain exception | BLOCKED BY M7 mutation/test PASS |
| M9 | ADR-0063 | incident/assurance docs | negative tests, injection/replay/exfiltration, kill-switch/break-glass/rollback drills | BLOCKED BY M8 PASS |
| M10 | dedicated future ESS/ADR/runbook | PR WebAuthn/passkey step-up | assertion bound to Owner + repo + PR + exact head + privileged action; replay/origin/RP-ID/freshness fail closed | BLOCKED BY M9 PASS |

## Current phase gate

M0–M5 are complete from an implementation and verification perspective. PR #210 was merged as `e39d5370d8b1498e84952535a38a339cc200082f` after final Human/Owner review and required CI run #892 (`31559124198`) passed.

M5 durable Supabase persistence remains `VERIFIED PASS`. The application integration is also `VERIFIED PASS`:
- server-side append-only audit writer merged;
- provider-neutral authorization coupled to durable evidence;
- canonical Telemetry secret/PII redaction reused;
- complete prompts/diffs/raw request-response bodies omitted;
- validated `auditReference` propagation;
- terminal outcome stored as a second append-only correlated event;
- TypeScript, audit unit/negative tests, production build/predeploy and Docker/runtime checks passed.

Application integration mutation state: **NOT REQUIRED**. No new Supabase/Stripe/Render mutation was performed by PR #210.

This post-merge synchronization is the final M5 documentation gate. Once merged to `main`, M5A may start with a **read-only** TOTP/AAL2 baseline. No Supabase Auth mutation may occur until its exact need is established and Human/Owner approval is recorded.

M6–M10 remain blocked by their sequential gates.

## Mandatory mutation state vocabulary
Every platform-affecting roadmap item must record one of:

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

A later phase may not start unless every mutation/test marked required by the preceding phase is `VERIFIED PASS`.

For M5 application integration: `Supabase mutation = NOT REQUIRED`, implementation/test state = `VERIFIED PASS`.

For M5A: initial assessment state = `PLANNED / READ-ONLY`; any Supabase Auth mutation remains unauthorized until separately approved.

## Autonomous agent traceability gate
Privileged autonomous/semi-autonomous agents require a Human/Owner-approved Roadmap package built from Deep Research/current best practices, read-only repository/production inspection, gap analysis, ESS/ADR, mutation/test gates, telemetry/audit, rollback and kill switch.

Daily/recurring agents are exempt from prior Owner approval only when strictly limited to `READ` and `ANALYZE`, with no branch/commit/PR/CI/deploy/mutation/merge capability or write credential.

No implementation phase may close without updating `docs/architecture/ROADMAP.md`, the detailed implementation roadmap and this matrix.
