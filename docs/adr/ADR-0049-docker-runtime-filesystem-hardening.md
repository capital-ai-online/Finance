# ADR-0049 — Docker Runtime Filesystem Hardening

Status: Proposed  
Date: 2026-08-10

## Context

ADR-0048 introduced the first production Docker hardening baseline for Render: immutable base-image digest, multi-stage build, production-only dependencies, non-root runtime user, explicit ownership, healthcheck, direct Node PID 1 execution and Docker-specific CI verification.

Render Web Services do not expose Docker runtime controls equivalent to a self-managed `docker run` configuration for `--read-only`, `--cap-drop`, `--security-opt no-new-privileges`, seccomp profiles or AppArmor policies. Therefore the image itself must reduce writable runtime surface as far as possible without relying on unavailable host-level controls.

The previous image copied production artifacts and dependencies as `capitalai:capitalai`. Although the process ran as non-root, this allowed the application identity to modify its own JavaScript bundles, server artifacts and installed dependencies at runtime if an application-level compromise occurred.

## Decision

The production image SHALL apply an immutable-application-filesystem pattern inside the container:

1. Runtime application artifacts (`/app/dist` and `/app/server`) SHALL be owned by `root:root` and SHALL not be writable by the application user.
2. Runtime dependencies (`/app/node_modules`) and package manifests SHALL be owned by root and SHALL not be writable by the application user.
3. The runtime process SHALL continue to execute as the unprivileged `capitalai` user.
4. `/app/uploads` SHALL remain the explicit application-writable persistent/work path with restrictive permissions.
5. Runtime temporary/home writes SHALL be isolated to `/tmp/capitalai`, owned only by `capitalai`, with mode `0700`.
6. `HOME` and `TMPDIR` SHALL point to `/tmp/capitalai` so libraries that require temporary or home-directory writes do not fall back to application directories.
7. The Docker hardening verifier SHALL fail closed if root-owned/read-only application artifacts or isolated writable paths are removed.
8. The direct Node command, healthcheck, immutable image digest, production-only dependency install and secret-like Docker ARG prohibition remain mandatory.

## Security Properties

This design reduces post-exploitation persistence opportunities inside the running container:

- application code cannot overwrite its own server bundle;
- dependencies cannot be modified by the runtime identity;
- the runtime artifact guard cannot be replaced by the application process;
- writable paths are explicit and narrow;
- temporary files are isolated from application artifacts and from other users;
- no additional Linux capabilities or privileged runtime mode are introduced.

The design does not claim to provide a fully read-only root filesystem. Render controls the host/container runtime and does not currently expose all corresponding Docker security flags for this service type.

## Trade-offs

- Libraries that attempt to write into their package directory or application directory will fail rather than silently mutate production state.
- Any future feature requiring a new writable directory must be reviewed explicitly and added as a narrowly scoped writable path.
- Runtime temporary state is ephemeral and must not be treated as persistent storage.

## Verification

CI SHALL validate both policy and built-image behavior. At minimum:

- `USER` is `capitalai`;
- `CMD` is direct Node PID 1;
- healthcheck targets `/healthz`;
- Dockerfile policy confirms root-owned/read-only artifacts and dependencies;
- only explicitly designated runtime directories are writable by `capitalai`.

## Relationship to Render

Render Auto-Deploy remains Off. Production deployment continues through the GitHub Actions Deploy Hook after a successful `main` CI run. Pull-request preview generation should remain disabled unless explicitly required.

This ADR extends ADR-0048 and does not replace it.
