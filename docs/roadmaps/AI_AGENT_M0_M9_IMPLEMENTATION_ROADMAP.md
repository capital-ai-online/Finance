# AI Agent M0–M9 Implementation Roadmap

Status: DOCUMENTATION PHASE
Baseline: `main@1c3706c4f24e5f5a9fe5b0398a2fcd5bee758b17`

## M0 — Evidence Baseline
COMPLETE.

## M1 — Git Guardrails
COMPLETE for current single-owner topology; future independent reviewer enables stricter review gates.

## M2 — Architecture Definition
M2A inventory/current baseline; M2B ESS-0019; M2C ADR-0057..0063; M2D trust/threat models; M2E traceability; M2F implementation roadmap; M2G Documentation Freeze.

Exit: all documents merged, no unresolved CRITICAL design decision, ROADMAP marks `DOCUMENTATION FREEZE = COMPLETE`.

## M3 — CI Hardening
Only after M2G. Secure Git toolchain source, enforce workflow permissions/pinning, eliminate unnecessary expensive builds while preserving required checks.

## M4 — Agent IAM
Generalize existing ADR-0050/0051/ESS-0018 into provider-neutral capability enforcement and negative tests.

## M5 — Observability/Telemetry/Audit
Extend ADR-0056/O1 with W3C/OTel correlation, immutable security audit evidence and redaction.

## M6 — Supply Chain
Export SBOM, bind digest/provenance/attestation to exact source and artifact.

## M7 — Deployment Identity
Implement protected `production` environment and Render credential bridge/short-lived identity according to ADR-0061. PR #190 code is not reused blindly.

## M8 — Agent Cutover
Route ChatGPT/Claude and future execution clients through Control Plane. NotebookLM remains read-only.

## M9 — Assurance
Run negative tests, prompt/tool injection tests, replay tests, exfiltration tests, kill-switch/break-glass/rollback drills and independent evidence review.

## Per-step mandatory update
Every completed DevelopmentChain step MUST update:
1. `docs/architecture/ROADMAP.md` status date and baseline SHA;
2. this roadmap phase/gate;
3. `AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` evidence pointer;
4. affected ADR/ESS status if changed.

No code/config implementation is authorized before M2G Documentation Freeze.