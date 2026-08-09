# Render Docker Hardening Runbook — 2026-08-09

## Scope

Production service: `Finance`
Repository: `SvenKulessa/Finance`
Runtime: Docker
Render Auto-Deploy: Off
Production deploy authority: GitHub Actions deploy hook after successful CI

## Hardening controls

- immutable Node 22 Alpine digest in builder and runner stages;
- multi-stage build;
- production-only runtime dependency installation;
- npm cache cleanup;
- non-root runtime identity `capitalai`;
- explicit artifact ownership through `COPY --chown`;
- writable-path allowlist centered on `/app/uploads`;
- read-only `/app/docs` governance path;
- direct Node PID 1 startup;
- `/healthz` container healthcheck;
- expanded `.dockerignore` for secrets, key material, logs, coverage, editor files, temp files and VCS metadata;
- CI policy validation with `scripts/security/verifyDockerHardening.mjs`;
- CI Docker image build and metadata inspection before production deploy.

## Production deployment sequence

`main push → build-and-test → Docker hardening policy → application tests/build → Docker image build → image metadata checks → Deploy verified commit to Render → deploy_hook → exact SHA → live`

A failure in any build-and-test step prevents the Render deploy job from running.

## Validation after merge

Record the following evidence:

1. merge commit SHA;
2. GitHub CI run ID and final conclusion;
3. result of Docker hardening policy step;
4. result of production Docker image build;
5. result of runtime metadata verification;
6. Render deploy ID;
7. Render trigger must be `deploy_hook`;
8. Render commit SHA must equal the GitHub verified merge SHA;
9. final Render status must be `live`.

## Rollback

If the hardened container fails in Render while CI remains green, revert the Docker-hardening PR. Do not re-enable Render Auto-Deploy as a workaround. The existing GitHub deploy-hook gate remains the authoritative deployment path.

## Future hardening candidates

Evaluate separately in later ADRs:

- distroless or similarly reduced runtime image after native-module/library compatibility testing;
- generated SBOM attestation tied to the deployed SHA;
- vulnerability scanning of the built OCI image with a pinned scanner version;
- signed OCI provenance if the architecture moves from Render-side Docker builds to prebuilt immutable registry images;
- platform-level read-only root filesystem if/when supported by the production runtime model.
