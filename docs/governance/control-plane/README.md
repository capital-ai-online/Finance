# CAPITAL-AI Governance Control Plane

**Authority ID:** `AUTH-GOV-CONTROL-PLANE`  
**Authority version:** `1.2.0` — canonical target: `src/platform/Governance/README.md` / `src/platform/Governance/manifest.json`  
**Projection version:** `1.3.1`  
**Projection date:** `2026-09-14`

This directory documents the repository-wide Governance Control Plane as a current documentation projection of `AUTH-GOV-CONTROL-PLANE`. Its projection version does not create or advance a second authority version. It does not replace domain ADR/ESS content; it defines how authorities, controls, versions, evidence, document roles, projections and agent instructions are resolved consistently.

## Canonical roles

- `/AGENTS.md` — sole repository-wide AI-agent trust root and instruction surface.
- `docs/governance/authority-registry.json` — stable authority identities and current locations.
- `docs/governance/control-catalog.json` — operative machine-readable governance controls.
- `docs/adr/registry.json` — ADR identity/version/date/lifecycle/supersession and parallel namespace reservations.
- `.ai/registry/ess-registry.json` — ESS allocation registry.
- `docs/governance/document-registry.json` — documentary identity, role, normative scope, authority references and projection relationships; not a higher policy authority.
- `scripts/governance/validateGovernanceControlPlane.mjs` — canonical deterministic repository validator.
- `scripts/governance/controlPlaneRegistryRules.mjs` — pure rule library consumed by the canonical validator and its unit tests; not a second validator or authority surface.
- `src/platform/Governance/` — global Governance component boundary and reusable contracts.

Repository-level provider instruction mirrors such as `CLAUDE.md` or `.github/copilot-instructions.md` are intentionally absent. Provider tooling cannot create a second repository instruction hierarchy.

## Authority and evidence separation

Authority decides what is permitted or required. Evidence records what happened. A report, build log, test result, PR body, reaction, label or historical document cannot manufacture authority.

Stable identities are path-independent. Paths, display numbers and titles may change under controlled migration without changing stable identity.

Recency alone does not resolve different authorities. A cross-authority replacement requires explicit scope, relationship, impact analysis, lifecycle transition and traceability under ADR-0096.

## Document roles — projection, not redefinition

`docs/governance/document-registry.json` can classify documents with machine-readable roles such as `authority`, `projection`, `inventory`, `roadmap`, `evidence` and `specification`.

The role metadata is fail-closed where it is declared:

- an `authority` may be normative only within its registered `normativeScope`;
- a `projection` references parent Authority IDs and must not become an independent normative copy;
- an `inventory` is descriptive and non-normative;
- a `roadmap` plans sequencing, dependencies, status and acceptance criteria and is non-normative;
- projections may not treat suspended, historical, superseded or rejected parents as active authority;
- two normative authorities may not claim the same exclusive normative scope.

For the Frontend document family this resolves to:

```text
AUTH-FRONTEND-PRESENTATION-ARCHITECTURE
  └─ docs/frontend/FRONTEND_ARCH.md        authority; frontend scopes only
      ├─ COMPONENT_INVENTORY.md            inventory; non-authorizing projection
      └─ FRONTEND_ROADMAP.md               roadmap; non-authorizing plan

Financial Runtime
  └─ ADR / ESS / SC-MD-SPT authorities
      └─ Frontend presentation             read-only projection/consumer
```

`FRONTEND_ARCH.md` cannot claim Financial Runtime, Market Data, Scoring, Ranking, Financial Eligibility or Runtime Evidence authority.

## ADR lifecycle and parallel writers

All formal ADRs live under `docs/adr/`. New/migrated ADRs are registered with stable `authorityId`, unique active display ID, semantic version, date and lifecycle.

Before creation of a new ADR, its display ID is reserved in the existing `parallelNamespaceReservations` structure. An active reservation contains at least:

- `displayId`,
- `branch`,
- `source`,
- `path`,
- `observedHead`,
- `state`,
- `reservedAt`.

The deterministic validator denies duplicate active reservations, an active ADR plus active reservation of the same display ID, malformed reservations and reservations explicitly marked `stale`. Merge, close, supersession or abandonment releases the reservation. Live GitHub/Open-PR correlation is a separate preflight that updates or evaluates repository metadata; deterministic CI never depends on live GitHub access.

For the same `authorityId`, the newer effective semantic version/date may supersede an older one. Between different authorities, recency alone is non-authorizing: explicit supersession and Owner-visible impact analysis are required.

## Parallel writer governance

Existing `.ai/work-claims` remain the coordination mechanism for path writers. No second lock architecture is introduced. Preflight correlation evaluates current `main`, open PRs, relevant branches, `claimedPaths`, `baseSha`, `lastMainSyncSha`, PR association, exclusivity and lifecycle before synchronization and again before Draft-PR readiness.

A claim whose release condition has already occurred is stale coordination metadata and must be released rather than continuing to block paths.

## Documentation boundary

`src/platform/Documentary/Governance` is documentation-domain governance only. Cross-cutting authority/control resolution belongs to `src/platform/Governance`. Fully replaced current governance/roadmap material moves to `docs/archive/governance/superseded/` rather than remaining as a parallel current source.

## Validation boundary

The structural validator checks stable-ID uniqueness, active ADR/ESS namespace collisions, ADR reservation lifecycle, registry targets, legacy redirects, document roles, projection relationships, exclusive normative scopes, Frontend role invariants, ADR-0005 lifecycle consistency, current M10 retirement state and the absence of repository provider instruction mirrors.

`validateFrontendArchitecture.ts` remains responsible for directories, dependency direction, feature/shared boundaries, legacy compatibility and parallel Frontend roots. Governance role/authority rules are not duplicated into that validator.

Validation is technical evidence only. It does not authorize a Pull Request, Human Merge or production mutation.

## M10 state

M10 Passkey PR-CI `AUTHORIZE_PR_CI` productive runtime is `RETIRED / OFF`. Human Merge of PR #691 removed the productive M10 runtime and current authorization path; historical M10 evidence remains non-authorizing.

Current-state discovery, architecture scans, roadmaps and validators must not expect, reconstruct or report a missing M10 implementation as a gap. Any future PR-CI/passkey authorization mechanism is a new separately scoped Human/Owner architecture and authority decision, not a reactivation of retired M10.

## Standards posture

`STANDARDS_CROSSWALK.md` maps CAPITAL-AI controls to ISO/IEC 42001:2023 as the currently adopted external governance benchmark. Standards alignment does not constitute certification or a legal-compliance claim.
