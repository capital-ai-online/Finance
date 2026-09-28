# Production Docker hardening for Render.
# All stages are pinned to the same immutable Node 24.20.0 Alpine multi-platform image digest.
FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS builder
WORKDIR /app

# Materialize the pinned Google Analytics MCP provider in the existing builder stage.
# This preserves the canonical three-stage Docker contract; the final runtime receives
# only the completed venv and does not resolve Python packages at request time.\n# Package managers are build-only tooling and are removed from the copied runtime venv after validation.
RUN apk add --no-cache python3 py3-pip \
  && python3 -m venv /opt/ga4-mcp \
  && /opt/ga4-mcp/bin/pip install --no-cache-dir analytics-mcp==0.7.0 msgpack==1.2.1 setuptools==78.1.1 \
  && /opt/ga4-mcp/bin/pip check \
  && test -x /opt/ga4-mcp/bin/analytics-mcp \
  && /opt/ga4-mcp/bin/python -c "import analytics_mcp; import google.analytics.admin_v1beta; import google.analytics.data_v1beta; import importlib.metadata as md; assert md.version('msgpack') == '1.2.1'" \
  && rm -rf /root/.cache \
    /opt/ga4-mcp/lib/python*/site-packages/pip \
    /opt/ga4-mcp/lib/python*/site-packages/pip-*.dist-info \
    /opt/ga4-mcp/lib/python*/site-packages/setuptools \
    /opt/ga4-mcp/lib/python*/site-packages/setuptools-*.dist-info \
    /opt/ga4-mcp/lib/python*/site-packages/_distutils_hack \
    /opt/ga4-mcp/lib/python*/site-packages/pkg_resources \
  && rm -f /opt/ga4-mcp/lib/python*/site-packages/distutils-precedence.pth \
    /opt/ga4-mcp/bin/pip /opt/ga4-mcp/bin/pip3 /opt/ga4-mcp/bin/pip3.* \
  && /opt/ga4-mcp/bin/python -c "import analytics_mcp; import google.analytics.admin_v1beta; import google.analytics.data_v1beta; import importlib.metadata as md, importlib.util as iu; assert md.version('msgpack') == '1.2.1'; assert iu.find_spec('pip') is None; assert iu.find_spec('setuptools') is None"

# Never execute Node dependency lifecycle scripts as root. The official Node image already
# provides the unprivileged `node` identity; keep the complete application build under that user.
RUN chown node:node /app
USER node

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .

# The public roadmap timeline reads these markdown sources. The runtime image otherwise
# ships only dist/, so a GitHub 404 would fail closed and hide every owner lane.
RUN set -eu; \
    mkdir -p /app/roadmap-shipped; \
    for f in docs/architecture/ROADMAP.md docs/projects/README.md docs/projects/*/ROADMAP.md; do \
      mkdir -p "/app/roadmap-shipped/$(dirname "$f")"; \
      cp "$f" "/app/roadmap-shipped/$f"; \
    done; \
    test -s /app/roadmap-shipped/docs/architecture/ROADMAP.md; \
    test -s /app/roadmap-shipped/docs/projects/README.md

# Exact source identity is non-sensitive build metadata. Git metadata stays excluded from context.
ARG RELEASE_SOURCE_COMMIT
ARG RENDER_GIT_COMMIT

# Vite build-time values are public client configuration only. Never pass secrets via ARG.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_GA_MEASUREMENT_ID
ARG VITE_NATIVE_PASSKEY_LOGIN_ENABLED
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY \
    VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID \
    VITE_NATIVE_PASSKEY_LOGIN_ENABLED=$VITE_NATIVE_PASSKEY_LOGIN_ENABLED

# CI injects RELEASE_SOURCE_COMMIT explicitly; Render can provide RENDER_GIT_COMMIT.
# Delete the backend source map in the SAME builder layer that creates it. The final runner
# therefore never receives the source map in a COPY layer, rather than merely white-out deleting it.
# package.json aliases the production server bundle's legacy static Vite import to a local
# fail-closed module; the real Vite development server is therefore not a runtime dependency.
RUN RELEASE_SOURCE_COMMIT="${RELEASE_SOURCE_COMMIT:-$RENDER_GIT_COMMIT}" npm run build \
  && grep -Fq 'VITE_DEV_SERVER_DISABLED_IN_PRODUCTION_BUNDLE' /app/dist/server.cjs \
  && rm -f /app/dist/server.cjs.map

# Install the production dependency graph in a dedicated unprivileged stage. This prevents
# package lifecycle scripts from gaining root privileges while keeping the final dependency
# tree immutable and root-owned once copied into the runner. Build/development toolchains that
# are still classified as application dependencies in the source lockfile are removed entirely;
# unlike the previous implementation, no synthetic package is inserted into node_modules.
FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS prod-deps
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev \
  && rm -rf /app/node_modules/esbuild /app/node_modules/@esbuild \
    /app/node_modules/vite /app/node_modules/@vitejs /app/node_modules/@tailwindcss \
    /app/node_modules/tailwindcss \
  && rm -f /app/node_modules/.bin/esbuild /app/node_modules/.bin/vite \
    /app/node_modules/.bin/tailwindcss \
  && npm cache clean --force

FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS runner
WORKDIR /app

# Patch fixable OpenSSL CVEs exposed by the pinned upstream image at build time. The mutable
# Alpine security repository is an explicit availability-vs-reproducibility trade-off: the exact
# resulting image identity and final package inventory are captured by CI as image ID + SBOM.
# npm/yarn/corepack are package-management tooling, not runtime requirements; remove them too.
RUN apk upgrade --no-cache libcrypto3 libssl3 \
  && apk add --no-cache python3 libstdc++ \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-* \
  && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm /usr/local/bin/pnpx

# Render binds public web services to PORT=10000 by default. Keeping the image default aligned
# makes Docker's declared port, the process listener and the health check one explicit contract.
ENV NODE_ENV=production \
    PORT=10000 \
    ROADMAP_SHIPPED_ROOT=/app/roadmap-shipped

# Create the runtime identity before copying artifacts.
RUN addgroup -S capitalai && adduser -S capitalai -G capitalai

COPY --chown=root:root package*.json ./
COPY --from=prod-deps --chown=root:root /app/node_modules ./node_modules
COPY --from=builder --chown=root:root /app/dist ./dist
COPY --from=builder --chown=root:root /app/roadmap-shipped /app/roadmap-shipped
COPY --from=builder --chown=root:root /app/server/runtime/runtimeArtifactGuard.mjs ./server/runtime/runtimeArtifactGuard.mjs
COPY --from=builder --chown=root:root /opt/ga4-mcp /opt/ga4-mcp

# Keep the application runtime limited to runtime-owned guards. Supabase Management API
# reconciliation is a privileged control-plane operation and remains an explicit operations
# command; it must never be a mandatory preload for the public web process.
ENV CAPITAL_AI_RUNTIME_ARTIFACT_MODE=readonly \
    NODE_OPTIONS=--import=/app/server/runtime/runtimeArtifactGuard.mjs \
    HOME=/tmp/capitalai \
    TMPDIR=/tmp/capitalai

# COPY --chown=root:root above already gives the immutable application/dependency trees
# their final ownership. Avoid recursive chown/chmod here: on OverlayFS those metadata rewrites
# copy up the complete node_modules tree and can consume most of the five-minute deploy-trigger SLA.
# Runtime container checks verify that the unprivileged capitalai user still cannot write these
# roots. Only uploads and the dedicated temp/home directory remain writable.
RUN mkdir -p /app/uploads /app/docs /tmp/capitalai \
  && chmod a-w /app/package*.json \
  && chmod -R a-w /opt/ga4-mcp \
  && chmod 0555 /app/docs \
  && chown capitalai:capitalai /app/uploads /tmp/capitalai \
  && chmod 0750 /app/uploads \
  && chmod 0700 /tmp/capitalai

USER capitalai

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-10000}/healthz" || exit 1

# Run Node directly so the application is PID 1 and receives termination signals without an npm shim.
CMD ["node", "dist/server.cjs"]
