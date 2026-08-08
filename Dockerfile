# Deploy-Härtung (Supply-Chain): beide Stages auf das Image-Digest statt den floating
# "22-alpine"-Tag gepinnt, damit derselbe Tag nicht unbemerkt auf ein neues (kompromittiertes
# oder schlicht anderes) Image zeigen kann. Digest verifiziert am 08.08.2026 gegen
# registry-1.docker.io/library/node:22-alpine (multi-arch Index, deckt weiterhin alle von
# Docker Hub unterstützten Plattformen ab). Bump bewusst manuell/reviewed statt automatisch.
# Stage 1: Build the client assets and server bundle
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code files
COPY . .

# Run production build (vite build & esbuild server)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_GA_MEASUREMENT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID

RUN npm run build

# Stage 2: Production runtime image
FROM node:22-alpine@sha256:c610fcdfb1d5b4740dd70c284ed3cb16bb857e0f7166196e36a5501df7a3aa32 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application assets from the builder stage
COPY --from=builder /app/dist ./dist

# R-002: preload the production artifact immutability guard outside of the bundled server.
# This keeps repository-style documentation and legacy release-governance state read-only even
# when older runtime routes are still reachable during the staged migration to CI/control-plane ownership.
COPY --from=builder /app/server/runtime/runtimeArtifactGuard.mjs ./server/runtime/runtimeArtifactGuard.mjs
ENV CAPITAL_AI_RUNTIME_ARTIFACT_MODE=readonly
ENV NODE_OPTIONS=--import=/app/server/runtime/runtimeArtifactGuard.mjs

# Audit ARCH-AUDIT-0002 (AUD2-F-018): Container lief zuvor als root. Non-root-User anlegen.
# R-002 narrows filesystem authority further: docs/ is OS-level read-only for the web runtime;
# uploads/ remains writable for normal application data, while the preload guard blocks the two
# legacy governance files document_hygiene.json and version_manager.json specifically.
RUN addgroup -S capitalai && adduser -S capitalai -G capitalai \
  && mkdir -p /app/uploads /app/docs \
  && chown -R capitalai:capitalai /app \
  && chmod 0555 /app/docs
USER capitalai

# Expose port 3000
EXPOSE 3000

# Audit ARCH-AUDIT-0002 (AUD2-F-018): Container-Health per HTTP-Check gegen /healthz statt gar
# keiner Ueberwachung. wget ist Teil von busybox in node:22-alpine, kein zusaetzliches Paket noetig.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1

# Start command
CMD ["npm", "run", "start"]
