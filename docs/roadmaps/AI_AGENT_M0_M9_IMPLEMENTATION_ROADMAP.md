# AI Agent M0–M9 Implementation Roadmap

Status: IMPLEMENTATION PHASE
Baseline: `main@c093052c22ed620bc9b086ba4ec05612d7dd2150` (PR #197 merge)

## M0 — Evidence Baseline
COMPLETE.

## M1 — Git Guardrails
COMPLETE for current single-owner topology. Human/Owner review is now enforced through the PR checklist + current-commit review gate.

## M2 — Architecture Definition
M2A inventory/current baseline; M2B ESS-0019; M2C ADR-0057..0063; M2D trust/threat models; M2E traceability; M2F implementation roadmap; M2G Documentation Freeze.

Exit: COMPLETE.

## M3 — CI Hardening
COMPLETE.

Evidence:
- PR #195 full-path CI hardening;
- PR #196 docs-only Fast Path proof;
- cryptographic Git 2.55.0 archive verification;
- stable required check `build-and-test`;
- technical validation separated from the light Human/Owner gate by PR #197.

## M4 — Agent IAM
IN REVIEW / ACTIVE.

Authorized scope:
1. Generalize ADR-0050/0051/ESS-0018 into a provider-neutral authorization core.
2. Bind authorization to attributable human actor + app/client + agent + session + tool credential holder.
3. Require explicit capability grants; deny by default.
4. Classify READ/ANALYZE/PLAN/BRANCH/COMMIT/PR/CI_REQUEST/DEPLOY_REQUEST/PRODUCTION_MUTATION into LOW/MEDIUM/HIGH/CRITICAL risk.
5. Require human approval for HIGH/CRITICAL; require step-up for CRITICAL.
6. Reject self-approval, stale/mismatched approval and missing grants.
7. Keep MERGE outside the agent capability namespace and under the Human/Owner PR gate.
8. Add negative tests and M4 evidence.

M4 exit criteria:
- provider-neutral policy module exists and is independent of provider/model name;
- explicit grants are required for every agent capability;
- negative tests prove fail-closed identity/grant/approval behavior;
- MERGE cannot be granted to an agent;
- no production provider/database/deployment mutation is introduced by M4;
- full CI/Governance pass;
- Human/Owner checklist + current-commit review completed before merge;
- ROADMAP/traceability/ADR evidence synchronized.

## M5 — Observability/Telemetry/Audit
BLOCKED BY M4. Extend ADR-0056/O1 with W3C/OTel correlation, immutable security audit evidence and redaction.

## M6 — Supply Chain
BLOCKED BY M4/M5. Extend M3 CI evidence into SBOM, provenance and attestation bound to exact source/artifact digests.

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

No later phase may be opened before the active phase passes its Human/Owner merge gate.