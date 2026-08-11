# AI Agent M0–M9 Implementation Roadmap

Status: IMPLEMENTATION PHASE
Baseline: `main@69f719683b60ba6aadc0022381c6cecc430f0ea5` (PR #198 merge)

## M0 — Evidence Baseline
COMPLETE.

## M1 — Git Guardrails
COMPLETE for current single-owner topology. Human/Owner review is a mandatory merge gate.

## M2 — Architecture Definition
COMPLETE. ESS-0019, ADR-0057..0063, trust/threat models, traceability and Documentation Freeze are established.

## M3 — CI Hardening
COMPLETE via PR #195/#196. PR #197 additionally established the Human/Owner final gate.

## M4 — Agent IAM
CLOSURE IN REVIEW.

PR #198 merged the canonical provider-neutral Agent IAM implementation. Parallel drafts #200/#201 are superseded; only controls consistent with ADR-0058 and the canonical risk ladder are retained.

Canonical M4 scope:
1. Explicit non-inheriting capabilities: READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST, PRODUCTION_MUTATION.
2. MERGE remains outside agent capability vocabulary and behind Human/Owner governance.
3. Principal attribution binds human/app/agent/session/request/credential holder.
4. Provider/model identifiers are non-authoritative metadata.
5. LOW: READ/ANALYZE/PLAN; MEDIUM: BRANCH/COMMIT/PR/CI_REQUEST; HIGH: DEPLOY_REQUEST; CRITICAL: PRODUCTION_MUTATION.
6. Context may increase but never reduce canonical minimum risk.
7. HIGH requires current Human Approval; CRITICAL requires Human Approval plus Step-up.
8. Approval binds human actor + subject agent + capability + target and must be unexpired.
9. PRODUCTION_MUTATION is denied to development principals.
10. Kill switch denies mutating capabilities.
11. ESS-0018 tool-specific grants, approvals and PolicyGate remain an independent second layer.
12. Negative tests cover privilege inheritance, approval mismatch, risk under-classification, MERGE, self-approval and production boundary.

M4 closure criteria:
- consolidation tests/CI are green;
- #200/#201 are closed as superseded;
- Owner reviews every changed file, checks both attestations and submits current-commit `💪` or `okay` review;
- merge occurs only after explicit human merge instruction;
- after merge, M4 is COMPLETE and M5 is authorized.

## M5 — Observability/Telemetry/Audit
BLOCKED BY M4 CLOSURE. After closure, extend ADR-0056/O1 with W3C/OTel correlation, immutable security audit evidence and redaction.

## M6 — Supply Chain
BLOCKED BY M4/M5. Extend M3 evidence into SBOM, provenance and attestation bound to exact source/artifact digests.

## M7 — Deployment Identity
BLOCKED. Implement protected production identity according to ADR-0061 only after prior gates.

## M8 — Agent Cutover
BLOCKED. Route ChatGPT/Claude and future execution clients through the Control Plane. NotebookLM remains read-only.

## M9 — Assurance
BLOCKED. Run negative tests, prompt/tool injection tests, replay tests, exfiltration tests, kill-switch/break-glass/rollback drills and independent evidence review.

## Per-step mandatory update
Every completed DevelopmentChain step MUST update:
1. `docs/architecture/ROADMAP.md` status date and baseline SHA;
2. this roadmap phase/gate;
3. `AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` evidence pointer;
4. affected ADR/ESS status if changed.

No implementation phase may skip the Human/Owner merge gate or a preceding phase closure.
