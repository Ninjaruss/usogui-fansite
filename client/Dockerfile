# =============================================================================
# L-File Usogui Fansite - Next.js Frontend Dockerfile
# =============================================================================
# Multi-stage build using Next.js standalone output for minimal image size.
#
# Build args (set in Dokploy UI under "Build Arguments"):
#   NEXT_PUBLIC_API_URL  - Public URL of the backend API (baked into client bundle)
#                          e.g. https://api.l-file.com/api
#
# Runtime env vars (set in Dokploy UI under "Environment Variables"):
#   AUTH_SECRET          - Must match server JWT_SECRET
#   AUTH_URL             - Canonical frontend URL (e.g. https://l-file.com)
#   AUTH_INTERNAL_SECRET - Shared secret for internal auth communication
#   AUTH_RESEND_KEY      - Resend API key for magic link emails
#   EMAIL_FROM           - From address for auth emails
#   API_URL              - Backend API URL for server-side requests
#                          (can be same as NEXT_PUBLIC_API_URL)
#   NEXT_PUBLIC_API_URL  - Backend API URL for client-side requests
# =============================================================================

# =============================================================================
# Stage 1: Install Dependencies
# =============================================================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# =============================================================================
# Stage 2: Build Application
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are baked into the client bundle at build time.
# This ARG must be passed when building the image.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1536"

RUN yarn build

# =============================================================================
# Stage 3: Production Runtime
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with correct ownership for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone server and static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
