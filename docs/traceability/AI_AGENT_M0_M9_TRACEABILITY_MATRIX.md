# AI Agent M0–M9 Traceability Matrix

| Phase | Authority | Primary documents / implementation | Mutation/Test gate | Exit evidence |
|---|---|---|---|---|
| M0 | M0 Evidence Baseline | `docs/evidence/m0/*` | read-only | PASS baseline |
| M1 | Git Guardrails | main protection/CODEOWNERS + Human/Owner policy | Owner-reviewed GitHub policy changes | protected main + stable `build-and-test` + Owner review gate |
| M2 | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | no production mutation | PR #192 + M2G PR #194; Documentation Freeze COMPLETE |
| M3 | ADR-0060 + ADR-0053 | `.github/workflows/ci.yml`, `docs/evidence/m3/*` | CI mutation verified by full/docs-fast paths | PR #195/#196 COMPLETE |
| M4 | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 | `src/platform/Security/agentIam.ts`, `src/platform/Compliance/PolicyGate.ts`, `tests/unit/agentIam.test.ts`, `docs/evidence/m4/M4_AGENT_IAM_EVIDENCE.md` | no Stripe/Supabase/Render production mutation; negative IAM tests + Human/Owner gate | PR #198 merged at `69f719683b60ba6aadc0022381c6cecc430f0ea5`; PR #202 CLOSURE IN REVIEW |
| M5 | ADR-0059 + ADR-0056 | audit/telemetry/redaction implementation | determine Supabase mutation REQUIRED/NOT REQUIRED; if required: pretest/staging → Owner approve → mutate → verify → evidence | BLOCKED BY M4 CLOSURE |
| M6 | ADR-0060 | supply-chain model | SBOM/provenance/attestation verification; no implicit external-platform mutation | BLOCKED BY M5 PASS |
| M7 | ADR-0061 + platform-specific ADR/runbooks | deployment identity + approved platform mutation plans | Render production identity mutation; Stripe/Supabase only when explicitly named and Owner-approved; every mutation requires verification PASS | BLOCKED BY M6 PASS |
| M8 | ADR-0062 + `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md` | provider profiles/cutover | no autonomous agent creation before approved concept; controlled cutover test | BLOCKED BY M7 mutation/test PASS |
| M9 | ADR-0063 | incident/assurance docs | negative tests, injection/replay/exfiltration, kill-switch/break-glass/rollback drills | BLOCKED BY M8 PASS |

## Current phase gate
M3 is COMPLETE. PR #198 merged the canonical M4 implementation into `main` after Human/Owner review.

PRs #200 and #201 are superseded parallel M4 drafts. PR #202 is the single M4 consolidation/closure PR and preserves the canonical roadmap sequencing.

M5–M9 remain blocked until PR #202 is technically validated, Human/Owner-reviewed and merged.

## Mandatory mutation state vocabulary
Every platform-affecting roadmap item must record one of:

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

A later phase may not start unless every mutation/test marked required by the preceding phase is `VERIFIED PASS`.

## Autonomous agent traceability gate
Before an autonomous/semi-autonomous agent is created or enabled, traceability must include a Human/Owner-approved concept covering purpose, capabilities, target systems, risks, mutation points, tests, telemetry/audit and rollback/kill switch. Ad-hoc agent creation from chat or model output is prohibited.

No implementation phase may close without updating `docs/architecture/ROADMAP.md`, the detailed M0–M9 implementation roadmap and this matrix.
