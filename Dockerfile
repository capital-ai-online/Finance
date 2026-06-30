# Stage 1: Build the client assets and server bundle
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code files
COPY . .

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
