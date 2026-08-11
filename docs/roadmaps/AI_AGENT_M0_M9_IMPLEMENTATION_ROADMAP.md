# AI Agent M0–M9 Implementation Roadmap

Status: IMPLEMENTATION PHASE
Baseline: `main@e2a405f4435e217ff2ba08f35a29835d4c41d5d9` (PR #192 merge)

## M0 — Evidence Baseline
COMPLETE.

## M1 — Git Guardrails
COMPLETE for current single-owner topology; future independent reviewer enables stricter review gates.

## M2 — Architecture Definition
M2A inventory/current baseline; M2B ESS-0019; M2C ADR-0057..0063; M2D trust/threat models; M2E traceability; M2F implementation roadmap; M2G Documentation Freeze.

Exit: COMPLETE. PR #192 merged; no unresolved CRITICAL design decision blocks implementation.

## M3 — CI Hardening
IN PROGRESS.

Scope authorized by M2G:
1. Preserve stable required check `build-and-test`.
2. Preserve immutable SHA-pinned Actions and minimal workflow permissions.
3. Strengthen Git 2.55.0 source integrity beyond `xz --test` using a repository-pinned cryptographic checksum and fail-closed verification before extraction/build.
4. Remove avoidable expensive CI work through path/risk-based gating without skipping required validation for code, workflow, dependency, runtime or deployment changes.
5. Keep Git repository integrity verification after checkout.
6. Add M3-specific validation/evidence documentation and update ROADMAP/traceability on merge.

M3 exit criteria:
- workflow-security validation passes;
- `build-and-test` remains the required check name;
- Git source archive checksum is pinned and verified fail-closed;
- documentation-only changes avoid unnecessary source compilation/image work where safely possible;
- TypeScript/tests/build/predeploy remain mandatory for application-affecting changes;
- no production deployment occurs from PR events;
- ROADMAP and traceability contain the M3 merge evidence.

## M4 — Agent IAM
BLOCKED BY M3. Generalize existing ADR-0050/0051/ESS-0018 into provider-neutral capability enforcement and negative tests.

## M5 — Observability/Telemetry/Audit
BLOCKED BY M3 sequencing. Extend ADR-0056/O1 with W3C/OTel correlation, immutable security audit evidence and redaction.

## M6 — Supply Chain
BLOCKED BY M3. Extend M3 CI evidence into SBOM, provenance and attestation bound to exact source/artifact digests.

## M7 — Deployment Identity
BLOCKED. Implement protected `production` environment and Render credential bridge/short-lived identity according to ADR-0061. PR #190 code is not reused blindly.

## M8 — Agent Cutover
BLOCKED. Route ChatGPT/Claude and future execution clients through Control Plane. NotebookLM remains read-only.

## M9 — Assurance
BLOCKED. Run negative tests, prompt/tool injection tests, replay tests, exfiltration tests, kill-switch/break-glass/rollback drills and independent evidence review.

## Per-step mandatory update
Every completed DevelopmentChain step MUST update:
1. `docs/architecture/ROADMAP.md` status date and baseline SHA;
2. this roadmap phase/gate;
3. `AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` evidence pointer;
4. affected ADR/ESS status if changed.

M2G Documentation Freeze is COMPLETE; code/config implementation is now authorized only in the currently opened phase and may not skip phase gates.