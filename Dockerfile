# Stage 1: Build the client assets and server bundle
FROM node:22-alpine AS builder
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
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application assets from the builder stage
COPY --from=builder /app/dist ./dist

# Audit ARCH-AUDIT-0002 (AUD2-F-018): Container lief zuvor als root. Non-root-User anlegen und
# die zur Laufzeit beschriebenen Verzeichnisse (uploads/, docs/ - documentHygiene.ts legt beide
# per mkdirSync selbst an, falls sie fehlen) vorab mit passendem Besitzer bereitstellen, damit
# der Prozess unter diesem User weiterhin schreiben kann.
RUN addgroup -S capitalai && adduser -S capitalai -G capitalai \
  && mkdir -p /app/uploads /app/docs \
  && chown -R capitalai:capitalai /app
USER capitalai

# Expose port 3000
EXPOSE 3000

# Audit ARCH-AUDIT-0002 (AUD2-F-018): Container-Health per HTTP-Check gegen /healthz statt gar
# keiner Ueberwachung. wget ist Teil von busybox in node:22-alpine, kein zusaetzliches Paket noetig.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1

# Start command
CMD ["npm", "run", "start"]
