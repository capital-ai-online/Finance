# ADR-0044 — Production Runtime Artifact Immutability

- **Status:** Accepted
- **Implementation-Status:** IN VALIDATION — Phase 3
- **Date:** 2026-08-08
- **Scope:** CAPITAL-AI production web runtime / Documentary / Version Manager / release governance
- **Platform Version:** `0.6.0`
- **Roadmap:** R-002 — Make production documentary/release artifacts immutable
- **Related:** ADR-0030, ADR-0032, DC-005, DC-006

## 1. Context

The production Node/Express composition root still imports and exposes the legacy Document Hygiene and Version Manager modules. Those modules retain local filesystem mutation capabilities, including:

- `docs/**` document creation, rewrite, backup and sanitation;
- `docs/.history/**` backup mutation;
- `uploads/document_hygiene.json` as mutable governance state;
- `uploads/version_manager.json` as mutable release/version state;
- runtime-triggered version bumps and generated documentation;
- recursive document watcher startup from the production web process.

The legacy Version Manager also embeds a `0.5.4` default state. Once local persistence is blocked, allowing `/api/admin/version` to keep reading that fallback would expose a false release identity for the `0.6.0` deployment.

These capabilities conflict with the roadmap invariant that repository-style documentation and release identity are immutable deployment inputs. A production web process must not act as a repository writer, documentary watcher authority, or release-authority process.

## 2. Decision

CAPITAL-AI establishes a fail-closed production runtime artifact and control-plane boundary.

The production web container MUST NOT mutate:

1. any path under `docs/**`;
2. `uploads/document_hygiene.json`;
3. `uploads/version_manager.json`.

The production web process MUST NOT establish an active filesystem watcher over `docs/**`.

The production web process MUST NOT execute legacy Documentary or release-governance mutation endpoints. Those requests are rejected before Express executes their handlers with:

- HTTP `409`;
- code `READ_ONLY_CONTROL_PLANE_REQUIRED`;
- authoritative mutation owner `ci-or-authenticated-control-plane`.

The guarded mutation routes include:

- `POST /api/docs-file`;
- non-read operations under `/api/admin/hygiene/**`;
- `POST /api/admin/version/bump`.

`GET /api/admin/version` remains available for compatibility, but its production response MUST be derived from immutable package/deploy metadata. It MUST NOT read `uploads/version_manager.json` as the production release source of truth.

The runtime version contract uses:

- `package.json.version` as the application version;
- deployment commit metadata such as `RENDER_GIT_COMMIT` when available;
- optional immutable Render service/instance/hostname metadata;
- `source: immutable-build-metadata` and `readOnly: true`.

The production Docker image preloads `server/runtime/runtimeArtifactGuard.mjs` before `dist/server.cjs`. The guard is enabled only when both conditions are true:

- `NODE_ENV=production`;
- `CAPITAL_AI_RUNTIME_ARTIFACT_MODE=readonly`.

The guard:

- denies synchronous and promise-based filesystem mutations targeting protected artifacts;
- denies rename/copy operations when a protected artifact is a source or destination as applicable;
- suppresses `fs.watch()` / `fs.watchFile()` on protected paths by returning an inert watcher contract;
- rejects protected HTTP mutation contracts before legacy Express handlers execute;
- serves immutable production release identity for `GET /api/admin/version`;
- leaves non-protected runtime uploads and ordinary application routes untouched.

`/app/docs` is additionally made read-only at the OS permission layer (`0555`) for the non-root production user.

## 3. Ownership model

| Artifact / capability | Production web runtime | CI / control plane / reviewed Git workflow |
|---|---|---|
| Repository documentation | read-only | authoritative writer |
| ADRs / ESS / architecture docs | read-only | authoritative writer |
| Documentary filesystem watcher | disabled/inert | CI/control-plane observation only |
| Documentary mutation endpoints | reject with control-plane contract | authoritative mutation workflow |
| Release identity | immutable package/deploy metadata | release pipeline |
| Version bump / release document generation | rejected | authoritative release workflow |
| Documentary proposals/evidence | emit event/evidence only | reviewed persistence workflow |
| Normal application uploads | permitted by application contract | not governed by this ADR |

The legacy Document Hygiene and Version Manager modules may remain temporarily importable for compatibility, but they no longer hold production filesystem, watcher, mutation-route, or release-identity authority.

## 4. Migration order

R-002 is a P0 integrity item. The migration order is therefore:

1. remove production filesystem write authority;
2. remove production watcher authority over protected artifacts;
3. reject legacy mutation HTTP contracts before handler execution;
4. replace mutable local production version state with immutable build/release identity;
5. prove all boundaries with regression tests;
6. migrate Documentary proposals and release generation to CI/control-plane workflows;
7. remove obsolete legacy mutator code after consumers have migrated.

## 5. Failure semantics

A denied filesystem mutation throws:

`CAPITAL_AI_RUNTIME_ARTIFACT_READ_ONLY`

A denied production HTTP mutation returns:

`READ_ONLY_CONTROL_PLANE_REQUIRED`

No denied operation may silently fall back to another local file or mutation path.

Protected-path watchers are suppressed rather than allowed to observe and trigger mutation chains. The inert watcher preserves the minimal `close/ref/unref` interface required by legacy startup code without establishing production filesystem authority.

## 6. Security and reliability consequences

Positive consequences:

- deploy instances cannot rewrite Git-style documentation;
- rolling deploy overlap cannot race on local documentary/version files;
- production Document Hygiene cannot react to `docs/**` changes through an active filesystem watcher;
- mutating admin endpoints fail explicitly before legacy handlers execute;
- container restarts cannot create a false release source of truth;
- the embedded legacy `0.5.4` fallback cannot override the immutable `0.6.0` package identity;
- deploy commit identity can be surfaced without mutable local release state.

Trade-offs:

- legacy admin mutation operations are unavailable in production until a control-plane replacement is implemented;
- Document Hygiene local state does not persist as production authority;
- the legacy watcher startup call may still execute, but cannot establish an active protected-path watcher;
- development/CI workflows remain unaffected unless they explicitly enable the production read-only mode.

## 7. Validation contract

Automated process tests MUST prove:

1. `docs/**` writes are denied;
2. `uploads/document_hygiene.json` writes are denied;
3. `uploads/version_manager.json` writes are denied;
4. ordinary application uploads remain writable;
5. production watchers over `docs/**` are suppressed;
6. Documentary/version mutation endpoints return `409 READ_ONLY_CONTROL_PLANE_REQUIRED` before fallback handlers execute;
7. `GET /api/admin/version` returns package version `0.6.0` and immutable deploy commit metadata when provided;
8. the production Docker image preloads the guard;
9. `/app/docs` is OS-level read-only.

## 8. Follow-up work

Phase 3 closes the production authority boundary, but does not remove the legacy implementation from the repository.

Open follow-ups:

- define the durable proposal/evidence handoff contract for Documentary changes;
- move release bump/document generation to CI or an explicit authenticated control plane;
- migrate any UI consumers from legacy mutable Version Manager assumptions to the immutable runtime contract;
- remove obsolete runtime-generated ADR/changelog/release-document code after migration;
- persist review state only in a durable store governed by an accepted contract;
- remove obsolete legacy watcher/mutator code after consumer migration.

## 9. Decision

Accepted. Production repository-style artifacts and release-governance state are immutable deployment inputs. The web runtime is a read-only consumer and evidence emitter; CI or an authenticated control plane is the authoritative mutation owner.
