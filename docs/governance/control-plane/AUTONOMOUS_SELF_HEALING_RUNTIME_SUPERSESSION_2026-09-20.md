# Autonomous Self-Healing Runtime Supersession — 2026-09-20

**Projection ID:** `CAPITAL-AI-OPS-SH-SUPERSESSION-2026-09-20`  
**Status:** OWNER-DIRECTED / NON-AUTHORIZING PROJECTION  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@6889a7c5f7f5ac0176ea500b251ada795cf628e4`

## Purpose

This document records the repository projections that must converge after the Owner-directed request for an autonomous and self-healing backend/frontend. It does not create authority and cannot override `/AGENTS.md`.

## Superseded projection text

The following historical/current project statements are stale where they conflict with the current trust root:

1. `docs/projects/operations/WORK_PACKAGES.md` / historical `OPS-08-B-SH-01`:
   - stale projection: productive autonomous recovery is not authorized and `SH-R2` actions remain separately Human/Owner-gated.
2. `docs/projects/operations/ROADMAP.md` historical invariant:
   - stale projection: every provider/production mutation requires a separate authorization.

They are superseded only by the narrower current rule already present in `/AGENTS.md@CURRENT_MAIN`:

- eligible CI/CD, validation, deployment and equivalent workflows may execute/rerun automatically when repository/provider controls allow;
- protected external mutations may execute automatically only when already inside an authorized workflow/provider capability boundary and configured technical controls permit the exact action;
- repository scope never grants new credentials, provider permissions or destructive capability;
- final Pull Request merge remains a mandatory Human Owner action.

## What is NOT superseded

This projection does not supersede or weaken:

- Human/CODEOWNER merge authority;
- branch/ruleset protection and required checks;
- Security, Compliance, Quality or domain-owner verdicts;
- least privilege, approval consumption or existing IAM/policy gates;
- secret handling and credential boundaries;
- exact-SHA/provenance requirements;
- database integrity/restore requirements;
- rollback compatibility requirements;
- owner/PVC boundaries;
- fail-closed semantics.

## Recovery-tier consequence

- `SH-0` observation is allowed.
- `SH-1` local/reversible remediation is allowed when a bounded contract exists.
- `SH-2` existing-workflow/runtime remediation is eligible without an additional per-run approval when the already-authorized capability permits it.
- `SH-3` protected state-changing recovery remains disabled until a dedicated capability contract proves that the existing authorized boundary covers the exact action and all required pre/post verification exists.

## Historical branch treatment

The historical `agent/operations-self-healing-readiness-20260910` branch is evidence/search input only and is not resumed or used as an integration base. `OPS-08-B-SH-02` is fresh Owner-directed work from current main.
