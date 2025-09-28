FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat dumb-init
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Define ARGs to capture build-time variables from workflow
ARG NEXT_PUBLIC_ENVIRONMENT
ARG NEXT_PUBLIC_API_URL_STAGING
ARG NEXT_PUBLIC_API_URL_PRODUCTION
ARG NEXT_PUBLIC_STAGING_DOMAIN
ARG NEXT_PUBLIC_PRODUCTION_DOMAIN
ARG NEXT_PUBLIC_BASE_URL_STAGING
ARG NEXT_PUBLIC_BASE_URL_PRODUCTION
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Convert ARGs to ENVs for Next.js build process
ENV NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT
ENV NEXT_PUBLIC_API_URL_STAGING=$NEXT_PUBLIC_API_URL_STAGING
ENV NEXT_PUBLIC_API_URL_PRODUCTION=$NEXT_PUBLIC_API_URL_PRODUCTION
ENV NEXT_PUBLIC_STAGING_DOMAIN=$NEXT_PUBLIC_STAGING_DOMAIN
ENV NEXT_PUBLIC_PRODUCTION_DOMAIN=$NEXT_PUBLIC_PRODUCTION_DOMAIN
ENV NEXT_PUBLIC_BASE_URL_STAGING=$NEXT_PUBLIC_BASE_URL_STAGING
ENV NEXT_PUBLIC_BASE_URL_PRODUCTION=$NEXT_PUBLIC_BASE_URL_PRODUCTION
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Build the application for standalone output with optimizations
ENV BUILD_STANDALONE=true
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build output correctly for monorepo structure
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Expose port (Next.js default port)
EXPOSE 3000

# Set hostname to listen on all interfaces
ENV HOSTNAME="0.0.0.0"
ENV PORT=${PORT:-3000}

# Health check que valida Next.js server real
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "const http = require('http'); const options = {hostname: 'localhost', port: process.env.PORT || 3000, path: '/', timeout: 5000}; const req = http.request(options, (res) => {process.exit(res.statusCode === 200 ? 0 : 1)}); req.on('error', () => process.exit(1)); req.on('timeout', () => {req.destroy(); process.exit(1)}); req.end();" || exit 1

# Command that runs the standalone server directly - adjust path for monorepo
CMD ["sh", "-c", "PORT=${PORT:-3000} node apps/frontend-nextjs/server.js || node server.js"]
