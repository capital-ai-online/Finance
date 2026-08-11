# AI Agent M0–M9 Traceability Matrix

| Phase | Authority | Primary documents / code | Exit evidence |
|---|---|---|---|
| M0 | M0 Evidence Baseline | `docs/evidence/m0/*` | PASS baseline |
| M1 | Git Guardrails | main protection policy/CODEOWNERS + Human/Owner gate | protected main + stable `build-and-test` |
| M2 | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | PR #192 + M2G closure; Documentation Freeze COMPLETE |
| M3 | ADR-0060 + ADR-0053 + Git governance | `.github/workflows/ci.yml`, `docs/evidence/m3/*` | COMPLETE: full-path hardening + verified docs fast path |
| M4 | ADR-0058 + ADR-0050/0051 | `src/platform/Security/agentAuthorization.ts`, existing Supabase capability/approval IAM, M4 evidence | IN PROGRESS: provider-neutral deny-by-default authorization + negative tests + Human/Owner reviewed merge |
| M5 | ADR-0059 + ADR-0056 | audit/telemetry/redaction docs | BLOCKED: end-to-end correlation after M4 closure |
| M6 | ADR-0060 | supply-chain model | BLOCKED: SBOM/provenance/attestation |
| M7 | ADR-0061 | deployment identity | BLOCKED: protected deployment identity |
| M8 | ADR-0062 | provider profile/cutover docs | BLOCKED: all AI clients routed through Control Plane |
| M9 | ADR-0063 | incident/assurance docs | BLOCKED: negative tests/drills/independent review |

## Current phase gate

Baseline: `main@c093052c22ed620bc9b086ba4ec05612d7dd2150` after PR #197.

M0–M3 are complete. M4 is the only authorized implementation phase. M5–M9 remain blocked until the M4 implementation passes full CI, negative authorization tests, the Human/Owner review gate, is explicitly merged by the Owner, and this matrix plus `docs/architecture/ROADMAP.md` are synchronized to the M4 merge SHA.

## M4 control traceability

| Requirement | Implementation / evidence | State |
|---|---|---|
| provider-neutral principal | `AgentPrincipal` binds human actor + app + agent + session | IMPLEMENTED IN REVIEW |
| provider/model not trust root | provider/model metadata ignored for authority | IMPLEMENTED IN REVIEW |
| explicit capability grants | `authorizeAgentExecution()` requires requested capability in grant set | IMPLEMENTED IN REVIEW |
| risk classification | LOW/MEDIUM/HIGH/CRITICAL deterministic map | IMPLEMENTED IN REVIEW |
| HIGH/CRITICAL approval | explicit approval mandatory | IMPLEMENTED IN REVIEW |
| CRITICAL step-up | verified step-up mandatory for `PRODUCTION_MUTATION` | IMPLEMENTED IN REVIEW |
| MERGE separation | `MERGE` excluded from capability enum and denied; Human/Owner policy remains authority | IMPLEMENTED IN REVIEW |
| existing product/tool IAM preserved | ADR-0050/0051 Supabase `capability_grants`, approvals, PolicyGate unchanged | PRESERVED |
| negative authorization tests | `tests/unit/agentAuthorization.test.ts` | PENDING CI |
| Owner-visible review | PR checklist + Viewed files + current-head `💪`/`okay` review | PENDING PR |

No implementation phase may close without updating `docs/architecture/ROADMAP.md` and this matrix.
