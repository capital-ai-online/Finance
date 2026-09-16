# CAPITAL-AI Governance

**Project ID:** `CAPITAL-AI-GOV`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Cross-cutting role:** repository Governance  
**Trust root:** `/AGENTS.md`  
**Status:** ACTIVE PROJECT EXECUTION PROJECTION — NON-AUTHORIZING

## Scope

CAPITAL-AI-GOV owns `PVC-05 Platform Director` and repository Governance coordination. Under `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`, Governance may also execute bounded work packages whose Target Project / Primary Owner is another canonical CAPITAL-AI project. Foreign execution does not transfer the target PVC, Primary Ownership, domain authority, Security/Compliance assurance authority, merge authority or protected-mutation authority to Governance.

Canonical Governance authority remains in `/AGENTS.md`, ADR-0096, `src/platform/Governance`, the Authority Registry and Control Catalog. The GOV/OPS foreign-execution policy is the bounded execution-routing contract for this exception.

The non-authorizing Top-Layer product-quality projection is resolved dynamically from current-main project routing. `USER_VISIBLE_TOP_LAYER_FIRST` applies to canonical project folders except `CAPITAL-AI-SEC / docs/projects/security/`, `CAPITAL-AI-QM / docs/projects/quality-management/`, `CAPITAL-AI-FINTECH / docs/projects/fintech/` and `CAPITAL-AI-COMP / docs/projects/compliance/`. Those four remain governed by their project-local current-main authority direction; they still participate in dependency, evidence and user-impact correlation where applicable. `/AGENTS.md`, canonical PVC routing and `SC-MD-SPT-0001` where the technical financial chain is affected remain higher/parent inputs and are not replaced by the projection.

## Navigation

- `../README.md` — canonical project-folder to PVC mapping.
- `../PROJECT_VALUE_CHAIN.md` — `PVC-01`..`PVC-18` ownership.
- `ROADMAP.md` — local execution state.
- `TASK_REGISTER.md` — canonical chat-to-repository task register.
- `AUTHORITY_AND_DECISION_BOUNDARIES.md` — Platform Director / Governance authority separation.
- `COMPONENT_ARCHITECTURE_MATRIX.md` — Governance component and architecture assessment.
- `TOP_LAYER_APPLICATION_QUALITY_PROJECTION.yaml` — non-authorizing Top-Layer product-quality, execution and evidence projection; applies to all canonical project folders except SEC, QM, FINTECH and COMP, resolves productive PVC stages from the canonical mapping and keeps cross-cutting projects separate.
- `../../governance/GOV_OPS_FOREIGN_PROJECT_EXECUTION_POLICY.md` — bounded GOV/OPS foreign-project execution authority.

Post-PVC routing, execution-model, roadmap-registry and Owner-Device cutover contracts remain withdrawn. The Top-Layer projection and the foreign-execution policy do not recreate those overlays. The Top-Layer projection is product-quality/evidence guidance only; canonical Authority remains in `/AGENTS.md`, ADR/ESS/AUTH/CTRL and their registries, while project/PVC routing remains exclusively in `../README.md` and `../PROJECT_VALUE_CHAIN.md`.

## PR-create governance current state

Human-merged PR #952 activated `/AGENTS.md` v2.11.0, `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` v4.0.0 and `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` v3.0.0 on current `main`. Ordinary bounded agent-managed Draft Pull Request creation no longer requires a separate pre-create Human/Owner approval prompt.

PR creation is now correlation-gated. Immediately before creation, the executor refreshes current `main`, resolves Project/PVC/Owner/Roadmap scope and applicable authority, correlates open writers plus changed-file/semantic/namespace/authority/ownership/security overlap, records truthful validation state, reads the current-main PR template and creates a Draft only for a final create-correlation `PASS`.

Human authority is preserved after creation: the Owner reviews the concrete Pull Request, required hosted checks remain technical evidence, final PR-head/current-main correlation is repeated before merge readiness, and `MERGE` remains Human/CODEOWNER-only. Agents do not self-merge or enable auto-merge.

Automated Roadmap PRs use a serial integration lane: at most one not-yet-integrated automated PR is active. A successor is created only after the predecessor reaches a terminal outcome. After Human Merge, the successor starts on a fresh branch from the resulting then-current `main`; close-without-merge forces queue recomputation without assuming predecessor payload. Stacked unmerged dependency branches do not bypass this sequencing rule.

Historical Approval Envelope helpers and v3.4 evidence remain traceability/compatibility material only and are not current PR-create credentials.

## Non-goals

No parallel Governance Control Plane, no runtime relocation, no technical financial VC renumbering without coordinated authorization, no ownership transfer through foreign execution, no release/deploy/provider mutation, no bypass of then-effective create-correlation or Human/CODEOWNER merge rules, and no reconstruction of retired pre-create approval semantics as a current requirement.
