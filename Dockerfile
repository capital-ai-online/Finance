# Production Docker hardening for Render.
# Both stages are pinned to the same immutable Node 24.18.0 Alpine multi-platform image digest.
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

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

RUN npm run build

FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS runner
WORKDIR /app

# Keep build-time Node invocations free of runtime preload hooks.
ENV NODE_ENV=production

# Create the runtime identity before installing/copying artifacts.
RUN addgroup -S capitalai && adduser -S capitalai -G capitalai

COPY package*.json ./

# Install runtime dependencies only. Application code and dependencies remain root-owned/read-only.
RUN npm ci --omit=dev \
  && npm cache clean --force \
  && chown -R root:root /app/node_modules /app/package*.json \
  && chmod -R a-w /app/node_modules \
  && chmod a-w /app/package*.json

COPY --from=builder --chown=root:root /app/dist ./dist
COPY --from=builder --chown=root:root /app/server/runtime/runtimeArtifactGuard.mjs ./server/runtime/runtimeArtifactGuard.mjs

# Activate runtime-only governance controls only after the preload artifact exists.
ENV CAPITAL_AI_RUNTIME_ARTIFACT_MODE=readonly \
    NODE_OPTIONS=--import=/app/server/runtime/runtimeArtifactGuard.mjs \
    HOME=/tmp/capitalai \
    TMPDIR=/tmp/capitalai

# Deny writes to application artifacts. Only uploads and the dedicated temp/home directory are writable.
RUN mkdir -p /app/uploads /app/docs /tmp/capitalai \
  && chown root:root /app/dist /app/server /app/docs \
  && chmod -R a-w /app/dist /app/server \
  && chmod 0555 /app/docs \
  && chown capitalai:capitalai /app/uploads /tmp/capitalai \
  && chmod 0750 /app/uploads \
  && chmod 0700 /tmp/capitalai

USER capitalai

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1

# Run Node directly so the application is PID 1 and receives termination signals without an npm shim.
CMD ["node", "dist/server.cjs"]
