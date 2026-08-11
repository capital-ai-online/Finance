# AI Agent M0–M9 Traceability Matrix

| Phase | Authority | Primary documents / code | Exit evidence |
|---|---|---|---|
| M0 | M0 Evidence Baseline | `docs/evidence/m0/*` | PASS baseline |
| M1 | Git Guardrails | main protection policy/CODEOWNERS/Human-Owner gate | protected main + stable `build-and-test` |
| M2 | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | Documentation Freeze COMPLETE |
| M3 | ADR-0060 + ADR-0053 + Git governance | `.github/workflows/ci.yml`, `docs/evidence/m3/*` | COMPLETE: Full Path + Docs Fast Path + cryptographic Git verification |
| M4 | ADR-0058 + ADR-0050/0051 | `src/platform/Security/agentAuthorization.ts`, existing domain grants/approvals | IN PROGRESS: provider-neutral deny-by-default authorization + MERGE separation |
| M5 | ADR-0059 + ADR-0056 | audit/telemetry/redaction docs | blocked until M4 exit |
| M6 | ADR-0060 | supply-chain model | SBOM/provenance/attestation |
| M7 | ADR-0061 | deployment identity | protected deployment identity |
| M8 | ADR-0062 | provider profile/cutover docs | all AI clients routed through Control Plane |
| M9 | ADR-0063 | incident/assurance docs | negative tests/drills/independent review |

## Current phase gate

M0–M3 are complete. PR #197 established the Human/Owner merge gate. M4 is the only authorized implementation phase.

M4 requires:

1. attributable execution principal: human actor + client/app + agent session + credential holder;
2. enumerated provider-neutral capabilities only;
3. deny-by-default authorization;
4. HIGH actions require human approval;
5. CRITICAL actions require human approval + step-up;
6. MERGE must remain outside the agent capability set;
7. negative tests proving denial paths;
8. Human/Owner-reviewed PR validation before closure.

M5–M9 remain blocked until M4 exit evidence is merged and this matrix plus `docs/architecture/ROADMAP.md` are updated.

No implementation phase may close without updating `docs/architecture/ROADMAP.md`, this matrix and the applicable evidence artifact.
