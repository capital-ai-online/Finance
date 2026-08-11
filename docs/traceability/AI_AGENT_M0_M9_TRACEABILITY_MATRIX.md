# AI Agent M0–M9 Traceability Matrix

| Phase | Authority | Primary documents / implementation | Exit evidence |
|---|---|---|---|
| M0 | M0 Evidence Baseline | `docs/evidence/m0/*` | PASS baseline |
| M1 | Git Guardrails | main protection/CODEOWNERS + Human/Owner policy | protected main + stable `build-and-test` + Owner review gate |
| M2 | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | PR #192 + M2G PR #194; Documentation Freeze COMPLETE |
| M3 | ADR-0060 + ADR-0053 | `.github/workflows/ci.yml`, `docs/evidence/m3/*` | PR #195/#196; cryptographic Git verification + full/docs-fast paths COMPLETE |
| M4 | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 | `src/platform/Security/agentIam.ts`, `src/platform/Compliance/PolicyGate.ts`, `tests/unit/agentIam.test.ts`, `docs/evidence/m4/M4_AGENT_IAM_EVIDENCE.md` | PR #198 merged at `69f719683b60ba6aadc0022381c6cecc430f0ea5`; CLOSURE IN REVIEW in the single consolidation PR |
| M5 | ADR-0059 + ADR-0056 | audit/telemetry/redaction docs | BLOCKED BY M4 CLOSURE; end-to-end correlation |
| M6 | ADR-0060 | supply-chain model | BLOCKED; SBOM/provenance/attestation |
| M7 | ADR-0061 | deployment identity | BLOCKED; protected deployment identity |
| M8 | ADR-0062 | provider profile/cutover docs | BLOCKED; all execution clients routed through Control Plane |
| M9 | ADR-0063 | incident/assurance docs | BLOCKED; negative tests/drills/independent review |

## Current phase gate
M3 is COMPLETE. PR #198 merged the canonical M4 implementation into `main`.

PRs #200 and #201 are parallel M4 drafts from the older PR-#197 baseline and are superseded. Their useful, roadmap-consistent delta is consolidated into one closure PR based on current `main`:

- preserve the PR-#198 risk ladder;
- bind Human Approval additionally to the exact logical `agentId`;
- HIGH requires Human Approval;
- CRITICAL requires Human Approval plus Step-up;
- keep MERGE outside the agent capability model;
- retain the stronger request/credential/target/environment/kill-switch controls from PR #198.

M5–M9 remain blocked until the M4 consolidation/closure PR is technically validated, Human/Owner-reviewed and merged.

No implementation phase may close without updating `docs/architecture/ROADMAP.md` and this matrix.
