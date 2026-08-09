# ADR-0047 — Render Docker Image Hardening

Status: Proposed
Date: 2026-08-09

## Context

CAPITAL-AI runs on Render using `runtime: docker` and a repository-owned Dockerfile. The existing image already used an immutable Node base-image digest, a multi-stage build, a non-root runtime user, and a health check. The production deployment path is gated by GitHub Actions and triggers Render only after CI succeeds.

The remaining gaps were excessive runtime ownership changes, use of the npm process shim as PID 1, a broader-than-required Docker build context, and no CI control that proves the Dockerfile still satisfies the hardening invariants or that the resulting image metadata is non-root and health-checked.

## Decision

The production Docker image SHALL be hardened as follows:

1. Continue pinning builder and runner base images by immutable SHA-256 digest.
2. Keep a multi-stage build and install only production dependencies in the runner using `npm ci --omit=dev`.
3. Clean npm cache from the runtime dependency layer.
4. Create the `capitalai` runtime identity before application artifacts are copied.
5. Use `COPY --chown=capitalai:capitalai` for runtime artifacts rather than broad recursive ownership changes.
6. Treat `/app/uploads` as the explicit writable application path and `/app/docs` as read-only governance content.
7. Run the application directly as `node dist/server.cjs`, making Node PID 1 instead of an npm wrapper.
8. Retain the `/healthz` container health check.
9. Extend `.dockerignore` to exclude environment files, private-key/certificate material, logs, coverage output, editor state, temporary files, secrets directories, and other non-runtime artifacts.
10. Add a fail-closed CI policy script that verifies Dockerfile and `.dockerignore` invariants and rejects secret-like Docker `ARG` declarations.
11. Build the production Docker image in CI and inspect the resulting image metadata before any production deploy hook can execute.

## Secret handling

Docker `ARG` MUST NOT be used for secrets. Existing `VITE_*` arguments are permitted only for values intentionally exposed to browser clients, such as public/anon/publishable identifiers. Server credentials, service-role keys, passwords, tokens, private keys, and Stripe secret keys must remain Render runtime secrets or secret files.

## Consequences

Positive:

- smaller and more deterministic runtime dependency surface;
- reduced filesystem authority for the runtime user;
- direct signal delivery to the Node process;
- reduced chance of local or secret material entering the Docker build context;
- Docker hardening becomes a CI-enforced invariant rather than documentation only;
- Render receives a deploy hook only after the hardened image definition has successfully built in GitHub CI.

Trade-offs:

- CI duration increases because the production Dockerfile is built in addition to the application build;
- the runner remains based on Node Alpine rather than a distroless image to avoid combining runtime-library compatibility changes with this hardening step;
- full read-only-root-filesystem enforcement is not available as a repository-only Dockerfile guarantee on the current Render service configuration, so writable-path minimization is used instead.

## Verification

Implementation is accepted when:

- `node scripts/security/verifyDockerHardening.mjs` succeeds;
- GitHub CI successfully executes `docker build`;
- image metadata reports user `capitalai`;
- image command is `["node","dist/server.cjs"]`;
- image healthcheck contains `/healthz`;
- application CI remains green;
- after merge, the GitHub deploy-hook job deploys the exact verified commit to Render and the service reaches `live`.
