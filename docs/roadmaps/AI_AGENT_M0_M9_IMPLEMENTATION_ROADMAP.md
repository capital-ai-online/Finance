# AI Agent M0–M9 Implementation Roadmap

Status: IMPLEMENTATION PHASE
Baseline: `main@69f719683b60ba6aadc0022381c6cecc430f0ea5` (PR #198 merge)

## Global execution rule
Every phase that contains a platform mutation follows:

`CONCEPT → HUMAN APPROVAL → PRE-MUTATION TEST → MUTATION → POST-MUTATION VERIFICATION → EVIDENCE → ROADMAP UPDATE → NEXT PHASE`

No later phase may start while a required mutation/test is missing, failed, inconclusive or undocumented.

No autonomous/semi-autonomous agent may be created or enabled before a predefined roadmap concept is Human/Owner-approved under `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md`.

## M0 — Evidence Baseline
COMPLETE.

Mutation gate: none; evidence collection is read-only.

## M1 — Git Guardrails
COMPLETE for current single-owner topology. Human/Owner review is a mandatory merge gate.

Mutation gate: GitHub policy/ruleset/workflow changes require Owner review and validation before becoming authoritative.

## M2 — Architecture Definition
COMPLETE. ESS-0019, ADR-0057..0063, trust/threat models, traceability and Documentation Freeze are established.

Mutation gate: documentation only; no production platform mutation.

## M3 — CI Hardening
COMPLETE via PR #195/#196. PR #197 additionally established the Human/Owner final gate.

Mutation/test gate: CI/workflow changes were validated through full-path and docs-only-fast-path evidence.

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

M4 mutation gate:
- no production Stripe/Supabase/Render mutation is authorized in M4;
- M4 is code/policy hardening only.

M4 closure criteria:
- consolidation tests/CI are green;
- #200/#201 are closed as superseded;
- Owner reviews every changed file, checks both attestations and submits current-commit `💪` or `okay` review;
- merge occurs only after explicit human merge instruction;
- after merge, M4 is COMPLETE and M5 is authorized.

## M5 — Observability/Telemetry/Audit
BLOCKED BY M4 CLOSURE.

Scope:
- extend ADR-0056/O1 with W3C/OTel correlation;
- immutable security audit evidence;
- redaction and security-event separation.

Mutation/test gate:
1. finish and Owner-approve the M5 implementation concept;
2. implement code/instrumentation without production mutation;
3. determine explicitly whether Supabase persistence/schema mutation is `REQUIRED` or `NOT REQUIRED`;
4. if REQUIRED: validate migration/dry-run/staging path, RLS/permission behavior and rollback;
5. obtain explicit Owner approval for the exact Supabase mutation;
6. execute mutation only in the authorized production path;
7. verify audit event write/read, authorization, retention semantics and absence of privilege expansion;
8. record PASS evidence and update ROADMAP/traceability;
9. only then authorize M6.

M6 remains blocked until the M5 mutation/test gate is PASS.

## M6 — Supply Chain
BLOCKED BY M5.

Scope:
- SBOM;
- provenance;
- attestation bound to exact source/artifact digests.

Mutation/test gate:
- provenance/attestation generation and verification must PASS;
- no Stripe/Supabase/Render mutation is implied by M6;
- any newly discovered external-platform mutation requires a separate Owner-approved concept/ADR before execution.

M7 remains blocked until M6 evidence is PASS.

## M7 — Deployment Identity + Production Platform Mutation Gate
BLOCKED BY M6.

Scope:
- protected deployment identity according to ADR-0061;
- environment-scoped credentials/hooks;
- rotation/revocation;
- controlled production mutation handoff.

Render mutation gate:
1. approved M7 concept/runbook;
2. preflight and rollback readiness;
3. Owner approval for exact Render setting/credential/hook mutation;
4. mutation;
5. controlled deployment test;
6. health/readiness verification;
7. rollback evidence;
8. PASS required before M8.

Supabase mutation gate in M7:
- only additional production IAM/credential/deployment-boundary changes explicitly required by the approved M7 design;
- never repeat M5 schema work opportunistically;
- same PREPARE → APPROVE → MUTATE → VERIFY → EVIDENCE sequence applies.

Stripe mutation gate in M7:
- no generic Stripe mutation is authorized;
- only a named billing/webhook/credential mutation with dedicated ADR/runbook and Owner approval may execute;
- use non-destructive/test-mode verification where applicable;
- verify webhook/idempotency behavior, metadata/customer/subscription mapping and rollback/revocation;
- PASS evidence is required before M8 when the mutation is part of the agent/platform cutover dependency chain.

Stripe billing/product remediations unrelated to the AI-Agent DevelopmentChain remain a separate workstream and require their own roadmap/ADR before mutation.

## M8 — Agent Cutover
BLOCKED BY M7.

Scope:
- route ChatGPT/Claude and future execution clients through the Control Plane;
- NotebookLM remains read-only unless a future approved concept changes that profile.

Agent creation gate:
- every autonomous/semi-autonomous agent requires a predefined Human/Owner-approved concept before implementation or enablement;
- concept must define capabilities, risk, target systems, approvals, mutations, tests, telemetry, rollback and kill switch;
- controlled cutover test must PASS before production enablement;
- no agent may self-authorize MERGE or production mutation.

M9 remains blocked until M8 cutover verification is PASS.

## M9 — Assurance
BLOCKED BY M8.

Run:
- negative authorization tests;
- prompt/tool injection tests;
- replay tests;
- exfiltration tests;
- kill-switch/break-glass drills;
- rollback/recovery drills;
- independent evidence review.

Final assurance requires PASS evidence for all mandatory drills and all unresolved mutation/test gates.

## Per-step mandatory update
Every completed DevelopmentChain step MUST update:
1. `docs/architecture/ROADMAP.md` status date and baseline SHA;
2. this roadmap phase/gate;
3. `AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` evidence pointer;
4. affected ADR/ESS status if changed;
5. required mutation status (`NOT REQUIRED`, `PLANNED`, `APPROVED`, `MUTATED`, `VERIFIED PASS`, `FAILED/ROLLED BACK`);
6. required test status and evidence.

No implementation phase may skip the Human/Owner merge gate, the autonomous-agent concept gate, a required mutation/test gate or a preceding phase closure.
