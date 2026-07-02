# Stage 1: Build the client assets and server bundle
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code files
COPY . .

# ── Build-time VITE_ variables ──────────────────────────────────────────
# Vite bakes import.meta.env.VITE_* into the bundle at build time, not at
# runtime. Render only forwards dashboard Environment Variables into this
# build stage for names explicitly declared as ARG here. Any VITE_ var not
# listed below will be empty in the built app, no matter what is set in the
# Render dashboard - the login screen will then silently report Supabase
# as "not configured". After adding a new VITE_ variable, it must be added
# both here and in the Render dashboard, then deployed with cache cleared
# ("Clear build cache & deploy") to take effect.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

# Run production build (vite build & esbuild server)
RUN npm run build

# Stage 2: Production runtime image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application assets from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start command
CMD ["npm", "run", "start"]
