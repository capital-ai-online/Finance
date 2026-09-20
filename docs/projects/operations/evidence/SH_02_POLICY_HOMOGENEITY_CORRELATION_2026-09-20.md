# SH-02 Policy Homogeneity Correlation — 2026-09-20

**Project:** `CAPITAL-AI-OPS`  
**Parent:** `OPS-08-B-SH-02 / CAPITAL-AI-ASH-01`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Correlation baseline:** `main@39aeb4473ae3f0b26a174cf5654bb78b3a288c29`  
**Priority:** `P0-HIGHEST`  
**Role:** evidence + owner-correct handoff; not a second instruction surface.

## Resolution model

Repository-development instructions resolve only through `/AGENTS.md@CURRENT_MAIN`. Self-Healing architecture and `self-healing-contract/1.0.0` constrain Self-Healing subject matter but do not supersede the trust root.

Findings are classified as:

- `OPS_DRIFT`: OPS-owned stale projection; corrected in the current branch.
- `FOREIGN_POLICY_DRIFT`: active non-OPS projection contradicts current trust-root semantics; handed to its Primary Owner.
- `DOMAIN_GATE_VALID`: stricter subject-matter safety gate for Security/Compliance/IAM/production/data mutation; retained.
- `HISTORICAL_EVIDENCE`: historical/archive/evidence text; retained verbatim and non-authorizing.
- `NON_AUTHORIZING_PROJECTION`: machine registry/status projection; must point to the current trust root and must not recreate an instruction surface.

## Corrected OPS findings

| Finding | Before | Resolution |
|---|---|---|
| SH-02.5 stale work claim | PR #1141 merged, but claim remained `active/exclusive=true` | release claim; bind release to merge SHA and successful exact-head workflows |
| SH-02 work graph | SH-02.5 still `IMPLEMENTED_BRANCH / VALIDATION_PENDING` | `IMPLEMENTED_ON_MAIN / VALIDATED via PR #1141`; SH-02.6 becomes next functional slice |
| SH-1 architecture wording | tier table said “enabled when contract exists” | action-specific activation; only `activation=ENABLED` is executable |
| Dependency architecture | stated a later package would introduce shared registry | bind to merged SH-02.4/02.5 reality; generic retry/quarantine remain `HELD` |
| OPS priority projection | old #1125 branch/PR and another package marked `NEXT_EXECUTABLE / PRIORITY_1` | SH-02 becomes `P0-HIGHEST` until SH-02.11 terminal or real dependency blocks it |
| OPS Roadmap baseline | stale SH-02.3 snapshot | refresh to current main and current homogeneity gate |

## Foreign-owner contradiction handoffs

### SH-PH-GOV-01 — Governance PR-creation semantics

**Owner:** `CAPITAL-AI-GOV / PVC-05`  
**Priority:** P0 dependency of Self-Healing policy homogeneity.

Affected current surfaces:

- `docs/projects/governance/VALIDATION_REPORT.md` — still requires Human/Owner approval before PR creation.
- `docs/adr/registry.json` — ADR-0104 still carries a supersedes edge targeting `AUTH-GOV-AGENT-TRUST-ROOT`; under current AGENTS this cannot be an executable trust-root override.
- `docs/adr/ADR-0104-timeboxed-human-owner-execution-session.md` — PR-create prompt replacement semantics are now redundant/inert under global correlation-gated automated PR creation.
- `docs/adr/ADR-0105-deterministic-autonomous-versioning.md` — still preserves a “PR-Creation Approval Envelope” as if it were a current separate gate.

**Exit gate:** all current Governance projections state that PR creation/update may execute automatically after final fail-closed correlation; Human/CODEOWNER merge remains the mandatory Human repository-development action. Stable historical authority IDs may remain aliases only.

### SH-PH-DOC-01 — Documentary workflow/autodeletion semantics

**Owner:** `CAPITAL-AI-DOC / PVC-03`  
**Priority:** P0 parallel handoff; no ownership transfer.

Affected current surfaces:

- `docs/projects/documentary/work-packages/CAPITAL-AI-DOC-REPO-STRUCTURE-AUTO-01/AUTOMATIC_WORK_PACKAGE.md` — prohibits Hosted CI before a manual Owner approval gate.
- `docs/adr/ADR-0097-documentary-maintenance-agent-control-loop.md` — requires a separate Owner approval before a delete-eligible repository patch.
- `docs/architecture/DOCUMENTARY_MAINTENANCE_CONTROL_LOOP.md` — repeats the same extra delete approval requirement.

**Exit gate:** eligible hosted workflows follow current AGENTS workflow autonomy; documentary retention/delete eligibility, kill switches, branch-only mutation, review and Human merge remain intact without inventing an extra generic PR/CI approval plane.

### SH-PH-SEC-01 — Security Roadmap PR gate

**Owner:** `CAPITAL-AI-SEC`  
**Priority:** P0 parallel handoff.

Affected current surface:

- `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md` still describes “exact Human approval before PR workflow dispatch” and “separate explicit Human/Owner approval” for PR creation.

**Exit gate:** Security retains independent verification and all real Security gates, while generic PR creation semantics point to AGENTS correlation + Human/CODEOWNER merge rather than a retired pre-create approval requirement.

### SH-PH-COMP-01 — Compliance projections of PR creation

**Owner:** `CAPITAL-AI-COMP`  
**Priority:** P0 parallel handoff.

Affected current surfaces include:

- `docs/compliance/CAPITAL-AI-COMP/inventory/COMPLIANCE_TASK_EXTRACTION_MATRIX.md`
- `docs/compliance/CAPITAL-AI-COMP/mappings/REQUIREMENT_CONTROL_EVIDENCE_MATRIX.md`
- `docs/compliance/CAPITAL-AI-COMP/inventory/COMPLIANCE_REQUIREMENTS_INVENTORY.md`

These still project `CTRL-SDLC-PR-CREATE-001` as an explicit Human/Owner pre-create approval gate.

**Exit gate:** retain compliance evidence requirements and Human merge; map `REQ-COMP-005` to correlation-gated PR creation as currently defined only in AGENTS/control catalog.

### SH-PH-QM-01 — QM proposed ADR wording

**Owner:** `CAPITAL-AI-QM` with Governance registry coordination  
**Priority:** P1 because ADR-0103 is `proposed`, not active executable authority.

Affected surface:

- `docs/adr/ADR-0103-quality-management-project-execution-authority.md` states explicit Owner approval is required before PR creation.

**Exit gate:** proposed text cannot reintroduce a repository-development approval rule; QM remains independent assurance, technical remediation remains owner-correct, and merge remains Human/CODEOWNER-only.

### SH-PH-REG-01 — Registry homogeneity

**Owner:** `CAPITAL-AI-GOV` + Documentary registry maintenance  
**Priority:** P0.

Affected current projection:

- `.ai/registry/ess-registry.json` historical ESS-0022 entry correctly marks M10 retired but its `replacement` text still says current Human/Owner PR-create approval.

**Exit gate:** historical M10 remains historical/non-authorizing; replacement text reflects current AGENTS semantics without rewriting historical archived artifacts.

## Retained valid gates

The following are **not contradictions** and must not be removed merely for homogeneity:

- Human/CODEOWNER final merge.
- Security/Compliance/QM independent acceptance/verification.
- Explicit capability and effective-grant checks for IAM, secrets, billing, DNS, destructive data, provider grants and other protected mutations.
- Domain-specific approval/verification where the applicable current subject-matter contract intentionally makes it a configured control.
- Exact-SHA production identity, supply-chain provenance and post-action readback.
- Historical evidence and archived superseded rules when clearly non-authorizing.

## Priority order after this correlation

1. **P0-HIGHEST — SH-02 policy-homogeneity gate**: merge OPS-owned corrections and record owner handoffs.
2. **P0-HIGHEST — SH-02.6 Frontend degraded-mode + version-skew recovery**.
3. **P0-HIGHEST — SH-02.7 Exact-SHA runtime recovery**.
4. **HELD — SH-02.8 Protected rollback/restore contracts** until SH-02.7 + recovery evidence + SEC/COMP/QM prerequisites.
5. **P0-HIGHEST — SH-02.9 Observability/SLO/incident convergence** when dependency-ready.
6. **P0-HIGHEST — SH-02.10 Fault injection/convergence suite** after 02.4..02.9.
7. **P0-HIGHEST — SH-02.11 Staged production activation** after all enabled tiers are verified.
8. Normal OPS backlog resumes only when SH-02 is terminal or genuinely blocked.

This ordering changes OPS execution priority only. It does not preempt foreign-project ownership or independent assurance.
