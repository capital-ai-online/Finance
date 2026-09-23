# CAPITAL-AI-SEC — Live Roadmap Compatibility Pointer

**Project:** `CAPITAL-AI-SEC`  
**Folder:** `docs/projects/security/`  
**Status:** `RETIRED_CURRENT_STATUS_SOURCE / COMPATIBILITY_POINTER`  
**Baseline:** `main@8f5fff57613f183e0e1a2a8c8b41017338e63491`  
**Migrated:** 2026-09-23  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Current status source

The current Security work graph is maintained only in:

- `docs/architecture/ROADMAP.md` — repository Live Roadmap current-state source;
- `/roadmap` — read-only branded UI projection.

This file deliberately carries **no independent ACTIVE/READY/HELD queue**. Historical Security roadmaps, work-package documents, branches, claims and chat state are evidence only and cannot reactivate work.

At migration time, fresh CURRENT_MAIN correlation established:

- `SEC-WEB-HARDENING-01` = the only current active SEC program identity; its phases and gates are projected in the Live Roadmap.
- `SEC-AUTH-DIAG-AAL2-01` = superseded / not active; PR #1257 merged and its coordination claim is released.
- the SEC-WEB roadmap-promotion claim is stale after merged PR #1196 and is released by this migration.

Security remains cross-cutting with no productive `PVC-*` ownership. Productive remediation continues to return to the canonical affected Owner; Security retains requirements, findings, Security tests and independent verification.

## Evidence / detail

Preserved Security program detail and superseded work evidence lives under `docs/projects/security/evidence/`. Older `docs/roadmaps/*SECURITY*` documents are bounded historical/domain detail and not current status sources.
