# AI Agent M0–M9 Implementation Roadmap

Status: IMPLEMENTATION PHASE
Baseline: `main@c093052c22ed620bc9b086ba4ec05612d7dd2150` (PR #197 merge)

## M0 — Evidence Baseline
COMPLETE.

## M1 — Git Guardrails
COMPLETE for current single-owner topology. Human/Owner review is now a mandatory merge gate.

## M2 — Architecture Definition
COMPLETE. ESS-0019, ADR-0057..0063, trust/threat models, traceability and Documentation Freeze are established.

## M3 — CI Hardening
COMPLETE via PR #195/#196. Full validation, docs-only Fast Path, cryptographic Git source verification and stable required check `build-and-test` are established. PR #197 additionally separates heavy `technical-validation` from the lightweight Human/Owner final gate.

## M4 — Agent IAM
IN PROGRESS.

Scope:
1. Generalize ADR-0050/0051/ESS-0018 into provider-neutral capability enforcement under ADR-0058/ESS-0019.
2. Introduce canonical non-inheriting capabilities: READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST, PRODUCTION_MUTATION.
3. Keep MERGE outside the agent capability vocabulary and behind Human/Owner governance.
4. Bind decisions to attributable human/app/agent/session/request/credential principals.
5. Treat provider/model identifiers as non-authoritative metadata.
6. Fail closed on unknown capability, incomplete principal, missing exact grant, expired/mismatched approval or missing step-up.
7. Block PRODUCTION_MUTATION from development principals.
8. Add kill-switch handling for mutating capabilities.
9. Preserve ESS-0018 tool-specific capability grants, approvals and PolicyGate checks as an independent second layer.
10. Add negative tests for privilege non-inheritance and self-approval prevention.

M4 exit criteria:
- provider-neutral Agent IAM contract is code-backed;
- deny-by-default PolicyGate integration exists;
- negative tests are green;
- MERGE remains human-only;
- no direct Stripe/Supabase/Render production mutation is introduced;
- ROADMAP, traceability and M4 evidence are updated;
- technical/governance CI passes;
- Owner reviews every changed file, checks both attestations and submits current-commit `💪` or `okay` review;
- merge occurs only after explicit human merge instruction.

## M5 — Observability/Telemetry/Audit
BLOCKED BY M4. After M4 closure, extend ADR-0056/O1 with W3C/OTel correlation, immutable security audit evidence and redaction.

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
