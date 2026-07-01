# Stage 1: Build the client assets and server bundle
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code files
COPY . .

# --- Vite build-time variable injection -----------------------------------
# Vite bakes VITE_* variables into the static bundle at BUILD time, not at
# container start time. Render automatically populates these ARG values
# from the service's Environment tab IF (and only if) the ARG names below
# match the Environment Variable names exactly — set VITE_SUPABASE_URL,
# VITE_SUPABASE_PUBLISHABLE_KEY (or legacy VITE_SUPABASE_ANON_KEY) and
# VITE_STRIPE_PUBLISHABLE_KEY in the Render dashboard. Without this block,
# the deployed frontend ships with empty Supabase credentials and the login
# screen will perpetually report them as missing, even though they are
# correctly set in the dashboard.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
# ---------------------------------------------------------------------------

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
