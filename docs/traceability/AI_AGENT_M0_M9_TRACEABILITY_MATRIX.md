# AI Agent M0–M9 Traceability Matrix

| Phase | Authority | Primary documents | Exit evidence |
|---|---|---|---|
| M0 | M0 Evidence Baseline | `docs/evidence/m0/*` | PASS baseline |
| M1 | Git Guardrails | main protection policy/CODEOWNERS | protected main + stable `build-and-test` |
| M2 | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | Documentation Freeze |
| M3 | ADR-0060 + Git governance | CI hardening docs | secure/efficient CI controls |
| M4 | ADR-0058 + ADR-0050/0051 | IAM/capability docs | deny-by-default agent authorization |
| M5 | ADR-0059 + ADR-0056 | audit/telemetry/redaction docs | end-to-end correlation |
| M6 | ADR-0060 | supply-chain model | SBOM/provenance/attestation |
| M7 | ADR-0061 | deployment identity | protected deployment identity |
| M8 | ADR-0062 | provider profile/cutover docs | all AI clients routed through Control Plane |
| M9 | ADR-0063 | incident/assurance docs | negative tests/drills/independent review |

No implementation phase may close without updating `docs/architecture/ROADMAP.md` and this matrix.