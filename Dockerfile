# Production Docker hardening for Render.
# All stages are pinned to the same immutable Node 24.20.0 Alpine multi-platform image digest.
FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS builder
WORKDIR /app

# Never execute dependency lifecycle scripts as root. The official Node image already
# provides the unprivileged `node` identity; keep the complete build under that user.
RUN chown node:node /app
USER node

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .

# Exact source identity is non-sensitive build metadata. Git metadata stays excluded from context.
ARG RELEASE_SOURCE_COMMIT
ARG RENDER_GIT_COMMIT

# Vite build-time values are public client configuration only. Never pass secrets via ARG.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_GA_MEASUREMENT_ID
ARG VITE_HCAPTCHA_SITE_KEY
ARG VITE_NATIVE_PASSKEY_LOGIN_ENABLED
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY \
    VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID \
    VITE_HCAPTCHA_SITE_KEY=$VITE_HCAPTCHA_SITE_KEY \
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
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-* \
  && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm /usr/local/bin/pnpx

# Render binds public web services to PORT=10000 by default. Keeping the image default aligned
# makes Docker's declared port, the process listener and the health check one explicit contract.
ENV NODE_ENV=production \
    PORT=10000

# Create the runtime identity before copying artifacts.
RUN addgroup -S capitalai && adduser -S capitalai -G capitalai

COPY --chown=root:root package*.json ./
COPY --from=prod-deps --chown=root:root /app/node_modules ./node_modules
COPY --from=builder --chown=root:root /app/dist ./dist
COPY --from=builder --chown=root:root /app/server/runtime/runtimeArtifactGuard.mjs ./server/runtime/runtimeArtifactGuard.mjs

# Activate runtime-only governance controls only after the preload artifact exists.
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
