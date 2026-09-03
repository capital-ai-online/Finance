# CAPITAL-AI SEO — Google-visible Version Correlation

**Date:** 2026-09-02  
**Project:** `CAPITAL-AI-SEO`  
**Repository baseline:** `main@adba446e8c17676d1064f9a687970c23cb9aa279`  
**Repository version authority:** `package.json#version`  
**Observed repository version:** `0.6.0`  
**Status:** `BLOCKED` for Google-visible completion; repository evidence/requirements prepared  
**External Google mutation performed:** `NO`

## Purpose

Correlate all version-bearing SEO/search surfaces against the single canonical platform version without introducing a second SEO version authority. Historical evidence is preserved and classified; it is not rewritten into current state.

## Current correlation

| Surface | Observed state | Result |
|---|---|---|
| `package.json#version` | `0.6.0` | canonical authority |
| Public website | visible `VERSION 0.6.0`; public search crawl also exposes `Version 0.6.0` metadata | PASS |
| `index.html` meta description | `Version 0.6.0` | PASS |
| `index.html` OpenGraph description | `Version 0.6.0` | PASS |
| `index.html` Twitter description | `Version 0.6.0` | PASS |
| JSON-LD `SoftwareApplication` | object present; `softwareVersion` absent | FAIL / FE-owned implementation gap |
| Canonical URL | `https://capital-ai.online/` | PASS for version-correlation scope |
| Public search for `capital-ai.online` + `0.5.4` | no current result identified in available read-only web search | NOT_AVAILABLE as proof of the reported Google surface |
| Google Search Console | Domain property historically VERIFIED; no connected Search Console read connector available in this execution context | NOT_AVAILABLE for current version-surface inspection |
| Google Auth Platform / OAuth Branding | no connected read-only Google Auth Platform connector available in this execution context | NOT_AVAILABLE |
| Connected Apps / Account metadata | no connected read-only Google account metadata connector available in this execution context | NOT_AVAILABLE |

## Structured-data requirement

`SoftwareApplication` MUST expose the canonical application version as `softwareVersion` derived/projected from `package.json#version`.

Required invariant:

```text
package.json#version
  -> build/public metadata projection
  -> SoftwareApplication.softwareVersion
```

SEO MUST NOT introduce a second hard-coded canonical version value. A generated/injected build-time projection or another FE-owned implementation that consumes the package version is acceptable when it preserves this invariant.

Current `index.html` is a productive Frontend surface. Under current project ownership, implementation of this requirement belongs to `CAPITAL-AI-FE`; CAPITAL-AI-SEO owns this requirement, evidence and subsequent search verification.

## Existing FE work-package correlation

Merged PR #722 (`CAPITAL-AI-OPS — Auth Lifecycle Re-correlation`) records the same return contract: public metadata projects `0.6.0`, while `SoftwareApplication` lacks explicit canonical `softwareVersion`. This SEO package consumes that merged observation as coordination evidence and does not duplicate the foreign implementation.

## Classification of `0.5.4` repository occurrences

A current-main repository search still returns `0.5.4` in historical release/evidence material and legacy/internal source comments. Examples include release changelogs, archived documentary/raw-material evidence, historical reports and non-SEO source comments.

Classification rule:

- release changelogs and archived evidence: **HISTORICAL / RETAIN**;
- old reports/specification snapshots: **EVIDENCE / NOT CURRENT VERSION AUTHORITY**;
- source comments or other non-SEO occurrences: **NON-AUTHORITATIVE FOR SEARCH VERSION PROJECTION** and owner-routed if remediation is independently required;
- none of these occurrences may be used to infer the current platform version while `package.json#version` says otherwise.

No historical evidence is deleted by this work item.

## Google-surface determination

The exact Google surface that displayed `0.5.4` is **not independently resolved** by the available read-only evidence. Current public web/search retrieval identifies `0.6.0` for the site and does not return a current `0.5.4` result for the tested domain/version queries.

Therefore this evidence does **not** guess whether the stale value came from:

- Search Result / Snippet;
- Rich Result / structured-data-derived display;
- Search Console;
- Google Auth Platform / OAuth Branding;
- Connected Apps / Account Metadata;
- another Google Marketing surface.

Until an exact surface and resource identity are observed, Google-side state remains `BLOCKED` rather than PASS.

## External mutation plan boundary

No Google mutation, reindex request, Search Console write, OAuth branding update or generic Google write is authorized or performed by this branch.

For any later Google mutation, the execution package must first contain:

1. exact Google product/surface;
2. exact target resource/property/application identity;
3. read-only current state;
4. proposed state (`0.6.0` or canonical current package-version projection as applicable);
5. dry-run/diff;
6. applicable ESS-0014 approval/identity gate;
7. fresh Human/Owner approval for that exact target and proposal.

Credential values must never be recorded in this evidence.

## Reindex / refresh exit gate

After an authorized refresh/reindex or metadata mutation:

- capture request/evidence ID when available;
- verify the public website still projects the canonical current package version;
- verify `SoftwareApplication.softwareVersion` is present and correct after the FE implementation is deployed;
- re-read the exact previously stale Google surface;
- report `GOOGLE_VISIBLE_PASS` only after Google itself exposes the current version.

State progression:

`REPOSITORY_PASS` → `GOOGLE_REFRESH_REQUESTED` → `WAITING_FOR_REINDEX` → `GOOGLE_VISIBLE_PASS`

Use `BLOCKED` whenever the exact Google surface, required authorization or post-refresh observation is unavailable.

## Validation performed

- current `/AGENTS.md` read from `main` (Control Plane 2.6.0);
- current main SHA resolved and branch re-synchronized after main advanced;
- open PR overlap checked; PR #725 has no changed-file overlap with this SEO scope;
- package version inspected;
- `index.html` metadata and JSON-LD inspected;
- SEO project README/ROADMAP, checklist, canonical consolidated roadmap and Q3 runbook inspected;
- ESS-0024 inspected as `READ / ANALYZE / PLAN` only;
- ESS-0014 mutation boundary inspected;
- Skill Engine read-only verification boundary inspected;
- current public website/search evidence checked;
- repository `0.5.4` occurrences searched and classified without deletion.

No Production build is required for this documentation-only SEO branch.
