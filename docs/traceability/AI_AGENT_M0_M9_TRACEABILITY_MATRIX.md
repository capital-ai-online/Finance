# AI Agent M0–M9 Traceability Matrix

| Phase | Authority | Primary documents | Exit evidence |
|---|---|---|---|
| M0 | M0 Evidence Baseline | `docs/evidence/m0/*` | PASS baseline |
| M1 | Git Guardrails | main protection policy/CODEOWNERS + Human/Owner policy | protected main + stable `build-and-test` + owner review gate |
| M2 | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | PR #192 + #194; Documentation Freeze COMPLETE |
| M3 | ADR-0060 + ADR-0053 + Git governance | `.github/workflows/ci.yml`, `docs/evidence/m3/*` | PR #195 full path + PR #196 docs Fast Path; COMPLETE |
| M4 | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 | `src/platform/Security/agentAuthorization.ts`, `tests/unit/agentAuthorization.test.ts`, `docs/evidence/m4/M4_AGENT_IAM_EVIDENCE.md` | IN REVIEW: provider-neutral deny-by-default capability/risk authorization + negative tests + MERGE separation |
| M5 | ADR-0059 + ADR-0056 | audit/telemetry/redaction docs | BLOCKED until M4 Human/Owner-approved merge |
| M6 | ADR-0060 | supply-chain model | BLOCKED until M4/M5 closure |
| M7 | ADR-0061 | deployment identity | BLOCKED |
| M8 | ADR-0062 | provider profile/cutover docs | BLOCKED |
| M9 | ADR-0063 | incident/assurance docs | BLOCKED |

## Current phase gate
M0–M3 are complete. PR #197 merged the Human/Owner PR approval gate at `c093052c22ed620bc9b086ba4ec05612d7dd2150`. M4 is the only authorized implementation phase.

M4 may close only when:

1. provider-neutral authorization code and negative tests pass CI;
2. `MERGE` remains outside the agent capability namespace;
3. no production provider/database/deployment mutation is introduced;
4. the M4 pull request has all files reviewed/Viewed, both Owner attestations checked, and a current-commit Owner review with `💪` or `okay`;
5. the M4 merge SHA is recorded in ROADMAP and this matrix.

No implementation phase may close without updating `docs/architecture/ROADMAP.md` and this matrix.