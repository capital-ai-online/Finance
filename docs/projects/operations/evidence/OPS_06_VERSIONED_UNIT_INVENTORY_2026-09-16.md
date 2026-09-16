# OPS-06 — Versioned Unit Inventory Evidence

**Project:** `CAPITAL-AI-OPS`  
**PVC:** `PVC-06 — Version Management`  
**Work package:** `OPS-06-UNIT-VERSIONING-01`  
**Execution source:** explicit Human/Owner scope from 2026-09-16, bounded by `OPS-CARRY-01`  
**Initial main baseline:** `7c177a86fae05efc95bafee5967a9e4b3cb0ff3c`  
**Branch:** `agent/operations-unit-versioning-20260916`  
**Trust root at branch creation:** `/AGENTS.md` Control Plane `2.11.0`  
**Primary authorities:** ADR-0030, ADR-0096, ADR-0105, `CTRL-GOV-VERSION-001`, `CTRL-GOV-VERSION-002`, `ESS-0001-CONTRACTS`

## Objective

Provide one deterministic, read-only version projection across the application without creating per-file SemVer, a second platform-version registry, a revived VersionManager state machine or a parallel Release mutation path.

The projection is an OPS/PVC-06 evidence surface for downstream Documentary/reporting consumption. It does not transfer Version Management authority to Documentary.

## Implemented contract

`src/platform/Release/Services/versionedUnitInventory.ts` defines `versioned-unit-inventory/1.0.0`.

The inventory discovers, deterministically sorts and version-binds:

1. the repository/platform root;
2. every direct `src/platform/*` component;
3. every direct `src/features/*` feature slice;
4. every other direct `src/*` module root;
5. the `server/` backend root when present.

### Version authority resolution

| Unit class | Effective authority |
|---|---|
| Platform root | `package.json#version` |
| Platform component with valid manifest | `src/platform/<component>/manifest.json#version` |
| Platform component without manifest | inherited `package.json#version` |
| Feature slice | inherited `package.json#version` |
| Other application module | inherited `package.json#version` |
| Backend root | inherited `package.json#version` |

Existing component authority always wins over the inherited platform projection. An existing component manifest with malformed SemVer is fail-closed and is never silently replaced by platform inheritance.

## Identity and provenance

Every unit exposes:

- deterministic `unitId`;
- `kind` and canonical source path;
- effective `version`;
- exactly one `versionAuthority` and `versionAuthorityMode`;
- exact 40-character Git `sourceCommit`;
- component `manifestPath` where applicable;
- canonical `ownerProject` / `primaryPVC` only when existing manifest metadata resolves them;
- component documentation/dependency references where already present.

Unresolved ownership remains explicitly `unresolved`; source-path placement is not interpreted as Domain/PVC ownership transfer.

## Automation surface

`scripts/automation/validateVersionedUnitInventory.ts` resolves the exact current Git HEAD (or an explicit CI commit environment value), constructs the inventory and exits non-zero on fail-closed contract violations.

Human-readable validation:

```bash
npx tsx scripts/automation/validateVersionedUnitInventory.ts
```

Machine-readable Documentary handoff:

```bash
npx tsx scripts/automation/validateVersionedUnitInventory.ts --json
```

The JSON output is a projection only. No generated repository registry is persisted by this slice.

## Focused regression coverage

`tests/unit/versionedUnitInventory.test.ts` covers:

- platform/component/feature/application/backend discovery;
- component-authority precedence;
- inherited platform projection;
- Documentary owner/PVC resolution from existing manifest metadata;
- malformed component SemVer fail-closed behavior;
- deterministic repeated output;
- invalid Git source identity rejection;
- `readOnly=true` and `mutationPerformed=false` boundaries.

## Platform-version materialization boundary

This slice adds a new backward-compatible version-reporting capability. ADR-0105 classifies a new capability as version-relevant, but platform-version mutation is allowed only through the canonical deterministic Decision Evidence + Release Version Gate path.

The connected GitHub file-mutation surface does not execute that canonical local Release gate. Therefore this implementation **does not manually edit** `package.json#version`, lockfile/version mirrors, Release Candidate evidence or production state. Platform version remains governed exclusively by `package.json#version` until a valid deterministic materialization pass executes on an authorized host.

This is fail-closed behavior, not a `NONE` version decision.

## Pre-write correlation

At branch creation:

- `main = 7c177a86fae05efc95bafee5967a9e4b3cb0ff3c`;
- open PR `#1021` was Frontend Admin Process Graph / PVC-18 presentation work;
- open PR `#1022` was Governance `/AGENTS.md` Security authority-exception work;
- open PR `#1023` was Frontend auth/session perceived-performance work;
- none of those PRs wrote the new Release service, version-management project README, focused version test or this evidence path;
- PR #1022 does change the trust root, so final PR creation requires a fresh main/open-writer/authority correlation and branch resynchronization if that PR or another authority-relevant change lands.

## Validation status

The current GitHub connector provides repository read/write primitives but not an installed full repository checkout for running Node/Vitest/TypeScript locally.

Therefore at this evidence point:

- focused Vitest: `NOT RUN`;
- TypeScript: `NOT RUN`;
- repository quality: `NOT RUN`;
- Documentation Hygiene: `NOT RUN`;
- Governance Control Plane validation: `NOT RUN`;
- hosted post-PR CI: `PENDING / NOT YET CREATED`.

`NOT RUN` is not represented as `PASS`.

## Exit gate for this OPS slice

This slice is repository-ready for create-correlation only when:

1. the branch is synchronized with then-current `main`;
2. no open writer has unresolved file/semantic/authority overlap;
3. every discovered unit receives exactly one effective version authority;
4. malformed existing component versions fail closed;
5. the inventory remains read-only and commit-bound;
6. unresolved ownership is reported, not guessed;
7. no second version registry or mutation path is created;
8. the canonical PR body can be rendered from then-current `.github/pull_request_template.md`;
9. available validation is reported truthfully.

After Human/CODEOWNER merge, the successor `CAPITAL-AI-DOC / PVC-03` slice may consume this exact JSON projection from fresh then-current `main` for documentation hygiene, catalog and branded report generation.
