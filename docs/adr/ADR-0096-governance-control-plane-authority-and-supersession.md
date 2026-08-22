# ADR-0096 — Governance Control Plane, Stable Authority and Supersession

**Authority ID:** `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`  
**Version:** `1.3.0`  
**Status:** `ACCEPTED / ACTIVE` — Governance Control Plane landed through the merged governance-consolidation sequence; revalidated 2026-08-22  
**Date:** `2026-08-22`  
**Decision Owner:** CAPITAL-AI Owner  
**Scope:** repository governance authority, agent trust root, stable identities, ADR/ESS lifecycle, Documentation-only boundaries, document roles/projections, namespace reservations, parallel-writer correlation, platform-version authority, current-state synchronization and M10 prerequisite remediation

**Legacy alias:** historical governance draft number `ADR-0086`; active ADR-0086 belongs to Vendor Privacy Evidence Governance.

## Context

The repository accumulated overlapping governance surfaces: root agent directives, Documentary Governance, ADR/ESS registries, historical Version Manager behavior, release projections, workflow prose and status reports. The Governance Control Plane was introduced and merged to make authority resolution deterministic without creating another control plane.

Post-merge revalidation shows that the architectural decision is operational. Remaining drift is therefore treated as current-state synchronization, not as a new governance architecture.

## Decision

### 1. Single repository Agent Trust Root

`/AGENTS.md` is the single repository-wide instruction and trust-root surface for AI models, coding agents, MCP hosts and automation clients. Provider-specific repository instruction mirrors are non-authoritative.

### 2. Stable identities

- `AUTH-*` identifies an authority/decision immutably;
- `CTRL-*` identifies an enforceable governance control;
- `DOC-*` identifies documentary artifacts;
- ADR/ESS numbers remain display/traceability aliases.

Paths and display aliases may change only through traceable migration; stable authority identity does not.

### 3. Canonical registries

The control plane reuses exactly these registries:

- `docs/governance/authority-registry.json` — stable authority identity and location;
- `docs/governance/control-catalog.json` — operative controls;
- `docs/adr/registry.json` — ADR identity/version/lifecycle/reservation state;
- `.ai/registry/ess-registry.json` — ESS identity/lifecycle;
- `docs/governance/document-registry.json` — document identity/role/projection metadata.

No parallel registry may outrank these sources.

### 4. Lifecycle and supersession

`accepted`/active records may authorize within their declared scope. `suspended`, `superseded`, `historical` and `rejected` records are non-authorizing. Newer dates alone do not supersede a different authority; explicit scope/supersession is required.

Historical evidence remains immutable history and cannot silently regain current authority.

### 5. Global Governance vs Documentary Governance

Repository-wide governance belongs to `src/platform/Governance` and this ADR.

ADR-0014 / ESS-0012 remain Documentation-only. They may define documentation validation, lifecycle findings and read-only hygiene but cannot define repository-wide merge, production mutation, platform-version or agent-trust-root authority.

ADR-0097 extends Documentary maintenance under this boundary and cannot override the Governance Control Plane.

### 6. Single platform-version authority

`package.json#version` is the sole current platform-version authority.

```text
package.json#version
   ├─ Release Version Gate — controlled mutation
   ├─ README/runtime projections — derived/read-only
   └─ release/build evidence — derived

AGENTS.md governance version — independent control-plane metadata
```

Historical VersionManager state, generated JSON and autonomous document/version side effects are non-authorizing compatibility/history surfaces.

### 7. Current-state documents are projections, not second authorities

Current-state indexes such as `docs/architecture/ROADMAP.md` may project repository status and exact observed SHAs, but exact SHAs are validation/evidence-time facts, not permanent semantic authority.

Roadmaps, inventories and projections may reference parent authorities; they must not restate another domain's normative rule chain as a competing authority.

### 8. Document roles

Document Registry roles remain bounded to `authority`, `projection`, `inventory`, `roadmap`, `evidence` and `specification` semantics. Projections/inventories/roadmaps are non-authorizing unless a separate explicit authority scope states otherwise.

Frontend, Documentary, Vocabulary, Quality and Financial Runtime retain distinct domains. Presentation/documentation projections cannot acquire financial decision authority.

### 9. Parallel writers and Work Claims

Existing `.ai/work-claims` remain the single repository coordination mechanism for scoped writers. Before any PR/Draft PR, current `main` and open PRs must be correlated for path/semantic/namespace overlap.

Stale branches are not blindly rebased when that would import obsolete architecture. A fresh branch from current `main` plus selective semantic replay is valid when it preserves current authorities and is revalidated.

### 10. ADR namespace reservations

`docs/adr/registry.json#parallelNamespaceReservations` is the single ADR display-ID reservation mechanism. Active duplicate reservations, active ADR + active reservation collisions and stale reservations fail closed until resolved.

ADR-0097 is permanently allocated to Documentary Maintenance Control Loop after PR #460. Historical abandoned branches that used the same display ID for another concept are non-authorizing.

### 11. Financial value-chain boundary

`SC-MD-SPT-0001` remains the canonical financial value-chain authority. Governance/Quality/Documentary/Vocabulary may validate or project that chain but cannot create a second scoring/evidence/eligibility authority.

The current structural projection contains 18 stages. Documentary attaches read-only at VC-17 EventMesh/Traceability/Supervisor; delivery is VC-18. Current-state consumers must not continue using the obsolete 14-stage/VC-13 mapping.

### 12. Repository-local/ChatGPT sandbox execution

A ChatGPT/local sandbox may execute existing pre-PR checks on a real feature-branch checkout. It is a non-authorizing execution projection only:

- no automatic dependency installation;
- no push/PR creation/merge/deploy;
- no external platform mutation;
- no new CI authority;
- hosted CI still validates the exact remote PR head.

The profile is defined by `docs/runbooks/CHATGPT_REPOSITORY_SANDBOX.md` and `scripts/automation/runChatGptSandboxPrePr.mjs`.

### 13. M10 state

M10 Passkey/WebAuthn `AUTHORIZE_PR_CI` remains **SUSPENDED / OFF**. Historical M10 evidence cannot reactivate it.

Reactivation requires then-current architecture/authority cleanup, structural validation, exact-head hosted CI and a new explicit Human/Owner decision.

### 14. Deployment authority

Render native Auto Deploy remains off. Production promotion authority remains the verified `main` deployment control plane. A second automatic deployment authority requires a separate architecture/security decision.

### 15. Policy-as-code

`scripts/governance/validateGovernanceControlPlane.mjs` remains the canonical structural governance validator. It must fail closed on duplicate authorities, invalid ADR reservations, missing targets, non-authorizing projections used as authorities, platform-version ambiguity, trust-root duplication, role/scope leakage and other registered control-plane invariants.

Domain validators may validate their own architecture but may not duplicate repository-wide governance authority.

## Consequences

### Positive

- one resolvable governance control plane;
- one platform-version authority;
- historical documents remain traceable but non-authorizing;
- Frontend/Documentary/Vocabulary/Quality/Financial Runtime boundaries stay explicit;
- current-state drift can be detected without hard-coding exact Git SHAs as permanent authority;
- sandbox/local execution reduces pre-PR failure cost without weakening hosted CI or Human merge.

### Trade-offs

- historical documents can retain stale terminology and must be interpreted through lifecycle/authority resolution;
- compatibility namespaces may remain temporarily while callers migrate;
- current-state synchronization remains an ongoing governance obligation.

## Security and integrity impact

This decision reduces ambiguous authority, mutable duplicate version state and accidental cross-domain authority leakage. It adds no secret, provider-write, billing, IAM or production mutation capability.

## Verification / Definition of Done

1. `/AGENTS.md` remains sole repository trust root.
2. `package.json#version` remains sole platform-version authority.
3. Authority/ADR/ESS/Document registries resolve stable identities consistently.
4. Documentation Governance stays Documentation-only.
5. ADR-0096 registry/file lifecycle is accepted/active.
6. ADR-0097 resolves uniquely to Documentary Maintenance.
7. SC-MD-SPT current projection is 18 stages; Documentary binds to VC-17.
8. current-state indexes do not create separate version/SHA authority.
9. ChatGPT/local sandbox is non-authorizing and offline-first.
10. M10 remains suspended until a new Human/Owner reactivation decision.
11. Human/CODEOWNER merge remains mandatory.
