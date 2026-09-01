# CAPITAL-AI-COMP — Project Roadmap

**Project:** `CAPITAL-AI-COMP`  
**Project folder:** `docs/projects/compliance/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting Compliance assessment and regulatory traceability  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Detailed roadmap:** `docs/compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This roadmap is the thin owner-side project execution surface required by the canonical `docs/projects/` model. It does not duplicate the detailed Compliance roadmap, inventories, mappings, traceability, work packages or reports.

Detailed Compliance state remains canonical in `docs/compliance/CAPITAL-AI-COMP/**`.

## Project-surface controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `COMP-PROJ-01` | Canonical `docs/projects/compliance/` navigation exists | `README.md` + `ROADMAP.md` reference existing Compliance sources |
| `COMP-PROJ-02` | No productive PVC ownership | no Compliance project artifact allocates a productive `PVC-*` stage |
| `COMP-PROJ-03` | Authority separation remains intact | mapped requirements reference existing `AUTH-*` / `CTRL-*` / ADR / ESS rather than creating duplicates |
| `COMP-PROJ-04` | Remediation remains owner-routed | findings identify the affected Primary Owner and required return evidence |
| `COMP-PROJ-05` | Evidence-based assessment remains fail-closed | missing/stale required evidence cannot be assessed as PASS |

## Execution invariants

- Compliance maps and assesses; it does not redefine repository authority.
- Productive remediation remains with the affected Primary Owner.
- Legal applicability and accepted-risk decisions remain Human/Legal/Owner-controlled where required.
- Security verification remains Security-owned; Quality verification remains QM-owned.
- Technical `VC-*` identifiers and organizational `PVC-*` routing remain explicitly separate namespaces.
- Merge, deployment and protected external mutations retain their existing Human/Owner and repository gates.

## Current project dependencies

| Target | Relationship |
|---|---|
| `CAPITAL-AI-GOV` | consumes canonical authority/control identities; escalates authority or policy gaps |
| `CAPITAL-AI-SEC` | consumes independent Security evidence/findings where compliance-relevant |
| `CAPITAL-AI-QM` | consumes quality evidence/findings where compliance-relevant |
| Primary PVC owners | receive remediation work and return implementation evidence |
| Human/Legal Owner | receives Legal Review/applicability/accepted-risk escalations |

## Validation

For project-surface changes, the smallest sufficient validation is:

1. current `/AGENTS.md` and current `main` correlated;
2. open PR / writer / work-claim overlap checked;
3. project folder and branch slug match `docs/projects/README.md`;
4. no second Compliance or Governance authority is introduced;
5. all references target existing Compliance/project artifacts;
6. shared Governance-owned registry paths are not modified by this owner branch;
7. branch is synchronized with current `main` before PR readiness;
8. PR creation is separately approved for the exact main/head snapshot.

Documentation-only project-surface work does not by itself require a pre-PR Runtime build; hosted repository checks after PR creation remain authoritative for merge readiness.

## Completion condition

The owner-side Compliance project-folder migration is complete after Human merge when:

- the Compliance project surface is present on current `main`;
- no productive PVC ownership or foreign implementation authority has moved to Compliance;
- existing Compliance domain sources remain canonical and non-duplicated;
- required hosted checks for the exact PR candidate have passed.

The shared project registry may then consume the merge as GOV-owned return evidence.
