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

Human-merged PR #874 activates `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` v3.4.0 on current `main`. The effective Approval Envelope treats approval-base/current Git SHAs as mandatory evidence and correlation anchors while requiring deterministic effective-change identity, material-equivalence review and current-main/open-writer/semantic/namespace/authority/security re-correlation before PR creation.

The current rule evaluates the immediate pre-create state as exactly `APPROVAL_STILL_VALID`, `REAPPROVAL_REQUIRED` or `BLOCKED`. SHA equality is not semantic safety proof and SHA inequality alone is not a material scope change. Synchronization-only Git identity movement may preserve approval only when the approved bounded payload remains materially equivalent and all then-current correlation and validation requirements remain satisfied.

The current Approval Envelope preserves `CTRL-SEC-BOUNDED-REMEDIATION-001`, existing Security/PVC/Primary-Owner and protected-mutation boundaries, M10 `RETIRED / OFF`, NIST bindings as non-authorizing, and Human/CODEOWNER-only merge. The canonical PR-create response surface is the single embedded `Owner-Freigabe` field with affirmative value `PR Erstellung : Freigegeben`; the retired duplicate `Freigabe-Antwort` presentation is not reconstructed.

Historical branch `agent/governance-pr-approval-envelope-20260910` and pre-merge evidence remain audit/traceability only. Future PR-create evaluation resolves exclusively from then-current `/AGENTS.md` and its effective projected controls.

## Non-goals

No parallel Governance Control Plane, no runtime relocation, no technical financial VC renumbering without coordinated authorization, no ownership transfer through foreign execution, no release/deploy/provider mutation, no bypass of the then-effective Human/Owner PR-create gate, no candidate-policy self-bootstrap and no weakening of Human/CODEOWNER-only merge.
