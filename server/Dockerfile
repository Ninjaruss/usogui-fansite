# =============================================================================
# L-File Usogui Fansite - NestJS Backend Dockerfile
# =============================================================================
# Multi-stage build for optimal production image size
# =============================================================================

# =============================================================================
# Stage 1: Dependencies Installation
# =============================================================================
FROM node:20-alpine AS deps

# Install build dependencies for native modules (bcrypt, pg)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files for dependency caching
COPY package.json yarn.lock ./

# Install all dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# =============================================================================
# Stage 2: Build Application
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the NestJS application
RUN yarn build

# Prune devDependencies after build
RUN yarn install --frozen-lockfile --production

# =============================================================================
# Stage 3: Production Runtime
# =============================================================================
FROM node:20-alpine AS runner

# Add labels for container metadata
LABEL maintainer="Usogui Fansite Team"
LABEL description="NestJS backend API for Usogui Fansite"

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Copy only production dependencies and built application
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nestjs

# Expose the application port
EXPOSE 3001

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Use dumb-init as entrypoint for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main"]
