# Production Docker hardening for Render.
# Both stages are pinned to the same immutable Node 22 Alpine digest.
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS builder
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

FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS runner
WORKDIR /app

# Keep build-time Node invocations free of runtime preload hooks.
ENV NODE_ENV=production

# Create the runtime identity before copying application artifacts so ownership is explicit.
RUN addgroup -S capitalai && adduser -S capitalai -G capitalai

COPY --chown=capitalai:capitalai package*.json ./

# Install runtime dependencies only and remove npm cache from the image layer.
RUN npm ci --omit=dev \
  && npm cache clean --force \
  && chown -R capitalai:capitalai /app/node_modules

COPY --from=builder --chown=capitalai:capitalai /app/dist ./dist
COPY --from=builder --chown=capitalai:capitalai /app/server/runtime/runtimeArtifactGuard.mjs ./server/runtime/runtimeArtifactGuard.mjs

# Activate runtime-only governance controls only after the preload artifact exists.
ENV CAPITAL_AI_RUNTIME_ARTIFACT_MODE=readonly \
    NODE_OPTIONS=--import=/app/server/runtime/runtimeArtifactGuard.mjs

# Deny writes by default for governance content; uploads is the explicit writable application path.
RUN mkdir -p /app/uploads /app/docs \
  && chown capitalai:capitalai /app/uploads \
  && chmod 0750 /app/uploads \
  && chown root:root /app/docs \
  && chmod 0555 /app/docs

USER capitalai

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1

# Run Node directly so the application is PID 1 and receives termination signals without an npm shim.
CMD ["node", "dist/server.cjs"]
