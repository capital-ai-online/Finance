# ADR-0044 — Production Runtime Artifact Immutability

- **Status:** Accepted
- **Implementation-Status:** IN VALIDATION
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
- runtime-triggered version bumps and generated documentation.

These capabilities conflict with the roadmap invariant that repository-style documentation and release identity are immutable deployment inputs. A production web process must not act as a repository writer or release-authority process.

## 2. Decision

CAPITAL-AI establishes a fail-closed production runtime artifact boundary.

The production web container MUST NOT mutate:

1. any path under `docs/**`;
2. `uploads/document_hygiene.json`;
3. `uploads/version_manager.json`.

The production Docker image preloads `server/runtime/runtimeArtifactGuard.mjs` before `dist/server.cjs`. The guard denies Node filesystem mutation APIs for the protected paths when both conditions are true:

- `NODE_ENV=production`;
- `CAPITAL_AI_RUNTIME_ARTIFACT_MODE=readonly`.

`/app/docs` is additionally made read-only at the OS permission layer (`0555`) for the non-root production user.

Normal application uploads are intentionally outside this boundary and remain writable unless governed by a separate persistence contract.

## 3. Ownership model

After this decision, production ownership is:

| Artifact | Production web runtime | CI / control plane / reviewed Git workflow |
|---|---|---|
| Repository documentation | read-only | authoritative writer |
| ADRs / ESS / architecture docs | read-only | authoritative writer |
| Release identity | read-only deployment input | release pipeline |
| Documentary proposals/evidence | emit event/evidence only | reviewed persistence workflow |
| Normal application uploads | permitted by application contract | not governed by this ADR |

The legacy Document Hygiene and Version Manager code may remain temporarily reachable for compatibility, but attempts to exercise local repository-style write authority in production fail closed.

## 4. Why a boundary guard first

R-002 is a P0 integrity item. Rewriting the complete Documentary and Version Manager architecture before removing write authority would leave the highest-risk capability active during the refactor.

Therefore the migration order is:

1. remove production write authority at the filesystem/runtime boundary;
2. prove the boundary with process-level regression tests;
3. migrate Documentary proposals to a durable reviewed evidence/control-plane workflow;
4. replace mutable local Version Manager state with immutable build/release identity;
5. remove obsolete runtime mutation routes and watcher behavior.

## 5. Failure semantics

A denied mutation throws an error with code:

`CAPITAL_AI_RUNTIME_ARTIFACT_READ_ONLY`

No protected write may silently fall back to another local file.

Legacy callers may catch the exception and degrade to read-only behavior, but they must not regain write authority through a different path.

## 6. Security and reliability consequences

Positive consequences:

- deploy instances cannot rewrite Git-style documentation;
- rolling deploy overlap cannot race on local documentary/version files;
- container restarts cannot create a false release source of truth;
- local mutable version `0.5.4` state can no longer become production authority over the immutable `0.6.0` deployment identity;
- the control-plane migration can proceed without leaving the P0 write capability exposed.

Trade-offs:

- legacy admin operations that attempted to mutate documentation or local release state will fail in production until their control-plane replacement is implemented;
- Document Hygiene local state will no longer persist in the production web container;
- development/CI workflows are intentionally unaffected unless they explicitly enable the production read-only mode.

## 7. Validation contract

Automated process tests MUST prove:

1. `docs/**` writes are denied;
2. `uploads/document_hygiene.json` writes are denied;
3. `uploads/version_manager.json` writes are denied;
4. ordinary application uploads remain writable;
5. the production Docker image preloads the guard;
6. `/app/docs` is OS-level read-only.

## 8. Follow-up work

This ADR is the first R-002 implementation slice, not the final Documentary/Release architecture.

Open follow-ups:

- replace runtime Document Hygiene mutation routes with proposal/evidence emission;
- disable production recursive document watcher startup;
- remove runtime-generated ADR/changelog/release-document writes;
- derive runtime version exclusively from immutable package/build/deploy metadata;
- move Documentary/release generation to CI or an explicit authenticated control plane;
- persist review state in a durable store only where required by an accepted contract.

## 9. Decision

Accepted. Production repository-style artifacts and local release-governance files are read-only deployment inputs. The web runtime is not an authoritative documentation or release writer.
