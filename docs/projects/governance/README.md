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

## PR-create governance transition

The branch-local Governance maintenance `agent/governance-pr-approval-envelope-20260910` selectively rematerializes candidate `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` v3.4.0 from historical evidence against `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`. Its bounded Approval Envelope treats approval-base/current Git SHAs as mandatory evidence and correlation anchors while requiring material-equivalence and current-main/open-writer/semantic/namespace/authority/security re-correlation before PR creation.

The branch explicitly preserves the current bounded Security-remediation authority and removes no Security/PVC/Primary-Owner or protected-mutation boundary. It also keeps M10 `RETIRED / OFF` and NIST bindings non-authorizing under the current Trust Root.

This candidate policy cannot authorize its own Pull Request. Until Human Merge, the PR-create rule effective on then-current `main` remains controlling for creation of that exact PR. After Human Merge, only the merged/current version of `/AGENTS.md` and its projected controls governs future PR-create evaluation.

## Non-goals

No parallel Governance Control Plane, no runtime relocation, no technical financial VC renumbering without coordinated authorization, no ownership transfer through foreign execution, no release/deploy/provider mutation, no bypass of the then-effective Human/Owner PR-create gate, no candidate-policy self-bootstrap and no weakening of Human/CODEOWNER-only merge.
