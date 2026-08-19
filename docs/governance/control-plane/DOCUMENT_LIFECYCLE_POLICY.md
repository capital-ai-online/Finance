# CAPITAL-AI Document Lifecycle & Repository Hygiene Policy

**Document ID:** `DOC-GOV-DOCUMENT-LIFECYCLE-2026-08-19`  
**Authority ID:** `AUTH-GOV-DOCUMENT-LIFECYCLE`  
**Version:** `1.3.0`  
**Date:** `2026-08-19`  
**Status:** OWNER-DIRECTED — effective with ADR-0096 after Human Merge

## Purpose

Define canonical repository placement and lifecycle metadata without creating a second global authority plane. Documentation-domain implementation belongs to `src/platform/Documentary/Governance`; global authority resolution belongs to `src/platform/Governance` and `/AGENTS.md`.

## Canonical repository document domains

| Domain | Canonical location | Purpose |
|---|---|---|
| Agent trust/instruction root | `/AGENTS.md` | sole repository-wide AI-agent instruction and governance entrypoint |
| ADR | `docs/adr/` plus lifecycle subdirectories | architecture/decision records and controlled legacy redirect stubs |
| Governance | `docs/governance/` | current governance policies, registries and control-plane material |
| Architecture | `docs/architecture/` | architecture/current-state descriptions, not independent decision authority unless backed by ADR/ESS |
| Compliance | `docs/compliance/` | applicability/control/evidence material |
| Roadmaps | `docs/roadmaps/` | current approved/planned execution sequencing |
| Runbooks | `docs/runbooks/` | authorized operational procedures; no independent authorization |
| Evidence | `docs/evidence/` | implementation/runtime/audit evidence; non-authorizing |
| Traceability | `docs/traceability/` | relationships and matrices |
| Archive | `docs/archive/` | suspended, superseded, historical and non-normative material |

Root Markdown is restricted to `README.md` and `AGENTS.md`. Repository-level provider instruction mirrors are not an approved document class.

## Required metadata

New or materially migrated governance/decision documents expose, as applicable: stable `authorityId`/`documentId`, semantic version, date, lifecycle/status, owner, supersession/legacy aliases and current registry path.

## Lifecycle

```text
draft / proposed
→ reviewed
→ approved / accepted / active
→ suspended OR resolved OR superseded
→ historical / archived
```

`suspended` is a deliberate non-authorizing pause for a normative artifact whose historical content must remain traceable while its operative contract is disabled or replaced. A suspended artifact cannot authorize implementation, release, mutation or reactivation until a newer explicit decision restores or supersedes it.

A superseded/archived artifact remains traceable and its identity is never reused for an unrelated artifact.

## Suspended and superseded placement

- Suspended ADRs live under `docs/adr/suspended/` and remain registered with lifecycle `suspended`.
- Suspended ESS/component specifications move from the active `.ai/skills` namespace to `docs/archive/governance/suspended/` and remain registered as suspended.
- Fully replaced governance/roadmap sources move to `docs/archive/governance/superseded/` when no compatibility path is required.

Current suspended examples in this work package:

- `docs/adr/suspended/ADR-0004-branding-and-panel-removal.md`;
- `docs/archive/governance/suspended/ESS-0004-Enterprise-Version-Manager.md`.

Historical evidence is preserved; suspended/archive placement explicitly removes current authority.

## Current-state versus historical roadmap rule

A current-state index must remain synchronized with the effective Control Plane and may not expose a historical gate as current enforcement.

- `docs/architecture/ROADMAP.md` is the canonical DevelopmentChain current-state index;
- `docs/roadmaps/GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` remains governance-control-plane history/context;
- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` is historical/non-authorizing for current execution state;
- detailed M0–M10 history remains evidence and cannot independently reactivate M10.

## ADR legacy redirect rule

When a display-number collision is repaired, a small compatibility stub may remain at the former path if historical/current links require it. A valid redirect is labeled `Legacy ADR Redirect — NON-AUTHORIZING`, identifies the canonical ADR and immutable Authority ID, contains no independent decision content and is registered as a legacy alias.

## Recency

Recency is meaningful only within one stable authority/document identity. A newer unrelated file is not automatically authoritative over an older Accepted decision.

## Hygiene rules

1. no duplicate active stable document/authority identity;
2. no duplicate active ADR/ESS display number;
3. open PRs allocating shared ADR/ESS namespaces are correlated before new allocation;
4. registry target paths exist;
5. historical evidence is not rewritten to simulate a past state that never existed;
6. generated reports remain marked generated/evidence and cannot become policy by location;
7. repository-level provider instruction mirrors are prohibited while `AGENTS.md` is the sole instruction surface;
8. root Markdown is restricted to `README.md` and `AGENTS.md`;
9. path moves require registry updates or a controlled non-authorizing redirect where compatibility is necessary;
10. current-state indexes cannot contradict the Control Catalog;
11. fully replaced current governance/roadmap documents move to archive rather than remaining parallel current sources;
12. `suspended` artifacts are excluded from active authority resolution;
13. renames affecting active code/contracts follow Safe Rename/impact governance;
14. bulk formatting/reorganization outside approved scope is prohibited.

## Relationship to PR #439

The reusable Documentation Hygiene and README projection implementation from parked PR #439 is integrated into the current Governance work package and adapted to ADR-0096. Documentary Hygiene remains documentation-only; README is a deterministic projection; neither becomes a competing global authority plane.

## Enforcement transition

`scripts/governance/validateGovernanceControlPlane.mjs` validates stable-ID, namespace, suspended-authority, version/router, README projection and M10 prerequisite invariants. `npm run docs:hygiene:check` executes the reusable documentation-domain service. Validation evidence is technical evidence only and cannot reactivate M10 or authorize merge.
