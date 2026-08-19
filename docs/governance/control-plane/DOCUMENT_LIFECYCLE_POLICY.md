# CAPITAL-AI Document Lifecycle & Repository Hygiene Policy

**Document ID:** `DOC-GOV-DOCUMENT-LIFECYCLE-2026-08-19`  
**Authority ID:** `AUTH-GOV-DOCUMENT-LIFECYCLE`  
**Version:** `1.1.0`  
**Date:** `2026-08-19`  
**Status:** OWNER-DIRECTED — effective with ADR-0095 after Human Merge

## Purpose

Define canonical repository placement and lifecycle metadata without creating a second global authority plane. Documentation-domain implementation belongs to `src/platform/Documentary/Governance`; global authority resolution belongs to `src/platform/Governance` and `/AGENTS.md`.

## Canonical repository document domains

| Domain | Canonical location | Purpose |
|---|---|---|
| Agent trust root | `/AGENTS.md` | single repository-wide agent governance entrypoint |
| Provider/model adapters | approved root/provider paths | non-authoritative execution-host adapters only |
| ADR | `docs/adr/` plus lifecycle subdirectories | architecture/decision records and controlled legacy redirect stubs |
| Governance | `docs/governance/` | governance policies, registries and control-plane material |
| Architecture | `docs/architecture/` | architecture/current-state descriptions, not independent decision authority unless backed by ADR/ESS |
| Compliance | `docs/compliance/` | applicability/control/evidence material |
| Roadmaps | `docs/roadmaps/` | approved/planned execution sequencing and clearly labeled historical roadmap snapshots |
| Runbooks | `docs/runbooks/` | authorized operational procedures; no independent authorization |
| Evidence | `docs/evidence/` | implementation/runtime/audit evidence; non-authorizing |
| Traceability | `docs/traceability/` | relationships and matrices |
| Archive | `docs/archive/` | superseded/historical/non-normative material |

Root Markdown remains restricted to explicitly approved root documents such as `README.md`, `AGENTS.md` and non-authoritative provider adapters.

## Required metadata for new governance/decision documents

New or materially migrated governance documents must expose, as applicable:

- stable `authorityId` or `documentId`;
- semantic `version`;
- decision/publication `date`;
- lifecycle/status;
- canonical owner;
- explicit supersession or legacy aliases when relevant;
- current path registered in the appropriate machine-readable registry.

## Lifecycle

Canonical documentary lifecycle states are:

```text
draft / proposed
→ reviewed
→ approved / accepted / active
→ resolved OR superseded
→ historical / archived
```

A superseded or archived artifact remains traceable and retains its stable identity. Its historical identity is never reused for an unrelated artifact.

## Current-state versus historical roadmap rule

A document that presents itself as a **current-state index** must be kept synchronized with the effective control plane and may not expose a historical gate as current enforcement.

For the DevelopmentChain:

- `docs/architecture/ROADMAP.md` is the canonical current-state status index;
- `docs/roadmaps/GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` is the current governance-remediation execution roadmap;
- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` is an older implementation-roadmap snapshot and is **historical/non-authorizing for current execution state**;
- detailed M0–M10 history remains in ADR/ESS/runbook/evidence records and does not independently reactivate retired/suspended controls.

## ADR legacy redirect rule

When an ADR display-number collision is repaired, a small compatibility stub may remain at the former path if existing historical/current documents link to it.

A valid ADR legacy redirect must:

1. be labeled `Legacy ADR Redirect — NON-AUTHORIZING`;
2. identify the canonical ADR and immutable `AUTH-*` identity;
3. state that it is not a second active ADR;
4. preserve only link/traceability compatibility, not decision content;
5. be represented as a legacy alias/redirect in the ADR registry model.

This preserves historical link integrity without recreating an active namespace collision.

## Recency

Recency is meaningful only within one stable authority/document identity. A newer unrelated file is not automatically authoritative over an older Accepted decision.

## Hygiene rules

1. no duplicate active stable document or authority identity;
2. no duplicate active ADR/ESS display number after namespace migration;
3. registry target paths must exist;
4. historical evidence must not be rewritten to simulate a past state that never existed;
5. generated reports must be marked generated/evidence and may not become policy through location alone;
6. provider-specific agent files may not duplicate repository-wide governance policy;
7. new orphan Markdown at repository root is prohibited;
8. path moves require registry updates or a controlled non-authorizing legacy redirect in the same branch/PR;
9. current-state roadmaps/indexes must not contradict the current Control Catalog;
10. renames affecting active code/contracts require the existing Safe Rename/impact process;
11. bulk formatting/reorganization outside the approved scope is prohibited.

## Relationship to parked PR #439

PR #439 contains reusable documentation-hygiene logic and version-projection work. After ADR-0095 is merged, that implementation should be synchronized and adapted so its `DocumentationHygieneValidator` enforces this documentary boundary while consuming stable identities from the global Governance component. A second independent global governance implementation must not be created.

## Enforcement transition

This policy is established in the governance control-plane PR. The current standalone global validator checks critical structural identity conflicts, ADR legacy redirects and current M10 state consistency. More detailed documentary hygiene enforcement may reuse #439 after reconciliation rather than being reimplemented here.