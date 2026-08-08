# ADR-0044 — Production Runtime Artifact Immutability

- **Status:** Accepted
- **Implementation-Status:** COMPLETE — R-002 validated
- **Date:** 2026-08-08
- **Scope:** CAPITAL-AI production web runtime / Documentary / Version Manager / release governance
- **Platform Version:** `0.6.0`
- **Roadmap:** R-002 — Make production documentary/release artifacts immutable
- **Related:** ADR-0030, ADR-0032, DC-005, DC-006

## 1. Context

The legacy production composition root still contains Document Hygiene and Version Manager implementation that historically could mutate repository-style documentation, local governance JSON state, generated release documents and runtime version state. It also starts a recursive Documentary watcher.

The legacy Version Manager embeds a `0.5.4` default state, while the governed package version is `0.6.0`. Therefore blocking local persistence alone is insufficient: production release identity must be derived from immutable build evidence rather than mutable or fallback runtime state.

## 2. Decision

CAPITAL-AI establishes a fail-closed production runtime artifact and control-plane boundary.

The production web runtime MUST NOT:

1. mutate any path under `docs/**`;
2. mutate `uploads/document_hygiene.json`;
3. mutate `uploads/version_manager.json`;
4. establish an active filesystem watcher over `docs/**`;
5. execute legacy Documentary or release-governance mutation routes;
6. use local Version Manager JSON/default state as production release authority.

Protected production mutations return HTTP `409` with code:

`READ_ONLY_CONTROL_PLANE_REQUIRED`

Filesystem mutations on protected artifacts throw:

`CAPITAL_AI_RUNTIME_ARTIFACT_READ_ONLY`

The authoritative mutation owner is:

`ci-or-authenticated-control-plane`

## 3. Production enforcement

The production Docker image preloads `server/runtime/runtimeArtifactGuard.mjs` before `dist/server.cjs` when:

- `NODE_ENV=production`;
- `CAPITAL_AI_RUNTIME_ARTIFACT_MODE=readonly`.

The guard:

- blocks synchronous and promise-based filesystem mutations on protected paths;
- blocks protected rename/copy targets;
- suppresses `fs.watch()` / `fs.watchFile()` on `docs/**` with an inert watcher contract;
- rejects protected HTTP mutation routes before legacy Express handlers execute;
- serves read-only release identity for `GET /api/admin/version`;
- leaves ordinary application uploads and unrelated runtime routes untouched.

`/app/docs` is additionally permissioned `0555` for the non-root production user.

## 4. Immutable build evidence

Every production `npm run build` executes:

`scripts/automation/buildRuntimeReleaseManifest.ts`

and emits:

`dist/control-plane/release-manifest.json`

Contract:

`capital-ai-runtime-release-manifest/1.0.0`

The manifest records:

- governed `package.json.version`;
- source commit when available from controlled build/deploy metadata;
- SHA-256 of `package.json`;
- SHA-256 of `package-lock.json`;
- deterministic SHA-256 over the sorted Documentary tree under `docs/**` excluding `.history`;
- Documentary file count;
- deterministic `buildIdentity` derived from the release inputs;
- `authority: ci-or-controlled-build`;
- `mutable: false`.

If the manifest exists but violates its contract, production startup fails closed rather than silently trusting fallback release state.

`GET /api/admin/version` uses this manifest as the primary production release identity. Package/deploy metadata is retained only as a compatibility fallback when no manifest exists, for example in development probes or older deployment artifacts.

## 5. Existing controlled release workflow

The repository already contains the controlled `release:version` workflow in `scripts/automation/releaseVersion.ts`. It performs governed version planning/application, mandatory gates and versioned release-candidate evidence generation. It does not create a final immutable Git tag before production acceptance.

R-002 therefore does not introduce a competing runtime release engine. The ownership split is:

| Capability | Production web runtime | Controlled build / CI / reviewed Git workflow |
|---|---|---|
| Repository documentation | read-only | authoritative writer |
| ADR / ESS / architecture changes | read-only | reviewed Git mutation |
| Documentary watcher | disabled/inert | offline/CI tooling only |
| Documentary mutation routes | rejected | control-plane/review workflow |
| Version bump | rejected | `release:version` |
| Release candidate evidence | consume only | `release:version` |
| Runtime release manifest | consume only | production build |
| Release identity | manifest-backed read-only | controlled build/release pipeline |

## 6. Failure semantics

No protected mutation may silently fall back to another local path, JSON state file or mutation endpoint.

A corrupted or structurally invalid immutable release manifest is an integrity failure and must not be replaced by the legacy `0.5.4` state.

The production web process is an evidence consumer/emitter, not a repository or release writer.

## 7. Validation contract

Automated tests MUST prove:

1. `docs/**` writes are denied;
2. Document Hygiene local authority is denied;
3. Version Manager local JSON authority is denied;
4. ordinary application uploads remain writable;
5. production Documentary watchers are suppressed;
6. protected Documentary/version mutation routes return `409 READ_ONLY_CONTROL_PLANE_REQUIRED` before legacy handlers execute;
7. the controlled build emits a valid immutable release manifest;
8. the manifest contains version, source commit, dependency-lock hash and Documentary-tree hash evidence;
9. `GET /api/admin/version` prefers the immutable build manifest;
10. package/deploy metadata remains compatibility fallback only;
11. the Docker production runtime preloads the guard and keeps `/app/docs` OS-level read-only;
12. repository TypeScript, tests, production build and PR technical validation remain green.

## 8. Validation evidence

R-002 Phase 4 was validated on the branch synchronized with current `main` at merge-base `066d329558e77ffecc5064ce7c0daa037317ad4c`.

Successful gates before this status-only documentation commit:

- CI run `#482`: dependency audit, production invariants, TypeScript, Vitest, production build including immutable release-manifest generation, and deployment-readiness all succeeded;
- PR Technical Validation run `#133`: repository conventions, changed-workflow security, dependency vulnerability gate, TypeScript, tests, production build and deployment-readiness all succeeded;
- Google Marketing Protected Change Guard run `#63`: Docker-context contract, protected invariants, CSP/consent tests, TypeScript, production build and built-SPA CSP delivery all succeeded.

The final documentation-only head must retain these gates before merge.

## 9. Consequences

Positive consequences:

- deploy instances cannot rewrite Git-style documentation;
- rolling instances cannot race on Documentary/version files;
- the production watcher cannot trigger autonomous document mutation chains;
- legacy admin mutations fail explicitly;
- the embedded `0.5.4` fallback cannot override release `0.6.0`;
- each build carries a content-addressable release/Documentary evidence record;
- runtime release identity can be correlated to source commit, dependency lock and Documentary state.

Trade-offs:

- legacy production admin mutation UI paths require migration to a control-plane workflow;
- legacy mutator implementation remains in the repository until consumer cleanup;
- older artifacts without the new manifest use the compatibility package/deploy fallback.

## 10. R-002 closure boundary

R-002 is technically complete. Production mutation, watcher and release-authority capabilities are fail-closed and release identity is build-evidence-backed.

Removal of now-inert legacy implementation and UI cleanup is follow-up technical debt rather than a prerequisite for the R-002 integrity invariant.

## 11. Decision

Accepted and validated. Production Documentary and release artifacts are immutable deployment inputs. The production web runtime is a read-only consumer and evidence emitter; controlled build/CI/review workflows are the authoritative mutation and release owners.
