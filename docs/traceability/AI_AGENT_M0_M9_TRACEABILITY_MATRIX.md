# AI Agent M0–M10 Traceability Matrix

> Legacy filename retained for stable references; scope now includes M10.

| Phase | Authority | Primary documents / implementation | Mutation/Test gate | Exit evidence |
|---|---|---|---|---|
| M0 | M0 Evidence Baseline | `docs/evidence/m0/*` | read-only | PASS baseline |
| M1 | Git Guardrails | main protection/CODEOWNERS + Human/Owner policy | Owner-reviewed GitHub policy changes | protected main + stable `build-and-test` + Owner review gate |
| M2 | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | no production mutation | PR #192 + M2G PR #194; Documentation Freeze COMPLETE |
| M3 | ADR-0060 + ADR-0053 | `.github/workflows/ci.yml`, `docs/evidence/m3/*` | one required `build-and-test`; current-head review then final Owner-checkbox edit triggers expensive CI | PR #195/#196/#204/#208 COMPLETE |
| M4 | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 | `src/platform/Security/agentIam.ts`, `src/platform/Compliance/PolicyGate.ts`, `tests/unit/agentIam.test.ts`, `docs/evidence/m4/M4_AGENT_IAM_EVIDENCE.md` | no Stripe/Supabase/Render production mutation; negative IAM tests + Human/Owner gate | PR #198/#202 COMPLETE |
| M5 | ADR-0059 + ADR-0056 | `public.agent_audit_events`, `server/agentAudit/*`, `tests/unit/agentAudit.test.ts`, `docs/evidence/m5/*` | persistence mutation `VERIFIED PASS`; application substep mutation `NOT REQUIRED`; Owner-reviewed class C tests must PASS | PERSISTENCE PASS; APP INTEGRATION IN REVIEW |
| M5A | existing IAM/Step-up ADRs + Supabase Auth guidance | TOTP enrollment/challenge/verify + privileged AAL2 enforcement | read-only auth baseline → Owner approval → mutation/config only if required → positive/negative AAL2 tests → advisor/evidence | BLOCKED BY M5 APP PASS; Leaked Password Protection DEFERRED plan dependency |
| M6 | ADR-0060 | supply-chain model | SBOM/provenance/attestation verification; no implicit external-platform mutation | BLOCKED BY M5 + M5A PASS |
| M7 | ADR-0061 + platform-specific ADR/runbooks | deployment identity + approved platform mutation plans | Render production identity mutation; Stripe/Supabase only when explicitly named and Owner-approved; every mutation requires verification PASS | BLOCKED BY M6 PASS |
| M8 | ADR-0062 + `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md` | provider profiles/cutover | privileged agents only after approved Roadmap/ESS/ADR package; read-only daily agents remain exception | BLOCKED BY M7 mutation/test PASS |
| M9 | ADR-0063 | incident/assurance docs | negative tests, injection/replay/exfiltration, kill-switch/break-glass/rollback drills | BLOCKED BY M8 PASS |
| M10 | dedicated future ESS/ADR/runbook | PR WebAuthn/passkey step-up | assertion bound to Owner + repo + PR + exact head + privileged action; replay/origin/RP-ID/freshness fail closed | BLOCKED BY M9 PASS |

## Current phase gate

M0–M4 are COMPLETE. PR #208 is merged at `af88fcdfbc0d6b4a466ce734c0787ad0b6277dd8` and defines the current single-CI trigger sequence.

M5 durable Supabase persistence is `VERIFIED PASS`. The remaining M5 application integration is `IN REVIEW` on `agent/m5-audit-writer-e2e` and requires no new Supabase mutation because the verified `agent_audit_events` schema is sufficient.

The application review branch introduces:
- one server-side append-only audit writer;
- canonical server adapter coupling provider-neutral authorization to durable evidence;
- existing Telemetry secret/PII redaction reuse;
- explicit omission of complete prompts/diffs/raw request-response bodies;
- `auditReference` propagation;
- unit/negative tests for correlation and fail-closed persistence.

M5A may start only after the M5 application PR is Human-reviewed, the single `build-and-test` passes, the code is merged, and M5 evidence is synchronized to the final merge SHA.

M6–M10 remain blocked by the sequential gates.

## Mandatory mutation state vocabulary
Every platform-affecting roadmap item must record one of:

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

A later phase may not start unless every mutation/test marked required by the preceding phase is `VERIFIED PASS`.

For the current M5 application substep: `Supabase mutation = NOT REQUIRED`; the existing production audit table is consumed without schema/config mutation.

## Autonomous agent traceability gate
Privileged autonomous/semi-autonomous agents require a Human/Owner-approved Roadmap package built from Deep Research/current best practices, read-only repository/production inspection, gap analysis, ESS/ADR, mutation/test gates, telemetry/audit, rollback and kill switch.

Daily/recurring agents are exempt from prior Owner approval only when strictly limited to `READ` and `ANALYZE`, with no branch/commit/PR/CI/deploy/mutation/merge capability or write credential.

No implementation phase may close without updating `docs/architecture/ROADMAP.md`, the detailed implementation roadmap and this matrix.
