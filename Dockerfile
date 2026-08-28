# Production Docker hardening for Render.
# All stages are pinned to the same immutable Node 24.18.0 Alpine multi-platform image digest.
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS builder
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
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_GA_MEASUREMENT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY \
    VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID

# CI injects RELEASE_SOURCE_COMMIT explicitly; Render can provide RENDER_GIT_COMMIT.
# Delete the backend source map in the SAME builder layer that creates it. The final runner
# therefore never receives the source map in a COPY layer, rather than merely white-out deleting it.
RUN RELEASE_SOURCE_COMMIT="${RELEASE_SOURCE_COMMIT:-$RENDER_GIT_COMMIT}" npm run build \
  && rm -f /app/dist/server.cjs.map

# Install the production dependency graph in a dedicated unprivileged stage. This prevents
# package lifecycle scripts from gaining root privileges while keeping the final dependency
# tree immutable and root-owned once copied into the runner.
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS prod-deps
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node package*.json ./
# Vite/esbuild/Tailwind plugins are build/development tooling. server.application.ts still has
# a legacy static Vite import, even though createServer() is only called outside production.
# Remove the real toolchain before the runner COPY and leave a tiny fail-closed ESM stub solely
# to satisfy that static import. If NODE_ENV is ever overridden away from production inside this
# production image, createServer() throws instead of silently enabling a development server.
RUN npm ci --omit=dev \
  && rm -rf /app/node_modules/esbuild /app/node_modules/@esbuild \
    /app/node_modules/vite /app/node_modules/@vitejs /app/node_modules/@tailwindcss \
  && rm -f /app/node_modules/.bin/esbuild /app/node_modules/.bin/vite \
  && mkdir -p /app/node_modules/vite \
  && printf '%s\n' '{"type":"module","exports":"./index.js"}' > /app/node_modules/vite/package.json \
  && printf '%s\n' "export async function createServer() { throw new Error('VITE_DEV_SERVER_DISABLED_IN_PRODUCTION_IMAGE'); }" > /app/node_modules/vite/index.js \
  && node --input-type=module -e "const vite = await import('vite'); if (typeof vite.createServer !== 'function') process.exit(1)" \
  && npm cache clean --force

FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS runner
WORKDIR /app

# Patch the fixable OpenSSL CVEs that were present in the immutable upstream image. Keeping the
# upstream digest pinned preserves source-image identity; the image CVE gate verifies the result.
# npm/yarn/corepack are package-management tooling, not runtime requirements. The pinned Node
# base currently bundles fixable HIGH/CRITICAL vulnerabilities there, so remove the tooling.
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

# Deny writes to all application/dependency artifacts; only uploads and the dedicated
# temp/home directory are writable. The backend source map was already removed in builder.
RUN mkdir -p /app/uploads /app/docs /tmp/capitalai \
  && chown -R root:root /app/node_modules /app/package*.json /app/dist /app/server /app/docs \
  && chmod -R a-w /app/node_modules /app/dist /app/server \
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
