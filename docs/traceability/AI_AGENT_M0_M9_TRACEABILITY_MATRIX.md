# AI Agent M0–M9 Traceability Matrix

| Phase | Authority | Primary documents / implementation | Exit evidence |
|---|---|---|---|
| M0 | M0 Evidence Baseline | `docs/evidence/m0/*` | PASS baseline |
| M1 | Git Guardrails | main protection/CODEOWNERS + Human/Owner policy | protected main + stable `build-and-test` + Owner review gate |
| M2 | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | PR #192 + M2G PR #194; Documentation Freeze COMPLETE |
| M3 | ADR-0060 + ADR-0053 | `.github/workflows/ci.yml`, `docs/evidence/m3/*` | PR #195/#196; cryptographic Git verification + full/docs-fast paths COMPLETE |
| M4 | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 | `src/platform/Security/agentIam.ts`, `src/platform/Compliance/PolicyGate.ts`, `tests/unit/agentIam.test.ts`, `docs/evidence/m4/M4_AGENT_IAM_EVIDENCE.md` | IN PROGRESS: provider-neutral deny-by-default capability/principal/risk policy + negative tests; Human/Owner merge separation preserved |
| M5 | ADR-0059 + ADR-0056 | audit/telemetry/redaction docs | BLOCKED BY M4; end-to-end correlation |
| M6 | ADR-0060 | supply-chain model | BLOCKED; SBOM/provenance/attestation |
| M7 | ADR-0061 | deployment identity | BLOCKED; protected deployment identity |
| M8 | ADR-0062 | provider profile/cutover docs | BLOCKED; all execution clients routed through Control Plane |
| M9 | ADR-0063 | incident/assurance docs | BLOCKED; negative tests/drills/independent review |

## Current phase gate
M3 is COMPLETE. M4 is the only authorized implementation phase on baseline `main@c093052c22ed620bc9b086ba4ec05612d7dd2150`.

M4 may close only after technical/governance validation and explicit Human/Owner review of the current PR head. M5–M9 remain blocked until M4 closure evidence and the resulting merge SHA are synchronized into this matrix and `docs/architecture/ROADMAP.md`.

No implementation phase may close without updating `docs/architecture/ROADMAP.md` and this matrix.
