# CAPITAL-AI Governance

**Project ID:** `CAPITAL-AI-GOV`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Cross-cutting role:** repository Governance  
**Trust root:** `/AGENTS.md`  
**Status:** ACTIVE PROJECT EXECUTION PROJECTION — NON-AUTHORIZING

## Scope

CAPITAL-AI-GOV owns `PVC-05 Platform Director` and repository Governance coordination. Under `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`, Governance may also execute bounded work packages whose Target Project / Primary Owner is another canonical CAPITAL-AI project. Foreign execution does not transfer the target PVC, Primary Ownership, domain authority, Security/Compliance assurance authority, merge authority or protected-mutation authority to Governance.

Canonical Governance authority remains in `/AGENTS.md`, ADR-0096, `src/platform/Governance`, the Authority Registry and Control Catalog. The GOV/OPS foreign-execution policy is the bounded execution-routing contract for this exception.

## Navigation

- `../README.md` — canonical project-folder to PVC mapping.
- `../PROJECT_VALUE_CHAIN.md` — `PVC-01`..`PVC-18` ownership.
- `ROADMAP.md` — local execution state.
- `TASK_REGISTER.md` — canonical chat-to-repository task register.
- `AUTHORITY_AND_DECISION_BOUNDARIES.md` — Platform Director / Governance authority separation.
- `COMPONENT_ARCHITECTURE_MATRIX.md` — Governance component and architecture assessment.
- `../../governance/GOV_OPS_FOREIGN_PROJECT_EXECUTION_POLICY.md` — bounded GOV/OPS foreign-project execution authority.

Post-PVC routing, execution-model, roadmap-registry and Owner-Device cutover contracts remain withdrawn. The foreign-execution policy does not recreate those overlays; it is a narrow implementation delegation with the canonical Target Project/PVC mapping preserved.

## PR-create governance current state

Current `main` remains governed by Human-merged PR #874 and `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` v3.4.0 until a later Human/CODEOWNER merge changes that authority. The current effective rule therefore still requires its bounded Approval Envelope for the PR that introduces the next model; candidate-branch semantics cannot self-bootstrap.

Owner-directed `GOV-CHAT-077` materializes the successor model on `agent/governance-autonomous-pr-chain-20260915`. After Human Merge activates `/AGENTS.md` v2.11.0, `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` v4.0.0 and `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` v3.0.0, ordinary bounded agent-managed Draft PR creation no longer requires a separate pre-create Owner prompt. Creation instead requires a fail-closed final create-correlation `PASS` covering current main/head/merge-base, Project/PVC/Owner/Roadmap scope, open writers, changed-file/semantic/namespace/authority/ownership/security overlap, truthful validation state and complete current-main PR-body rendering.

Human authority is preserved after creation: the Owner reviews the concrete PR, required hosted checks remain technical evidence, final PR-head/current-main correlation is repeated before merge readiness, and `MERGE` remains Human/CODEOWNER-only. Agents do not self-merge or enable auto-merge.

Automated Roadmap PRs use a serial integration lane after activation: at most one not-yet-integrated automated PR is active; the successor is created only after its predecessor reaches a terminal outcome. A Human-merged predecessor causes the next work item to start on a fresh branch from the resulting then-current `main`; a predecessor closed without merge contributes no assumed payload and the queue is recomputed. Stacked unmerged dependency branches do not bypass this sequencing rule.

Historical Approval Envelope helpers and v3.4 evidence remain traceability/compatibility material after activation and do not become future create credentials.

## Non-goals

No parallel Governance Control Plane, no runtime relocation, no technical financial VC renumbering without coordinated authorization, no ownership transfer through foreign execution, no release/deploy/provider mutation, no bypass of then-effective create-correlation or bootstrap rules, no candidate-policy self-bootstrap and no weakening of Human/CODEOWNER-only merge.
